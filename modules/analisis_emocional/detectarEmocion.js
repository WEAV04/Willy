/**
 * detectarEmocion.js
 * Implementa la lógica para detectar la emoción dominante en un mensaje de usuario.
 */

import { EMOCIONES } from './emociones_basicas.js';

// Definición de palabras clave para cada emoción.
// Esto es una simplificación y puede expandirse significativamente.
// Se podrían usar pesos o un scoring más avanzado.
const keywordsEmocionales = {
  [EMOCIONES.ALEGRIA]: ['feliz', 'contento', 'alegre', 'genial', 'maravilloso', 'excelente', 'divertido', 'encantado', 'emocionado', 'fantástico', 'celebrar', 'sonriendo', 'disfrutando'],
  [EMOCIONES.TRISTEZA]: ['triste', 'deprimido', 'desanimado', 'melancólico', 'llorando', 'abatido', 'infeliz', 'corazón roto', 'solo', 'sola', 'desesperanzado', 'nostalgia', 'pesimista'],
  [EMOCIONES.IRA]: ['enojado', 'furioso', 'molesto', 'irritado', 'indignado', 'rabia', 'odio', 'frustrado', 'harto', 'fastidiado', 'colérico'],
  [EMOCIONES.MIEDO]: ['miedo', 'asustado', 'aterrorizado', 'pánico', 'temeroso', 'nervioso', 'horror', 'preocupado por peligro'],
  [EMOCIONES.ANSIEDAD]: ['ansioso', 'preocupado', 'nervioso', 'inquieto', 'estresado', 'tensión', 'angustiado', 'no puedo dormir', 'palpitaciones', 'agobiado'],
  [EMOCIONES.CALMA]: ['calmado', 'tranquilo', 'relajado', 'sereno', 'paz', 'en paz', 'contento', 'satisfecho', 'bien'],
  [EMOCIONES.SORPRESA]: ['sorprendido', 'asombrado', 'increíble', 'wow', 'no lo puedo creer', 'qué sorpresa', 'inesperado'],
  [EMOCIONES.DESMOTIVACION]: ['desmotivado', 'sin ganas', 'apático', 'sin energía', 'no quiero hacer nada', 'pereza', 'indiferente', 'sin inspiración'],
  [EMOCIONES.ESTRES]: ['estresado', 'tensión', 'presionado', 'agobiado', 'superado por trabajo', 'muchas cosas', 'saturado'],
  [EMOCIONES.CULPA]: ['culpable', 'arrepentido', 'lo siento mucho por', 'mi culpa', 'debería haber', 'no debí'],
  [EMOCIONES.VERGUENZA]: ['avergonzado', 'pena', 'qué vergüenza', 'humillado', 'ridículo'],
  [EMOCIONES.FRUSTRACION]: ['frustrado', 'impotente', 'no puedo lograrlo', 'atascado', 'harto de intentar'],
  [EMOCIONES.ESPERANZA]: ['esperanzado', 'optimista', 'fe', 'creo que saldrá bien', 'tengo esperanza', 'futuro mejor'],
  [EMOCIONES.AMOR]: ['amo', 'quiero mucho', 'cariño', 'afecto', 'adoro', 'enamorado', 'mi amor']
};

// Negaciones comunes que pueden invertir el significado de una emoción cercana
const NEGACIONES = ['no', 'nunca', 'jamás', 'tampoco', 'sin', 'nadie me hace sentir', 'no estoy', 'no me siento'];

/**
 * Detecta la emoción dominante en un mensaje de usuario basado en palabras clave.
 * @param {string} mensajeUsuario - El mensaje del usuario.
 * @returns {string | null} La emoción detectada (un valor de EMOCIONES) o null si no se detecta una clara.
 */
