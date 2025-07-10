// modules/suggestions/contextAnalyzer.js

/**
 * Analiza el contexto emocional reciente y las metas activas del usuario.
 * @param {object} memory - Objeto que simula la memoria de Willy.
 * @returns {object} Un objeto con el análisis del contexto.
 */
export function analyzeContext(memory) {
  const { lastEmotion, lastModuleUsed, activeGoals, recentHabits } = memory || {};

  const context = {
    emotion: lastEmotion || null,
    recentModule: lastModuleUsed || null,
    hasGoals: activeGoals && activeGoals.length > 0,
    hasHabits: recentHabits && recentHabits.length > 0,
  };

  return context;
}
