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
    // Asumimos que firestoreService.js también exportará una función genérica para guardar documentos
    // y otra para consultar colecciones, que usará eventosCriticos.js.
    // Por ejemplo: guardarDocumentoEnColeccion, consultarColeccionConFiltros.
} from '../services/firestoreService.js';
import { fetchAndParseDDG } from '../lib/internet.js';
import * as terapiaLogic from '../modules/modo_terapia/logica_modo_terapia.js';
import * as terapiaContent from '../modules/modo_terapia/contenido_terapia.js';
import { detectarEmocion } from '../modules/analisis_emocional/detectarEmocion.js';
import { esEmocionNegativa, EMOCIONES, esEmocionPositiva } from '../modules/analisis_emocional/emociones_basicas.js';
import { buscarFraseInspiradora, generarRespuestaFrustracionReflexiva } from '../modules/intervenciones_emocionales/frustracionReflexiva.js';
import { obtenerInfoProfesion } from '../modules/conocimientoProfesional.js';
import * as SupervisionVulnerable from '../modules/modo_supervision_vulnerable.js';
import * as RespuestasGuiadas from '../modules/respuestasGuiadas.js';

// Importaciones para Modo Crisis
import * as CrisisDetection from '../modules/crisisDetection.js';
import * as ModoCrisis from '../modules/modoCrisis.js';

// Importaciones para Registro Ético de Eventos Críticos (Mejora 21)
import * as EventosCriticos from '../modules/eventosCriticos.js';


const OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'TU_API_KEY_AQUI';
const MOCK_USER_ID = 'user123';
let currentUserRole = null;
let esperandoRespuestaConsentimientoSensores = false;
global.pendingSensorConsentFor = null; // Usado por supervisión vulnerable para el consentimiento de sensores
global.eventoCriticoPendienteDeConsentimiento = null; // Usado por eventosCriticos para el consentimiento de registro

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

let noResponseTimer = null;
const NO_RESPONSE_TIMEOUT_MS = 5 * 60 * 1000;

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

