// modules/suggestions/suggestionEngine.js

/**
 * Decide si se debe hacer una sugerencia y qué tipo de sugerencia.
 * @param {object} context - El objeto de contexto proporcionado por contextAnalyzer.
 * @returns {object|null} Un objeto de sugerencia o null si no hay sugerencia.
 *                        Ej: { type: "journal_prompt", details: "Escribe sobre cómo te sientes ahora." }
 *                        Ej: { type: "micro_habit", details: { habitId: "tomar_agua" } }
 */
function generateSuggestion(context) {
  console.log("SuggestionEngine: Generando sugerencia basada en contexto:", context);

  // TODO: Implementar lógica de decisión basada en el contexto.
  // - Considerar el estado de ánimo (mood).
  // - Considerar temas de conversación recientes.
  // - Considerar metas activas y su progreso.
  // - Considerar la hora del día.
  // - Considerar el tipo de la última interacción para evitar sugerencias repetitivas o irrelevantes.

  // Placeholder: Lógica de ejemplo muy simple
  if (context.mood === "slightly_negative" && context.activeGoals.includes("mejorar_animo")) {
    return {
      type: "journal_prompt",
      details: "Parece que hoy no es tu mejor día. ¿Quieres escribir un poco sobre cómo te sientes?",
      priority: 1 // Prioridad de la sugerencia (más alto es más importante)
    };
  }

  if (context.timeOfDay > 8 && context.timeOfDay < 12 && !context.lastInteractionType === "micro_habit_completed") {
     // TODO: Seleccionar un microhábito relevante que no se haya completado recientemente.
    return {
      type: "micro_habit",
      details: { habitId: "hidratacion_matutina", prompt: "¿Qué tal un vaso de agua para empezar bien la mañana?" },
      priority: 2
    };
  }

  // TODO: Añadir más reglas y tipos de sugerencias (ej: reflexionar sobre una meta, etc.)

  return null; // No hay sugerencia por ahora
}

module.exports = { generateSuggestion };
