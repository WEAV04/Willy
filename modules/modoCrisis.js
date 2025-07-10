/**
 * modoCrisis.js
 * Lógica para el "Modo Crisis" de Willy.
 * Este modo se activa automáticamente ante patrones de lenguaje o emocionales
 * que sugieren un riesgo alto para el usuario. El objetivo es ofrecer
 * contención inmediata, validar el sufrimiento y guiar hacia ayuda profesional urgente.
 */

import {
    obtenerFraseAleatoria,
    frasesActivacionModoCrisis,
    frasesValidacionCrisis,
    frasesGuiaAyudaCrisis,
    frasesSugerenciaServicioEmergencia,
    frasesCierreModoCrisis
} from './respuestasGuiadas.js'; // Asumiendo que las nuevas frases están aquí
// import { EMOCIONES } from '../analisis_emocional/emociones_basicas.js'; // Para emoción de Willy
// import { iniciarTemporizadorNoRespuesta, cancelarTemporizadorNoRespuesta } from './modo_supervision_vulnerable.js'; // Para el timer

// --- Estado del Modo Crisis ---
let modoCrisisActivoGlobal = false; // Un solo estado global para MOCK_USER_ID
let datosCrisisActualGlobal = null; // { userId, tipoCrisis, timestampInicio, ultimoMensajeUsuario }
// let timerNoRespuestaIdCrisis = null; // Se manejará a través de modo_supervision_vulnerable.js

// (Conceptual) Callback para cuando el timer de no respuesta en crisis expira.
// Este se pasaría a iniciarTemporizadorNoRespuesta.
// async function handleCrisisTimerExpiration(mensajeAlerta, datosCrisis) {
//   console.log(`[modoCrisis] CALLBACK TIMER EXPIRADO. Alerta: ${mensajeAlerta}`);
//   // Aquí se llamaría a la lógica para notificar contacto de emergencia
//   // Y luego, potencialmente, iniciar el flujo de pedir consentimiento para sensores al cuidador.
//   // Esto se manejará en api/openai.js a través de handleTimerExpirationForVulnerable.
// }


/**
 * Inicia el Modo Crisis.
 * @param {string} userId - ID del usuario.
 * @param {string} tipoCrisis - Ej: 'SUICIDAL_IDEATION', 'SELF_HARM_RISK'.
 * @param {string} primerMensajeCrisis - El mensaje del usuario que activó el modo.
 * @returns {string} El primer mensaje de contención de Willy.
 */
export function iniciarModoCrisis(userId, tipoCrisis, primerMensajeCrisis) {
  if (modoCrisisActivoGlobal && datosCrisisActualGlobal && datosCrisisActualGlobal.userId === userId) {
    // Ya está en modo crisis, no reiniciar, pero quizás reforzar.
    return obtenerFraseAleatoria(frasesValidacionCrisis) + " Sigo aquí contigo, muy de cerca.";
  }

  console.warn(`[modoCrisis] INICIANDO MODO CRISIS para userId: ${userId}, Tipo: ${tipoCrisis}`);
  modoCrisisActivoGlobal = true;
  datosCrisisActualGlobal = {
    userId,
    tipoCrisis,
    timestampInicio: new Date().toISOString(),
    ultimoMensajeUsuario: primerMensajeCrisis,
    // El timer se iniciará desde api/openai.js usando la función de SupervisionVulnerable
  };

  // Willy debe responder inmediatamente con una frase de activación/contención.
  let mensajeInicial = obtenerFraseAleatoria(frasesActivacionModoCrisis);

  // Guardar el mensaje de activación de Willy (esto se hará en api/openai.js después de esta llamada)
  // Ejemplo: await guardarMensajeFirestore({ userId, role: 'willy', message: mensajeInicial, emotion: EMOCIONES.PREOCUPACION });

  return mensajeInicial; // Este mensaje se usará como willyResponseContent en api/openai.js
}

/**
 * Detiene el Modo Crisis.
 * @param {string} userId - ID del usuario.
 * @returns {string} Mensaje de cierre del modo.
 */
export function detenerModoCrisis(userId) {
  if (!modoCrisisActivoGlobal || !datosCrisisActualGlobal || datosCrisisActualGlobal.userId !== userId) {
    return "El modo de crisis no estaba activo o era para otra sesión.";
  }
  console.log(`[modoCrisis] DETENIENDO MODO CRISIS para userId: ${userId}`);

  // SupervisionVulnerable.cancelarTemporizadorNoRespuesta(); // Cancelar timer si estaba activo

  const mensajeCierre = obtenerFraseAleatoria(frasesCierreModoCrisis);

  modoCrisisActivoGlobal = false;
  datosCrisisActualGlobal = null;

  return mensajeCierre;
}