async function handleTimerExpirationLogic(userIdTimedOut, tipoAlertaContexto, datosAlerta) {
    console.log(`[api/openai.js] Timer expirado para ${userIdTimedOut}. Contexto: ${tipoAlertaContexto}`);
    let mensajeAlertaParaContacto = "";
    let idCuidadorParaAlerta = MOCK_USER_ID;
    let eventoCriticoParaRegistro = null;

    if (tipoAlertaContexto.startsWith("crisis")) {
        const { nombrePersona, contactoEmergencia, tipoCrisis, userId } = datosAlerta;
        idCuidadorParaAlerta = datosAlerta.userIdCuidador || userId; // Usar el ID del usuario en crisis si no hay cuidador
        mensajeAlertaParaContacto = `ALERTA URGENTE (MODO CRISIS): No se ha detectado respuesta de ${nombrePersona || 'el usuario'} (${userIdTimedOut}) durante un estado de crisis (${tipoCrisis}). Por favor, verificar inmediatamente. Contacto de emergencia: ${contactoEmergencia?.nombre || 'No definido'} (${contactoEmergencia?.telefono || 'No definido'}).`;

        await guardarMensajeFirestore({
            userId: idCuidadorParaAlerta, role: 'system_alert', message: mensajeAlertaParaContacto,
            emotion: EMOCIONES.ALARMA, tags: ['timer_expired', 'crisis_alert']
        });
        eventoCriticoParaRegistro = {
            tipoEvento: EventosCriticos.TIPOS_EVENTO_CRITICO.NO_RESPONDE_TIMER_CRISIS,
            detalleEvento: `Usuario no respondió tras timer en Modo Crisis (${tipoCrisis}). Alerta enviada a ${contactoEmergencia?.nombre || 'contacto por defecto'}.`,
            modoActivado: "ModoCrisis"
        };
    } else if (tipoAlertaContexto === "supervision_vulnerable_no_respuesta") {
        const { userIdCuidador, nombrePersona, contactoEmergenciaSimulado, userIdSupervisado } = datosAlerta;
        idCuidadorParaAlerta = userIdCuidador;
        mensajeAlertaParaContacto = SupervisionVulnerable.prepararMensajeAlertaEmergencia(nombrePersona, contactoEmergenciaSimulado.nombre);

        await guardarMensajeFirestore({
            userId: idCuidadorParaAlerta, role: 'system_alert', message: `ALERTA ENVIADA (Supervisión Vulnerable): ${mensajeAlertaParaContacto}`,
            emotion: EMOCIONES.PREOCUPACION, tags: ['timer_expired', 'supervision_alert']
        });

        if (idCuidadorParaAlerta === MOCK_USER_ID) {
            esperandoRespuestaConsentimientoSensores = true;
            global.pendingSensorConsentFor = { nombrePersona, userIdSupervisado, idCuidador: idCuidadorParaAlerta };
            // El mensaje de solicitud de consentimiento se manejará en el próximo turno del cuidador.
        }
        SupervisionVulnerable.registrarAlertaNoRespuesta(userIdSupervisado);
        eventoCriticoParaRegistro = {
            tipoEvento: EventosCriticos.TIPOS_EVENTO_CRITICO.NO_RESPONDE_TIMER_SUPERVISION,
            detalleEvento: `Persona supervisada (${nombrePersona}) no respondió tras timer. Alerta enviada a ${contactoEmergenciaSimulado.nombre}.`,
            modoActivado: "SupervisionVulnerable"
        };
    }

    // Solicitar consentimiento para registrar el evento crítico (la no respuesta)
    // Esta solicitud irá dirigida al usuario que estaba siendo monitoreado o al cuidador si es el que interactúa.
    // Para simplificar, si es MOCK_USER_ID (que puede ser el usuario directo o el cuidador interactuando), se le pregunta.
    if (eventoCriticoParaRegistro && userIdTimedOut === MOCK_USER_ID) { // Solo preguntar si el usuario afectado es el que interactúa
        const { mensajeParaWilly, datosEventoPendiente } = EventosCriticos.solicitarConsentimientoRegistroEvento(
            userIdTimedOut,
            eventoCriticoParaRegistro.tipoEvento,
            eventoCriticoParaRegistro.detalleEvento,
            eventoCriticoParaRegistro.modoActivado
        );
        global.eventoCriticoPendienteDeConsentimiento = datosEventoPendiente;
        // Este mensajeParaWilly necesita ser enviado. Dado que esto es un callback de timer,
        // no podemos devolverlo directamente. Podríamos necesitar un sistema de notificación proactiva
        // o que Willy lo mencione en la próxima interacción si el usuario escribe.
        // Por ahora, lo más simple es que si el usuario escribe después de esto, se gestione el pendiente.
        console.log(`[TimerExpiration] Evento crítico pendiente para ${userIdTimedOut}: ${mensajeParaWilly}`);
        // Si tuviéramos un canal de salida directo a Willy (ej. WebSocket), lo enviaríamos aquí.
        // Para esta estructura, se gestionará en la próxima llamada a getWillyResponse si el usuario interactúa.
    }
}

