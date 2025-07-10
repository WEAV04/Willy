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
let datosPersonaSupervisada = null; // { userIdCuidador, nombrePersona, tipoPersona, contextoAdicional, nombreCuidador, parentescoCuidador, contactoEmergencia: { nombre: '', telefono: ''} }
let timerNoRespuestaId = null; // ID para el temporizador de no respuesta

// Palabras clave de riesgo que podrían indicar que la persona supervisada necesita ayuda.
const FRASES_RIESGO_PERSONA_SUPERVISADA = [
  "me siento mal", "me duele mucho", "tengo miedo", "no puedo respirar", "ayúdame",
  "socorro", "necesito ayuda urgente", "me caí", "estoy solo y asustado", "no quiero estar solo",
  "tengo mucho frío", "tengo mucha hambre", "no me hacen caso", "me he caído", "ayuda por favor"
];

// Contacto de emergencia (simulado, en una app real se configuraría por usuario)
// Esta es una SIMULACIÓN. En una app real, esto se cargaría del perfil del cuidador.
const CONTACTO_EMERGENCIA_SIMULADO = {
    nombre: "Contacto de Emergencia (Ej: Ana)",
    telefono: "123-456-7890", // Número de ejemplo
    relacion: "familiar"
};


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
    nombreCuidador: nombreCuidador || "la persona que te cuida",
    parentescoCuidador: parentescoCuidador || "quien te cuida",
    // Simulación: Cargar el contacto de emergencia del cuidador. En un sistema real, esto se haría desde el perfil del cuidador.
    contactoEmergencia: CONTACTO_EMERGENCIA_SIMULADO // Usar el simulado por ahora
  };
  console.log("[modo_supervision_vulnerable] Supervisión iniciada:", datosPersonaSupervisada);

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
  if (timerNoRespuestaId) {
    clearTimeout(timerNoRespuestaId);
    timerNoRespuestaId = null;
    console.log("[modo_supervision_vulnerable] Temporizador de no respuesta cancelado.");
  }
  const nombrePersona = datosPersonaSupervisada.nombrePersona;
  supervisionActiva = false;
  datosPersonaSupervisada = null;
  console.log(`[modo_supervision_vulnerable] Supervisión detenida para ${nombrePersona} por ${userIdCuidador}.`);
  return `De acuerdo. He desactivado el modo de acompañamiento especial para ${nombrePersona}.`;
}

export function obtenerDatosSupervision() {
  return supervisionActiva ? datosPersonaSupervisada : null;
}

/**
 * Prepara el mensaje de alerta para el contacto de emergencia.
 * @param {object} datosSupervisados - Los datos de la persona supervisada.
 * @param {string} [ultimaInteraccion="No hubo interacción reciente antes de la alerta."] - Último mensaje o contexto.
 * @returns {string} Mensaje de alerta.
 */
export function prepararMensajeAlertaEmergencia(datosSupervisados, ultimaInteraccion = "No hubo interacción reciente antes de la alerta.") {
    const { nombrePersona, tipoPersona, contactoEmergencia } = datosSupervisados;
    if (!contactoEmergencia || !contactoEmergencia.nombre) {
        console.warn("[modo_supervision_vulnerable] No hay contacto de emergencia configurado para enviar alerta.");
        return `Alerta para ${datosSupervisados.nombreCuidador}: Se detectó una posible situación de riesgo con ${nombrePersona} y no hubo respuesta. Por favor, verifica su estado. (No hay contacto de emergencia específico configurado).`;
    }
    return `Hola ${contactoEmergencia.nombre}, soy Willy, el asistente emocional. ` +
           `Estoy en modo de acompañamiento para ${nombrePersona} (${tipoPersona}) y se ha detectado una situación que podría requerir tu atención ` +
           `(basado en una falta de respuesta tras una posible alerta o frase de riesgo: "${ultimaInteraccion}"). ` +
           `Por favor, intenta contactar o verificar el estado de ${nombrePersona} lo antes posible. ` +
           `Recuerda, esta es una notificación generada por un sistema de IA como medida de precaución.`;
}


