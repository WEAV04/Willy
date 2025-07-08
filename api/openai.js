import axios from 'axios';
import { systemPrompt as baseSystemPrompt } from '../config/personalityPrompt.js';
import { addMessage, getMessagesByKeyword, getLastMessages } from '../lib/memory.js';
import { fetchAndParseDDG } from '../lib/internet.js';
import * as terapiaLogic from '../modules/modo_terapia/logica_modo_terapia.js';
import * as terapiaContent from '../modules/modo_terapia/contenido_terapia.js';


const OPENAI_API_KEY = 'TU_API_KEY_AQUI'; // Reemplaza con la clave real
const MOCK_USER_ID = 'user123'; // Placeholder for user identification

// Keywords for memory recall
const RECALL_KEYWORDS = ['recuerdas', 'te acuerdas', 'qué te dije', 'lo que te conté'];

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
  // 1. Save user message to local memory
  addMessage({
    userId: MOCK_USER_ID,
    role: 'user',
    message: userMessageContent,
  });

  const userMessageLower = userMessageContent.toLowerCase();
  let willyResponseContent = "";
  let initialTherapyMessage = ""; // For messages like activation/deactivation

  // 2. Therapy Mode Logic
  if (terapiaLogic.detectarDesactivacionTerapia(userMessageLower)) {
    initialTherapyMessage = terapiaLogic.desactivarModoTerapia();
    // If deactivation returns a message, send it and potentially skip OpenAI for this turn.
    if (initialTherapyMessage) willyResponseContent = initialTherapyMessage;
  } else if (terapiaLogic.estaEnModoTerapia() || terapiaLogic.detectarNecesidadTerapia(userMessageLower)) {
    if (!terapiaLogic.estaEnModoTerapia()) {
      initialTherapyMessage = terapiaLogic.activarModoTerapia();
      // Send activation message immediately, then proceed to get empathetic response for current user message.
    }

    // Prepare conversation history for therapy mode (includes current user message via getLastMessages)
    const recentMessagesForTherapy = getLastMessages(MOCK_USER_ID, 10) // Includes current user message
        .map(msg => ({
            role: msg.role === 'willy' ? 'assistant' : msg.role,
            content: msg.message
        }));

    const therapyResponse = await terapiaLogic.responderComoTerapia(
      userMessageContent,
      axios.post, // Pass the function itself
      OPENAI_API_KEY,
      recentMessagesForTherapy // Pass the prepared history
    );
    willyResponseContent = initialTherapyMessage ? initialTherapyMessage + "\n\n" + therapyResponse : therapyResponse;

    addMessage({ userId: MOCK_USER_ID, role: 'willy', message: willyResponseContent });
    return willyResponseContent;
  } else if (terapiaLogic.detectarSugerenciaTerapia(userMessageLower)) {
    // Suggest therapy mode but don't activate yet. Let Willy respond normally,
    // but perhaps OpenAI will pick up on the hint if we pass it.
    // Or, craft a specific response here:
    willyResponseContent = terapiaContent.obtenerFraseAleatoria(terapiaContent.frasesValidacion) +
                           " Parece que estás pasando por un momento difícil. Si necesitas un espacio más tranquilo para hablar de tus emociones, solo dime \"modo terapia\".";
    addMessage({ userId: MOCK_USER_ID, role: 'willy', message: willyResponseContent });
    return willyResponseContent;
  }


  // 3. If a therapy mode response was already decided (e.g. activation/deactivation message only)
  if (willyResponseContent) {
      addMessage({ userId: MOCK_USER_ID, role: 'willy', message: willyResponseContent });
      return willyResponseContent;
  }

  // 4. Standard Operation: Internet Search or Memory Recall or General Chat
  let memoryContext = "";
  let internetContext = "";
  let finalSystemPrompt = baseSystemPrompt;

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
      internetContext = await fetchAndParseDDG(internetQuery, null); // Mocked
    }
    finalSystemPrompt += "\n\n--- Información relevante de internet ---\n" + internetContext;
  }

  // 4b. Memory Recall Detection (if not an internet search)
  if (!needsInternetSearch) {
    const wantsToRecall = RECALL_KEYWORDS.some(keyword => userMessageLower.includes(keyword));
    if (wantsToRecall) {
      let searchTerm = "";
      const aboutMatch = userMessageLower.match(/sobre ([\wáéíóúñ]+)/i);
      if (aboutMatch && aboutMatch[1]) searchTerm = aboutMatch[1];
      else {
        const words = userMessageLower.split(' ').filter(word => !RECALL_KEYWORDS.join(' ').includes(word));
        if (words.length > 0) searchTerm = words[words.length - 1];
      }

      if (searchTerm) {
        const relevantMessages = getMessagesByKeyword(MOCK_USER_ID, searchTerm);
        if (relevantMessages.length > 0) {
          memoryContext = "Para tu referencia, anteriormente hablamos de esto:\n";
          relevantMessages.slice(-3).forEach(msg => {
            memoryContext += `- (${msg.role === 'user' ? 'Tú' : 'Yo'} el ${new Date(msg.timestamp).toLocaleDateString()}): "${msg.message}"\n`;
          });
        } else {
          memoryContext = "Busqué en mi memoria sobre eso, pero no encontré algo específico. ¿Podrías recordarme un poco más?\n";
        }
      } else {
        memoryContext = "Parece que quieres que recuerde algo. ¿Podrías darme más detalles?\n";
      }
      finalSystemPrompt += "\n\n--- Información de nuestra conversación anterior ---\n" + memoryContext;
    }
  }

  // 5. Prepare messages for OpenAI API
  const recentMessages = getLastMessages(MOCK_USER_ID, 10) // Includes current user message
    .map(msg => ({
      role: msg.role === 'willy' ? 'assistant' : msg.role,
      content: msg.message
    }));

  const messagesForAPI = [
    { role: 'system', content: finalSystemPrompt },
    ...recentMessages,
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

  // 6. Save Willy's final response to memory
  addMessage({
    userId: MOCK_USER_ID,
    role: 'willy',
    message: willyResponseContent,
  });

  return willyResponseContent;
}
