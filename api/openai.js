import axios from 'axios';
import { systemPrompt as baseSystemPrompt } from '../config/personalityPrompt.js';
import {
    guardarMensajeFirestore,
    buscarMensajesPorPalabraClave,
    obtenerMensajesRecientes,
    generarResumenEmocional,
    marcarComoMemorable,
    obtenerMomentosMemorables,
    analizarEvolucionEmocional // Importar la nueva función
} from '../services/firestoreService.js';
import { fetchAndParseDDG } from '../lib/internet.js';
import * as terapiaLogic from '../modules/modo_terapia/logica_modo_terapia.js';
import * as terapiaContent from '../modules/modo_terapia/contenido_terapia.js';
import { detectarEmocion } from '../modules/analisis_emocional/detectarEmocion.js';
import { esEmocionNegativa, EMOCIONES } from '../modules/analisis_emocional/emociones_basicas.js';

const OPENAI_API_KEY = 'TU_API_KEY_AQUI'; // Reemplaza con la clave real
const MOCK_USER_ID = 'user123'; // Placeholder for user identification, debería ser dinámico

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

export async function getWillyResponse(userMessageContent) {
  const userMessageLower = userMessageContent.toLowerCase();
  let willyResponseContent = "";
  let initialTherapyMessage = "";

  const emocionDetectada = detectarEmocion(userMessageContent);
  console.log(`[api/openai.js] Emoción detectada para mensaje de usuario: ${emocionDetectada}`);

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


  // 3. Therapy Mode Logic (check before standard operations)
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

  // 4. Standard Operation: Internet Search, Memory Recall, Emotional Summary, Evolution or General Chat
  let memoryContext = "";
  let internetContext = "";
  let finalSystemPrompt = baseSystemPrompt;
  let isSpecialRequestHandled = false; // Flag to check if a special request (summary, evolution) was handled

  if (emocionDetectada && emocionDetectada !== EMOCIONES.NEUTRO && !terapiaLogic.estaEnModoTerapia()) {
    if (esEmocionNegativa(emocionDetectada)) {
      finalSystemPrompt += `\n\n[Contexto emocional: El usuario parece sentirse ${emocionDetectada}. Responde con especial empatía y suavidad, validando sus sentimientos si es apropiado, incluso si no pide ayuda explícitamente.]`;
    } else if (esEmocionPositiva(emocionDetectada)) {
      finalSystemPrompt += `\n\n[Contexto emocional: El usuario parece sentirse ${emocionDetectada}. Comparte su entusiasmo o responde de manera cálida y acorde.]`;
    }
  }

  // 4a. Emotional Evolution Request Detection
  const EVOLUTION_KEYWORDS = ["he mejorado emocionalmente", "cómo he cambiado", "evolución emocional", "más tranquilo ahora que antes", "mi progreso emocional"];
  if (EVOLUTION_KEYWORDS.some(keyword => userMessageLower.includes(keyword))) {
    isSpecialRequestHandled = true;
    console.log("[api/openai.js] Solicitud de evolución emocional detectada.");

    let rango1 = {}, rango2 = null;
    // Parse date ranges (simplified - focusing on "este mes" vs "mes anterior" or "este mes" trend)
    // TODO: More robust date parsing for flexible user queries.
    if (userMessageLower.includes("este mes vs") || userMessageLower.includes("este mes comparado con")) {
        const hoy = new Date();
        rango1.fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        rango1.fechaFin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0); // Last day of current month

        rango2 = {};
        const mesAnterior = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
        rango2.fechaInicio = new Date(mesAnterior.getFullYear(), mesAnterior.getMonth(), 1);
        rango2.fechaFin = new Date(mesAnterior.getFullYear(), mesAnterior.getMonth() + 1, 0);
    } else if (userMessageLower.includes("este mes") || userMessageLower.includes("último mes")) { // Trend within this month
        const hoy = new Date();
        rango1.fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        rango1.fechaFin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
    } else { // Default to last 30 days if no specific month term found
        rango1.fechaFin = new Date();
        rango1.fechaInicio = new Date();
        rango1.fechaInicio.setDate(rango1.fechaFin.getDate() - 29);
        rango1.fechaInicio.setHours(0,0,0,0);
    }

    const evolucionData = await analizarEvolucionEmocional(MOCK_USER_ID, rango1, rango2);
    const systemPromptForEvolution = baseSystemPrompt +
        `\n\n[Instrucción especial: El usuario ha pedido un análisis de su evolución emocional. Aquí tienes los datos del análisis: ${JSON.stringify(evolucionData)}. ` +
        `Explícale esta evolución de manera comprensiva, cálida y humana. Usa el campo 'comentario' como base, pero siéntete libre de expandirlo con tu propia voz empática, ` +
        `destacando cambios positivos y ofreciendo apoyo si se observan desafíos. Menciona los periodos comparados si es relevante.]`;

    const recentMessagesForEvolution = (await obtenerMensajesRecientes(MOCK_USER_ID, 3)).map(msg => ({
        role: msg.role === 'willy' ? 'assistant' : 'user', content: msg.message
    }));
    const messagesForAPIEvolution = [
        { role: 'system', content: systemPromptForEvolution },
        ...recentMessagesForEvolution,
        { role: 'user', content: userMessageContent }
    ];

    try {
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: 'gpt-4o', messages: messagesForAPIEvolution, temperature: 0.7, max_tokens: 1000,
        }, { headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' }});
        willyResponseContent = response.data.choices[0].message.content;
    } catch (error) {
        console.error('Error al obtener respuesta de Willy (evolución emocional):', error.response ? error.response.data : error.message);
        willyResponseContent = "Pude analizar tu evolución emocional, pero tuve un problema al expresarlo. Aquí está el comentario principal del análisis:\n" + (evolucionData.comentario || "No se pudo generar un comentario detallado.");
    }
  }


  // 4b. Emotional Summary Request Detection (if not evolution)
  if (!isSpecialRequestHandled) {
    const SUMMARY_KEYWORDS = ["cómo he estado", "resumen emocional", "emociones he sentido", "estado emocional", "mis emociones últimamente"];
    if (SUMMARY_KEYWORDS.some(keyword => userMessageLower.includes(keyword))) {
      isSpecialRequestHandled = true;
      console.log("[api/openai.js] Solicitud de resumen emocional detectada.");
      let fechaInicio, fechaFin;
      if (userMessageLower.includes("última semana") || userMessageLower.includes("esta semana")) {
        fechaFin = new Date();
        fechaInicio = new Date();
        fechaInicio.setDate(fechaFin.getDate() - 6);
        fechaInicio.setHours(0,0,0,0);
      } else if (userMessageLower.includes("último mes")) {
        fechaFin = new Date();
        fechaInicio = new Date();
        fechaInicio.setMonth(fechaFin.getMonth() - 1);
        fechaInicio.setHours(0,0,0,0);
      }
      const resumenTexto = await generarResumenEmocional(MOCK_USER_ID, fechaInicio, fechaFin);
      const systemPromptForSummary = baseSystemPrompt +
          `\n\n[Instrucción especial: El usuario ha pedido un resumen de su estado emocional. Aquí tienes los datos: "${resumenTexto}". Por favor, preséntale esta información de una manera cálida, reflexiva y humana. Puedes ofrecer una perspectiva gentil o una pregunta abierta sobre cómo se siente al ver este resumen. No inventes datos, solo usa la información proporcionada.]`;
      const recentMessagesForSummary = (await obtenerMensajesRecientes(MOCK_USER_ID, 5)).map(msg => ({
          role: msg.role === 'willy' ? 'assistant' : 'user', content: msg.message
      }));
      const messagesForAPISummary = [
          { role: 'system', content: systemPromptForSummary },
          ...recentMessagesForSummary,
          { role: 'user', content: userMessageContent }
      ];
      try {
          const response = await axios.post('https://api.openai.com/v1/chat/completions', {
              model: 'gpt-4o', messages: messagesForAPISummary, temperature: 0.7, max_tokens: 1000,
          }, { headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' }});
          willyResponseContent = response.data.choices[0].message.content;
      } catch (error) {
          console.error('Error al obtener respuesta de Willy (resumen emocional):', error.response ? error.response.data : error.message);
          willyResponseContent = "Pude generar tu resumen emocional, pero tuve un pequeño problema al intentar expresarlo de forma natural. Aquí están los datos directamente:\n" + resumenTexto;
      }
    }
  }

  // 4c. Internet Search Detection (if no special request handled yet)
  if (!isSpecialRequestHandled) {
    let needsInternetSearch = false;
    let internetQuery = "";
    for (const keyword of INTERNET_SEARCH_KEYWORDS) {
      if (userMessageLower.includes(keyword)) {
        needsInternetSearch = true;
        let queryCandidate = userMessageContent.substring(userMessageLower.indexOf(keyword) + keyword.length).trim();
        for (const stopWord of INTERNET_QUERY_STOP_WORDS) {
          if (queryCandidate.toLowerCase().startsWith(stopWord)) {
            queryCandidate = queryCandidate.substring(stopWord.length).trim();
          }
        }
        internetQuery = queryCandidate;
        if (internetQuery.endsWith("?")) internetQuery = internetQuery.slice(0, -1);
        break;
      }
    }
    if (needsInternetSearch && internetQuery) {
      isSpecialRequestHandled = true; // Considered handled if it's an internet search
      console.log(`[api/openai.js] Internet search needed for query: "${internetQuery}"`);
      if (viewTextWebsiteTool) {
        internetContext = await fetchAndParseDDG(internetQuery, viewTextWebsiteTool);
      } else {
        console.warn("[api/openai.js] viewTextWebsiteTool not available. Internet search will be mocked.");
        internetContext = await fetchAndParseDDG(internetQuery, null);
      }
      finalSystemPrompt += "\n\n--- Información relevante de internet ---\n" + internetContext;
    }
  }

  // 4d. Memory Recall Detection (if no special request handled yet)
  if (!isSpecialRequestHandled) {
    const wantsToRecall = RECALL_KEYWORDS.some(keyword => userMessageLower.includes(keyword));
    if (wantsToRecall) {
      isSpecialRequestHandled = true; // Considered handled if it's a memory recall
      let searchTerm = "";
      if (userMessageLower.includes("lo último que hablamos")) {
      } else {
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
          memoryContext = "Para tu referencia, anteriormente hablamos de esto:\n";
          relevantMessagesRaw.slice(-3).forEach(msg => {
            const date = msg.timestamp && msg.timestamp.toDate ? msg.timestamp.toDate().toLocaleDateString() : 'una fecha anterior';
            memoryContext += `- (${msg.role === 'user' ? 'Tú' : 'Yo'} el ${date}): "${msg.message}"\n`;
          });
        } else {
          memoryContext = `Busqué en mi memoria sobre "${searchTerm}", pero no encontré algo específico. ¿Podrías recordarme un poco más?\n`;
        }
      } else if (userMessageLower.includes("lo último que hablamos")) {
        memoryContext = "Revisando nuestras últimas conversaciones...\n";
      } else {
        memoryContext = "Parece que quieres que recuerde algo. ¿Podrías darme más detalles o una palabra clave?\n";
      }
      if (memoryContext) finalSystemPrompt += "\n\n--- Información de nuestra conversación anterior ---\n" + memoryContext;
    }
  }

  // 5. Prepare messages for OpenAI API (if response not already set by a special request)
  if (!willyResponseContent) { // If no special request handled it and set willyResponseContent directly
    const recentMessagesRaw = await obtenerMensajesRecientes(MOCK_USER_ID, 10);
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
