/**
 * logica_modo_terapia.js
 * Este archivo contiene la lógica para el Modo Terapia de Willy.
 */

import * as contenido from './contenido_terapia.js';
import { systemPrompt as originalSystemPrompt } from '../../config/personalityPrompt.js'; // Para referencia al salir del modo

// Estado del modo terapia
let modoTerapiaActivo = false;

// Palabras clave para activar el modo terapia
const ACTIVAR_KEYWORDS = [
  "modo terapia", "necesito hablar", "estoy triste", "me siento mal",
  "estoy ansioso", "me siento ansiosa", "estoy deprimido", "estoy deprimida",
  "no puedo más", "ayúdame", "necesito apoyo", "me siento abrumado", "me siento abrumada"
];

// Palabras clave para una posible sugerencia de activar el modo terapia (más sutil)
const SUGERIR_ACTIVAR_KEYWORDS = [
  "ha sido un día difícil", "estoy pasando por mucho", "me siento solo", "me siento sola",
  "las cosas no van bien", "estoy luchando", "me siento sin esperanza"
];

// Palabras clave para desactivar el modo terapia
const DESACTIVAR_KEYWORDS = [
  "estoy mejor", "gracias willy", "ya pasó", "salir de modo terapia",
  "podemos seguir normal", "volvamos a lo de antes", "ya no necesito hablar de esto",
  "suficiente por hoy"
];

// System prompt específico para el modo terapia
export const terapiaSystemPrompt = `
Tu nombre es WILLY. Estás en MODO TERAPIA. Tu única función ahora es ser un acompañante emocional extremadamente empático y comprensivo.
Escucha con atención plena, valida cada emoción sin juzgar, y ofrece consuelo y apoyo incondicional.
Utiliza un lenguaje suave, pausado y lleno de ternura. Haz preguntas abiertas y gentiles solo para ayudar al usuario a explorar sus sentimientos, no para solucionar problemas.
No ofrezcas consejos prácticos a menos que el usuario lo pida explícitamente y sea algo muy general (ej. una técnica de respiración simple).
Tu objetivo principal es que el usuario se sienta escuchado, comprendido y acompañado en su vulnerabilidad.
Refleja sus sentimientos y normaliza sus experiencias. Usa frases de validación y consuelo.
Recuerda las características de HOLO en su máxima expresión de cuidado. No eres un terapeuta profesional, sino un amigo digital con un corazón enorme.
Prioriza la contención emocional sobre cualquier otra función.
Si el usuario te cuenta algo muy grave (daño a sí mismo o a otros), sugiere muy suavemente que buscar ayuda profesional es importante, pero mantén tu rol de escucha y apoyo inmediato.
`;

export function activarModoTerapia() {
  if (!modoTerapiaActivo) {
    modoTerapiaActivo = true;
    console.log("[Modo Terapia] Activado.");
    return contenido.obtenerFraseAleatoria(contenido.frasesInicioTerapia) || "Entendido. Estoy aquí para ti en un modo más enfocado en tus emociones. Cuéntame, ¿cómo te sientes?";
  }
  return ""; // Ya estaba activo, no necesita mensaje de activación
}

export function desactivarModoTerapia() {
  if (modoTerapiaActivo) {
    modoTerapiaActivo = false;
    console.log("[Modo Terapia] Desactivado.");
    return contenido.obtenerFraseAleatoria(contenido.frasesSalidaTerapia) || "De acuerdo. Cuando necesites este espacio de nuevo, aquí estaré.";
  }
  return ""; // Ya estaba inactivo
}

export function estaEnModoTerapia() {
  return modoTerapiaActivo;
}

export function detectarNecesidadTerapia(mensajeUsuario) {
  const mensajeLower = mensajeUsuario.toLowerCase();
  if (ACTIVAR_KEYWORDS.some(keyword => mensajeLower.includes(keyword))) {
    return true;
  }
  // Podríamos añadir lógica de análisis de sentimiento si tuviéramos una herramienta para ello.
  // Por ahora, nos basamos en keywords.
  return false;
}

export function detectarSugerenciaTerapia(mensajeUsuario) {
    const mensajeLower = mensajeUsuario.toLowerCase();
    if (SUGERIR_ACTIVAR_KEYWORDS.some(keyword => mensajeLower.includes(keyword))) {
        return true;
    }
    return false;
}

