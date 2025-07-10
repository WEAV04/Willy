/**
 * modo_supervision_vulnerable.js
 * Lógica para el "Modo Supervisión Ética para Personas Vulnerables".
 * Willy no accede a cámaras ni sensores; esta supervisión es simulada
 * y se basa en la interacción conversacional y la información proporcionada por el cuidador.
 */

import { obtenerFraseSupervisionAdaptada, TIPOS_PERSONA_VULNERABLE } from './respuestasGuiadas.js';
// import { detectarEmocion } from '../analisis_emocional/detectarEmocion.js'; // Si se usa para la persona supervisada
// import { EMOCIONES } from '../analisis_emocional/emociones_basicas.js'; // Para la emoción de Willy al responder

let supervisionActiva = false;
let datosPersonaSupervisada = null; // { userIdCuidador, nombrePersona, tipoPersona, contextoAdicional, nombreCuidador, parentescoCuidador }

// Palabras clave de riesgo que podrían indicar que la persona supervisada necesita ayuda.
// Estas son generales; se podrían refinar por tipoPersona si es necesario.
const FRASES_RIESGO_PERSONA_SUPERVISADA = [
  "me siento mal", "me duele mucho", "tengo miedo", "no puedo respirar",
  "ayúdame", "socorro", "necesito ayuda urgente", "me caí", "estoy solo y asustado",
  "no quiero estar solo", "tengo mucho frío", "tengo mucha hambre", "no me hacen caso"
];


/**
 * Inicia el modo de supervisión ética.
 * @param {string} userIdCuidador - ID del usuario que solicita la supervisión (MOCK_USER_ID por ahora).
 * @param {string} tipoPersona - Uno de los valores de TIPOS_PERSONA_VULNERABLE.
 * @param {string} nombrePersona - Nombre de la persona a supervisar.
 * @param {string} [contextoAdicional=""] - Contexto dado por el cuidador (ej. "mientras duerme").
 * @param {string} [nombreCuidador=""] - Nombre del cuidador (para personalizar mensajes).
 * @param {string} [parentescoCuidador="alguien que te cuida"] - Parentesco del cuidador (ej. "mamá", "hijo").
 * @returns {string} Mensaje de confirmación de Willy para el cuidador.
 */
export function iniciarSupervision(userIdCuidador, tipoPersona, nombrePersona, contextoAdicional = "", nombreCuidador = "tu ser querido", parentescoCuidador = "quien te cuida") {
  if (supervisionActiva) {
    return `Ya estoy en modo de supervisión para ${datosPersonaSupervisada.nombrePersona}. Si quieres cambiar, primero detén la supervisión actual.`;
  }
  supervisionActiva = true;
  datosPersonaSupervisada = {
    userIdCuidador,
    nombrePersona: nombrePersona || "la persona que acompañas",
    tipoPersona: tipoPersona || TIPOS_PERSONA_VULNERABLE.GENERAL_VULNERABLE,
    contextoAdicional,
    nombreCuidador: nombreCuidador || "la persona que te cuida", // Nombre del cuidador para mensajes a la persona supervisada
    parentescoCuidador: parentescoCuidador || "quien te cuida" // Parentesco para mensajes a la persona supervisada
  };
  console.log("[modo_supervision_vulnerable] Supervisión iniciada:", datosPersonaSupervisada);

  // Mensaje para el CUIDADOR que activó el modo
  let mensajeConfirmacion = `Entendido. Activaré un modo de acompañamiento especial para ${datosPersonaSupervisada.nombrePersona}. `;
  mensajeConfirmacion += `Estaré atento/a a lo que me comuniques sobre ${datosPersonaSupervisada.nombrePersona} o si ${datosPersonaSupervisada.nombrePersona} interactúa directamente. `;
  mensajeConfirmacion += `Recuerda que mi supervisión es a través de nuestra conversación y no tengo acceso a sensores ni cámaras; la seguridad real depende de ti.`;
  return mensajeConfirmacion;
}

/**
 * Detiene el modo de supervisión.
 * @param {string} userIdCuidador - ID del usuario que solicita detener la supervisión.
 * @returns {string} Mensaje de confirmación de Willy.
 */
export function detenerSupervision(userIdCuidador) {
  if (!supervisionActiva || (datosPersonaSupervisada && datosPersonaSupervisada.userIdCuidador !== userIdCuidador) ) {
    return "No había una supervisión activa para detener, o no fue iniciada por ti.";
  }
  const nombrePersona = datosPersonaSupervisada.nombrePersona;
  supervisionActiva = false;
  datosPersonaSupervisada = null;
  console.log(`[modo_supervision_vulnerable] Supervisión detenida para ${nombrePersona} por ${userIdCuidador}.`);
  return `De acuerdo. He desactivado el modo de acompañamiento especial para ${nombrePersona}.`;
}

