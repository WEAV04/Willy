/**
 * analisis_contexto.js
 * Este módulo ayuda a clasificar el contexto de ciertas expresiones del usuario,
 * como cuando se siente perdido/a.
 */

// Palabras clave generales que indican sentirse perdido/a
const KEYWORDS_PERDIDO_GENERAL = [
  "me siento perdido", "me siento perdida", "estoy perdido", "estoy perdida",
  "no sé qué hacer", "no se que hacer", "sin rumbo", "desorientado", "desorientada",
  "no encuentro mi camino", "perdido en la vida", "perdida en la vida"
];

// Palabras clave que sugieren un contexto de pérdida física (simulada)
const KEYWORDS_PERDIDO_FISICO = [
  "calle", "dónde estoy", "donde estoy", "no reconozco este lugar", "estoy lejos de casa",
  "cómo vuelvo", "mapa", "dirección", "ubicación", "me perdí camino a", "me he perdido",
  "no se donde estoy", "ayuda no se donde estoy"
];

/**
 * Clasifica si el usuario se siente perdido/a y si es en un contexto emocional o físico (simulado).
 * @param {string} mensajeUsuario - El mensaje del usuario en minúsculas.
 * @returns {object|null} Objeto { tipo: 'emocional'|'fisica_simulada', desencadenante: string } o null.
 */
export function clasificarSentimientoDePerdida(mensajeUsuario) {
  if (!mensajeUsuario || typeof mensajeUsuario !== 'string') {
    return null;
  }

  let esPerdidoGeneral = false;
  let desencadenanteGeneral = "";

  for (const keyword of KEYWORDS_PERDIDO_GENERAL) {
    if (mensajeUsuario.includes(keyword)) {
      esPerdidoGeneral = true;
      desencadenanteGeneral = keyword;
      break;
    }
  }

  if (esPerdidoGeneral) {
    // Si se detectó una sensación general de estar perdido,
    // verificar si también hay contexto físico.
    for (const keywordFisico of KEYWORDS_PERDIDO_FISICO) {
      if (mensajeUsuario.includes(keywordFisico)) {
        console.log(`[analisis_contexto] Clasificado como pérdida física (simulada) por: "${keywordFisico}" en mensaje: "${mensajeUsuario}"`);
        return {
          tipo: 'fisica_simulada',
          desencadenante: `${desencadenanteGeneral} (contexto: ${keywordFisico})`
        };
      }
    }
    // Si fue perdido general pero sin keywords físicas, es emocional.
    console.log(`[analisis_contexto] Clasificado como pérdida emocional por: "${desencadenanteGeneral}" en mensaje: "${mensajeUsuario}"`);
    return {
      tipo: 'emocional',
      desencadenante: desencadenanteGeneral
    };
  }

  return null; // No se detectó sentimiento de pérdida relevante.
}
