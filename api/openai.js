import axios from 'axios';
import { systemPrompt as baseSystemPrompt } from '../config/personalityPrompt.js';
import {
    guardarMensajeFirestore,
    buscarMensajesPorPalabraClave,
    obtenerMensajesRecientes
} from '../services/firestoreService.js';
import { fetchAndParseDDG } from '../lib/internet.js';
import * as terapiaLogic from '../modules/modo_terapia/logica_modo_terapia.js';
import * as terapiaContent from '../modules/modo_terapia/contenido_terapia.js';
import { detectarEmocion } from '../modules/analisis_emocional/detectarEmocion.js';
import { esEmocionNegativa, EMOCIONES } from '../modules/analisis_emocional/emociones_basicas.js';

const OPENAI_API_KEY = 'TU_API_KEY_AQUI'; // Reemplaza con la clave real
const MOCK_USER_ID = 'user123'; // Placeholder for user identification, debería ser dinámico

// Keywords for memory recall
const RECALL_KEYWORDS = ['recuerdas', 'te acuerdas', 'qué te dije', 'lo que te conté', 'último que hablamos'];

// Keywords for internet search
const INTERNET_SEARCH_KEYWORDS = [
  'busca sobre', 'encuentra información de', 'qué es', 'quién es', 'dime sobre',
  'investiga', 'últimas noticias', 'qué pasó hoy con', 'qué sabes de', 'cuéntame de'
];
const INTERNET_QUERY_STOP_WORDS = ['busca sobre', 'encuentra información de', 'dime sobre', 'investiga', 'qué sabes de', 'cuéntame de', 'explícame'];

let viewTextWebsiteTool = null;
export function setViewTextWebsiteTool(tool) {
  viewTextWebsiteTool = tool;
  console.log("[api/openai.js] viewTextWebsiteTool has been set.");
}