/**
 * Verifica si el Modo Crisis está activo para el usuario actual.
 * @param {string} [userId] - Opcional, para verificar para un usuario específico si hubiera múltiples.
 * @returns {boolean}
 */
export function estaEnModoCrisis(userId) {
  // Para MOCK_USER_ID, solo hay un estado global.
  // Si tuviéramos múltiples usuarios, aquí se verificaría datosCrisisActualGlobal.userId === userId
  return modoCrisisActivoGlobal && (datosCrisisActualGlobal ? datosCrisisActualGlobal.userId === userId : true);
}

/**
 * Obtiene los datos de la crisis actual.
 * @returns {object|null}
 */
export function obtenerDatosCrisisActual() {
  return datosCrisisActualGlobal;
}

/**
 * Genera una respuesta de Willy mientras está en Modo Crisis.
 * @param {string} mensajeUsuario - Mensaje actual del usuario.
 * @param {string|null} emocionDetectada - Emoción detectada en el mensaje del usuario.
 * @param {object} datosCrisis - Datos de la crisis actual.
 * @returns {object} { willyMessage: string (base para OpenAI), needsOpenAIPhrasing: boolean, furtherContextForOpenAI: string, suggestedAction: string }
 */
export function responderEnModoCrisis(mensajeUsuario, emocionDetectada, datosCrisis) {
  const { tipoCrisis } = datosCrisis;
  let willyMessage = "";
  let suggestedAction = "MAINTAIN_PRESENCE_AND_VALIDATE"; // Acción por defecto en crisis

  // Prioridad 1: Si el usuario expresa intención directa de daño INMINENTE o pide ayuda de emergencia.
  if (mensajeUsuario.toLowerCase().includes("llamar emergencias") || mensajeUsuario.toLowerCase().includes("llama al 911")) {
    willyMessage = obtenerFraseAleatoria(frasesSugerenciaServicioEmergencia);
    suggestedAction = "USER_REQUESTS_EMERGENCY_CALL"; // Frontend podría interpretar esto
  } else if (tipoCrisis === 'SUICIDAL_IDEATION' || tipoCrisis === 'SELF_HARM_RISK') {
    // Si ya se identificó ideación o riesgo de autolesión, ser más directivo hacia ayuda.
    willyMessage = obtenerFraseAleatoria(frasesGuiaAyudaCrisis);
    // Podríamos alternar con frasesSugerenciaServicioEmergencia si la conversación escala.
    if (Math.random() < 0.3) { // Aleatoriamente, ser más directo hacia servicios de emergencia
        willyMessage = obtenerFraseAleatoria(frasesSugerenciaServicioEmergencia);
    }
    suggestedAction = "GUIDE_TO_PROFESSIONAL_HELP";
  } else { // SEVERE_EMOTIONAL_COLLAPSE u otros
    willyMessage = obtenerFraseAleatoria(frasesValidacionCrisis) + " " + obtenerFraseAleatoria(frasesGuiaAyudaCrisis);
    suggestedAction = "VALIDATE_AND_GUIDE_TO_HELP";
  }

  // El furtherContextForOpenAI se construirá en api/openai.js
  // Aquí solo devolvemos el mensaje base y la acción sugerida.
  const furtherContextForOpenAI =
    `El usuario está en Modo Crisis (tipo: ${tipoCrisis}). Su último mensaje: "${mensajeUsuario}". Emoción detectada: ${emocionDetectada || 'no clara'}. ` +
    `Tu ÚNICA prioridad es la SEGURIDAD del usuario. Sé EXTREMADAMENTE empático, calmado y usa frases CORTAS y CLARAS. ` +
    `Valida intensamente sus sentimientos. NO intentes resolver problemas ni dar consejos complejos. ` +
    `Guíale suavemente hacia ayuda profesional o de emergencia. Refuerza que no está solo/a y que estás ahí. ` +
    `Base tu respuesta en: "${willyMessage}".`;

  return {
    willyMessage, // Este es el mensaje o idea base que OpenAI debe frasear.
    needsOpenAIPhrasing: true, // Casi siempre en crisis, para asegurar el tono correcto.
    furtherContextForOpenAI,
    suggestedAction
  };
}
