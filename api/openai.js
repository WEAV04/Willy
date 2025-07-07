import axios from 'axios';
import { systemPrompt } from '../config/personalityPrompt';
import { addMessage, getMessagesByKeyword, getLastMessages } from '../lib/memory';

const OPENAI_API_KEY = 'TU_API_KEY_AQUI'; // Reemplaza con la clave real
const MOCK_USER_ID = 'user123'; // Placeholder for user identification

// Palabras clave para detectar si el usuario quiere que Willy recuerde algo.
const RECALL_KEYWORDS = ['recuerdas', 'te acuerdas', 'qué te dije', 'lo que te conté'];

export async function getWillyResponse(userMessageContent) {
  // Guardar mensaje del usuario en la memoria local
  addMessage({
    userId: MOCK_USER_ID,
    role: 'user',
    message: userMessageContent,
    // topic, emotion, relevante can be added later or through NLP
  });

  let conversationHistoryForPrompt = [];
  let memoryContext = "";

  // Detectar si el usuario quiere que Willy recuerde algo
  const userMessageLower = userMessageContent.toLowerCase();
  const wantsToRecall = RECALL_KEYWORDS.some(keyword => userMessageLower.includes(keyword));

  if (wantsToRecall) {
    // Extraer un posible término de búsqueda (muy simplificado)
    // Por ejemplo, si dice "recuerdas lo que te dije sobre Laura", buscar "Laura"
    let searchTerm = "";
    const aboutMatch = userMessageLower.match(/sobre ([\wáéíóúñ]+)/i);
    if (aboutMatch && aboutMatch[1]) {
      searchTerm = aboutMatch[1];
    } else {
      // Si no hay "sobre X", buscar alguna palabra clave de la frase del usuario,
      // excluyendo las palabras de recuerdo.
      const words = userMessageLower.split(' ').filter(word => !RECALL_KEYWORDS.join(' ').includes(word));
      // Tomar la última palabra como posible término (esto es muy básico y puede mejorarse)
      if (words.length > 0) searchTerm = words[words.length-1];
    }

    if (searchTerm) {
        const relevantMessages = getMessagesByKeyword(MOCK_USER_ID, searchTerm);
        if (relevantMessages.length > 0) {
            memoryContext = "Para tu referencia, anteriormente hablamos de esto:\n";
            relevantMessages.slice(-3).forEach(msg => { // Limitar a los últimos 3 mensajes relevantes
                 memoryContext += `- (${msg.role === 'user' ? 'Tú' : 'Yo'} el ${new Date(msg.timestamp).toLocaleDateString()}): "${msg.message}"\n`;
            });
        } else {
            memoryContext = "Busqué en mi memoria sobre eso, pero no encontré algo específico en este momento. ¿Podrías recordarme un poco más?\n";
        }
    } else {
        // Si no se identifica un término de búsqueda claro, pero sí una intención de recuerdo,
        // podríamos ofrecer los últimos mensajes relevantes o un resumen general.
        // Por ahora, un mensaje genérico:
        memoryContext = "Parece que quieres que recuerde algo. ¿Podrías darme alguna palabra clave o un poco más de contexto sobre lo que buscas en nuestra conversación pasada?\n";
    }
  }

  // Obtener los últimos mensajes para construir el historial del prompt (ej. últimos 5 intercambios)
  const recentMessagesFromMemory = getLastMessages(MOCK_USER_ID, 10); // Obtener los últimos 10 mensajes (user y willy)

  // Filtrar para que solo los mensajes de 'user' y 'assistant' (Willy) se pasen a la API
  // y asegurarse de que el mensaje actual del usuario no se duplique si ya fue guardado por addMessage.
  conversationHistoryForPrompt = recentMessagesFromMemory
    .filter(msg => msg.role === 'user' || msg.role === 'willy')
    .map(msg => ({
      role: msg.role === 'willy' ? 'assistant' : msg.role, // OpenAI usa 'assistant'
      content: msg.message
    }));

  // Asegurarse de que el mensaje actual del usuario esté al final, si no fue incluido ya
  // (getLastMessages podría no incluirlo si se llama antes de que se guarde)
  // La lógica actual guarda el mensaje del usuario ANTES de llamar a getLastMessages,
  // por lo que ya debería estar incluido.

  const messagesForAPI = [
    { role: 'system', content: systemPrompt + (memoryContext ? "\n\n" + memoryContext : "") },
    ...conversationHistoryForPrompt, // Esto ya incluye el mensaje actual del usuario
    // El mensaje del usuario ya está en conversationHistoryForPrompt porque addMessage se llama antes
    // { role: 'user', content: userMessageContent } // No es necesario si getLastMessages lo incluye
  ];

  // console.log("Messages for API:", JSON.stringify(messagesForAPI, null, 2));


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
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const willyResponseContent = response.data.choices[0].message.content;

    // Guardar respuesta de Willy en la memoria local
    addMessage({
      userId: MOCK_USER_ID,
      role: 'willy', // Usamos 'willy' internamente para diferenciar de 'assistant' de OpenAI si es necesario
      message: willyResponseContent,
    });

    return willyResponseContent;
  } catch (error) {
    console.error('Error al obtener respuesta de Willy:', error.response ? error.response.data : error.message);
    return "Lo siento... hubo un problema técnico al intentar generar una respuesta. ¿Podemos intentarlo de nuevo?";
  }
}
