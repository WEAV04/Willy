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
    obtenerBalanceEmocional,
    obtenerDatosEvolucionEmocionalParaGrafico
} from '../services/firestoreService.js';
import { fetchAndParseDDG } from '../lib/internet.js';
import * as terapiaLogic from '../modules/modo_terapia/logica_modo_terapia.js';
import * as terapiaContent from '../modules/modo_terapia/contenido_terapia.js';
import { detectarEmocion } from '../modules/analisis_emocional/detectarEmocion.js';
import { esEmocionNegativa, EMOCIONES, esEmocionPositiva } from '../modules/analisis_emocional/emociones_basicas.js';
import { buscarFraseInspiradora, generarRespuestaFrustracionReflexiva } from '../modules/intervenciones_emocionales/frustracionReflexiva.js';
// import { evaluarSituacionYRecomendar as evaluarSituacionYRecomendarDefensa } from '../modules/defensaSegura.js'; // Comentado si no se usa
import { obtenerInfoProfesion } from '../modules/conocimientoProfesional.js';
// import * as Supervisor from '../modules/cameraSupervisor.js'; // Comentado si no se usa directamente aquí
import * as SupervisionVulnerable from '../modules/modo_supervision_vulnerable.js';
import * as RespuestasGuiadas from '../modules/respuestasGuiadas.js';
// import { clasificarSentimientoDePerdida } from '../modules/analisis_contexto.js'; // Comentado si no se usa

// Importaciones para Modo Crisis
import * as CrisisDetection from '../modules/crisisDetection.js';
import * as ModoCrisis from '../modules/modoCrisis.js';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'TU_API_KEY_AQUI';
const MOCK_USER_ID = 'user123'; // Placeholder, debería ser dinámico
let currentUserRole = null;
let esperandoRespuestaConsentimientoSensores = false;

const RECALL_KEYWORDS = ['recuerdas', 'te acuerdas', 'qué te dije', 'lo que te conté', 'último que hablamos'];
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

// --- Temporizador Global de No Respuesta (Mejora 17) ---
let noResponseTimer = null;
const NO_RESPONSE_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutos

function startNoResponseTimer(userId, callbackFunction, timeout = NO_RESPONSE_TIMEOUT_MS) {
    clearTimeout(noResponseTimer);
    console.log(`[api/openai.js] Iniciando no-response timer para ${userId} (${timeout / 1000}s)`);
    noResponseTimer = setTimeout(async () => {
        console.log(`[api/openai.js] No-response timer EXPIRADO para ${userId}`);
        await callbackFunction();
    }, timeout);
}

function cancelNoResponseTimer() {
    if (noResponseTimer) {
        console.log("[api/openai.js] Cancelando no-response timer.");
        clearTimeout(noResponseTimer);
        noResponseTimer = null;
    }
}

