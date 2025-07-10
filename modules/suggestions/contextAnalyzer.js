// modules/suggestions/contextAnalyzer.js

/**
 * Analiza el contexto emocional reciente y las metas activas del usuario.
 * @param {object} memory - Objeto que representa la memoria de Willy.
 *                          Debería contener: lastEmotion, lastModuleUsed, goals, habits.
 * @returns {object} Un objeto con el análisis del contexto.
 */
export function analyzeContext(memory) {
  // Fallback a un objeto vacío si memory es null o undefined para evitar errores de acceso.
  const safeMemory = memory || {};

  const context = {
    emotion: safeMemory.lastEmotion || null,
    recentModule: safeMemory.lastModuleUsed || null,
    // Renombramos 'goals' a 'activeGoals' para mantener la interfaz del contextAnalyzer,
    // pero usamos 'safeMemory.goals' como fuente.
    activeGoals: (safeMemory.goals && Array.isArray(safeMemory.goals)) ? safeMemory.goals : [],
    // Similarmente para 'habits' -> 'recentHabits'
    recentHabits: (safeMemory.habits && Array.isArray(safeMemory.habits)) ? safeMemory.habits : [],
    // Podríamos añadir más datos del contexto si fueran necesarios y disponibles en 'memory'
    // Por ejemplo: timeOfDay, lastInteractionType, etc. si Willy los rastrea.
  };

  // Validación y logging para depuración
  if (!safeMemory.lastEmotion) {
    console.warn("[contextAnalyzer] lastEmotion no encontrado en memory.");
  }
  if (!safeMemory.lastModuleUsed) {
    // Esto podría ser común si no siempre se registra el último módulo.
    // console.log("[contextAnalyzer] lastModuleUsed no encontrado en memory.");
  }
  if (!safeMemory.goals) {
    // console.log("[contextAnalyzer] goals no encontrados en memory.");
  }
  if (!safeMemory.habits) {
    // console.log("[contextAnalyzer] habits no encontrados en memory.");
  }

  return context;
}