export function detectarEmocion(mensajeUsuario) {
  if (!mensajeUsuario || typeof mensajeUsuario !== 'string' || mensajeUsuario.trim() === '') {
    return null;
  }

  const mensajeLower = mensajeUsuario.toLowerCase();
  let emocionDetectada = null;
  let maxScore = 0;

  // Eliminar o manejar negaciones simples cerca de palabras clave emocionales
  // Esta es una heurística muy básica. Un análisis de dependencias sería más robusto.
  let mensajeProcesado = mensajeLower;
  NEGACIONES.forEach(neg => {
    // Ejemplo: "no estoy feliz" -> "feliz" podría ser detectado, pero la negación lo anula.
    // Por ahora, no implementaremos una lógica de anulación compleja, solo ser conscientes.
    // Una mejora sería: si "no" está a X palabras de "feliz", no contar "feliz".
  });

  // Contar ocurrencias de palabras clave para cada emoción
  const scores = {};

  for (const emocion in keywordsEmocionales) {
    scores[emocion] = 0;
    keywordsEmocionales[emocion].forEach(keyword => {
      // Usar expresión regular para contar palabras completas y evitar subcadenas
      const regex = new RegExp(`\\b${keyword}\\b`, 'g');
      const matches = mensajeProcesado.match(regex);
      if (matches) {
        scores[emocion] += matches.length;
      }
    });
  }

  // Encontrar la emoción con el puntaje más alto
  for (const emocion in scores) {
    if (scores[emocion] > maxScore) {
      maxScore = scores[emocion];
      emocionDetectada = emocion;
    }
  }

  // Si hay un empate o el score es muy bajo, podríamos devolver null o 'neutro'
  // Por ahora, si hay algún score > 0, devolvemos la emoción con maxScore.
  // Se podría añadir un umbral mínimo de score.
  if (maxScore > 0) {
    // Manejo de negaciones simples: si "no [palabra clave emoción X]" está presente,
    // y X es la emoción detectada, podríamos anularla o buscar una segunda opción.
    // Ejemplo: "No estoy triste, pero sí estoy un poco molesto"
    // "triste" podría tener score 1, "molesto" (ira) score 1.
    // Si "no estoy triste" es detectado, y la emocionDetectada es TRISTEZA,
    // se podría intentar buscar la siguiente emoción con mayor score.
    // Esto requiere una lógica más compleja que la actual.

    // Lógica de desambiguación simple:
    // Si detecta alegría pero también hay palabras de tristeza/ansiedad fuertes, podría ser sarcasmo o mixto.
    // Ejemplo: "Estoy tan feliz que podría llorar de ansiedad." (Complejo)

    // Por ahora, la detección es directa basada en el conteo de keywords.
    console.log(`[detectarEmocion] Emoción detectada: ${emocionDetectada} (Score: ${maxScore}) para mensaje: "${mensajeUsuario}"`);
    return emocionDetectada;
  }

  console.log(`[detectarEmocion] No se detectó emoción clara para mensaje: "${mensajeUsuario}"`);
  return EMOCIONES.NEUTRO; // O null si se prefiere no asignar 'neutro' por defecto
}

// --- Opcional: Versión usando OpenAI para detección (requiere modificar el flujo) ---
// import axios from 'axios'; // Necesitaría axios si se usa aquí
/*
const OPENAI_API_KEY_EMOTION = 'TU_API_KEY_OPENAI'; // Idealmente desde config

export async function detectarEmocionConOpenAI(mensajeUsuario, listaEmocionesValidas) {
  if (!mensajeUsuario || !OPENAI_API_KEY_EMOTION || OPENAI_API_KEY_EMOTION === 'TU_API_KEY_OPENAI') {
    console.warn("[detectarEmocionConOpenAI] API Key no configurada o mensaje vacío. Usando detección por keywords.");
    return detectarEmocion(mensajeUsuario); // Fallback a keywords
  }

  const prompt = `Analiza el siguiente mensaje de usuario e identifica la emoción dominante.
  Responde SOLO con una de las siguientes etiquetas de emoción: ${listaEmocionesValidas.join(', ')}.
  Si no se detecta una emoción clara de la lista o es neutro, responde "neutro".
  Mensaje: "${mensajeUsuario}"
  Emoción dominante:`;

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions', // o el endpoint de completions si se prefiere
      {
        model: 'gpt-3.5-turbo', // Un modelo más rápido y económico para esta tarea
        messages: [{role: "system", content: "Eres un experto en análisis de sentimientos y emociones."}, {role: "user", content: prompt}],
        temperature: 0.2,
        max_tokens: 10,
      },
      {
        headers: { Authorization: `Bearer ${OPENAI_API_KEY_EMOTION}` }
      }
    );
    let emocion = response.data.choices[0].message.content.trim().toLowerCase();

    // Validar que la emoción devuelta esté en nuestra lista
    if (listaEmocionesValidas.includes(emocion)) {
      console.log(`[detectarEmocionConOpenAI] Emoción detectada (OpenAI): ${emocion}`);
      return emocion;
    } else if (emocion === "neutro") {
      console.log(`[detectarEmocionConOpenAI] Emoción detectada (OpenAI): ${EMOCIONES.NEUTRO}`);
      return EMOCIONES.NEUTRO;
    } else {
      console.warn(`[detectarEmocionConOpenAI] OpenAI devolvió una emoción no válida: ${emocion}. Usando fallback.`);
      return detectarEmocion(mensajeUsuario); // Fallback a keywords
    }
  } catch (error) {
    console.error('[detectarEmocionConOpenAI] Error al contactar OpenAI para detección de emoción:', error.message);
    return detectarEmocion(mensajeUsuario); // Fallback a keywords en caso de error
  }
}
*/
