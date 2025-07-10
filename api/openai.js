import axios from 'axios';
import { systemPrompt as baseSystemPrompt } from '../config/personalityPrompt.js';
import {
    guardarMensajeFirestore,
    buscarMensajesPorPalabraClave,
    obtenerMensajesRecientes,
    generarResumenEmocional,
    marcarComoMemorable,
    obtenerMomentosMemorables,
    analizarEvolucionEmocional,
    predecirEstadoEmocional,
    generarConversacionEspejo,
    obtenerBalanceEmocional, // Importar para datos de pie chart
    obtenerDatosEvolucionEmocionalParaGrafico // Importar para datos de line chart
} from '../services/firestoreService.js';
import { fetchAndParseDDG } from '../lib/internet.js';
import * as terapiaLogic from '../modules/modo_terapia/logica_modo_terapia.js';
import * as terapiaContent from '../modules/modo_terapia/contenido_terapia.js';
import { detectarEmocion } from '../modules/analisis_emocional/detectarEmocion.js';
import { esEmocionNegativa, EMOCIONES } from '../modules/analisis_emocional/emociones_basicas.js';
import { buscarFraseInspiradora, generarRespuestaFrustracionReflexiva } from '../modules/intervenciones_emocionales/frustracionReflexiva.js';
import { evaluarSituacionYRecomendar as evaluarSituacionYRecomendarDefensa } from '../modules/defensaSegura.js';
import { obtenerInfoProfesion } from '../modules/conocimientoProfesional.js';
import * as Supervisor from '../modules/cameraSupervisor.js';
import * as SupervisionVulnerable from '../modules/modo_supervision_vulnerable.js'; // NUEVA IMPORTACIÓN
import * as RespuestasGuiadas from '../modules/respuestasGuiadas.js'; // Para TIPOS_PERSONA_VULNERABLE
import { clasificarSentimientoDePerdida } from '../modules/analisis_contexto.js'; // Para la Mejora 14


const OPENAI_API_KEY = 'TU_API_KEY_AQUI'; // Reemplaza con la clave real
const MOCK_USER_ID = 'user123'; // Placeholder for user identification, debería ser dinámico
let currentUserRole = null; // Session-level storage for user's profession/role for MOCK_USER_ID
let esperandoRespuestaConsentimientoSensores = false; // Para el flujo de consentimiento

// Keywords for memory recall
const RECALL_KEYWORDS = ['recuerdas', 'te acuerdas', 'qué te dije', 'lo que te conté', 'último que hablamos'];

// Keywords for internet search
const INTERNET_SEARCH_KEYWORDS = [
  'busca sobre', 'encuentra información de', 'qué es', 'quién es', 'dime sobre',
  'investiga', 'últimas noticias', 'qué pasó hoy con', 'qué sabes de', 'cuéntame de'
];
const INTERNET_QUERY_STOP_WORDS = ['busca sobre', 'encuentra información de', 'dime sobre', 'investiga', 'qué sabes de', 'cuéntame de', 'explícame'];

let viewTextWebsiteTool = null;
export function setViewTextWebsiteTool(tool) {
  viewTextWebsiteTool = tool;
  console.log("[api/openai.js] viewTextWebsiteTool has been set.");
}

