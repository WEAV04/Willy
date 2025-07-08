/**
 * videoEventHandler.js
 * Este archivo manejaría (conceptualmente) los eventos recibidos de un sistema de
 * análisis de video/audio y coordinaría la respuesta de Willy.
 * En una aplicación Next.js, esto podría ser un API route (e.g., pages/api/video-event.js).
 */

import { guardarMensajeFirestore } from '../services/firestoreService.js'; // Para guardar la interacción
import { manejarAlertaSeguridad } from '../modules/alertaSeguridad.js';
import { getWillyResponse } from './openai.js'; // Para que Willy frasee la respuesta final
import { EMOCIONES } from '../modules/analisis_emocional/emociones_basicas.js'; // Para la emoción de Willy
import { detectarEmocion } from '../modules/analisis_emocional/detectarEmocion.js';


// Simulación de MOCK_USER_ID, en un sistema real vendría del evento o autenticación
const MOCK_USER_ID = 'user123';

/**
 * Maneja un evento de video/seguridad entrante.
 * @param {object} eventObject - El objeto del evento tal como se definió (con eventType, userId, details, etc.).
 * @returns {Promise<string>} La respuesta final de Willy, o un mensaje de error/estado.
 */
export async function handleVideoEvent(eventObject) {
  console.log("[videoEventHandler] Recibido evento:", eventObject);

  if (!eventObject || !eventObject.eventType || !eventObject.userId) {
    console.error("[videoEventHandler] Evento inválido o faltan datos esenciales (eventType, userId).");
    return "Error: Evento de video no válido.";
  }

  // (En un sistema real, aquí se verificaría la autenticidad del evento, etc.)

  // 1. Procesar el evento para obtener una respuesta base y contexto para Willy
  const {
    willyMessage: baseMessageFromAlertLogic,
    needsOpenAIPhrasing,
    furtherContextForOpenAI,
    suggestedAction
  } = manejarAlertaSeguridad(eventObject);

  let finalWillyResponse = "";

  if (needsOpenAIPhrasing && furtherContextForOpenAI) {
    // 2. Si necesita fraseo de OpenAI, construir un prompt especializado
    // El 'baseSystemPrompt' se importa de '../config/personalityPrompt.js' en openai.js
    // Aquí estamos construyendo un overrideSystemPrompt que es específico para este evento.
    // Se asume que el baseSystemPrompt de Willy ya está incorporado en getWillyResponse si no hay override.
    // O, si getWillyResponse usa baseSystemPrompt y *añade* el override, entonces solo pasamos la parte adicional.
    // Por simplicidad, aquí crearemos un prompt completo para la tarea específica.

    // El `baseSystemPrompt` ya define la personalidad de Willy.
    // `furtherContextForOpenAI` son las instrucciones específicas para ESTA situación.
    const systemPromptForVideoEvent =
        `Eres WILLY, un asistente emocional. Acabas de recibir una alerta de un sistema de vigilancia visual/auditiva sobre el usuario. ` +
        `El tipo de alerta es: ${eventObject.eventType}. ` +
        `Detalles adicionales del evento: ${JSON.stringify(eventObject.details || {}, null, 2)}. ` +
        `Tu respuesta base sugerida internamente es: "${baseMessageFromAlertLogic}". ` +
        `Instrucciones específicas para esta respuesta: ${furtherContextForOpenAI} ` +
        `Por favor, formula una respuesta final al usuario que sea extremadamente empática, cuidadosa y que refleje la urgencia o preocupación apropiada. ` +
        `Tu objetivo principal es verificar el bienestar del usuario y ofrecer ayuda.`;

    try {
      // Usamos la frase base como "mensaje del usuario" para que Willy la reformule con el contexto.
      // O una frase gatillo más genérica como "Reaccionar a alerta de seguridad".
      // La clave es que el overrideSystemPrompt guíe la respuesta.
      finalWillyResponse = await getWillyResponse(
        `Alerta de seguridad: ${eventObject.eventType}. Necesito responder.`, // Mensaje gatillo para Willy
        systemPromptForVideoEvent // Este es el system prompt especializado
      );
    } catch (error) {
      console.error("[videoEventHandler] Error al obtener respuesta de OpenAI para evento de video:", error);
      finalWillyResponse = baseMessageFromAlertLogic || "Detecté algo y quería asegurarme de que estás bien. ¿Podrías responderme?";
    }
  } else {
    // Si no necesita fraseo de OpenAI, usar el mensaje base directamente
    finalWillyResponse = baseMessageFromAlertLogic;
  }

  // 3. Guardar la "interacción" o alerta y la respuesta de Willy en Firestore
  // Esto es conceptual, ya que el "mensaje del usuario" es en realidad un evento del sistema.
  // Podríamos tener una colección separada para "system_events" o loguearlo de forma especial.
  // Por ahora, lo guardaremos como si Willy estuviera reaccionando a un evento.
  try {
    await guardarMensajeFirestore({
      userId: eventObject.userId, // Usar el userId del evento
      role: 'system_event', // Un rol especial para este tipo de "mensaje"
      message: `Evento detectado: ${eventObject.eventType} - Detalles: ${JSON.stringify(eventObject.details || {})}`,
      emotion: null, // Los eventos del sistema no tienen emoción per se
      memorable: (suggestedAction === "URGENT_CHECK_IN" || suggestedAction === "ASSIST_URGENT"), // Marcar eventos urgentes como memorables
    });

    await guardarMensajeFirestore({
      userId: eventObject.userId,
      role: 'willy',
      message: finalWillyResponse,
      emotion: detectarEmocion(finalWillyResponse) || EMOCIONES.PREOCUPACION, // Willy estaría preocupado o calmado al ayudar
      // Podríamos tener una emoción específica como EMOCIONES.ALERTA o EMOCIONES.CUIDADO
    });
  } catch (error) {
    console.error("[videoEventHandler] Error guardando log del evento de video en Firestore:", error);
  }

  // 4. (Conceptual) Realizar acciones adicionales basadas en `suggestedAction`
  // Por ejemplo, enviar una notificación push, alertar a un contacto de emergencia, etc.
  // Esto estaría fuera del alcance de este archivo y dependería de la infraestructura de la app.
  console.log(`[videoEventHandler] Acción sugerida para evento ${eventObject.eventType}: ${suggestedAction}`);


  // 5. Devolver la respuesta de Willy para que se comunique al usuario (o sistema de notificación)
  return finalWillyResponse;
}

/**
 * Documentación de Integración (Conceptual):
 *
 * Un sistema externo de análisis de video/audio debería enviar un evento a un endpoint
 * de la API del backend de Willy, por ejemplo:
 *
 * POST /api/video-event
 * Content-Type: application/json
 * Authorization: Bearer [AUTH_TOKEN_SI_NECESARIO]
 *
 * Body (ejemplo):
 * {
 *   "userId": "user123",
 *   "timestamp": "2024-07-30T10:30:00Z",
 *   "eventType": "FALL_DETECTED",
 *   "deviceId": "camara_sala_estar_01",
 *   "details": {
 *     "confidence": 0.92
 *   }
 * }
 *
 * El backend (este módulo `videoEventHandler.js` a través de su función `handleVideoEvent`)
 * procesaría este evento, generaría una respuesta de Willy, la registraría,
 * y podría devolver la respuesta de Willy o una confirmación.
 * La respuesta de Willy podría luego ser enviada al usuario a través de una notificación push,
 * un mensaje de voz en un altavoz inteligente, o mostrada en la interfaz de la app.
 */