/**
 * Obtiene los datos de la persona actualmente bajo supervisión.
 * @returns {object|null}
 */
export function obtenerDatosSupervision() {
  return supervisionActiva ? datosPersonaSupervisada : null;
}

/**
 * Genera una respuesta de Willy como cuidador, adaptada a la persona supervisada.
 * Esta función es llamada cuando se asume que el mensaje proviene de la persona supervisada,
 * o cuando el cuidador transmite un mensaje de ella.
 * @param {string} mensajePersonaSupervisada - El mensaje de la persona supervisada.
 * @param {string|null} emocionDetectada - La emoción detectada en el mensaje.
 * @param {object} datosDeSupervision - Objeto con { nombrePersona, tipoPersona, nombreCuidador, parentescoCuidador }.
 * @returns {object} Un objeto { willyMessage: string, needsOpenAIPhrasing: boolean, furtherContextForOpenAI?: string, suggestedAction?: string }
 */
export function responderComoCuidador(mensajePersonaSupervisada, emocionDetectada, datosDeSupervision) {
  const mensajeLower = mensajePersonaSupervisada.toLowerCase();
  let willyMessage = "";
  let needsOpenAIPhrasing = false; // Por defecto, las respuestas guiadas son directas
  let furtherContextForOpenAI = "";
  let suggestedAction = "CONTINUE_CONVERSATION";

  const { tipoPersona, nombrePersona, nombreCuidador, parentescoCuidador } = datosDeSupervision;

  // 1. Detección de Frases de Riesgo Específicas
  let riesgoDetectado = null;
  for (const fraseRiesgo of FRASES_RIESGO_PERSONA_SUPERVISADA) {
    if (mensajeLower.includes(fraseRiesgo)) {
      riesgoDetectado = fraseRiesgo;
      break;
    }
  }

  if (riesgoDetectado) {
    console.log(`[modo_supervision_vulnerable] Frase de riesgo detectada de ${nombrePersona}: "${riesgoDetectado}"`);
    willyMessage = obtenerFraseSupervisionAdaptada(tipoPersona, 'respuestaRiesgoSerio', datosDeSupervision);
    // Ajustar el mensaje para incluir el nombre del cuidador si es posible
    willyMessage = willyMessage.replace("{nombreCuidador}", nombreCuidador || "un adulto");
    suggestedAction = "ALERT_CUIDADOR_IMMEDIATE"; // Sugiere que el sistema debería notificar al cuidador
    // En este caso, la respuesta de Willy es directa y no necesita mucho fraseo de OpenAI,
    // pero el 'furtherContext' podría ser para que OpenAI elija la mejor forma de decirlo.
    needsOpenAIPhrasing = true;
    furtherContextForOpenAI = `El usuario supervisado (${nombrePersona}, ${tipoPersona}) dijo algo preocupante: "${mensajePersonaSupervisada}". ` +
                              `Debes responder con calma, validando su sentir, pero URGENTEMENTE indicando que debe avisar a ${nombreCuidador} o un adulto. ` +
                              `Usa la frase base: "${willyMessage}" y adáptala con empatía y claridad sobre la necesidad de ayuda real.`;

  } else {
    // 2. Si no hay riesgo serio, respuesta empática general adaptada al tipo de persona.
    // Podríamos tener una lógica más compleja aquí basada en la emocionDetectada o el contenido.
    // Por ahora, un check-in o una respuesta validante general.

    // Si el mensaje es corto o parece una pregunta simple, Willy puede hacer un check-in.
    if (mensajePersonaSupervisada.length < 15 && mensajePersonaSupervisada.includes("?")) {
        willyMessage = obtenerFraseSupervisionAdaptada(tipoPersona, 'checkIn', datosDeSupervision);
    } else { // Respuesta más general de acompañamiento
        let fraseBase = obtenerFraseSupervisionAdaptada(tipoPersona, 'respuestaRiesgoLeve', datosDeSupervision); // Usamos riesgoLeve como base para empatía general
        // Personalizar un poco si hay emoción detectada
        if (emocionDetectada && emocionDetectada !== 'neutro' && emocionDetectada !== 'otro') {
            fraseBase += ` Noto que quizás te sientes ${emocionDetectada}.`;
        }
        willyMessage = fraseBase + ` ¿Hay algo que te gustaría contarme o hacer, ${nombrePersona}?`;
        needsOpenAIPhrasing = true; // Para que Willy lo diga con su tono
        furtherContextForOpenAI = `Responde a ${nombrePersona} (${tipoPersona}) de forma cálida y presente, basándote en: "${willyMessage}". El mensaje original fue: "${mensajePersonaSupervisada}".`;
    }
  }

  return {
    willyMessage,
    needsOpenAIPhrasing,
    furtherContextForOpenAI,
    suggestedAction
  };
}
