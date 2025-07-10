// modules/suggestions/index.js

const { analyzeContext } = require('./contextAnalyzer');
const { generateSuggestion } = require('./suggestionEngine');

/**
 * Punto de entrada principal para el módulo de sugerencias proactivas.
 * Orquesta el análisis del contexto y la generación de sugerencias.
 * @returns {object|null} Una sugerencia procesable o null.
 */
async function getProactiveSuggestion() {
  // TODO: Obtener el ID de usuario o sesión actual para pasar a analyzeContext si es necesario.
  const currentContext = analyzeContext(/* userId */);

  if (currentContext) {
    const suggestion = generateSuggestion(currentContext);

    if (suggestion) {
      console.log("Proactive suggestion generated:", suggestion);
      // TODO: Conectar con el motor de diálogo para presentar la sugerencia al usuario.
      //       Esto podría implicar formatear la sugerencia de una manera específica
      //       o enviarla a través de un bus de eventos.
      return suggestion;
    }
  }
  return null;
}

module.exports = {
  getProactiveSuggestion,
  // También exportamos las funciones internas por si se necesitan granularmente
  analyzeContext,
  generateSuggestion
};