// --- Lógica de Expiración de Timer Unificada ---
async function handleTimerExpirationLogic(userIdTimedOut, tipoAlertaContexto, datosAlerta) {
    console.log(`[api/openai.js] Timer expirado para ${userIdTimedOut}. Contexto: ${tipoAlertaContexto}`);
    let mensajeAlertaParaContacto = "";
    let idCuidadorParaAlerta = MOCK_USER_ID; // Por defecto el usuario actual si no hay cuidador específico

    if (tipoAlertaContexto.startsWith("crisis")) {
        const { nombrePersona, contactoEmergencia, tipoCrisis } = datosAlerta;
        idCuidadorParaAlerta = datosAlerta.userIdCuidador || MOCK_USER_ID; // Usar ID del cuidador si existe
        mensajeAlertaParaContacto = `ALERTA URGENTE (MODO CRISIS): No se ha detectado respuesta de ${nombrePersona || 'el usuario'} (${userIdTimedOut}) durante un estado de crisis (${tipoCrisis}). Por favor, verificar inmediatamente. Contacto de emergencia registrado: ${contactoEmergencia?.nombre || 'No definido'} (${contactoEmergencia?.telefono || 'No definido'}).`;

        console.log(`Enviando alerta de CRISIS a ${contactoEmergencia?.nombre || 'contacto no definido'}: ${mensajeAlertaParaContacto}`);
        await guardarMensajeFirestore({
            userId: idCuidadorParaAlerta,
            role: 'system_alert',
            message: mensajeAlertaParaContacto,
            emotion: EMOCIONES.ALARMA,
            tags: ['timer_expired', 'crisis_alert']
        });
        // En crisis, no se pide consentimiento de sensores, la alerta es directa.
    } else if (tipoAlertaContexto === "supervision_vulnerable_no_respuesta") {
        const { userIdCuidador, nombrePersona, contactoEmergenciaSimulado } = datosAlerta;
        idCuidadorParaAlerta = userIdCuidador;
        mensajeAlertaParaContacto = SupervisionVulnerable.prepararMensajeAlertaEmergencia(nombrePersona, contactoEmergenciaSimulado.nombre);

        console.log(`[api/openai.js] Enviando alerta de SUPERVISIÓN a ${contactoEmergenciaSimulado.nombre}: ${mensajeAlertaParaContacto}`);
        await guardarMensajeFirestore({
            userId: idCuidadorParaAlerta,
            role: 'system_alert',
            message: `ALERTA ENVIADA (Supervisión Vulnerable): ${mensajeAlertaParaContacto}`,
            emotion: EMOCIONES.PREOCUPACION,
            tags: ['timer_expired', 'supervision_alert']
        });

        if (idCuidadorParaAlerta === MOCK_USER_ID) { // Solo si el cuidador actual es el que interactúa
            esperandoRespuestaConsentimientoSensores = true;
            global.pendingSensorConsentFor = { nombrePersona, userIdSupervisado: userIdTimedOut, idCuidador: idCuidadorParaAlerta };

            const preguntaConsentimiento = `Detecto una situación potencialmente urgente con ${nombrePersona} (bajo tu supervisión) y no ha respondido. ` +
                                           `Se ha enviado una notificación a su contacto de emergencia (${contactoEmergenciaSimulado.nombre}). ` +
                                           `Para ayudarte a evaluar mejor la situación de forma remota, ¿me das tu permiso explícito para (conceptualmente) activar temporalmente la cámara y el micrófono del dispositivo cercano a ${nombrePersona}? ` +
                                           `Por favor, responde 'Sí, activar sensores para ${nombrePersona}' o 'No, no activar sensores para ${nombrePersona}'. Tu privacidad y la suya son mi prioridad.`;
            console.log(`[api/openai.js] PREGUNTAR AL CUIDADOR (MOCK_USER_ID): ${preguntaConsentimiento}`);
            // Este mensaje se enviará al cuidador en la próxima interacción si es MOCK_USER_ID.
        }
        SupervisionVulnerable.registrarAlertaNoRespuesta(userIdTimedOut);
    }
}