export async function getWillyResponse(userMessageContent, overrideSystemPrompt = null) {
  const userMessageLower = userMessageContent.toLowerCase();
  let willyResponseContent = "";
  let initialTherapyMessage = "";

  // --- Inicio Manejo de Supervisión Ética para Vulnerables y Emergencias ---
  // Esta función se llamaría cuando el temporizador de no respuesta expira.
  async function handleTimerExpirationForVulnerable(mensajeAlerta, datosSupervisados) {
    console.log(`[api/openai.js] Timer expirado para ${datosSupervisados.nombrePersona}. Mensaje de alerta a contacto: ${mensajeAlerta}`);
    // 1. (Conceptual) Enviar `mensajeAlerta` al contacto de emergencia.
    //    Este es el punto donde se usaría un servicio de SMS/Email.
    //    Por ahora, lo registraremos.
    await guardarMensajeFirestore({
        userId: datosSupervisados.userIdCuidador, // Asociar al cuidador
        role: 'system_alert',
        message: `ALERTA ENVIADA A CONTACTO DE EMERGENCIA (${datosSupervisados.contactoEmergencia.nombre}): ${mensajeAlerta}`,
        emotion: EMOCIONES.PREOCUPACION // Emoción del sistema/Willy
    });

    // 2. Solicitar permiso para sensores al cuidador (MOCK_USER_ID)
    esperandoRespuestaConsentimientoSensores = true; // Activar flag
    // Guardar temporalmente para quién se pide el consentimiento
    // En un sistema real, esto sería más robusto (ej. en el estado de la supervisión)
    global.pendingSensorConsentFor = datosSupervisados.nombrePersona;

    const preguntaConsentimiento = `Detecto una situación potencialmente urgente con ${datosSupervisados.nombrePersona} y no ha respondido a mis intentos de contacto. ` +
                                   `Se ha enviado una notificación a su contacto de emergencia (${datosSupervisados.contactoEmergencia.nombre}). ` +
                                   `Para ayudarte a evaluar mejor la situación de forma remota, ¿me das tu permiso explícito para (conceptualmente) activar temporalmente la cámara y el micrófono del dispositivo cercano a ${datosSupervisados.nombrePersona}? ` +
                                   `Por favor, responde 'Sí, activar sensores para ${datosSupervisados.nombrePersona}' o 'No, no activar sensores para ${datosSupervisados.nombrePersona}'. Tu privacidad y la suya son mi prioridad.`;

    // Este mensaje debe llegar al CUIDADOR. En esta simulación, asumimos que la próxima interacción del MOCK_USER_ID es la respuesta.
    // En una app real, esto sería una notificación push al cuidador.
    // Por ahora, si el cuidador escribe algo, se interpretará como respuesta a esto si el flag está activo.
    // Para la simulación, podemos hacer que `getWillyResponse` devuelva este mensaje si detecta el estado.
    // O, si esta función es llamada por un evento externo, este sería el mensaje a enviar al cuidador.
    console.log(`[api/openai.js] PREGUNTAR AL CUIDADOR: ${preguntaConsentimiento}`);
    // Devolver este mensaje para que el cuidador lo vea.
    // Esto es conceptual, la entrega de este mensaje es un desafío en la arquitectura actual.
    // Si esto fuera un endpoint /api/timer-expired, devolvería esto.
    // Como está dentro de getWillyResponse, necesitamos una forma de que este sea el siguiente mensaje de Willy.
    // Por ahora, este flujo es más conceptual para la lógica de Willy.
    // Si getWillyResponse es llamado después de esto por el cuidador, el flag esperandoRespuestaConsentimientoSensores se usará.
  }


  const START_SUPERVISION_VULNERABLE_KEYWORDS = ["cuida a", "vigila a mi", "supervisa a"];
  const STOP_SUPERVISION_VULNERABLE_KEYWORDS = ["deja de cuidar a", "termina la supervisión de", "finaliza supervisión de"];
  const datosSupervisionActual = SupervisionVulnerable.obtenerDatosSupervision();

  // A. Comandos del Cuidador para iniciar/detener supervisión vulnerable
  if (!overrideSystemPrompt && !datosSupervisionActual) { // Solo si no hay una supervisión vulnerable ya activa
    for (const kw of START_SUPERVISION_VULNERABLE_KEYWORDS) {
      if (userMessageLower.startsWith(kw)) {
        const  nombreYTipo = userMessageContent.substring(kw.length).trim();
        // Parseo muy básico de "nombrePersona que es tipoPersona" o "nombrePersona mi parentesco"
        // Ej: "cuida a Ana que es adulto mayor", "vigila a Leo mi hijo"
        let nombrePersona = nombreYTipo;
        let tipoPersona = RespuestasGuiadas.TIPOS_PERSONA_VULNERABLE.GENERAL_VULNERABLE; // Default
        let parentesco = "ser querido"; // Default

        // Intentar extraer tipoPersona (ej. "niño", "abuelita", "adulto mayor")
        // Esto es una simplificación y necesitaría una lista más robusta de keywords y lógica de parseo.
        if (nombreYTipo.toLowerCase().includes("niño pequeño")) tipoPersona = RespuestasGuiadas.TIPOS_PERSONA_VULNERABLE.NINO_PEQUENO;
        else if (nombreYTipo.toLowerCase().includes("niño")) tipoPersona = RespuestasGuiadas.TIPOS_PERSONA_VULNERABLE.NINO_MAYOR;
        else if (nombreYTipo.toLowerCase().includes("abuelit") || nombreYTipo.toLowerCase().includes("adulto mayor")) tipoPersona = RespuestasGuiadas.TIPOS_PERSONA_VULNERABLE.ADULTO_MAYOR;
        else if (nombreYTipo.toLowerCase().includes("enferm")) tipoPersona = RespuestasGuiadas.TIPOS_PERSONA_VULNERABLE.PERSONA_ENFERMA;

        // Extraer nombre (lo que queda antes de "que es", "mi", etc.)
        const matchNombre = nombreYTipo.match(/^([\w\s]+)(?:\s+que es|\s+mi|\s+la)?/i);
        if (matchNombre && matchNombre[1]) nombrePersona = matchNombre[1].trim();

        willyResponseContent = SupervisionVulnerable.iniciarSupervision(MOCK_USER_ID, tipoPersona, nombrePersona, "contexto general", "cuidador principal", parentesco);
        await guardarMensajeFirestore({ userId: MOCK_USER_ID, role: 'user', message: userMessageContent, emotion: detectarEmocion(userMessageContent) });
        await guardarMensajeFirestore({ userId: MOCK_USER_ID, role: 'willy', message: willyResponseContent, emotion: EMOCIONES.CALMA });
        return willyResponseContent;
      }
    }
  }
  if (!overrideSystemPrompt && datosSupervisionActual && datosSupervisionActual.userIdCuidador === MOCK_USER_ID) {
     for (const kw of STOP_SUPERVISION_VULNERABLE_KEYWORDS) {
        if (userMessageLower.startsWith(kw)) {
            const nombrePersonaEnComando = userMessageContent.substring(kw.length).trim();
            if (nombrePersonaEnComando.toLowerCase() === datosSupervisionActual.nombrePersona.toLowerCase()) {
                willyResponseContent = SupervisionVulnerable.detenerSupervision(MOCK_USER_ID);
                await guardarMensajeFirestore({ userId: MOCK_USER_ID, role: 'user', message: userMessageContent, emotion: detectarEmocion(userMessageContent) });
                await guardarMensajeFirestore({ userId: MOCK_USER_ID, role: 'willy', message: willyResponseContent, emotion: EMOCIONES.CALMA });
                return willyResponseContent;
            }
        }
     }
  }

  // B. Si la supervisión vulnerable está activa Y el mensaje NO es un comando de parada del cuidador:
  //    Asumimos que el mensaje es DE o SOBRE la persona supervisada.
  if (datosSupervisionActual && datosSupervisionActual.userIdCuidador === MOCK_USER_ID) {
      // Cancelar timer de no respuesta si el cuidador o la persona supervisada interactúa.
      SupervisionVulnerable.cancelarTemporizadorNoRespuesta();

      const emocionMsjSupervisado = detectarEmocion(userMessageContent);
      const {
          willyMessage: baseMsgCuidador,
          needsOpenAIPhrasing,
          furtherContextForOpenAI,
          suggestedAction,
          iniciarTimer
      } = SupervisionVulnerable.responderComoCuidador(userMessageContent, emocionMsjSupervisado, datosSupervisionActual);

      if (iniciarTimer) {
          SupervisionVulnerable.iniciarTemporizadorNoRespuesta(
              MOCK_USER_ID, // userId del cuidador
              datosSupervisionActual,
              baseMsgCuidador, // El mensaje que Willy "dijo" y espera respuesta
              async (mensajeAlerta, datosSupervisadosTimer) => { // Callback si expira
                  // Este callback se ejecuta cuando el timer expira
                  await handleTimerExpirationForVulnerable(mensajeAlerta, datosSupervisadosTimer);
                  // Proactivamente, Willy podría enviar un mensaje al cuidador si la interfaz lo permite
                  // Por ahora, el estado 'esperandoRespuestaConsentimientoSensores' se activa.
              }
          );
      }

      if (needsOpenAIPhrasing) {
          const systemPromptSupervision = baseSystemPrompt + `\n\n[Contexto de Supervisión Ética: Estás acompañando a ${datosSupervisionActual.nombrePersona} (${datosSupervisionActual.tipoPersona}). ` +
                                          `El mensaje actual es: "${userMessageContent}". ` +
                                          `Instrucciones específicas: ${furtherContextForOpenAI}]`;
          // Guardar mensaje original del "usuario" (que podría ser la persona supervisada)
          await guardarMensajeFirestore({ userId: MOCK_USER_ID, role: 'user', message: userMessageContent, emotion: emocionMsjSupervisado });

          // Obtener respuesta de Willy
          willyResponseContent = await getWillyResponse(baseMsgCuidador, systemPromptSupervision); // Aquí se llama a getWillyResponse con el override
      } else {
          willyResponseContent = baseMsgCuidador;
          // Guardar mensaje original del "usuario"
          await guardarMensajeFirestore({ userId: MOCK_USER_ID, role: 'user', message: userMessageContent, emotion: emocionMsjSupervisado });
      }

      await guardarMensajeFirestore({ userId: MOCK_USER_ID, role: 'willy', message: willyResponseContent, emotion: detectarEmocion(willyResponseContent) || EMOCIONES.NEUTRO });
      return willyResponseContent;
  }

  // C. Flujo de consentimiento para sensores (si el cuidador responde a la pregunta de Willy)
  if (esperandoRespuestaConsentimientoSensores && global.pendingSensorConsentFor) {
    const nombrePersonaPendiente = global.pendingSensorConsentFor;
    let consentResponse = "";
    if (userMessageLower.includes("sí activar sensores para " + nombrePersonaPendiente.toLowerCase()) || userMessageLower.includes("si activar sensores para " + nombrePersonaPendiente.toLowerCase())) {
        consentResponse = `Entendido. (Conceptualmente) Iniciando activación temporal de sensores para ${nombrePersonaPendiente} para que puedas evaluar. Por favor, revisa tu sistema de visualización.`;
        // Aquí la app frontend/externa recibiría una señal para activar la cámara/micrófono.
        console.log(`[api/openai.js] CONSENTIMIENTO DADO para sensores de ${nombrePersonaPendiente}.`);
    } else if (userMessageLower.includes("no activar sensores para " + nombrePersonaPendiente.toLowerCase())) {
        consentResponse = `De acuerdo, no se activarán los sensores para ${nombrePersonaPendiente}. Te recomiendo contactarles directamente o verificar su estado lo antes posible si aún te preocupa.`;
        console.log(`[api/openai.js] CONSENTIMIENTO DENEGADO para sensores de ${nombrePersonaPendiente}.`);
    } else {
        // Respuesta no clara, mantener el estado y quizás pedir clarificación.
        consentResponse = `No entendí bien tu respuesta sobre los sensores para ${nombrePersonaPendiente}. Por favor, responde con 'Sí, activar sensores para ${nombrePersonaPendiente}' o 'No, no activar sensores para ${nombrePersonaPendiente}'.`;
    }
    esperandoRespuestaConsentimientoSensores = false; // Resetear flag tras primer intento de respuesta
    delete global.pendingSensorConsentFor;

    await guardarMensajeFirestore({ userId: MOCK_USER_ID, role: 'user', message: userMessageContent, emotion: detectarEmocion(userMessageContent) });
    await guardarMensajeFirestore({ userId: MOCK_USER_ID, role: 'willy', message: consentResponse, emotion: EMOCIONES.CALMA });
    return consentResponse;
  }
  // --- Fin Manejo de Supervisión Ética para Vulnerables ---


  // --- Resto del código existente (anclajes, frustración, terapia, análisis, etc.) ---
  // Asegurarse que el guardado del mensaje de usuario original y su emoción se haga una sola vez.
  // Si ya se guardó arriba por un comando de supervisión, no volver a guardarlo.
  const emocionDetectadaOriginal = detectarEmocion(userMessageContent);
  console.log(`[api/openai.js] Emoción detectada para mensaje de usuario (post-supervisión check): ${emocionDetectadaOriginal}`);

  let userMessageId = null;
  try {
    // GuardarMensajeFirestore ahora devuelve el ID del mensaje guardado.
    userMessageId = await guardarMensajeFirestore({
      userId: MOCK_USER_ID,
      role: 'user',
      message: userMessageContent,
      emotion: emocionDetectada,
      memorable: false // Por defecto no es memorable, se marca después si es necesario
    });
  } catch (error) {
    console.error("[api/openai.js] Error guardando mensaje de usuario en Firestore:", error);
  }

  // --- Inicio Lógica de Anclajes Emocionales (Marcar) ---
  const MARK_MEMORABLE_KEYWORDS = ["quiero que recuerdes esto", "esto fue importante", "guarda esto como un buen recuerdo", "anota esto", "recuerda bien esto"];
  if (MARK_MEMORABLE_KEYWORDS.some(keyword => userMessageLower.includes(keyword))) {
    if (userMessageId) { // Si tenemos el ID del mensaje del usuario que acaba de ser guardado
      try {
        await marcarComoMemorable(userMessageId);
        // Preparamos una respuesta de confirmación y podríamos no necesitar llamar a OpenAI para esto.
        willyResponseContent = terapiaContent.obtenerFraseAleatoria(terapiaContent.frasesValidacion) + // Reutilizar frases de validación para confirmación
                               " Lo he guardado como un momento especial. Gracias por compartirlo conmigo.";
        // Guardar esta respuesta de Willy también
        await guardarMensajeFirestore({ userId: MOCK_USER_ID, role: 'willy', message: willyResponseContent, emotion: EMOCIONES.CALMA });
        return willyResponseContent;
      } catch (error) {
        console.error(`[api/openai.js] Error al marcar mensaje ${userMessageId} como memorable:`, error);
        // Podríamos querer informar al usuario que no se pudo guardar.
      }
    } else {
      // No se pudo obtener el ID del mensaje anterior para marcarlo.
      // Willy podría decir: "Entendido. Lo tendré presente en nuestra conversación." (sin confirmación de guardado específico)
    }
  }
  // --- Fin Lógica de Anclajes Emocionales (Marcar) ---


  // --- Inicio Lógica de Anclajes Emocionales (Recuperar) ---
  const RECALL_MEMORABLE_KEYWORDS = ["recuérdame algo bonito", "dime algo que me hizo sentir bien", "mis mejores momentos", "momento feliz", "buen recuerdo"];
  if (RECALL_MEMORABLE_KEYWORDS.some(keyword => userMessageLower.includes(keyword))) {
    const momentos = await obtenerMomentosMemorables(MOCK_USER_ID, 1); // Pedir 1 por ahora, el más reciente
    if (momentos && momentos.length > 0) {
      const momento = momentos[0]; // Tomar el primero (más reciente memorable)
      // Formatear la respuesta
      let textoMomento = `Recordé algo especial que compartimos el ${new Date(momento.timestamp.toDate()).toLocaleDateString()}:\n`;
      if (momento.role === 'user') {
        textoMomento += `Tú dijiste: "${momento.message}"`;
      } else { // Willy's message
        textoMomento += `Yo te dije: "${momento.message}"`;
      }
      if (momento.emotion && momento.emotion !== EMOCIONES.NEUTRO) {
        textoMomento += `\n(Parece que en ese momento te sentías ${momento.emotion})`;
      }
      textoMomento += "\n\nEspero que este recuerdo te traiga una sonrisa. 😊";
      willyResponseContent = textoMomento;
      await guardarMensajeFirestore({ userId: MOCK_USER_ID, role: 'willy', message: willyResponseContent, emotion: EMOCIONES.ALEGRIA });
      return willyResponseContent;
    } else {
      willyResponseContent = "Busqué en nuestros momentos especiales guardados, pero no encontré uno específico ahora mismo. ¡Seguro crearemos muchos más juntos!";
      await guardarMensajeFirestore({ userId: MOCK_USER_ID, role: 'willy', message: willyResponseContent, emotion: EMOCIONES.ESPERANZA });
      return willyResponseContent;
    }
  }
  // --- Fin Lógica de Anclajes Emocionales (Recuperar) ---

  // --- Inicio Lógica de Intervención para Frustración (antes de Modo Terapia general) ---
  let frustracionIntervenida = false;
  if (emocionDetectada === EMOCIONES.FRUSTRACION && !terapiaLogic.estaEnModoTerapia()) { // Solo si no está ya en modo terapia
    const ultimosMensajes = await obtenerMensajesRecientes(MOCK_USER_ID, 3); // Revisar los últimos mensajes del usuario
    let frustracionCount = 0;
    if (emocionDetectada === EMOCIONES.FRUSTRACION) frustracionCount++;
    if (ultimosMensajes.length > 0 && ultimosMensajes[0].role === 'user' && ultimosMensajes[0].emotion === EMOCIONES.FRUSTRACION) {
        frustracionCount++;
    }
     if (ultimosMensajes.length > 1 && ultimosMensajes[1].role === 'user' && ultimosMensajes[1].emotion === EMOCIONES.FRUSTRACION) {
        // Esta condición es para si el historial es [user (frust), willy, user (frust)]
        // o [user (frust), user (frust)]. El índice 1 sería el penúltimo mensaje del usuario.
        // Necesitaríamos filtrar para asegurar que es el del usuario.
        // Simplificación: si los dos últimos mensajes del usuario fueron frustración
        // O si la frustración actual es muy intensa (requeriría keywords de intensidad)
    }


    // Condición simple: si la frustración es la emoción actual y también la del mensaje anterior del usuario.
    // Para una lógica de "dos mensajes de usuario seguidos con frustración", necesitamos asegurar que el historial lo refleje.
    // `obtenerMensajesRecientes` devuelve [..., penultimo_usuario, ultimo_willy, ultimo_usuario (actual)]
    // o [..., antepenultimo_usuario, penultimo_willy, ultimo_usuario (actual)] si Willy respondió
    // o [..., penultimo_usuario, ultimo_usuario (actual)] si Willy no respondió.
    // Buscamos el mensaje anterior del *usuario*.
    let previousUserMessage = null;
    if (ultimosMensajes.length >=2 && ultimosMensajes[ultimosMensajes.length-2].role === 'user') { // [..., prev_user, current_user]
        previousUserMessage = ultimosMensajes[ultimosMensajes.length-2];
    } else if (ultimosMensajes.length >=3 && ultimosMensajes[ultimosMensajes.length-3].role === 'user') { // [..., prev_user, willy, current_user]
        previousUserMessage = ultimosMensajes[ultimosMensajes.length-3];
    }


    if (previousUserMessage && previousUserMessage.emotion === EMOCIONES.FRUSTRACION) {
      console.log("[api/openai.js] Frustración repetida detectada, intentando intervención reflexiva.");
      // Determinar un tema de búsqueda para la frase. Podría ser genérico o intentar extraer del contexto.
      const temaBusquedaFrase = "paciencia superación perspectiva"; // Temas generales para frustración
      const quoteObj = await buscarFraseInspiradora(temaBusquedaFrase, viewTextWebsiteTool);
      willyResponseContent = generarRespuestaFrustracionReflexiva(quoteObj);

      await guardarMensajeFirestore({
          userId: MOCK_USER_ID,
          role: 'willy',
          message: willyResponseContent,
          emotion: EMOCIONES.CALMA // Willy intenta inducir calma o esperanza
      });
      frustracionIntervenida = true; // Marcar que la intervención se realizó
      return willyResponseContent; // Retornar directamente
    }
  }
  // --- Fin Lógica de Intervención para Frustración ---


  // 3. Therapy Mode Logic (check before standard operations, and if no frustration intervention occurred)
  if (!frustracionIntervenida) {
    if (terapiaLogic.detectarDesactivacionTerapia(userMessageLower)) {
      initialTherapyMessage = terapiaLogic.desactivarModoTerapia();
      if (initialTherapyMessage) willyResponseContent = initialTherapyMessage;
    } else if (terapiaLogic.estaEnModoTerapia() || terapiaLogic.detectarNecesidadTerapia(userMessageLower) || (emocionDetectada && esEmocionNegativa(emocionDetectada) && !terapiaLogic.estaEnModoTerapia())) {
      if (!terapiaLogic.estaEnModoTerapia()) {
          if (emocionDetectada && esEmocionNegativa(emocionDetectada) && !ACTIVAR_KEYWORDS.some(kw => userMessageLower.includes(kw))) {
             // --- Inicio Integración Emocional (Sugerir Recuerdo Positivo) ---
             const momentosPositivos = await obtenerMomentosMemorables(MOCK_USER_ID, 1); // Buscar si hay alguno
             if (momentosPositivos && momentosPositivos.length > 0) {
                initialTherapyMessage = terapiaLogic.activarModoTerapia() + `\nHe notado que quizás te sientes ${emocionDetectada}. Estoy aquí para escucharte. Por cierto, a veces recordar momentos bonitos ayuda un poco. ¿Te gustaría que te recuerde algo que te hizo sonreír?`;
                // Aquí la lógica de `responderComoTerapia` debería manejar la respuesta a esta pregunta si el usuario dice "sí".
                // Esto requeriría pasar un estado o una intención a `responderComoTerapia`.
                // Por ahora, la sugerencia se hace, y si el usuario luego pide el recuerdo, la lógica de arriba lo manejará.
             } else {
                initialTherapyMessage = terapiaLogic.activarModoTerapia() + `\nHe notado que quizás te sientes ${emocionDetectada}. Estoy aquí para escucharte.`;
             }
             // --- Fin Integración Emocional ---
        } else {
            initialTherapyMessage = terapiaLogic.activarModoTerapia();
        }
    }

    const recentMessagesForTherapyRaw = await obtenerMensajesRecientes(MOCK_USER_ID, 10);
    const recentMessagesForTherapy = recentMessagesForTherapyRaw.map(msg => ({
        role: msg.role === 'willy' ? 'assistant' : msg.role,
        content: msg.message
    }));

    const therapyResponse = await terapiaLogic.responderComoTerapia(
      userMessageContent,
      axios.post,
      OPENAI_API_KEY,
      recentMessagesForTherapy
    );
    willyResponseContent = initialTherapyMessage ? initialTherapyMessage + "\n\n" + therapyResponse : therapyResponse;

    try {
      await guardarMensajeFirestore({ userId: MOCK_USER_ID, role: 'willy', message: willyResponseContent, emotion: detectarEmocion(willyResponseContent) });
    } catch (error) {
      console.error("[api/openai.js] Error guardando respuesta de Willy (terapia) en Firestore:", error);
    }
    return willyResponseContent;
  } else if (terapiaLogic.detectarSugerenciaTerapia(userMessageLower)) {
    willyResponseContent = terapiaContent.obtenerFraseAleatoria(terapiaContent.frasesValidacion) +
                           " Parece que estás pasando por un momento difícil. Si necesitas un espacio más tranquilo para hablar de tus emociones, solo dime \"modo terapia\".";
    try {
      await guardarMensajeFirestore({ userId: MOCK_USER_ID, role: 'willy', message: willyResponseContent, emotion: EMOCIONES.CALMA }); // Emoción de Willy al sugerir
    } catch (error) {
      console.error("[api/openai.js] Error guardando sugerencia de terapia en Firestore:", error);
    }
    return willyResponseContent;
  }

  if (willyResponseContent) {
    try {
      // Si willyResponseContent ya tiene valor (por ej. de marcar memorable, o desactivar terapia), se guarda y retorna.
      await guardarMensajeFirestore({ userId: MOCK_USER_ID, role: 'willy', message: willyResponseContent, emotion: detectarEmocion(willyResponseContent) });
    } catch (error) {
      console.error("[api/openai.js] Error guardando mensaje de Willy (flujo temprano) en Firestore:", error);
    }
    return willyResponseContent;
  }

  // 4. Standard Operation: Internet Search, Memory Recall, Emotional Summary, Evolution, Predictive Chat, Mirror Conversation or Chart Request
  let memoryContext = "";
  let internetContext = "";
  // Use overrideSystemPrompt if provided, otherwise build it step-by-step
  let finalSystemPrompt = overrideSystemPrompt || baseSystemPrompt;
  let isSpecialRequestHandled = false; // Flag to check if a special request was handled
  let chartTriggerData = null; // To hold data if a chart needs to be triggered

  // --- Profession/Role Detection and Contextualization ---
  // Try to detect profession/role from current message
  const profesionDeclarada = userMessageLower.match(/soy ([\w\s]+)/i) || userMessageLower.match(/trabajo como ([\w\s]+)/i) || userMessageLower.match(/trabajo de ([\w\s]+)/i);
  if (profesionDeclarada && profesionDeclarada[1]) {
    const rolDetectado = profesionDeclarada[1].trim().toLowerCase().replace(/\s+/g, '_');
    // Basic normalization, e.g., "programador de software" -> "programador"
    // This could be expanded with a more robust mapping if needed.
    if (rolDetectado.includes("programador")) currentUserRole = "programador";
    else if (rolDetectado.includes("médico") || rolDetectado.includes("doctor")) currentUserRole = "medico";
    else if (rolDetectado.includes("psicólogo")) currentUserRole = "psicologo";
    else if (rolDetectado.includes("arquitecto")) currentUserRole = "arquitecto";
    else if (rolDetectado.includes("mecánico")) currentUserRole = "mecanico";
    else if (rolDetectado.includes("padre") && rolDetectado.includes("desempleado")) currentUserRole = "padre_desempleado";
    else if (rolDetectado.includes("madre") && rolDetectado.includes("joven")) currentUserRole = "madre_joven";
    else if (rolDetectado.includes("padre") || rolDetectado.includes("madre")) currentUserRole = "padre_madre";
    else if (rolDetectado.includes("estudiante") && rolDetectado.includes("medicina")) currentUserRole = "estudiante_de_medicina";
    else if (rolDetectado.includes("estudiante")) currentUserRole = "estudiante";
    else if (rolDetectado.includes("ama de casa") || rolDetectado.includes("cuidador del hogar")) currentUserRole = "ama_de_casa";
    else if (rolDetectado.includes("desempleado")) currentUserRole = "desempleado";
    else if (rolDetectado.includes("repartidor")) currentUserRole = "repartidor_urbano";
    else if (rolDetectado.includes("vendedor informal") || rolDetectado.includes("ambulante")) currentUserRole = "vendedor_informal";
    else if (rolDetectado.includes("albañil") || rolDetectado.includes("construcción")) currentUserRole = "albañil";
    else currentUserRole = rolDetectado; // Store as is if not specifically mapped

    console.log(`[api/openai.js] Profesión/Rol detectado y almacenado para la sesión: ${currentUserRole}`);
    // In a real multi-user system, this would be saved to a user profile in Firestore.
  }

  // Only add default contexts if not using an overrideSystemPrompt
  if (!overrideSystemPrompt) {
    if (currentUserRole) {
        const infoProfesion = obtenerInfoProfesion(currentUserRole);
        finalSystemPrompt += `\n\n[Contexto Profesional/Rol del Usuario: El usuario se identifica como ${infoProfesion.nombreDisplay}. ` +
                             `Algunos desafíos comunes pueden ser: ${infoProfesion.commonStressors.slice(0,2).join(', ')}. ` +
                             `Considera esto al responder, ofreciendo empatía y validación. ` +
                             `Puedes mencionar sutilmente alguna sugerencia general de bienestar como '${infoProfesion.copingSuggestions[0]}', pero enfócate en el apoyo emocional. ` +
                             `Si la situación parece requerirlo, recuerda la '${infoProfesion.sugerenciaProfesional}'. No des consejos técnicos específicos.]`;
    }
    if (emocionDetectada && emocionDetectada !== EMOCIONES.NEUTRO && !terapiaLogic.estaEnModoTerapia()) {
      if (esEmocionNegativa(emocionDetectada)) {
        finalSystemPrompt += `\n[Contexto emocional: El usuario parece sentirse ${emocionDetectada}. Responde con especial empatía y suavidad, validando sus sentimientos si es apropiado, incluso si no pide ayuda explícitamente.]`;
      } else if (esEmocionPositiva(emocionDetectada)) {
        finalSystemPrompt += `\n[Contexto emocional: El usuario parece sentirse ${emocionDetectada}. Comparte su entusiasmo o responde de manera cálida y acorde.]`;
      }
    }
  }
  // --- Fin de Contextualización Profesional/Rol ---


  // Order of Special Operations: Safety Advice -> Chart Request -> Mirror -> Predictive -> Evolution -> Summary -> Internet -> Recall

  // Helper function to parse date range for chart/summary requests
  const parseDateRangeForQuery = (queryLower) => {
      let fechaInicio, fechaFin;
      if (queryLower.includes("última semana") || queryLower.includes("esta semana")) {
        fechaFin = new Date();
        fechaInicio = new Date();
        fechaInicio.setDate(fechaFin.getDate() - 6);
        fechaInicio.setHours(0,0,0,0);
      } else if (queryLower.includes("último mes") || queryLower.includes("este mes")) {
        fechaFin = new Date();
        fechaInicio = new Date();
        fechaInicio.setMonth(fechaFin.getMonth() - 1);
        fechaInicio.setHours(0,0,0,0);
        // Asegurar que fechaFin sea el día actual si es "este mes" para no ir a futuro
        if (queryLower.includes("este mes")) fechaFin = new Date();
      }
      // Add more specific date parsers here if needed (e.g., "ayer", "últimos 15 días")
      return { fechaInicio, fechaFin };
  };

  // 4a. Chart Request Logic
  const CHART_LINE_KEYWORDS = ["gráfico de evolución", "evolución de mis emociones"];
  const CHART_PIE_KEYWORDS = ["gráfico de balance", "balance de mis emociones", "gráfico de torta", "gráfico circular"];
  // Add keywords for other chart types (bar, heatmap) as they get fully implemented for API response

  if (!isSpecialRequestHandled && CHART_LINE_KEYWORDS.some(kw => userMessageLower.includes(kw))) {
    isSpecialRequestHandled = true;
    console.log("[api/openai.js] Solicitud de gráfico de líneas (evolución) detectada.");
    const { fechaInicio, fechaFin } = parseDateRangeForQuery(userMessageLower); // Usa el helper
    let periodo = 'semanal'; // Default
    let numPeriodos = 4;   // Default
    if (userMessageLower.includes("diario") || userMessageLower.includes("últimos días")) periodo = 'diario';
    if (userMessageLower.includes("mensual")) periodo = 'mensual';
    // Podríamos añadir lógica para derivar numPeriodos de frases como "últimos 15 días"

    const chartData = await obtenerDatosEvolucionEmocionalParaGrafico(MOCK_USER_ID, periodo, numPeriodos);
    if (chartData && chartData.datasets && chartData.datasets.length > 0) {
        const systemPromptForChart = baseSystemPrompt +
            `\n\n[Instrucción especial: El usuario ha pedido un gráfico de su evolución emocional. Los datos son: ${JSON.stringify(chartData)}. ` +
            `Interpreta estos datos con empatía. Comenta sobre los cambios, los altibajos, y ofrece apoyo o reconocimiento. ` +
            `Por ejemplo: "He observado que esta semana comenzó con emociones más intensas, pero poco a poco has ido encontrando calma..."]`;
        const messagesForAPIChart = [
            { role: 'system', content: systemPromptForChart },
            { role: 'user', content: userMessageContent } // Pregunta original
        ];
        try {
            const response = await axios.post('https://api.openai.com/v1/chat/completions', {
                model: 'gpt-4o', messages: messagesForAPIChart, temperature: 0.7, max_tokens: 1000,
            }, { headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' }});
            willyResponseContent = response.data.choices[0].message.content;
        } catch (error) {
            willyResponseContent = "Pude obtener los datos para tu gráfico de evolución, pero tuve un problema al interpretarlos. Los datos sugieren [breve resumen manual si es posible o un mensaje genérico].";
        }
        chartTriggerData = { action: "display_chart", chartType: "line_emotional_evolution", data: chartData, messageForUser: willyResponseContent };
    } else {
        willyResponseContent = "No encontré suficientes datos para generar un gráfico de evolución emocional en el período solicitado.";
    }
  } else if (!isSpecialRequestHandled && CHART_PIE_KEYWORDS.some(kw => userMessageLower.includes(kw))) {
    isSpecialRequestHandled = true;
    console.log("[api/openai.js] Solicitud de gráfico de balance (pie) detectada.");
    const { fechaInicio, fechaFin } = parseDateRangeForQuery(userMessageLower); // Usa el helper
    const balanceData = await obtenerBalanceEmocional(MOCK_USER_ID, fechaInicio, fechaFin);
    if (balanceData && balanceData.data.some(d => d > 0)) {
        const systemPromptForPieChart = baseSystemPrompt +
            `\n\n[Instrucción especial: El usuario ha pedido un gráfico de su balance emocional. Los datos son: Positivas ${balanceData.data[0]}, Negativas ${balanceData.data[1]}, Neutras ${balanceData.data[2]}. ` +
            `Interpreta este balance. Si es positivo, celébrelo. Si hay muchas negativas, ofrece apoyo. ` +
            `Por ejemplo: "En los últimos días, un ${ (balanceData.data[0] / (balanceData.data[0]+balanceData.data[1]+balanceData.data[2]) * 100).toFixed(0) }% de tus emociones han sido positivas..."]`;
        const messagesForAPIPie = [
            { role: 'system', content: systemPromptForPieChart },
            { role: 'user', content: userMessageContent }
        ];
        try {
            const response = await axios.post('https://api.openai.com/v1/chat/completions', {
                model: 'gpt-4o', messages: messagesForAPIPie, temperature: 0.7, max_tokens: 1000,
            }, { headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' }});
            willyResponseContent = response.data.choices[0].message.content;
        } catch (error) {
            willyResponseContent = `Tu balance emocional es: ${balanceData.data[0]} positivas, ${balanceData.data[1]} negativas, y ${balanceData.data[2]} neutras. Tuve un problema al darte una interpretación más detallada.`;
        }
        chartTriggerData = { action: "display_chart", chartType: "pie_emotional_balance", data: balanceData, messageForUser: willyResponseContent };
    } else {
        willyResponseContent = "No encontré suficientes datos para generar un gráfico de balance emocional en el período solicitado.";
    }
  }
  // TODO: Add similar blocks for bar chart (emotions by topic) and heatmap (weekly distribution)

  // 4b. Mirror Conversation Request (if not a chart request)
  if (!isSpecialRequestHandled) {
    const MIRROR_KEYWORDS = ["cosas importantes te he dicho", "espejo emocional", "mis pensamientos más profundos", "reflexionar sobre lo que he dicho"];
    if (MIRROR_KEYWORDS.some(keyword => userMessageLower.includes(keyword))) {
      isSpecialRequestHandled = true;
      console.log("[api/openai.js] Solicitud de Conversación Espejo detectada.");
      const fechaFinEspejo = new Date();
      const fechaInicioEspejo = new Date();
      fechaInicioEspejo.setDate(fechaFinEspejo.getDate() - 14);
      const mensajesEspejo = await generarConversacionEspejo(MOCK_USER_ID, { fechaInicio: fechaInicioEspejo, fechaFin: fechaFinEspejo }, null, 5);
      if (mensajesEspejo && mensajesEspejo.length > 0) {
        const systemPromptForMirror = baseSystemPrompt +
          `\n\n[Instrucción especial: 'conversación espejo'. Selección de mensajes: ${JSON.stringify(mensajesEspejo)}. ` +
          `Actúa como espejo emocional: 1. Presenta ideas clave conectadas. 2. Destaca altibajos/patrones con compasión. ` +
          `3. Valida emociones. 4. Ayuda a autoconocimiento. 5. Concluye con reflexión/pregunta abierta. No aconsejes, refleja y valida.]`;
        const messagesForAPIMirror = [
            { role: 'system', content: systemPromptForMirror },
            { role: 'user', content: userMessageContent }
        ];
        try {
            const response = await axios.post('https://api.openai.com/v1/chat/completions', {
                model: 'gpt-4o', messages: messagesForAPIMirror, temperature: 0.7, max_tokens: 1000,
            }, { headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' }});
            willyResponseContent = response.data.choices[0].message.content;
        } catch (error) {
            console.error('Error (conversación espejo):', error.response ? error.response.data : error.message);
            willyResponseContent = "Intenté reflexionar, pero tuve un problema. ¿Intentamos de nuevo?";
        }
      } else {
        willyResponseContent = "No encontré suficientes momentos recientes para una 'conversación espejo'. Si me cuentas más, podré hacerlo.";
      }
    }
  }

  // 4c. Predictive Analysis Request (if not chart or mirror)
  if (!isSpecialRequestHandled) {
    const PREDICTIVE_KEYWORDS = ["cómo crees que me sentiré", "anticipar emocionalmente", "qué días suelo estar", "predicción emocional", "patrón emocional para"];
    if (PREDICTIVE_KEYWORDS.some(keyword => userMessageLower.includes(keyword))) {
      isSpecialRequestHandled = true;
      console.log("[api/openai.js] Solicitud de predicción/patrón emocional detectada.");
      let fechaObjetivo = null;
      if (userMessageLower.includes("próxima semana") || userMessageLower.includes("semana que viene")) {
          fechaObjetivo = new Date(); fechaObjetivo.setDate(fechaObjetivo.getDate() + 7);
      } else if (userMessageLower.match(/próximo lunes|lunes que viene/)) {
          fechaObjetivo = new Date(); while (fechaObjetivo.getDay() !== 1) { fechaObjetivo.setDate(fechaObjetivo.getDate() + 1); }
      }
      const prediccionData = await predecirEstadoEmocional(MOCK_USER_ID, fechaObjetivo);
      const systemPromptForPrediction = baseSystemPrompt +
          `\n\n[Instrucción especial: Petición de análisis de patrones o 'predicción' emocional. Datos: ${JSON.stringify(prediccionData)}. ` +
          `Comunica esto con tacto, como posibilidades basadas en el pasado, no certezas. ` +
          `Usa el 'comentario' de los datos y ofrece apoyo o discutir estrategias.]`;
      const recentMessagesForPrediction = (await obtenerMensajesRecientes(MOCK_USER_ID, 3)).map(msg => ({
          role: msg.role === 'willy' ? 'assistant' : 'user', content: msg.message
      }));
      const messagesForAPIPrediction = [
          { role: 'system', content: systemPromptForPrediction },
          ...recentMessagesForPrediction, { role: 'user', content: userMessageContent }
      ];
      try {
          const response = await axios.post('https://api.openai.com/v1/chat/completions', {
              model: 'gpt-4o', messages: messagesForAPIPrediction, temperature: 0.7, max_tokens: 1000,
          }, { headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' }});
          willyResponseContent = response.data.choices[0].message.content;
      } catch (error) {
          console.error('Error (predicción emocional):', error.response ? error.response.data : error.message);
          willyResponseContent = "Analicé tus patrones, pero tuve un problema al expresarlo. Sugiere: " + (prediccionData.comentario || "No se pudo generar comentario.");
      }
    }
  }

  // 4d. Emotional Evolution Request Detection
  if (!isSpecialRequestHandled) {
    const EVOLUTION_KEYWORDS = ["he mejorado emocionalmente", "cómo he cambiado", "evolución emocional", "más tranquilo ahora que antes", "mi progreso emocional"];
    if (EVOLUTION_KEYWORDS.some(keyword => userMessageLower.includes(keyword))) {
      isSpecialRequestHandled = true;
      console.log("[api/openai.js] Solicitud de evolución emocional detectada.");
      let rango1 = {}, rango2 = null;
      if (userMessageLower.includes("este mes vs") || userMessageLower.includes("este mes comparado con")) {
          const hoy = new Date();
          rango1.fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
          rango1.fechaFin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
          rango2 = {};
          const mesAnterior = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
          rango2.fechaInicio = new Date(mesAnterior.getFullYear(), mesAnterior.getMonth(), 1);
          rango2.fechaFin = new Date(mesAnterior.getFullYear(), mesAnterior.getMonth() + 1, 0);
      } else if (userMessageLower.includes("este mes") || userMessageLower.includes("último mes")) {
          const hoy = new Date();
          rango1.fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
          rango1.fechaFin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
      } else {
          rango1.fechaFin = new Date();
          rango1.fechaInicio = new Date();
          rango1.fechaInicio.setDate(rango1.fechaFin.getDate() - 29);
          rango1.fechaInicio.setHours(0,0,0,0);
      }
      const evolucionData = await analizarEvolucionEmocional(MOCK_USER_ID, rango1, rango2);
      const systemPromptForEvolution = baseSystemPrompt +
          `\n\n[Instrucción especial: Petición de análisis de evolución emocional. Datos: ${JSON.stringify(evolucionData)}. ` +
          `Explica esto comprensiva y cálidamente. Usa el 'comentario' como base. ` +
          `Destaca cambios positivos y ofrece apoyo.]`;
      const recentMessagesForEvolution = (await obtenerMensajesRecientes(MOCK_USER_ID, 3)).map(msg => ({
          role: msg.role === 'willy' ? 'assistant' : 'user', content: msg.message
      }));
      const messagesForAPIEvolution = [
          { role: 'system', content: systemPromptForEvolution },
          ...recentMessagesForEvolution, { role: 'user', content: userMessageContent }
      ];
      try {
          const response = await axios.post('https://api.openai.com/v1/chat/completions', {
              model: 'gpt-4o', messages: messagesForAPIEvolution, temperature: 0.7, max_tokens: 1000,
          }, { headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' }});
          willyResponseContent = response.data.choices[0].message.content;
      } catch (error) {
          console.error('Error (evolución emocional):', error.response ? error.response.data : error.message);
          willyResponseContent = "Analicé tu evolución, pero tuve problema al expresarlo. Indica: " + (evolucionData.comentario || "No se pudo generar comentario.");
      }
    }
  }

  // 4e. Emotional Summary Request Detection
  if (!isSpecialRequestHandled && !overrideSystemPrompt) { // Ensure overrideSystemPrompt is not active
    const SUMMARY_KEYWORDS = ["cómo he estado", "resumen emocional", "emociones he sentido", "estado emocional", "mis emociones últimamente"];
    if (SUMMARY_KEYWORDS.some(keyword => userMessageLower.includes(keyword))) {
      isSpecialRequestHandled = true;
      console.log("[api/openai.js] Solicitud de resumen emocional detectada.");
      const { fechaInicio, fechaFin } = parseDateRangeForQuery(userMessageLower); // Use helper for date parsing

      const resumenTexto = await generarResumenEmocional(MOCK_USER_ID, fechaInicio, fechaFin);

      // Construct a dedicated system prompt for conversational summary
      const systemPromptForConversationalSummary = overrideSystemPrompt ? overrideSystemPrompt : // Should not happen if !overrideSystemPrompt
          baseSystemPrompt + `\n\n[Instrucción especial: El usuario ha pedido un resumen de su estado emocional. ` +
          `Los datos clave son: "${resumenTexto}". ` +
          `En lugar de solo listar los datos, quiero que actúes como Willy y tengas una conversación al respecto. ` +
          `Puedes empezar diciendo algo como: "He estado reflexionando sobre cómo te has sentido últimamente, y he notado algunas cosas. ¿Te gustaría que te comparta un pequeño resumen?" ` +
          `Si la respuesta implícita es sí (ya que el usuario lo pidió), entonces presenta el resumen de forma narrativa y empática. ` +
          `Por ejemplo: 'Parece que en [periodo], tus emociones más frecuentes fueron [emociones]. También noté que...' ` +
          `Concluye de una forma que invite a la reflexión o al diálogo continuo. Todo debe ser parte de tu respuesta conversacional.]`;

      const recentMessagesForSummary = (await obtenerMensajesRecientes(MOCK_USER_ID, 5)).map(msg => ({
          role: msg.role === 'willy' ? 'assistant' : 'user', content: msg.message
      }));

      const messagesForAPISummary = [
          { role: 'system', content: systemPromptForConversationalSummary },
          ...recentMessagesForSummary,
          { role: 'user', content: userMessageContent } // Include the original user message that triggered the summary
      ];

      try {
          const response = await axios.post('https://api.openai.com/v1/chat/completions', {
              model: 'gpt-4o', messages: messagesForAPISummary, temperature: 0.7, max_tokens: 1000,
          }, { headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' }});
          willyResponseContent = response.data.choices[0].message.content;
      } catch (error) {
          console.error('Error (resumen conversacional):', error.response ? error.response.data : error.message);
          // Fallback to a more direct presentation if OpenAI phrasing fails
          willyResponseContent = "He preparado un resumen de tus emociones recientes: " + resumenTexto + "\n¿Qué piensas sobre esto?";
      }
    }
  }

  // 4f. Internet Search Detection
  if (!isSpecialRequestHandled && !overrideSystemPrompt) { // Don't add internet context if using override
    let needsInternetSearch = false;
    let internetQuery = "";
    for (const keyword of INTERNET_SEARCH_KEYWORDS) {
      if (userMessageLower.includes(keyword)) {
        needsInternetSearch = true;
        let queryCandidate = userMessageContent.substring(userMessageLower.indexOf(keyword) + keyword.length).trim();
        for (const stopWord of INTERNET_QUERY_STOP_WORDS) {
          if (queryCandidate.toLowerCase().startsWith(stopWord)) queryCandidate = queryCandidate.substring(stopWord.length).trim();
        }
        internetQuery = queryCandidate;
        if (internetQuery.endsWith("?")) internetQuery = internetQuery.slice(0, -1);
        break;
      }
    }
    if (needsInternetSearch && internetQuery) {
      isSpecialRequestHandled = true;
      console.log(`[api/openai.js] Internet search: "${internetQuery}"`);
      if (viewTextWebsiteTool) internetContext = await fetchAndParseDDG(internetQuery, viewTextWebsiteTool);
      else { console.warn("viewTextWebsiteTool not available."); internetContext = await fetchAndParseDDG(internetQuery, null); }
      finalSystemPrompt += "\n\n--- Información de internet ---\n" + internetContext;
    }
  }

  // 4g. Memory Recall Detection
  if (!isSpecialRequestHandled && !overrideSystemPrompt) { // Don't add memory context if using override
    const wantsToRecall = RECALL_KEYWORDS.some(keyword => userMessageLower.includes(keyword));
    if (wantsToRecall) {
      isSpecialRequestHandled = true;
      let searchTerm = "";
      if (userMessageLower.includes("lo último que hablamos")) {}
      else {
        const aboutMatch = userMessageLower.match(/sobre ([\wáéíóúñ]+)/i);
        if (aboutMatch && aboutMatch[1]) searchTerm = aboutMatch[1];
        else {
          const words = userMessageLower.split(' ').filter(word => !RECALL_KEYWORDS.join(' ').includes(word) && word.length > 2);
          if (words.length > 0) searchTerm = words[words.length - 1];
        }
      }
      if (searchTerm) {
        const relevantMessagesRaw = await buscarMensajesPorPalabraClave(MOCK_USER_ID, searchTerm);
        if (relevantMessagesRaw.length > 0) {
          memoryContext = "Referencia de conversaciones pasadas:\n";
          relevantMessagesRaw.slice(-3).forEach(msg => {
            const date = msg.timestamp && msg.timestamp.toDate ? msg.timestamp.toDate().toLocaleDateString() : 'antes';
            memoryContext += `- (${msg.role === 'user' ? 'Tú' : 'Yo'} el ${date}): "${msg.message}"\n`;
          });
        } else memoryContext = `Busqué sobre "${searchTerm}", pero no encontré algo específico. ¿Más detalles?\n`;
      } else if (userMessageLower.includes("lo último que hablamos")) memoryContext = "Revisando lo último...\n";
      else memoryContext = "Parece que quieres recordar algo. ¿Más detalles?\n";
      if (memoryContext) finalSystemPrompt += "\n\n--- Memoria ---\n" + memoryContext;
    }
  }

  // 5. OpenAI API call if no direct response yet
  if (!willyResponseContent) {
    const recentMessagesRaw = await obtenerMensajesRecientes(MOCK_USER_ID, overrideSystemPrompt ? 3 : 10); // Less history if override prompt is detailed
    const recentMessagesForAPI = recentMessagesRaw.map(msg => ({
      role: msg.role === 'willy' ? 'assistant' : msg.role,
      content: msg.message
    }));

    const messagesForAPI = [
      { role: 'system', content: finalSystemPrompt },
      ...recentMessagesForAPI,
    ];

    console.log("[api/openai.js] Messages for API (standard):", JSON.stringify(messagesForAPI, null, 2));

    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4o',
          messages: messagesForAPI,
          temperature: 0.7,
          max_tokens: 1000,
        },
        {
          headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' }
        }
      );
      willyResponseContent = response.data.choices[0].message.content;
    } catch (error) {
      console.error('Error al obtener respuesta de Willy (standard):', error.response ? error.response.data : error.message);
      willyResponseContent = "Lo siento... hubo un problema técnico al intentar generar una respuesta. ¿Podemos intentarlo de nuevo?";
    }
  }
  try {
    await guardarMensajeFirestore({
      userId: MOCK_USER_ID,
      role: 'willy',
      message: willyResponseContent,
      emotion: detectarEmocion(willyResponseContent) // También detectar emoción en respuesta de Willy
    });
  } catch (error) {
    console.error("[api/openai.js] Error guardando respuesta de Willy (standard) en Firestore:", error);
  }

  return willyResponseContent;
}

// Helper para la lógica de activación de modo terapia por emoción negativa (usado arriba)
const ACTIVAR_KEYWORDS = [
  "modo terapia", "necesito hablar", "estoy triste", "me siento mal",
  "estoy ansioso", "me siento ansiosa", "estoy deprimido", "estoy deprimida",
  "no puedo más", "ayúdame", "necesito apoyo", "me siento abrumado", "me siento abrumada"
];