export function responderComoCuidador(mensajePersonaSupervisada, emocionDetectada, datosDeSupervision) {
  const mensajeLower = mensajePersonaSupervisada.toLowerCase();
  let willyMessage = "";
  let needsOpenAIPhrasing = true;
  let furtherContextForOpenAI = "";
  let suggestedAction = "CONTINUE_CONVERSATION"; // Default
  let iniciarTimer = false;

  const { tipoPersona, nombrePersona, nombreCuidador } = datosDeSupervision;

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
    willyMessage = willyMessage.replace("{nombreCuidador}", nombreCuidador || "un adulto de confianza");

    furtherContextForOpenAI = `El usuario supervisado (${nombrePersona}, ${tipoPersona}) dijo algo preocupante: "${mensajePersonaSupervisada}". ` +
                              `Debes responder con calma, validando su sentir, pero URGENTEMENTE indicando que debe avisar a ${nombreCuidador} o un adulto. ` +
                              `Usa la frase base: "${willyMessage}" y adáptala con empatía y claridad sobre la necesidad de ayuda real. ` +
                              `Pregúntale si está bien y si puede avisar a alguien.`;
    suggestedAction = "RISK_DETECTED_INITIATE_TIMER"; // Nueva acción
    iniciarTimer = true;
  } else {
    if (mensajePersonaSupervisada.length < 15 && mensajePersonaSupervisada.includes("?")) {
        willyMessage = obtenerFraseSupervisionAdaptada(tipoPersona, 'checkIn', datosDeSupervision);
    } else {
        let fraseBase = obtenerFraseSupervisionAdaptada(tipoPersona, 'respuestaRiesgoLeve', datosDeSupervision);
        if (emocionDetectada && emocionDetectada !== 'neutro' && emocionDetectada !== 'otro') {
            fraseBase += ` Noto que quizás te sientes ${emocionDetectada}.`;
        }
        willyMessage = fraseBase + ` ¿Hay algo que te gustaría contarme o hacer, ${nombrePersona}?`;
        furtherContextForOpenAI = `Responde a ${nombrePersona} (${tipoPersona}) de forma cálida y presente, basándote en: "${willyMessage}". El mensaje original fue: "${mensajePersonaSupervisada}".`;
    }
  }

  // Si un timer estaba activo y ahora hay una respuesta (no de riesgo), cancelarlo.
  if (timerNoRespuestaId && !riesgoDetectado) {
    clearTimeout(timerNoRespuestaId);
    timerNoRespuestaId = null;
    console.log("[modo_supervision_vulnerable] Temporizador de no respuesta cancelado debido a nueva interacción.");
  }

  return {
    willyMessage,
    needsOpenAIPhrasing,
    furtherContextForOpenAI,
    suggestedAction,
    iniciarTimer // Indica a la API si debe iniciar el temporizador
  };
}

/**
 * Inicia el temporizador de no respuesta. (Conceptual, la ejecución real del timer y su persistencia
 * dependerían del entorno de la aplicación - Node.js para backend, o Service Worker en frontend).
 * @param {string} userIdCuidador
 * @param {object} datosSupervisados
 * @param {string} ultimaInteraccionWilly - El mensaje que Willy envió y espera respuesta.
 * @param {function} callbackAlExpirar - Función a llamar si el timer expira.
 */
export function iniciarTemporizadorNoRespuesta(userIdCuidador, datosSupervisados, ultimaInteraccionWilly, callbackAlExpirar) {
  if (timerNoRespuestaId) {
    clearTimeout(timerNoRespuestaId); // Limpiar timer anterior si existe
  }
  const DURACION_TIMER_MS = 2 * 60 * 1000; // Ejemplo: 2 minutos

  console.log(`[modo_supervision_vulnerable] Iniciando temporizador de no respuesta para ${datosSupervisados.nombrePersona} (${DURACION_TIMER_MS / 1000}s).`);

  timerNoRespuestaId = setTimeout(async () => {
    console.log(`[modo_supervision_vulnerable] ¡TEMPORIZADOR EXPIRADO para ${datosSupervisados.nombrePersona}! No hubo respuesta.`);
    timerNoRespuestaId = null; // Limpiar el ID
    if (supervisionActiva && datosPersonaSupervisada && datosPersonaSupervisada.userIdCuidador === userIdCuidador) {
        // Asegurarse que la supervisión sigue activa para el mismo cuidador
        const mensajeAlerta = prepararMensajeAlertaEmergencia(datosSupervisados, ultimaInteraccionWilly);
        callbackAlExpirar(mensajeAlerta, datosSupervisados); // Llamar al callback con el mensaje y datos
    } else {
        console.log("[modo_supervision_vulnerable] Supervisión ya no activa o cambiada, no se envía alerta por timer.");
    }
  }, DURACION_TIMER_MS);
}

/**
 * Cancela el temporizador de no respuesta si está activo.
 */
export function cancelarTemporizadorNoRespuesta() {
    if (timerNoRespuestaId) {
        clearTimeout(timerNoRespuestaId);
        timerNoRespuestaId = null;
        console.log("[modo_supervision_vulnerable] Temporizador de no respuesta cancelado manualmente.");
    }
}