// --- Función Principal de Respuesta de Willy ---
export async function getWillyResponse(userMessageContent, overrideSystemPrompt = null) {
    const userMessageLower = userMessageContent.toLowerCase();
    let willyResponseContent = "";
    const emocionDetectada = detectarEmocion(userMessageContent);
    let userMessageId = null; // ID del mensaje del usuario en Firestore
    let mensajeUsuarioGuardadoEsteTurno = false;

    // Función auxiliar para guardar el mensaje del usuario si aún no se ha hecho
    async function guardarMensajeUsuarioUnaVez() {
        if (!mensajeUsuarioGuardadoEsteTurno) {
            userMessageId = await guardarMensajeFirestore({
                userId: MOCK_USER_ID, role: 'user', message: userMessageContent, emotion: emocionDetectada, memorable: false
            });
            mensajeUsuarioGuardadoEsteTurno = true;
            console.log(`[api/openai.js] Mensaje de usuario guardado (ID: ${userMessageId})`);
        }
    }

    // Función auxiliar para guardar la respuesta de Willy y retornarla
    async function guardarYRetornarRespuestaWilly(respuesta, emocionWilly = null, tags = []) {
        const emocionFinalWilly = emocionWilly || detectarEmocion(respuesta) || EMOCIONES.NEUTRO;
        await guardarMensajeFirestore({
            userId: MOCK_USER_ID, role: 'willy', message: respuesta, emotion: emocionFinalWilly, tags
        });
        console.log(`[api/openai.js] Respuesta de Willy guardada. Emoción: ${emocionFinalWilly}`);
        return respuesta;
    }

    // --- 0. PRIORIDAD MÁXIMA: MODO CRISIS ---
    const historialConversacionTemp = await obtenerMensajesRecientes(MOCK_USER_ID, 5);
    const crisisDetectadaInfo = CrisisDetection.detectarPatronCrisis(userMessageLower, emocionDetectada, historialConversacionTemp.map(m => m.user_message));

    if (ModoCrisis.estaEnModoCrisis()) {
        await guardarMensajeUsuarioUnaVez();
        cancelNoResponseTimer();
        const datosCrisisActual = ModoCrisis.obtenerDatosCrisisActual();

        if (RespuestasGuiadas.FRASES_CIERRE_MODO_CRISIS.some(f => userMessageLower.includes(f.keyword)) && datosCrisisActual.userId === MOCK_USER_ID) {
            willyResponseContent = ModoCrisis.detenerModoCrisis(MOCK_USER_ID);
            return guardarYRetornarRespuestaWilly(willyResponseContent, EMOCIONES.ALIVIO, ['modo_crisis_cierre']);
        }

        const { willyMessage, needsOpenAIPhrasing, furtherContextForOpenAI } = await ModoCrisis.responderEnModoCrisis(userMessageContent, emocionDetectada, datosCrisisActual);
        let respuestaFinalCrisis = willyMessage;
        if (needsOpenAIPhrasing) {
            const promptCrisis = `PRIORIDAD MÁXIMA: MODO CRISIS ACTIVO. Usuario: ${datosCrisisActual.nombrePersona || MOCK_USER_ID}. Crisis: ${datosCrisisActual.tipoCrisis}.
Tu ÚNICO objetivo es ofrecer calma, validación inmediata y guiar hacia ayuda profesional o de confianza. Sé BREVE, DIRECTO y EXTREMADAMENTE EMPÁTICO.
NO intentes resolver el problema. NO des consejos complejos. SÓLO valida, acompaña y sugiere buscar ayuda real.
Contexto IA: ${furtherContextForOpenAI}. Mensaje usuario: "${userMessageContent}". Base para tu respuesta (si aplica, mejórala): "${willyMessage}"`;
            respuestaFinalCrisis = await getOpenAIResponse(promptCrisis, MOCK_USER_ID, userMessageContent);
        }

        startNoResponseTimer(MOCK_USER_ID, async () => {
            const dc = ModoCrisis.obtenerDatosCrisisActual(); // Datos actualizados al momento de expirar
            await handleTimerExpirationLogic(MOCK_USER_ID, `crisis_no_respuesta_${dc.tipoCrisis}`, dc);
        });
        return guardarYRetornarRespuestaWilly(respuestaFinalCrisis, EMOCIONES.PREOCUPACION, [`modo_crisis_${datosCrisisActual.tipoCrisis}`]);
    }

    if (crisisDetectadaInfo && !ModoCrisis.estaEnModoCrisis()) {
        await guardarMensajeUsuarioUnaVez();
        const datosSupervision = SupervisionVulnerable.obtenerDatosSupervision();
        const contactoEmergenciaCrisis = datosSupervision?.contactoEmergenciaSimulado || { nombre: "Ayuda Profesional Urgente", telefono: "Número de Emergencia Local (ej. 911, 112)" };

        willyResponseContent = ModoCrisis.iniciarModoCrisis(MOCK_USER_ID, crisisDetectadaInfo.tipo, crisisDetectadaInfo.urgencia, userMessageContent, "Usuario", contactoEmergenciaCrisis);

        startNoResponseTimer(MOCK_USER_ID, async () => {
            const dc = ModoCrisis.obtenerDatosCrisisActual();
            await handleTimerExpirationLogic(MOCK_USER_ID, `crisis_activacion_no_respuesta_${dc.tipoCrisis}`, dc );
        });
        return guardarYRetornarRespuestaWilly(willyResponseContent, EMOCIONES.ALARMA, [`activacion_modo_crisis_${crisisDetectadaInfo.tipo}`]);
    }
    // --- FIN MODO CRISIS ---

    // --- 1. MANEJO DE SUPERVISIÓN VULNERABLE (Si no está en crisis) ---
    const datosSupervisionActual = SupervisionVulnerable.obtenerDatosSupervision();

    // A. Comandos del Cuidador para iniciar/detener supervisión
    if (!overrideSystemPrompt && !datosSupervisionActual) { // Iniciar
        for (const kw of SupervisionVulnerable.START_SUPERVISION_KEYWORDS) {
            if (userMessageLower.startsWith(kw)) {
                await guardarMensajeUsuarioUnaVez();
                // ... (Parseo de nombre y tipo como estaba antes)
                const  nombreYTipo = userMessageContent.substring(kw.length).trim();
                let nombrePersona = nombreYTipo;
                let tipoPersona = RespuestasGuiadas.TIPOS_PERSONA_VULNERABLE.GENERAL_VULNERABLE;
                let parentesco = "ser querido";
                if (nombreYTipo.toLowerCase().includes("niño pequeño")) tipoPersona = RespuestasGuiadas.TIPOS_PERSONA_VULNERABLE.NINO_PEQUENO;
                else if (nombreYTipo.toLowerCase().includes("niño")) tipoPersona = RespuestasGuiadas.TIPOS_PERSONA_VULNERABLE.NINO_MAYOR;
                else if (nombreYTipo.toLowerCase().includes("abuelit") || nombreYTipo.toLowerCase().includes("adulto mayor")) tipoPersona = RespuestasGuiadas.TIPOS_PERSONA_VULNERABLE.ADULTO_MAYOR;
                else if (nombreYTipo.toLowerCase().includes("enferm")) tipoPersona = RespuestasGuiadas.TIPOS_PERSONA_VULNERABLE.PERSONA_ENFERMA;
                const matchNombre = nombreYTipo.match(/^([\w\s]+)(?:\s+que es|\s+mi|\s+la)?/i);
                if (matchNombre && matchNombre[1]) nombrePersona = matchNombre[1].trim();

                willyResponseContent = SupervisionVulnerable.iniciarSupervision(MOCK_USER_ID, tipoPersona, nombrePersona, "Contexto inicial no provisto", MOCK_USER_ID, parentesco);
                return guardarYRetornarRespuestaWilly(willyResponseContent, EMOCIONES.NEUTRO, ['supervision_iniciada']);
            }
        }
    }
    if (!overrideSystemPrompt && datosSupervisionActual && datosSupervisionActual.userIdCuidador === MOCK_USER_ID) { // Detener
        for (const kw of SupervisionVulnerable.STOP_SUPERVISION_KEYWORDS) {
            if (userMessageLower.startsWith(kw)) {
                const nombrePersonaEnComando = userMessageContent.substring(kw.length).trim();
                if (nombrePersonaEnComando.toLowerCase() === datosSupervisionActual.nombrePersona.toLowerCase()) {
                    await guardarMensajeUsuarioUnaVez();
                    cancelNoResponseTimer();
                    willyResponseContent = SupervisionVulnerable.detenerSupervision(MOCK_USER_ID);
                    return guardarYRetornarRespuestaWilly(willyResponseContent, EMOCIONES.NEUTRO, ['supervision_detenida']);
                }
            }
        }
    }

    // B. Si la supervisión está activa y el mensaje es del cuidador (MOCK_USER_ID)
    if (datosSupervisionActual && datosSupervisionActual.userIdCuidador === MOCK_USER_ID) {
        await guardarMensajeUsuarioUnaVez();
        cancelNoResponseTimer(); // Cuidador interactuó

        // B1. Flujo de consentimiento para sensores
        if (esperandoRespuestaConsentimientoSensores && global.pendingSensorConsentFor?.idCuidador === MOCK_USER_ID) {
            const { nombrePersona, userIdSupervisado } = global.pendingSensorConsentFor;
            if (userMessageLower.includes("sí activar sensores para " + nombrePersona.toLowerCase())) {
                willyResponseContent = `Entendido. (Conceptualmente) Iniciando activación temporal de sensores para ${nombrePersona}. Te avisaré si detecto algo.`;
                SupervisionVulnerable.registrarConsentimientoSensores(userIdSupervisado, true);
            } else if (userMessageLower.includes("no activar sensores para " + nombrePersona.toLowerCase())) {
                willyResponseContent = `De acuerdo, no se activarán los sensores para ${nombrePersona}. Si la preocupación persiste, te sugiero contactarles directamente.`;
                SupervisionVulnerable.registrarConsentimientoSensores(userIdSupervisado, false);
            } else {
                willyResponseContent = `No entendí bien tu respuesta sobre los sensores para ${nombrePersona}. Por favor, responde claramente con 'Sí, activar sensores para ${nombrePersona}' o 'No, no activar sensores para ${nombrePersona}'.`;
                // Mantener esperandoRespuestaConsentimientoSensores = true;
                return guardarYRetornarRespuestaWilly(willyResponseContent, EMOCIONES.NEUTRO, ['supervision_consentimiento_pendiente']);
            }
            esperandoRespuestaConsentimientoSensores = false;
            delete global.pendingSensorConsentFor;
            return guardarYRetornarRespuestaWilly(willyResponseContent, EMOCIONES.NEUTRO, ['supervision_consentimiento_respuesta']);
        }

        // B2. Respuesta normal como cuidador (si no es flujo de consentimiento)
        // Asumimos que el mensaje es SOBRE la persona supervisada o una interacción general del cuidador.
        // La función responderComoCuidador se encarga de la lógica de si el mensaje es de riesgo, etc.
        const { willyMessage, needsOpenAIPhrasing, furtherContextForOpenAI, iniciarTimer } =
            await SupervisionVulnerable.responderComoCuidador(userMessageContent, emocionDetectada, datosSupervisionActual);

        let respuestaFinalSupervision = willyMessage;
        if (needsOpenAIPhrasing) {
            const systemPromptSupervision = `${baseSystemPrompt}\n\n[Contexto de Supervisión Ética: Estás en rol de apoyo al cuidador (${MOCK_USER_ID}) de ${datosSupervisionActual.nombrePersona} (${datosSupervisionActual.tipoPersona}). Mensaje del cuidador: "${userMessageContent}". Instrucciones: ${furtherContextForOpenAI}]`;
            respuestaFinalSupervision = await getOpenAIResponse(systemPromptSupervision, MOCK_USER_ID, baseMsgCuidador);
        }

        if (iniciarTimer) { // Timer por riesgo detectado en mensaje DEL SUPERVISADO (o interpretado por el cuidador)
            startNoResponseTimer(datosSupervisionActual.userIdSupervisado, async () => {
                await handleTimerExpirationLogic(datosSupervisionActual.userIdSupervisado, "supervision_vulnerable_no_respuesta", datosSupervisionActual);
            });
        }
        return guardarYRetornarRespuestaWilly(respuestaFinalSupervision, detectarEmocion(respuestaFinalSupervision) || EMOCIONES.COMPASIVO, ['supervision_respuesta_cuidador']);
    }
    // --- FIN SUPERVISIÓN VULNERABLE ---

    // --- Guardado de mensaje de usuario (si no se hizo en flujos prioritarios) ---
    await guardarMensajeUsuarioUnaVez();


    // --- 2. LÓGICAS DE RESPUESTA ESTÁNDAR (Anclajes, Terapia, etc.) ---
    // Anclajes (Marcar)
    if (RespuestasGuiadas.MARK_MEMORABLE_KEYWORDS.some(kw => userMessageLower.includes(kw))) {
        if (userMessageId) {
            await marcarComoMemorable(userMessageId);
            willyResponseContent = terapiaContent.obtenerFraseAleatoria(terapiaContent.frasesValidacion) + " Lo he guardado como un momento especial.";
        } else {
            willyResponseContent = terapiaContent.obtenerFraseAleatoria(terapiaContent.frasesValidacion) + " Entendido, lo tendré muy presente en nuestra conversación.";
        }
        return guardarYRetornarRespuestaWilly(willyResponseContent, EMOCIONES.CALMA, ['anclaje_marcar']);
    }

    // Anclajes (Recuperar)
    if (RespuestasGuiadas.RECALL_MEMORABLE_KEYWORDS.some(kw => userMessageLower.includes(kw))) {
        const momentos = await obtenerMomentosMemorables(MOCK_USER_ID, 1);
        if (momentos && momentos.length > 0) {
            // ... (formateo de textoMomento como antes)
            const momento = momentos[0];
            let textoMomento = `Recordé algo especial que compartimos el ${new Date(momento.timestamp.toDate()).toLocaleDateString()}:\n`;
            textoMomento += (momento.role === 'user' ? `Tú dijiste: "${momento.message}"` : `Yo te dije: "${momento.message}"`);
            if (momento.emotion && momento.emotion !== EMOCIONES.NEUTRO) textoMomento += `\n(Parece que en ese momento te sentías ${momento.emotion})`;
            textoMomento += "\n\nEspero que este recuerdo te traiga una sonrisa. 😊";
            willyResponseContent = textoMomento;
        } else {
            willyResponseContent = "Busqué en nuestros momentos especiales guardados, pero no encontré uno ahora. ¡Seguro crearemos muchos más!";
        }
        return guardarYRetornarRespuestaWilly(willyResponseContent, EMOCIONES.ALEGRIA, ['anclaje_recuperar']);
    }

    // Intervención Frustración
    if (emocionDetectada === EMOCIONES.FRUSTRACION && !terapiaLogic.estaEnModoTerapia()) {
        const ultimosMensajesUsuario = (await obtenerMensajesRecientes(MOCK_USER_ID, 5)).filter(m => m.role === 'user');
        if (ultimosMensajesUsuario.length >= 2 && ultimosMensajesUsuario[0].emotion === EMOCIONES.FRUSTRACION && ultimosMensajesUsuario[1].emotion === EMOCIONES.FRUSTRACION) {
            const quoteObj = await buscarFraseInspiradora("paciencia superación perspectiva", viewTextWebsiteTool);
            willyResponseContent = generarRespuestaFrustracionReflexiva(quoteObj);
            return guardarYRetornarRespuestaWilly(willyResponseContent, EMOCIONES.CALMA, ['frustracion_intervencion']);
        }
    }

    // Modo Terapia
    if (terapiaLogic.detectarDesactivacionTerapia(userMessageLower)) {
        willyResponseContent = terapiaLogic.desactivarModoTerapia();
        return guardarYRetornarRespuestaWilly(willyResponseContent, EMOCIONES.NEUTRO, ['terapia_desactivada']);
    }
    if (terapiaLogic.estaEnModoTerapia() || terapiaLogic.detectarNecesidadTerapia(userMessageLower) || (emocionDetectada && esEmocionNegativa(emocionDetectada) && !terapiaLogic.estaEnModoTerapia())) {
        let initialTherapyMsg = "";
        if (!terapiaLogic.estaEnModoTerapia()) {
            initialTherapyMsg = terapiaLogic.activarModoTerapia();
            if (emocionDetectada && esEmocionNegativa(emocionDetectada) && !RespuestasGuiadas.ACTIVAR_TERAPIA_KEYWORDS.some(kw => userMessageLower.includes(kw))) {
                 const momentosPositivos = await obtenerMomentosMemorables(MOCK_USER_ID, 1);
                 if (momentosPositivos && momentosPositivos.length > 0) {
                    initialTherapyMsg += `\nHe notado que quizás te sientes ${emocionDetectada}. Estoy aquí. A veces recordar momentos bonitos ayuda. ¿Quieres que te recuerde alguno?`;
                 } else {
                    initialTherapyMsg += `\nHe notado que quizás te sientes ${emocionDetectada}. Estoy aquí para escucharte.`;
                 }
            }
        }
        const therapyResponse = await terapiaLogic.responderComoTerapia(userMessageContent, axios.post, OPENAI_API_KEY, await obtenerMensajesRecientes(MOCK_USER_ID, 10));
        willyResponseContent = initialTherapyMsg ? initialTherapyMsg + "\n\n" + therapyResponse : therapyResponse;
        return guardarYRetornarRespuestaWilly(willyResponseContent, detectarEmocion(willyResponseContent) || EMOCIONES.ESCUCHA_ACTIVA, ['terapia_respuesta']);
    }
    if (terapiaLogic.detectarSugerenciaTerapia(userMessageLower)) {
        willyResponseContent = terapiaContent.obtenerFraseAleatoria(terapiaContent.frasesValidacion) + " Parece un momento difícil. Si necesitas un espacio más tranquilo, solo dime \"modo terapia\".";
        return guardarYRetornarRespuestaWilly(willyResponseContent, EMOCIONES.CALMA, ['terapia_sugerencia']);
    }

    // --- Solicitudes Especiales (Resúmenes, Gráficos, etc.) ---
    let finalSystemPrompt = overrideSystemPrompt || baseSystemPrompt;
    let isSpecialRequestHandled = false;
    let chartTriggerData = null;

    // Contextualización Profesional/Rol (si no hay override)
    if (!overrideSystemPrompt) {
        // ... (lógica de detección y adición de contexto profesional/rol como estaba)
        const profesionDeclarada = userMessageLower.match(/soy ([\w\s]+)/i) || userMessageLower.match(/trabajo como ([\w\s]+)/i) || userMessageLower.match(/trabajo de ([\w\s]+)/i);
        if (profesionDeclarada && profesionDeclarada[1]) {
            // ... (mapeo de rol)
            currentUserRole = profesionDeclarada[1].trim().toLowerCase().replace(/\s+/g, '_'); // Simplificado
            console.log(`[api/openai.js] Profesión/Rol detectado y almacenado para la sesión: ${currentUserRole}`);
        }
        if (currentUserRole) {
            const infoProfesion = obtenerInfoProfesion(currentUserRole);
            finalSystemPrompt += `\n\n[Contexto Profesional/Rol del Usuario: El usuario se identifica como ${infoProfesion.nombreDisplay}. Considera esto al responder.]`;
        }
        if (emocionDetectada && emocionDetectada !== EMOCIONES.NEUTRO && !terapiaLogic.estaEnModoTerapia()) {
            finalSystemPrompt += `\n[Contexto emocional: El usuario parece sentirse ${emocionDetectada}. Adapta tu respuesta.]`;
        }
    }

    // Lógica para gráficos, resúmenes, etc. (condensada)
    // ... (CHART_LINE_KEYWORDS, CHART_PIE_KEYWORDS, MIRROR_KEYWORDS, PREDICTIVE_KEYWORDS, EVOLUTION_KEYWORDS, SUMMARY_KEYWORDS)
    // ... (Cada bloque debe setear isSpecialRequestHandled = true y willyResponseContent o chartTriggerData)
    // Ejemplo de Resumen Emocional:
    if (RespuestasGuiadas.SUMMARY_KEYWORDS.some(kw => userMessageLower.includes(kw))) {
        isSpecialRequestHandled = true;
        const { fechaInicio, fechaFin } = RespuestasGuiadas.parseDateRangeForQuery(userMessageLower);
        const resumenTexto = await generarResumenEmocional(MOCK_USER_ID, fechaInicio, fechaFin);
        const systemPromptSum = `${finalSystemPrompt}\n\n[Instrucción: El usuario pidió resumen emocional. Datos: "${resumenTexto}". Conversa sobre esto.]`;
        willyResponseContent = await getOpenAIResponse(systemPromptSum, MOCK_USER_ID, userMessageContent);
        // chartTriggerData = { action: "display_summary_text", data: resumenTexto, messageForUser: willyResponseContent }; // Si se quiere acción específica
    }

    // Búsqueda en Internet
    if (!isSpecialRequestHandled && !overrideSystemPrompt && INTERNET_SEARCH_KEYWORDS.some(kw => userMessageLower.includes(kw))) {
        // ... (lógica de búsqueda y adición a finalSystemPrompt)
        isSpecialRequestHandled = true; // Para forzar llamada a OpenAI con este contexto
    }

    // Recuerdo de Memoria
    if (!isSpecialRequestHandled && !overrideSystemPrompt && RECALL_KEYWORDS.some(kw => userMessageLower.includes(kw))) {
        // ... (lógica de recuerdo y adición a finalSystemPrompt)
        isSpecialRequestHandled = true; // Para forzar llamada a OpenAI
    }

    // --- Llamada final a OpenAI si ninguna lógica anterior dio respuesta completa ---
    if (!willyResponseContent && !(chartTriggerData && chartTriggerData.messageForUser)) {
        // Si es una solicitud especial que añadió contexto al prompt, o si es un mensaje general.
        willyResponseContent = await getOpenAIResponse(finalSystemPrompt, MOCK_USER_ID, userMessageContent);
    } else if (chartTriggerData && chartTriggerData.messageForUser && !willyResponseContent) {
        willyResponseContent = chartTriggerData.messageForUser; // Usar el mensaje ya generado para el gráfico
    }

    // Guardado y retorno final
    if (chartTriggerData) {
        await guardarYRetornarRespuestaWilly(willyResponseContent, null, ['chart_request_response']); // Guardar el mensaje de Willy
        return { ...chartTriggerData, messageForUser: willyResponseContent }; // Devolver el objeto chart
    }
    return guardarYRetornarRespuestaWilly(willyResponseContent, null, ['general_response']);
}