export async function getWillyResponse(userMessageContent) {
  const userMessageLower = userMessageContent.toLowerCase();
  let willyResponseContent = "";
  let initialTherapyMessage = "";

  // 1. Detect emotion in user's message
  const emocionDetectada = detectarEmocion(userMessageContent); // Asumiendo que es síncrona por ahora
  console.log(`[api/openai.js] Emoción detectada para mensaje de usuario: ${emocionDetectada}`);

  // 2. Save user message to Firestore, now including the detected emotion
  try {
    await guardarMensajeFirestore({
      userId: MOCK_USER_ID,
      role: 'user',
      message: userMessageContent,
      emotion: emocionDetectada,
      // topic, relevante can be added later
    });
  } catch (error) {
    console.error("[api/openai.js] Error guardando mensaje de usuario en Firestore:", error);
  }

  // 3. Therapy Mode Logic (check before standard operations)
  // Note: initialTherapyMessage was already declared
  if (terapiaLogic.detectarDesactivacionTerapia(userMessageLower)) {
    initialTherapyMessage = terapiaLogic.desactivarModoTerapia();
    if (initialTherapyMessage) willyResponseContent = initialTherapyMessage;
  } else if (terapiaLogic.estaEnModoTerapia() || terapiaLogic.detectarNecesidadTerapia(userMessageLower) || (emocionDetectada && esEmocionNegativa(emocionDetectada) && !terapiaLogic.estaEnModoTerapia())) {
    // Condición adicional: si se detecta emoción negativa fuerte y no está en modo terapia, puede activarse o responder con más cuidado.
    // Por ahora, si detecta necesidad directa o ya está en modo, o si es emoción negativa (y no está en modo) -> entra en lógica de terapia.
    if (!terapiaLogic.estaEnModoTerapia()) {
        // Si la activación es por emoción negativa detectada y no por keyword directa de "modo terapia"
        if (emocionDetectada && esEmocionNegativa(emocionDetectada) && !ACTIVAR_KEYWORDS.some(kw => userMessageLower.includes(kw))) {
             initialTherapyMessage = terapiaLogic.activarModoTerapia() + `\nHe notado que quizás te sientes ${emocionDetectada}. Estoy aquí para escucharte.`;
        } else {
            initialTherapyMessage = terapiaLogic.activarModoTerapia();
        }
    }

    const recentMessagesForTherapyRaw = await obtenerMensajesRecientes(MOCK_USER_ID, 10);
    const recentMessagesForTherapy = recentMessagesForTherapyRaw.map(msg => ({
        role: msg.role === 'willy' ? 'assistant' : msg.role,
        content: msg.message
    }));

    const therapyResponse = await terapiaLogic.responderComoTerapia(
      userMessageContent,
      axios.post,
      OPENAI_API_KEY,
      recentMessagesForTherapy
    );
    willyResponseContent = initialTherapyMessage ? initialTherapyMessage + "\n\n" + therapyResponse : therapyResponse;

    try {
      await guardarMensajeFirestore({ userId: MOCK_USER_ID, role: 'willy', message: willyResponseContent, emotion: detectarEmocion(willyResponseContent) }); // Willy también puede tener emociones en su respuesta
    } catch (error) {
      console.error("[api/openai.js] Error guardando respuesta de Willy (terapia) en Firestore:", error);
    }
    return willyResponseContent;
  } else if (terapiaLogic.detectarSugerenciaTerapia(userMessageLower)) {
    willyResponseContent = terapiaContent.obtenerFraseAleatoria(terapiaContent.frasesValidacion) +
                           " Parece que estás pasando por un momento difícil. Si necesitas un espacio más tranquilo para hablar de tus emociones, solo dime \"modo terapia\".";
    try {
      await guardarMensajeFirestore({ userId: MOCK_USER_ID, role: 'willy', message: willyResponseContent });
    } catch (error) {
      console.error("[api/openai.js] Error guardando sugerencia de terapia en Firestore:", error);
    }
    return willyResponseContent;
  }

  if (willyResponseContent) { // Si ya se generó una respuesta (ej. activación/desactivación de terapia)
    try {
      await guardarMensajeFirestore({ userId: MOCK_USER_ID, role: 'willy', message: willyResponseContent });
    } catch (error) {
      console.error("[api/openai.js] Error guardando mensaje inicial de terapia en Firestore:", error);
    }
    return willyResponseContent;
  }

  // 4. Standard Operation: Internet Search or Memory Recall or General Chat
  let memoryContext = "";
  let internetContext = "";
  let finalSystemPrompt = baseSystemPrompt; // Inicia con el prompt base

  // Modificación del system prompt si se detecta emoción y no está en modo terapia explícito
  if (emocionDetectada && emocionDetectada !== EMOCIONES.NEUTRO && !terapiaLogic.estaEnModoTerapia()) {
    if (esEmocionNegativa(emocionDetectada)) {
      finalSystemPrompt += `\n\n[Contexto emocional: El usuario parece sentirse ${emocionDetectada}. Responde con especial empatía y suavidad, validando sus sentimientos si es apropiado, incluso si no pide ayuda explícitamente.]`;
    } else if (esEmocionPositiva(emocionDetectada)) {
      finalSystemPrompt += `\n\n[Contexto emocional: El usuario parece sentirse ${emocionDetectada}. Comparte su entusiasmo o responde de manera cálida y acorde.]`;
    }
    // No se añade nada especial para EMOCIONES.NEUTRO u OTRO aquí, se maneja por defecto.
  }


  // 4a. Internet Search Detection
  let needsInternetSearch = false;
  let internetQuery = "";
  for (const keyword of INTERNET_SEARCH_KEYWORDS) {
    if (userMessageLower.includes(keyword)) {
      needsInternetSearch = true;
      let queryCandidate = userMessageContent.substring(userMessageLower.indexOf(keyword) + keyword.length).trim();
      for (const stopWord of INTERNET_QUERY_STOP_WORDS) {
        if (queryCandidate.toLowerCase().startsWith(stopWord)) {
          queryCandidate = queryCandidate.substring(stopWord.length).trim();
        }
      }
      internetQuery = queryCandidate;
      if (internetQuery.endsWith("?")) internetQuery = internetQuery.slice(0, -1);
      break;
    }
  }

  if (needsInternetSearch && internetQuery) {
    console.log(`[api/openai.js] Internet search needed for query: "${internetQuery}"`);
    if (viewTextWebsiteTool) {
      internetContext = await fetchAndParseDDG(internetQuery, viewTextWebsiteTool);
    } else {
      console.warn("[api/openai.js] viewTextWebsiteTool not available. Internet search will be mocked.");
      internetContext = await fetchAndParseDDG(internetQuery, null);
    }
    finalSystemPrompt += "\n\n--- Información relevante de internet ---\n" + internetContext;
  }

  // 4b. Memory Recall Detection (if not an internet search)
  if (!needsInternetSearch) {
    const wantsToRecall = RECALL_KEYWORDS.some(keyword => userMessageLower.includes(keyword));
    if (wantsToRecall) {
      let searchTerm = "";
      // Check for "lo último que hablamos"
      if (userMessageLower.includes("lo último que hablamos")) {
          // No specific search term, handled by recent messages context
      } else {
        const aboutMatch = userMessageLower.match(/sobre ([\wáéíóúñ]+)/i);
        if (aboutMatch && aboutMatch[1]) searchTerm = aboutMatch[1];
        else {
          const words = userMessageLower.split(' ').filter(word => !RECALL_KEYWORDS.join(' ').includes(word) && word.length > 2); // simple filter
          if (words.length > 0) searchTerm = words[words.length - 1];
        }
      }

      if (searchTerm) {
        const relevantMessagesRaw = await buscarMensajesPorPalabraClave(MOCK_USER_ID, searchTerm);
        if (relevantMessagesRaw.length > 0) {
          memoryContext = "Para tu referencia, anteriormente hablamos de esto:\n";
          relevantMessagesRaw.slice(-3).forEach(msg => { // Tomar los 3 más recientes de los encontrados
            const date = msg.timestamp && msg.timestamp.toDate ? msg.timestamp.toDate().toLocaleDateString() : 'una fecha anterior';
            memoryContext += `- (${msg.role === 'user' ? 'Tú' : 'Yo'} el ${date}): "${msg.message}"\n`;
          });
        } else {
          memoryContext = `Busqué en mi memoria sobre "${searchTerm}", pero no encontré algo específico. ¿Podrías recordarme un poco más?\n`;
        }
      } else if (userMessageLower.includes("lo último que hablamos")) {
          memoryContext = "Revisando nuestras últimas conversaciones...\n"; // El historial ya provee esto.
      } else {
        memoryContext = "Parece que quieres que recuerde algo. ¿Podrías darme más detalles o una palabra clave?\n";
      }
      if (memoryContext) finalSystemPrompt += "\n\n--- Información de nuestra conversación anterior ---\n" + memoryContext;
    }
  }

  // 5. Prepare messages for OpenAI API using Firestore
  const recentMessagesRaw = await obtenerMensajesRecientes(MOCK_USER_ID, 10); // Incluye el mensaje actual del usuario
  const recentMessagesForAPI = recentMessagesRaw.map(msg => ({
    role: msg.role === 'willy' ? 'assistant' : msg.role,
    content: msg.message
  }));

  const messagesForAPI = [
    { role: 'system', content: finalSystemPrompt },
    ...recentMessagesForAPI,
  ];

  console.log("[api/openai.js] Messages for API (standard):", JSON.stringify(messagesForAPI, null, 2));

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o',
        messages: messagesForAPI,
        temperature: 0.7,
        max_tokens: 1000,
      },
      {
        headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' }
      }
    );
    willyResponseContent = response.data.choices[0].message.content;
  } catch (error) {
    console.error('Error al obtener respuesta de Willy (standard):', error.response ? error.response.data : error.message);
    willyResponseContent = "Lo siento... hubo un problema técnico al intentar generar una respuesta. ¿Podemos intentarlo de nuevo?";
  }

  // 6. Save Willy's final response to Firestore
  try {
    await guardarMensajeFirestore({
      userId: MOCK_USER_ID,
      role: 'willy',
      message: willyResponseContent,
      emotion: detectarEmocion(willyResponseContent) // También detectar emoción en respuesta de Willy
    });
  } catch (error) {
    console.error("[api/openai.js] Error guardando respuesta de Willy (standard) en Firestore:", error);
  }

  return willyResponseContent;
}

// Helper para la lógica de activación de modo terapia por emoción negativa (usado arriba)
const ACTIVAR_KEYWORDS = [
  "modo terapia", "necesito hablar", "estoy triste", "me siento mal",
  "estoy ansioso", "me siento ansiosa", "estoy deprimido", "estoy deprimida",
  "no puedo más", "ayúdame", "necesito apoyo", "me siento abrumado", "me siento abrumada"
];
