/**
 * crisisDetection.js
 * Lógica para detectar patrones de crisis en los mensajes del usuario.
 * Esta detección es crucial y debe ser manejada con extrema sensibilidad y ética.
 * Su objetivo principal es identificar cuándo activar el "Modo Crisis" de Willy.
 */

import { EMOCIONES } from './analisis_emocional/emociones_basicas.js'; // Asumiendo que está en una ruta accesible

// --- Listas de Palabras Clave de Crisis ---
// Estas listas deben ser cuidadosamente curadas y revisadas.
// Son indicativas y no exhaustivas. La combinación con el contexto emocional es importante.

const CRISIS_KEYWORDS_SUICIDAL_IDEATION = [
  "no quiero vivir", "quiero desaparecer", "acabar con todo", "terminarlo todo",
  "matarme", "suicidarme", "quitarme la vida", "desearía estar muerto", "no vale la pena seguir",
  "sería mejor si no estuviera", "sin mí todo sería mejor", "plan para morir",
  "despedida final", "ya no aguanto más esta vida"
  // Considerar variaciones y errores tipográficos comunes.
];

const CRISIS_KEYWORDS_SELF_HARM = [
  "hacerme daño", "cortarme", "lastimarme", "autolesionarme", "golpearme",
  "quemarme", "castigarme físicamente", "necesito sentir dolor físico"
  // Considerar también descripciones de acciones sin usar estas palabras exactas.
];

const CRISIS_KEYWORDS_SEVERE_EMOTIONAL_COLLAPSE = [
  "no puedo más", "estoy al límite", "me rindo", "todo es inútil", "nada tiene sentido",
  "estoy completamente roto", "no queda nada", "oscuridad total", "vacío absoluto",
  "grito de ayuda", "ayuda urgente", "necesito ayuda ya", "socorro" // Estos también pueden ser generales
];

// Umbral de mensajes recientes para considerar patrón de desesperanza/aislamiento
const HISTORIAL_RECIENTE_LIMITE = 5;
const CONTEO_MINIMO_EMOCION_NEGATIVA_SOSTENIDA = 3;

/**
 * Detecta patrones de crisis en el mensaje del usuario y su contexto emocional reciente.
 * @param {string} mensajeUsuarioLower - Mensaje del usuario en minúsculas.
 * @param {string|null} emocionDetectada - Emoción principal detectada en el mensaje actual.
 * @param {Array<object>} historialMensajesRecientes - Array de los últimos N mensajes del usuario,
 *                                                    cada uno { message: string, emotion: string|null }.
 * @returns {object|null} Objeto { esCrisis: true, tipoCrisis: string, urgencia: 'ALTA' } o null.
 */
export function detectarPatronCrisis(mensajeUsuarioLower, emocionDetectada, historialMensajesRecientes = []) {
  if (!mensajeUsuarioLower) return null;

  // 1. Detección directa por keywords de alta severidad
  for (const keyword of CRISIS_KEYWORDS_SUICIDAL_IDEATION) {
    if (mensajeUsuarioLower.includes(keyword)) {
      console.warn(`[crisisDetection] CRISIS DETECTADA (SUICIDAL_IDEATION) por keyword: "${keyword}"`);
      return { esCrisis: true, tipoCrisis: 'SUICIDAL_IDEATION', urgencia: 'ALTA' };
    }
  }
  for (const keyword of CRISIS_KEYWORDS_SELF_HARM) {
    if (mensajeUsuarioLower.includes(keyword)) {
      console.warn(`[crisisDetection] CRISIS DETECTADA (SELF_HARM_RISK) por keyword: "${keyword}"`);
      return { esCrisis: true, tipoCrisis: 'SELF_HARM_RISK', urgencia: 'ALTA' };
    }
  }

  // 2. Detección por keywords de colapso emocional severo
  // Estas son un poco más ambiguas, por lo que podrían necesitar confirmación o un umbral.
  for (const keyword of CRISIS_KEYWORDS_SEVERE_EMOTIONAL_COLLAPSE) {
    if (mensajeUsuarioLower.includes(keyword)) {
      // Si la emoción actual es muy negativa (desesperanza, tristeza profunda), aumentar certeza.
      if (emocionDetectada === EMOCIONES.DESESPERANZA || // Asumiendo que EMOCIONES.DESESPERANZA existe
          (emocionDetectada === EMOCIONES.TRISTEZA && mensajeUsuarioLower.includes("profunda"))) {
        console.warn(`[crisisDetection] CRISIS DETECTADA (SEVERE_EMOTIONAL_COLLAPSE) por keyword: "${keyword}" y emoción: ${emocionDetectada}`);
        return { esCrisis: true, tipoCrisis: 'SEVERE_EMOTIONAL_COLLAPSE', urgencia: 'ALTA' };
      }
      // Incluso sin emoción específica, algunas de estas frases son suficientemente fuertes.
      if (["ayuda urgente", "socorro", "grito de ayuda"].includes(keyword)){
        console.warn(`[crisisDetection] CRISIS DETECTADA (SEVERE_EMOTIONAL_COLLAPSE) por keyword de urgencia: "${keyword}"`);
        return { esCrisis: true, tipoCrisis: 'SEVERE_EMOTIONAL_COLLAPSE', urgencia: 'ALTA' };
      }
    }
  }

  // 3. Detección por patrones en historial reciente (emociones negativas sostenidas + keywords)
  // Esto es más complejo y requiere una buena definición de "desesperanza" o "aislamiento".
  // Ejemplo simplificado: si los últimos N mensajes del usuario son de tristeza/desesperanza
  // Y el mensaje actual contiene frases de "no puedo más" o "todo es inútil".
  if (historialMensajesRecientes && historialMensajesRecientes.length >= HISTORIAL_RECIENTE_LIMITE -1) { // -1 porque el actual no está en el historial que se pasa
    const emocionesNegativasSostenidas = historialMensajesRecientes
      .slice(-(HISTORIAL_RECIENTE_LIMITE -1)) // Tomar los últimos N-1 mensajes
      .filter(msg => msg.role === 'user' &&
                     (msg.emotion === EMOCIONES.TRISTEZA ||
                      msg.emotion === EMOCIONES.DESESPERANZA || // Si existe
                      msg.emotion === EMOCIONES.DESMOTIVACION))
      .length;

    if (emocionesNegativasSostenidas >= CONTEO_MINIMO_EMOCION_NEGATIVA_SOSTENIDA) {
      if (CRISIS_KEYWORDS_SEVERE_EMOTIONAL_COLLAPSE.some(keyword => mensajeUsuarioLower.includes(keyword))) {
        console.warn(`[crisisDetection] CRISIS DETECTADA (SEVERE_EMOTIONAL_COLLAPSE) por patrón de negatividad sostenida y keyword actual.`);
        return { esCrisis: true, tipoCrisis: 'SEVERE_EMOTIONAL_COLLAPSE', urgencia: 'ALTA' };
      }
    }
  }

  // Podríamos añadir más reglas aquí, por ejemplo, combinación de emoción muy negativa con temas de soledad, etc.
  // También, la detección de "intensidad" podría ser un factor (ej. uso de mayúsculas, repetición de palabras).

  return null; // No se detectó un patrón de crisis claro.
}
