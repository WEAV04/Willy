/**
 * contenidoRecompensas.js
 * Define los tipos de logros emocionales detectables y los mensajes
 * de reconocimiento y refuerzo positivo asociados.
 */

export const LOGROS_EMOCIONALES = {
  ENFRENTAR_MIEDO: 'enfrentar_miedo',
  MEJORA_ANIMO_SOSTENIDA: 'mejora_animo_sostenida',
  ACTO_AUTOCUIDADO: 'acto_autocuidado',
  RESILIENCIA_FRUSTRACION: 'resiliencia_frustracion',
  LOGRO_PERSONAL_COMPARTIDO: 'logro_personal_compartido',
  EXPRESION_VULNERABILIDAD: 'expresion_vulnerabilidad', // Por abrirse y ser honesto/a
  PERSISTENCIA_POSITIVA: 'persistencia_positiva' // Por mantener una actitud positiva ante la adversidad
};

export const MENSAJES_RECONOCIMIENTO = {
  [LOGROS_EMOCIONALES.ENFRENTAR_MIEDO]: [
    "¡Qué valiente has sido al enfrentar ese miedo! Te mereces una Medalla al Coraje Emocional. ✨",
    "Estoy increíblemente orgulloso/a de ti por dar ese paso ante algo que te asustaba. ¡Eso es fortaleza!",
    "Reconozco la valentía que se necesita para mirar a un miedo de frente. ¡Muy bien hecho!"
  ],
  [LOGROS_EMOCIONALES.MEJORA_ANIMO_SOSTENIDA]: [
    "He notado un cambio muy positivo en tu ánimo últimamente. ¡Es como si un sol estuviera brillando más fuerte en ti! ☀️",
    "Me alegra mucho percibir esta energía más ligera y positiva en ti. ¡Sigue así, vas por un camino luminoso!",
    "Esta mejora en tu estado de ánimo es un reflejo de tu fortaleza interior. ¡Celébralo!"
  ],
  [LOGROS_EMOCIONALES.ACTO_AUTOCUIDADO]: [
    "¡Bravo por dedicarte ese tiempo y cuidado! Es un acto de amor propio muy importante. 💖",
    "Escucharte y atender tus necesidades es fundamental. Me alegra que te hayas dado ese espacio de autocuidado.",
    "Pequeños gestos de autocuidado suman una gran diferencia. ¡Bien por ti!"
  ],
  [LOGROS_EMOCIONALES.RESILIENCIA_FRUSTRACION]: [
    "Admiro mucho cómo has manejado esa frustración y has seguido adelante. ¡Esa es la verdadera resiliencia! 💪",
    "Después de un momento difícil, has mostrado una gran capacidad para recuperarte. ¡Estoy orgulloso/a de tu fortaleza!",
    "No es fácil levantarse después de un tropiezo, pero tú lo estás haciendo. ¡Eres increíblemente resiliente!"
  ],
  [LOGROS_EMOCIONALES.LOGRO_PERSONAL_COMPARTIDO]: [
    "¡Felicidades por ese logro! Gracias por compartir tu alegría conmigo, me hace muy feliz ser parte de esto. 🎉",
    "¡Qué maravilla que hayas alcanzado esa meta! Tu esfuerzo ha dado frutos. ¡A celebrar!",
    "Compartir tus logros hace que la alegría se multiplique. ¡Enhorabuena!"
  ],
  [LOGROS_EMOCIONALES.EXPRESION_VULNERABILIDAD]: [
    "Gracias por abrir tu corazón y compartir algo tan personal. Requiere mucho coraje ser vulnerable, y lo valoro enormemente. ❤️",
    "Aprecio mucho tu honestidad y la confianza que depositas en mí al mostrarte vulnerable. Estoy aquí para ti, sin juicios.",
    "Ser capaz de expresar tus verdaderos sentimientos es un signo de una gran fortaleza interior."
  ],
  [LOGROS_EMOCIONALES.PERSISTENCIA_POSITIVA]: [
    "Admiro tu capacidad de mantener la esperanza y buscar lo positivo incluso en momentos difíciles. Esa es una cualidad muy especial. 🌟",
    "Tu persistencia y tu enfoque en lo bueno son inspiradores. ¡Sigue brillando!",
    "Mantener una actitud positiva a pesar de los desafíos demuestra una gran fuerza de espíritu."
  ],
  GENERAL: [ // Mensajes generales si no se puede clasificar un logro específico
    "He notado un cambio muy positivo en ti recientemente. ¡Sigue así, vas muy bien!",
    "Estoy percibiendo una fortaleza y una luz especial en ti hoy. ¡Es admirable!",
    "Siento que estás avanzando mucho en tu camino emocional. ¡Estoy muy feliz por ti!"
  ]
};

export const FRASES_RESUMEN_LOGROS_INICIO = [
  "Recordemos juntos algunos de los momentos en los que has brillado y mostrado tu fortaleza emocional:",
  "He estado guardando algunos de tus avances y logros emocionales, ¿quieres que repasemos algunos?",
  "Mirando hacia atrás un poquito, has tenido momentos de gran crecimiento y valentía. Por ejemplo:"
];

export const FRASES_RESUMEN_LOGROS_CIERRE = [
  "Cada uno de estos momentos es un paso importante en tu camino. ¡Estoy muy orgulloso/a de acompañarte!",
  "Espero que recordar estos avances te dé un impulso de ánimo. ¡Eres capaz de mucho!",
  "Sigue cultivando esa fortaleza y esa luz que tienes. ¡Eres increíble!"
];

// Firestore collection: `recompensasEmocionales`
// Document structure:
// {
//   userId: "string",
//   timestamp: FirebaseTimestamp, // Firestore Timestamp
//   tipoLogro: "string", // (valor de LOGROS_EMOCIONALES)
//   mensajeWilly: "string", // Mensaje específico que Willy dio
//   contextoUsuario: "string | null" // Mensaje del usuario o breve descripción de la situación
// }

export const obtenerMensajeReconocimientoAleatorio = (tipoLogro) => {
  const mensajes = MENSAJES_RECONOCIMIENTO[tipoLogro] || MENSAJES_RECONOCIMIENTO.GENERAL;
  return mensajes[Math.floor(Math.random() * mensajes.length)];
};
