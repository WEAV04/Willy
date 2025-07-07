import axios from 'axios';
import { systemPrompt } from '../config/personalityPrompt';

const OPENAI_API_KEY = 'TU_API_KEY_AQUI'; // Reemplaza con la clave real

export async function getWillyResponse(userMessage) {
  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
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

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('Error al obtener respuesta de Willy:', error);
    return "Lo siento... hubo un problema técnico. ¿Podemos intentarlo de nuevo?";
  }
}
