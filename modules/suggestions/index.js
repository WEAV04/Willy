// modules/suggestions/index.js

import { analyzeContext } from './contextAnalyzer.js';
import { generateSuggestion } from './suggestionEngine.js';

/**
 * Punto de entrada principal para el módulo de sugerencias proactivas.
 * Orquesta el análisis del contexto y la generación de sugerencias.
 * @param {object} memory - Objeto que simula la memoria de Willy.
 * @returns {object|null} Una sugerencia procesable o null.
 */
export function getProactiveSuggestion(memory) {
  const context = analyzeContext(memory);
  const suggestion = generateSuggestion(context);
  return suggestion;
}

// También exportamos las funciones internas por si se necesitan granularmente
export { analyzeContext, generateSuggestion };
