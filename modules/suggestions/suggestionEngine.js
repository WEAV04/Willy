// modules/suggestions/suggestionEngine.js

const suggestionMap = {
  ansiedad: { type: 'microhabito', text: '¿Te gustaría probar una respiración guiada para calmarte?' },
  tristeza: { type: 'diario', text: 'Podrías escribir en tu diario emocional lo que estás sintiendo.' },
  frustración: { type: 'reflexion', text: 'Quizás una reflexión inspiradora te ayudaría.' }
};

/**
 * Decide si se debe hacer una sugerencia y qué tipo de sugerencia.
 * @param {object} context - El objeto de contexto proporcionado por contextAnalyzer.
 * @returns {object|null} Un objeto de sugerencia o null si no hay sugerencia.
 */
export function generateSuggestion(context) {
  if (!context || !context.emotion) return null;

  const suggestion = suggestionMap[context.emotion.toLowerCase()];
  if (!suggestion) return null;

  return {
    valid: true,
    type: suggestion.type,
    message: suggestion.text
  };
}