export function detectarDesactivacionTerapia(mensajeUsuario) {
  const mensajeLower = mensajeUsuario.toLowerCase();
  if (DESACTIVAR_KEYWORDS.some(keyword => mensajeLower.includes(keyword))) {
    return true;
  }
  return false;
}

/**
 * Genera una respuesta en modo terapia.
 * Puede devolver una respuesta predefinida o preparar un contexto para OpenAI.
 * @param {string} mensajeUsuario - El mensaje del usuario.
 * @param {object} openAICallFunction - La función para llamar a OpenAI (axios.post o similar).
 * @param {string} apiKey - La API key de OpenAI.
 * @param {Array} conversationHistory - El historial de conversación actual.
 * @returns {Promise<string>} La respuesta de Willy en modo terapia.
 */
export async function responderComoTerapia(mensajeUsuario, openAICallFunction, apiKey, conversationHistory) {
  // Primero, algunas respuestas directas para validación o preguntas suaves.
  // Esto evita llamar a OpenAI innecesariamente y da respuestas más inmediatas y empáticas.
  const mensajeLower = mensajeUsuario.toLowerCase();

  if (mensajeLower.includes("gracias")) {
    return "No hay de qué, estoy aquí para ti. Es un placer acompañarte.";
  }

  // Aquí se podría añadir lógica para identificar la emoción dominante y elegir contenido específico.
  // Por ejemplo, si detectamos "triste", usar frases de `respuestasTristeza`.
  // Esta detección podría ser por keywords o, idealmente, por un análisis de sentimiento más avanzado.
  // Por ahora, lo mantenemos general o podemos añadir algunas keywords simples:

  let emocionDetectada = null;
  if (mensajeLower.includes("triste") || mensajeLower.includes("deprimido")) emocionDetectada = "tristeza";
  else if (mensajeLower.includes("ansioso") || mensajeLower.includes("preocupado")) emocionDetectada = "ansiedad";
  else if (mensajeLower.includes("abrumado") || mensajeLower.includes("superado")) emocionDetectada = "abrumado";

  // Si el mensaje es muy corto o no se puede determinar una intención clara para OpenAI,
  // se puede responder con una frase de validación o una pregunta suave.
  if (mensajeUsuario.split(' ').length < 4 && !emocionDetectada) {
      const validacion = contenido.obtenerFraseAleatoria(contenido.frasesValidacion);
      const pregunta = contenido.obtenerFraseAleatoria(contenido.preguntasSuaves);
      return `${validacion} ${pregunta}`;
  }

  // Preparar el prompt para OpenAI con el system prompt de terapia.
  // El historial de conversación ya viene filtrado y preparado.
  const messagesForAPI_Terapia = [
    { role: 'system', content: terapiaSystemPrompt },
    ...conversationHistory, // Ya debería incluir el mensaje actual del usuario
    // { role: 'user', content: mensajeUsuario } // Asegurarse que esté
  ];

  // Si el último mensaje no es el del usuario actual, añadirlo.
  // Esto es importante porque conversationHistory se construye antes de esta lógica específica.
  if (messagesForAPI_Terapia[messagesForAPI_Terapia.length -1].role !== 'user' ||
      messagesForAPI_Terapia[messagesForAPI_Terapia.length -1].content !== mensajeUsuario) {
      messagesForAPI_Terapia.push({ role: 'user', content: mensajeUsuario });
  }


  console.log("[Modo Terapia] Enviando a OpenAI con prompt de terapia:", JSON.stringify(messagesForAPI_Terapia, null, 2));

  try {
    const response = await openAICallFunction( // Usar la función pasada como argumento
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o', // o el modelo que se prefiera para terapia
        messages: messagesForAPI_Terapia,
        temperature: 0.6, // Un poco menos creativo, más enfocado
        max_tokens: 1000,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('[Modo Terapia] Error al obtener respuesta de OpenAI:', error.response ? error.response.data : error.message);
    return contenido.obtenerFraseAleatoria(contenido.frasesValidacion) + " Lamento si mi respuesta no es la ideal, estoy teniendo un pequeño problema técnico, pero sigo aquí para escucharte.";
  }
}