// --- Función Auxiliar para llamadas a OpenAI ---
async function getOpenAIResponse(systemMessageContent, userIdForHistory = MOCK_USER_ID, userPromptForAPICall = null) {
    const recentMessagesRaw = await obtenerMensajesRecientes(userIdForHistory, 7); // Historial más corto para llamadas específicas
    const messagesForAPI = [{ role: 'system', content: systemMessageContent }];

    recentMessagesRaw.forEach(msg => {
        messagesForAPI.push({
            role: msg.role === 'willy' ? 'assistant' : 'user',
            content: msg.message
        });
    });

    if (userPromptForAPICall && messagesForAPI[messagesForAPI.length -1].content !== userPromptForAPICall) {
        messagesForAPI.push({ role: 'user', content: userPromptForAPICall });
    }

    console.log("[getOpenAIResponse] System prompt for this call:", systemMessageContent);
    console.log("[getOpenAIResponse] Messages for API (last 3):", JSON.stringify(messagesForAPI.slice(-3), null, 2));

    try {
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: 'gpt-4o', // o el modelo que estés usando
            messages: messagesForAPI,
            temperature: 0.65,
            max_tokens: 300,
        }, { headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' } });
        return response.data.choices[0].message.content.trim();
    } catch (error) {
        console.error('Error en getOpenAIResponse:', error.response?.data || error.message);
        // Devolver una frase de error genérica pero empática de Willy
        return terapiaContent.obtenerFraseAleatoria(terapiaContent.frasesErrorComunicacion) ||
               "Vaya, parece que mis pensamientos se enredaron un poquito. ¿Podrías decírmelo de nuevo, por favor?";
    }
}

// Keywords de activación de terapia (ya definidos en respuestasGuiadas.js, pero pueden ser referenciados si es necesario)
// const ACTIVAR_KEYWORDS = RespuestasGuiadas.ACTIVAR_TERAPIA_KEYWORDS;
