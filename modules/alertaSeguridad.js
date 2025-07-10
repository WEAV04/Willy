/**
 * alertaSeguridad.js
 * Este módulo contiene la lógica para que Willy maneje alertas de seguridad
 * provenientes de un sistema de análisis de video/audio externo.
 */

// import { EMOCIONES } from '../analisis_emocional/emociones_basicas.js'; // Para Willy's emotion

/**
 * Estructura esperada para eventoRecibido:
 * {
 *   userId: "string",
 *   timestamp: "ISO8601_string",
 *   eventType: "EVENT_TYPE_NAME",
 *   deviceId?: "string | null",
 *   details?: {
 *     confidence?: number (0-1),
 *     durationOfInactivity?: string (e.g., "30s"),
 *     inactivityDuration?: string (e.g., "2h"),
 *     gestureType?: string,
 *     distressType?: string,
 *     soundLevel?: string,
 *     detectedPhrase?: string,
 *     soundType?: string
 *   }
 * }
 */

/**
 * Procesa un evento de seguridad y genera una respuesta y/o acción para Willy.
 * @param {object} eventoRecibido - El objeto del evento detectado.
 * @returns {object} Objeto con { willyMessage: string, needsOpenAIPhrasing: boolean, furtherContextForOpenAI?: string, suggestedAction?: string }
 */
export function manejarAlertaSeguridad(eventoRecibido) {
  let willyMessage = "";
  let needsOpenAIPhrasing = true; // Por defecto, asumimos que la mayoría de las respuestas se beneficiarán del toque de Willy
  let furtherContextForOpenAI = "";
  let suggestedAction = "LOG_EVENT"; // Acción por defecto

  console.log(`[alertaSeguridad] Evento recibido: ${eventoRecibido.eventType}`, eventoRecibido);

  switch (eventoRecibido.eventType) {
    case 'FALL_DETECTED':
      willyMessage = "Detecté lo que parece ser una caída. ¿Estás bien? Por favor, respóndeme si puedes.";
      furtherContextForOpenAI = "El usuario podría haberse caído. Pregunta si está bien y si necesita ayuda urgente. Sé muy gentil y calmado.";
      suggestedAction = "URGENT_CHECK_IN";
      break;

    case 'SUDDEN_MOVEMENT_THEN_INACTIVITY':
      const inactivity = eventoRecibido.details?.durationOfInactivity || "un momento";
      willyMessage = `Noté un movimiento rápido seguido de inactividad durante ${inactividad}. ¿Está todo en orden?`;
      furtherContextForOpenAI = `Hubo un movimiento brusco y luego el usuario ha estado inactivo por ${inactividad}. Pregunta si está bien, si necesita algo. Tono preocupado pero calmado.`;
      suggestedAction = "CHECK_IN";
      break;

    case 'GESTURE_FOR_HELP_DETECTED':
      const gesture = eventoRecibido.details?.gestureType || "una señal de ayuda";
      willyMessage = `Parece que detecté ${gesture}. ¿Necesitas ayuda? Estoy aquí para asistirte.`;
      furtherContextForOpenAI = `El usuario parece haber hecho un gesto pidiendo ayuda (${gesture}). Pregunta directamente si necesita asistencia y qué tipo de ayuda requiere. Tono de urgencia controlada.`;
      suggestedAction = "ASSIST_USER";
      break;

    case 'PROLONGED_UNUSUAL_INACTIVITY':
      const duration = eventoRecibido.details?.inactivityDuration || "un tiempo considerable";
      willyMessage = `He notado que has estado inactivo/a de una forma que no es usual durante ${duration}. ¿Te encuentras bien?`;
      furtherContextForOpenAI = `El usuario ha estado inactivo de forma inusual por ${duration}. Pregunta con suavidad si todo está bien, si necesita algo o si solo está descansando.`;
      suggestedAction = "CHECK_IN_GENTLE";
      break;

    case 'USER_APPEARS_DISTRESSED_VISUALLY':
      const distress = eventoRecibido.details?.distressType || "algún tipo de malestar";
      willyMessage = `Por lo que puedo interpretar de la cámara, parece que podrías estar sintiendo ${distress}. ¿Estás bien? ¿Hay algo que pueda hacer?`;
      furtherContextForOpenAI = `La cámara sugiere que el usuario podría estar experimentando ${distress}. Ofrece consuelo, pregunta si quiere hablar o si necesita ayuda de otro tipo. Mucha empatía.`;
      suggestedAction = "OFFER_SUPPORT_EMOTIONAL";
      break;

    case 'OBJECT_COLLISION_NEAR_USER':
      willyMessage = "Escuché o vi algo que pareció un golpe u objeto cayendo cerca. ¿Está todo bien por ahí? ¿Te asustaste?";
      furtherContextForOpenAI = "Se detectó un posible objeto cayendo o un golpe cerca del usuario. Pregunta si está bien y si algo se cayó o si necesita revisar algo. Tono de cuidado.";
      suggestedAction = "CHECK_ENVIRONMENT";
      break;

    case 'USER_VOICE_ALERT_DETECTED':
      const phrase = eventoRecibido.details?.detectedPhrase;
      const sound = eventoRecibido.details?.soundType;
      let detectionDetail = "";
      if (phrase) detectionDetail = `la frase "${phrase}"`;
      else if (sound) detectionDetail = `un sonido de ${sound.toLowerCase()}`;
      else detectionDetail = "una alerta de voz";

      willyMessage = `He detectado ${detectionDetail}. ¿Necesitas ayuda inmediata?`;
      furtherContextForOpenAI = `Se detectó una alerta de voz del usuario (${detectionDetail}). Pregunta con urgencia si necesita ayuda y qué puede hacer Willy.`;
      suggestedAction = "ASSIST_URGENT";
      break;

    default:
      willyMessage = "Detecté un evento inusual en el entorno. ¿Está todo bien?";
      furtherContextForOpenAI = `Se recibió un evento desconocido o no especificado del sistema de vigilancia: ${eventoRecibido.eventType}. Pregunta genéricamente si todo está bien.`;
      needsOpenAIPhrasing = true;
      console.warn(`[alertaSeguridad] Evento no manejado: ${eventoRecibido.eventType}`);
  }

  // Si el mensaje ya es muy específico y empático, podríamos considerar no pasarlo por OpenAI.
  // Por ahora, la mayoría se beneficiarán del toque final de Willy.
  // Ejemplo de uno que podría ser directo:
  // if (eventoRecibido.eventType === 'FALL_DETECTED') needsOpenAIPhrasing = false;
  // Pero para mantener consistencia en el tono de Willy, es mejor pasarlo.

  return {
    willyMessage, // Este es el mensaje base o la data para OpenAI
    needsOpenAIPhrasing,
    furtherContextForOpenAI, // Guía adicional para el prompt de OpenAI
    suggestedAction
  };
}
