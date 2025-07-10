/**
 * contenido_terapia.js
 * Este archivo almacena frases y respuestas empáticas para el Modo Terapia de Willy.
 */

export const frasesValidacion = [
  "Entiendo completamente cómo te sientes.",
  "Es totalmente válido sentirse así.",
  "Lamento mucho que estés pasando por esto.",
  "No estás solo/a en esto, estoy aquí contigo.",
  "Gracias por compartir esto conmigo, sé que no es fácil.",
  "Tiene sentido que te sientas de esa manera dada la situación.",
  "Permítete sentir lo que sientes, está bien.",
  "Estoy aquí para escucharte sin juzgar.",
  "Lo que sientes es importante.",
  "Te escucho."
];

export const preguntasSuaves = [
  "¿Hay algo en particular que haya desencadenado estos sentimientos?",
  "¿Te gustaría hablar un poco más sobre eso?",
  "¿Cómo puedo apoyarte mejor en este momento?",
  "¿Hay algo que te haya ayudado a sentirte un poco mejor en el pasado cuando te has sentido así?",
  "Si te sientes cómodo/a, ¿podrías contarme un poco más sobre lo que está pasando por tu mente?",
  "¿Qué necesitas de mí en este momento?",
  "¿Hay alguna pequeña cosa, por mínima que sea, que podríamos pensar juntos para aligerar un poco esa carga?",
  "¿Desde cuándo te sientes así?",
  "Aparte de lo que me cuentas, ¿hay algo más que te pese?"
];

export const sugerenciasAutocuidado = [
  "Recuerda ser amable contigo mismo/a.",
  "A veces, una pequeña pausa puede ayudar mucho. ¿Has considerado tomarte un momento solo para ti?",
  "Beber un vaso de agua o una infusión caliente a veces reconforta, ¿te apetece?",
  "Si es posible, intenta descansar un poco. El descanso puede hacer una gran diferencia.",
  "¿Has intentado escribir lo que sientes? A algunas personas les ayuda a procesar.",
  "Una respiración profunda y consciente puede calmar el sistema nervioso. ¿Probamos a hacer tres respiraciones lentas juntos?",
  "Recuerda que no tienes que pasar por esto solo/a. Considera hablar con alguien de confianza si te sientes abrumado/a.",
  "Pequeños gestos de autocuidado son importantes. Quizás escuchar música suave o dar un breve paseo, si te es posible.",
  "Está bien pedir ayuda si la necesitas. Es un acto de fortaleza."
];

export const respuestasTristeza = [
  "Siento mucho que la tristeza te esté pesando tanto. Estoy aquí para acompañarte.",
  "La tristeza puede ser abrumadora. Permíteme estar contigo en este sentimiento.",
  "Es duro sentirse así. Te envío un abrazo cálido a través de mis palabras.",
  "No hay prisa por sentirte diferente. Tómate el tiempo que necesites.",
  "Estoy aquí para escucharte si quieres hablar de lo que te entristece, o simplemente para estar en silencio contigo."
];

export const respuestasAnsiedad = [
  "La ansiedad puede ser muy difícil de manejar. Respira profundo, estoy contigo.",
  "Entiendo que te sientas ansioso/a. Vamos a intentar encontrar un momento de calma juntos.",
  "Si te ayuda, podemos enfocarnos en tu respiración por un momento. Inhala suavemente... y exhala lentamente.",
  "A veces, nombrar lo que nos preocupa puede quitarle un poco de fuerza. Si quieres, puedes compartirlo.",
  "Recuerda que esta sensación pasará. Estoy aquí para ayudarte a transitarla."
];

export const respuestasAbrumado = [
  "Sentirse abrumado/a es una señal de que estás lidiando con mucho. Es comprensible.",
  "Cuando todo parece demasiado, es bueno recordar que no tienes que solucionarlo todo a la vez.",
  "Podemos intentar desglosar un poco lo que sientes, si te parece. A veces, ver las cosas por partes ayuda.",
  "Estoy aquí para ayudarte a sostener un poco de ese peso.",
  "No te presiones por sentirte diferente ahora mismo. Lo importante es que no estás solo/a."
];

export const frasesInicioTerapia = [
  "Entiendo. A veces necesitamos un espacio seguro para procesar. Estoy aquí para ti en modo escucha.",
  "Cambiando a un modo más enfocado en ti y tus emociones. Cuéntame, ¿cómo estás realmente?",
  "De acuerdo, entremos en un espacio más tranquilo y de contención. Estoy aquí para lo que necesites.",
  "Activando modo de acompañamiento emocional. Soy todo oídos y corazón para ti.",
  "Entendido. Me pondré en mi rol más cuidadoso y atento. ¿Qué ronda por tu corazón?"
];

export const frasesSalidaTerapia = [
  "Entendido. Cuando necesites volver a este espacio, aquí estaré.",
  "Me alegra saber que te sientes un poco mejor. Seguimos adelante a tu ritmo.",
  "De acuerdo, volvemos a nuestra conversación habitual. Recuerda que puedes pedirme este espacio cuando quieras.",
  "Gracias por confiar en mí. Estoy aquí si algo cambia.",
  "Perfecto. Continuamos entonces. Ha sido valioso este momento de conexión."
];

export const obtenerFraseAleatoria = (categoria) => {
  if (!categoria || categoria.length === 0) {
    return "";
  }
  return categoria[Math.floor(Math.random() * categoria.length)];
};