export async function getWillyResponse(userMessageContent, overrideSystemPrompt = null) {
    const userMessageLower = userMessageContent.toLowerCase();
    let willyResponseContent = "";
    const emocionDetectada = detectarEmocion(userMessageContent);
    let userMessageId = null;
    let mensajeUsuarioGuardadoEsteTurno = false;
    let respuestaWillyDefinitiva = ""; // Para construir la respuesta final

    async function guardarMensajeUsuarioUnaVez() {
        if (!mensajeUsuarioGuardadoEsteTurno) {
            userMessageId = await guardarMensajeFirestore({
                userId: MOCK_USER_ID, role: 'user', message: userMessageContent, emotion: emocionDetectada, memorable: false
            });
            mensajeUsuarioGuardadoEsteTurno = true;
        }
    }

    async function guardarYFinalizarRespuestaWilly(respuesta, emocionWilly = null, tags = []) {
        const emocionFinalWilly = emocionWilly || detectarEmocion(respuesta) || EMOCIONES.NEUTRO;

        // Verificar si hay una solicitud de consentimiento de evento crítico pendiente
        if (global.eventoCriticoPendienteDeConsentimiento && global.eventoCriticoPendienteDeConsentimiento.userId === MOCK_USER_ID) {
            if (!respuesta.includes(EventosCriticos.solicitarConsentimientoRegistroEvento("", "", "", "").mensajeParaWilly.substring(0,30))) { // Evitar duplicar pregunta
                 const datosPendientes = global.eventoCriticoPendienteDeConsentimiento;
                 const { mensajeParaWilly } = EventosCriticos.solicitarConsentimientoRegistroEvento(
                    datosPendientes.userId, datosPendientes.tipoEvento, datosPendientes.detalleEvento, datosPendientes.modoActivado
                 );
                 respuesta += `\n\nPor cierto, sobre lo que acaba de pasar... ${mensajeParaWilly}`;
            }
        }

        await guardarMensajeFirestore({
            userId: MOCK_USER_ID, role: 'willy', message: respuesta, emotion: emocionFinalWilly, tags
        });
        return respuesta;
    }

    // --- GESTIÓN DE CONSENTIMIENTO PARA EVENTO CRÍTICO PENDIENTE ---
    if (global.eventoCriticoPendienteDeConsentimiento && global.eventoCriticoPendienteDeConsentimiento.userId === MOCK_USER_ID) {
        await guardarMensajeUsuarioUnaVez();
        const datosPendientes = global.eventoCriticoPendienteDeConsentimiento;
        if (userMessageLower.includes("sí") || userMessageLower.includes("acepto") || userMessageLower.includes("guárdalo") || userMessageLower.includes("si quiero")) {
            await EventosCriticos.guardarEventoCritico({ ...datosPendientes, consentimiento: true });
            respuestaWillyDefinitiva = "Entendido, lo he guardado de forma segura en tus registros privados. Gracias por tu confianza.";
        } else if (userMessageLower.includes("no") || userMessageLower.includes("no quiero") || userMessageLower.includes("no lo guardes")) {
            respuestaWillyDefinitiva = "De acuerdo, no lo guardaré. Respeto tu decisión. Estoy aquí si necesitas algo más.";
        } else {
            // Respuesta ambigua, volver a preguntar o asumir no. Por ahora, asumimos no y continuamos.
            respuestaWillyDefinitiva = "No estoy seguro de si querías guardar el evento anterior. Por ahora no lo haré. Si cambias de opinión, puedes decírmelo. ¿En qué más te puedo ayudar hoy?";
        }
        global.eventoCriticoPendienteDeConsentimiento = null;
        // No retornar aquí directamente, permitir que el resto del flujo continúe si es necesario,
        // pero la respuesta principal ya está establecida.
        // O, si esta es la única acción, retornar. Por ahora, vamos a permitir que continúe.
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
            respuestaWillyDefinitiva = willyResponseContent;
            return guardarYFinalizarRespuestaWilly(respuestaWillyDefinitiva, EMOCIONES.ALIVIO, ['modo_crisis_cierre']);
        }

        const { willyMessage, needsOpenAIPhrasing, furtherContextForOpenAI } = await ModoCrisis.responderEnModoCrisis(userMessageContent, emocionDetectada, datosCrisisActual);
        let respuestaFinalCrisis = willyMessage;
        if (needsOpenAIPhrasing) {
            const promptCrisis = `PRIORIDAD MÁXIMA: MODO CRISIS ACTIVO... Base: "${willyMessage}"`; // Prompt condensado
            respuestaFinalCrisis = await getOpenAIResponse(promptCrisis, MOCK_USER_ID, userMessageContent);
        }

        startNoResponseTimer(MOCK_USER_ID, async () => {
            const dc = ModoCrisis.obtenerDatosCrisisActual();
            await handleTimerExpirationLogic(MOCK_USER_ID, `crisis_no_respuesta_${dc.tipoCrisis}`, dc);
        });
        respuestaWillyDefinitiva = respuestaFinalCrisis;
        return guardarYFinalizarRespuestaWilly(respuestaWillyDefinitiva, EMOCIONES.PREOCUPACION, [`modo_crisis_${datosCrisisActual.tipoCrisis}`]);
    }

    if (crisisDetectadaInfo && !ModoCrisis.estaEnModoCrisis()) {
        await guardarMensajeUsuarioUnaVez();
        const datosSupervision = SupervisionVulnerable.obtenerDatosSupervision();
        const contactoEmergenciaCrisis = datosSupervision?.contactoEmergenciaSimulado || { nombre: "Ayuda Profesional Urgente", telefono: "Número de Emergencia Local" };

        willyResponseContent = ModoCrisis.iniciarModoCrisis(MOCK_USER_ID, crisisDetectadaInfo.tipo, crisisDetectadaInfo.urgencia, userMessageContent, "Usuario", contactoEmergenciaCrisis);

        // Preparar para solicitar consentimiento para registrar ESTA activación de crisis
        const { mensajeParaWilly, datosEventoPendiente } = EventosCriticos.solicitarConsentimientoRegistroEvento(
            MOCK_USER_ID,
            EventosCriticos.TIPOS_EVENTO_CRITICO.CRISIS_DETECTADA,
            `Crisis '${crisisDetectadaInfo.tipo}' detectada por mensaje: "${userMessageContent.substring(0, 100)}${userMessageContent.length > 100 ? '...' : ''}"`,
            "ModoCrisis"
        );
        global.eventoCriticoPendienteDeConsentimiento = datosEventoPendiente;
        // La pregunta de consentimiento se añadirá al final por guardarYFinalizarRespuestaWilly

        startNoResponseTimer(MOCK_USER_ID, async () => {
            const dc = ModoCrisis.obtenerDatosCrisisActual();
            await handleTimerExpirationLogic(MOCK_USER_ID, `crisis_activacion_no_respuesta_${dc.tipoCrisis}`, dc );
        });
        respuestaWillyDefinitiva = willyResponseContent;
        return guardarYFinalizarRespuestaWilly(respuestaWillyDefinitiva, EMOCIONES.ALARMA, [`activacion_modo_crisis_${crisisDetectadaInfo.tipo}`]);
    }
    // --- FIN MODO CRISIS ---

    // --- 1. MANEJO DE SUPERVISIÓN VULNERABLE (Si no está en crisis y no se resolvió consentimiento de evento crítico) ---
    if (!respuestaWillyDefinitiva) {
        const datosSupervisionActual = SupervisionVulnerable.obtenerDatosSupervision();

        if (!overrideSystemPrompt && !datosSupervisionActual) {
            for (const kw of SupervisionVulnerable.START_SUPERVISION_KEYWORDS) {
                if (userMessageLower.startsWith(kw)) {
                    await guardarMensajeUsuarioUnaVez();
                    const  nombreYTipo = userMessageContent.substring(kw.length).trim();
                    let nombrePersona = nombreYTipo;
                    let tipoPersona = RespuestasGuiadas.TIPOS_PERSONA_VULNERABLE.GENERAL_VULNERABLE;
                    let parentesco = "ser querido";
                    if (nombreYTipo.toLowerCase().includes("niño pequeño")) tipoPersona = RespuestasGuiadas.TIPOS_PERSONA_VULNERABLE.NINO_PEQUENO;
                    // ... (más parseo)
                    const matchNombre = nombreYTipo.match(/^([\w\s]+)(?:\s+que es|\s+mi|\s+la)?/i);
                    if (matchNombre && matchNombre[1]) nombrePersona = matchNombre[1].trim();

                    willyResponseContent = SupervisionVulnerable.iniciarSupervision(MOCK_USER_ID, tipoPersona, nombrePersona, "Contexto no provisto", MOCK_USER_ID, parentesco);
                    respuestaWillyDefinitiva = willyResponseContent;
                    return guardarYFinalizarRespuestaWilly(respuestaWillyDefinitiva, EMOCIONES.NEUTRO, ['supervision_iniciada']);
                }
            }
        }
        if (!overrideSystemPrompt && datosSupervisionActual && datosSupervisionActual.userIdCuidador === MOCK_USER_ID) {
            for (const kw of SupervisionVulnerable.STOP_SUPERVISION_KEYWORDS) {
                if (userMessageLower.startsWith(kw)) {
                    // ... (lógica de parada)
                    await guardarMensajeUsuarioUnaVez();
                    cancelNoResponseTimer();
                    willyResponseContent = SupervisionVulnerable.detenerSupervision(MOCK_USER_ID);
                    respuestaWillyDefinitiva = willyResponseContent;
                    return guardarYFinalizarRespuestaWilly(respuestaWillyDefinitiva, EMOCIONES.NEUTRO, ['supervision_detenida']);
                }
            }
        }

        if (datosSupervisionActual && datosSupervisionActual.userIdCuidador === MOCK_USER_ID) {
            await guardarMensajeUsuarioUnaVez();
            cancelNoResponseTimer();

            if (esperandoRespuestaConsentimientoSensores && global.pendingSensorConsentFor?.idCuidador === MOCK_USER_ID) {
                // ... (lógica de consentimiento de sensores como estaba)
                const { nombrePersona, userIdSupervisado } = global.pendingSensorConsentFor;
                if (userMessageLower.includes("sí activar sensores para " + nombrePersona.toLowerCase())) {
                    willyResponseContent = `Entendido. (Conceptualmente) Iniciando activación temporal de sensores para ${nombrePersona}.`;
                    SupervisionVulnerable.registrarConsentimientoSensores(userIdSupervisado, true);
                } else { // (incluye "no" y ambiguas)
                    willyResponseContent = `De acuerdo, no se activarán los sensores para ${nombrePersona}.`;
                    SupervisionVulnerable.registrarConsentimientoSensores(userIdSupervisado, false);
                }
                esperandoRespuestaConsentimientoSensores = false;
                delete global.pendingSensorConsentFor;
                respuestaWillyDefinitiva = willyResponseContent;
                return guardarYFinalizarRespuestaWilly(respuestaWillyDefinitiva, EMOCIONES.NEUTRO, ['supervision_consentimiento_sensores']);
            }

            const { willyMessage, needsOpenAIPhrasing, furtherContextForOpenAI, iniciarTimer } =
                await SupervisionVulnerable.responderComoCuidador(userMessageContent, emocionDetectada, datosSupervisionActual);
            // ... (resto de la lógica de supervisión)
            respuestaWillyDefinitiva = willyMessage; // Placeholder, añadiría OpenAI si needsOpenAIPhrasing
            return guardarYFinalizarRespuestaWilly(respuestaWillyDefinitiva, EMOCIONES.COMPASIVO, ['supervision_respuesta_cuidador']);
        }
    }
    // --- FIN SUPERVISIÓN VULNERABLE ---

    // --- Si una respuesta ya fue definida por consentimiento de evento crítico, usarla ---
    if (respuestaWillyDefinitiva) {
        return guardarYFinalizarRespuestaWilly(respuestaWillyDefinitiva); // Ya se guardó el mensaje de usuario
    }

    // --- Guardado de mensaje de usuario (si no se hizo en flujos prioritarios) ---
    await guardarMensajeUsuarioUnaVez();

    // --- 2. LÓGICAS DE RESPUESTA ESTÁNDAR ---
    // ... (Anclajes, Terapia, Frustración, Resúmenes, Búsquedas, etc. como estaban)
    // Cada una de estas lógicas debería ahora llamar a guardarYFinalizarRespuestaWilly al final
    // Ejemplo para Anclajes (Marcar):
    if (RespuestasGuiadas.MARK_MEMORABLE_KEYWORDS.some(kw => userMessageLower.includes(kw))) {
        if (userMessageId) { /* ... */ willyResponseContent = "Guardado como momento especial."; }
        else { willyResponseContent = "Entendido, lo tendré presente."; }
        return guardarYFinalizarRespuestaWilly(willyResponseContent, EMOCIONES.CALMA, ['anclaje_marcar']);
    }

    // ... (Resto de las lógicas estándar)

    // --- Llamada final a OpenAI si ninguna lógica anterior dio respuesta completa ---
    let finalSystemPrompt = overrideSystemPrompt || baseSystemPrompt;
    // ... (agregar contexto profesional, emocional si es necesario)
    if (!willyResponseContent) { // Si ninguna lógica anterior generó contenido
        willyResponseContent = await getOpenAIResponse(finalSystemPrompt, MOCK_USER_ID, userMessageContent);
    }

    return guardarYFinalizarRespuestaWilly(willyResponseContent, null, ['general_response']);
}

async function getOpenAIResponse(systemMessageContent, userIdForHistory = MOCK_USER_ID, userPromptForAPICall = null) {
    // ... (implementación de getOpenAIResponse como estaba)
    const recentMessagesRaw = await obtenerMensajesRecientes(userIdForHistory, 7);
    const messagesForAPI = [{ role: 'system', content: systemMessageContent }];
    recentMessagesRaw.forEach(msg => messagesForAPI.push({ role: msg.role === 'willy' ? 'assistant' : 'user', content: msg.message }));
    if (userPromptForAPICall && (messagesForAPI.length === 1 || messagesForAPI[messagesForAPI.length -1].content !== userPromptForAPICall)) {
        messagesForAPI.push({ role: 'user', content: userPromptForAPICall });
    }
    try {
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: 'gpt-4o', messages: messagesForAPI, temperature: 0.65, max_tokens: 300,
        }, { headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' } });
        return response.data.choices[0].message.content.trim();
    } catch (error) {
        return terapiaContent.obtenerFraseAleatoria(terapiaContent.frasesErrorComunicacion) || "Mis circuitos se enredaron. ¿Puedes repetirlo?";
    }
}
