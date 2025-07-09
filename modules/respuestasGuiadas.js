/**
 * respuestasGuiadas.js
 * Contiene frases y sugerencias para guiar conversaciones específicas,
 * como cuando el usuario se siente perdido.
 */

// --- Contenido para "Sentirse Perdido Emocionalmente" ---
export const frasesPerdidaEmocional = [
  "Entiendo que sentirse perdido/a puede ser desconcertante y a veces abrumador. Estoy aquí para escucharte.",
  "A veces, sentirse perdido/a es una señal de que estamos en un proceso de cambio o búsqueda interna. No estás solo/a en esto.",
  "Es completamente válido no tener todas las respuestas ahora mismo. Podemos explorar juntos lo que sientes, si te apetece.",
  "Esa sensación de no saber qué hacer o hacia dónde ir es muy humana. Permítete sentirlo sin juzgarte.",
  "Recuerda que los momentos de desorientación también pueden ser oportunidades para descubrir nuevos caminos o aspectos de ti mismo/a.",
  "Estoy aquí para acompañarte en este sentimiento. ¿Hay algo en particular que te haga sentir así en este momento?",
  "No tienes que tener un mapa claro de todo tu futuro hoy. A veces, solo necesitamos enfocarnos en el próximo pequeño paso.",
  "Muchas personas atraviesan momentos en los que se sienten sin rumbo. Es parte de la experiencia de crecer y vivir."
];

export const preguntasSuavesPerdidaEmocional = [
  "¿Hay algo específico que desencadene esta sensación de estar perdido/a?",
  "Si te sientes cómodo/a, ¿podrías contarme un poco más sobre lo que significa para ti 'sentirte perdido/a' en este momento?",
  "¿Hay alguna pequeña cosa que te gustaría que fuera diferente, o algún pequeño anhelo que sientas ahora?",
  "¿Qué cosas solían darte claridad o sentido antes? A veces recordar eso ayuda.",
  "Si pudieras pedir un deseo para sentirte un poco menos perdido/a ahora, ¿cuál sería?"
];

// --- Contenido para "Sentirse Perdido Físicamente (Simulado)" ---
export const frasesInicioPerdidaFisica = [
  "Entiendo que sentirse desorientado/a puede generar ansiedad. Aunque no puedo ver tu ubicación actual ni darte un mapa, estoy aquí para conversar y que te sientas acompañado/a mientras te orientas.",
  "Vaya, sonar perdido/a en un lugar desconocido puede ser estresante. Quiero recordarte que no tengo acceso a tu ubicación, pero puedo escucharte y ayudarte a pensar en opciones seguras."
];

export const sugerenciasPerdidaFisicaSimulada = [
  "Intenta mantener la calma y respirar profundo. A veces, unos segundos de pausa ayudan a pensar con más claridad.",
  "Observa a tu alrededor con atención. ¿Hay algún nombre de calle, tienda conocida, edificio distintivo o punto de referencia que puedas reconocer o usar?",
  "Si tienes tu teléfono contigo y tiene batería, ¿podrías usar una aplicación de mapas para ubicarte? Es una herramienta muy útil.",
  "¿Hay alguna persona cerca a la que podrías preguntar de forma segura por una dirección o referencia? (por ejemplo, personal de una tienda, un policía si lo ves).",
  "Si te sientes muy inseguro/a o es de noche, considera llamar a un amigo/a o familiar que conozca la zona o que pueda ayudarte a pensar en cómo volver a un lugar conocido.",
  "Recuerda priorizar tu seguridad. Si un camino no te da confianza, es mejor buscar una alternativa más transitada o iluminada."
];

export const obtenerFraseAleatoria = (categoria) => {
  if (!categoria || categoria.length === 0) {
    return "";
  }
  return categoria[Math.floor(Math.random() * categoria.length)];
};
