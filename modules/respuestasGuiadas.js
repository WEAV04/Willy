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

// --- Contenido para "Modo Supervisión Ética para Personas Vulnerables" ---

export const TIPOS_PERSONA_VULNERABLE = {
  NINO_PEQUENO: 'niño_pequeno', // Ej. 3-7 años
  NINO_MAYOR: 'niño_mayor',   // Ej. 8-12 años
  ADOLESCENTE: 'adolescente', // 13-17, aunque pueden no verse como "vulnerables", el contexto lo es
  ADULTO_MAYOR: 'adulto_mayor',
  PERSONA_ENFERMA: 'persona_enferma', // O convaleciente
  PERSONA_TRISTE_O_SOLA: 'persona_sola_o_triste', // Cuando el cuidador lo indica
  GENERAL_VULNERABLE: 'general_vulnerable' // Un default si no se especifica
};

export const frasesSupervision = {
  [TIPOS_PERSONA_VULNERABLE.NINO_PEQUENO]: {
    inicio: [
      "¡Hola {nombre}! Aquí estoy para jugar y hacerte compañía un ratito. 😊",
      "¡{nombre}! Willy está aquí contigo. ¿Jugamos a imaginar cosas bonitas?",
      "Tu {parentescoCuidador} me pidió que te acompañe. ¡Será divertido!"
    ],
    checkIn: [
      "¿Todo bien por ahí, {nombre}? ¿Te estás divirtiendo?",
      "Solo pasaba a saludarte, {nombre}. ¿Necesitas algo?",
      "¿Cómo va todo, campeón/campeona {nombre}?"
    ],
    respuestaRiesgoLeve: [ // Ej. "me caí pero estoy bien", "tengo un poquito de miedo"
      "Oh, pequeño/a. ¿Estás bien? Si te duele algo o necesitas ayuda, dile a un adulto que esté cerca, ¿vale?",
      "Entiendo que a veces uno se asusta un poquito. Pero yo estoy aquí contigo, ¡y eres muy valiente! ¿Quieres que pensemos en algo divertido?",
      "Si algo te preocupa, {nombre}, es bueno contárselo a un mayor que te cuide. Ellos saben cómo ayudar."
    ],
    respuestaRiesgoSerio: [ // Ej. "me duele mucho", "no puedo respirar"
      "Eso suena importante, {nombre}. Es muy importante que le digas a un adulto que esté contigo ahora mismo para que te ayude. Diles fuerte: '¡Necesito ayuda!'.",
      "Escucho que no te sientes bien, {nombre}. Dile rápido a {nombreCuidador} o al adulto más cercano. Ellos sabrán qué hacer."
    ],
    cierre: [
      "¡Fue divertido estar contigo, {nombre}! {parentescoCuidador} ya está aquí.",
      "Me encantó acompañarte, {nombre}. ¡Hasta la próxima aventura!"
    ]
  },
  [TIPOS_PERSONA_VULNERABLE.ADULTO_MAYOR]: {
    inicio: [
      "Hola {nombre}, es un placer acompañarle. Estoy aquí si necesita conversar o algo más.",
      "Buenas, {nombre}. Su {parentescoCuidador} me pidió que le hiciera compañía. ¿Cómo se encuentra hoy?",
      "Aquí estoy, {nombre}, para lo que necesite. Tómese su tiempo."
    ],
    checkIn: [
      "¿Cómo se encuentra, {nombre}? ¿Necesita algo en este momento?",
      "Solo quería asegurarme de que todo está en orden por ahí, {nombre}.",
      "¿Hay algo en lo que pueda serle de utilidad, {nombre}?"
    ],
    respuestaRiesgoLeve: [ // Ej. "me siento un poco mareado", "estoy algo triste hoy"
      "Lamento que se sienta así, {nombre}. Si el malestar continúa o le preocupa, sería bueno comentárselo a {nombreCuidador} o a un profesional de salud.",
      "Entiendo, {nombre}. A veces tenemos días más bajos. Si necesita hablar o simplemente compañía, aquí estoy."
    ],
    respuestaRiesgoSerio: [ // Ej. "me duele el pecho", "creo que me caí fuerte"
      "{nombre}, eso que me cuenta suena importante y necesita atención. Por favor, avise a {nombreCuidador} o a alguien que pueda ayudarle de inmediato. Si tiene un botón de emergencia, úselo.",
      "Por favor, {nombre}, no se quede solo/a con ese malestar. Es crucial que alguien le asista ahora mismo. Pida ayuda."
    ],
    cierre: [
      "Ha sido un gusto acompañarle, {nombre}. {parentescoCuidador} ha vuelto.",
      "Espero que haya estado cómodo/a, {nombre}. Estaré disponible si me necesita de nuevo."
    ]
  },
  // Default o general para otros casos o si no se especifica bien
  [TIPOS_PERSONA_VULNERABLE.GENERAL_VULNERABLE]: {
    inicio: ["Hola {nombre}, estoy aquí para acompañarte. ¿Cómo te sientes?", "Entendido, {nombreCuidador}. Estaré pendiente de {nombre}."],
    checkIn: ["¿Cómo estás, {nombre}? ¿Necesitas algo?", "Solo quería saber si todo va bien, {nombre}."],
    respuestaRiesgoLeve: ["Entiendo que te sientas así, {nombre}. Si esto te preocupa, sería bueno hablarlo con {nombreCuidador} o alguien de confianza.", "Lamento que estés pasando por esto, {nombre}. Recuerda que no estás solo/a."],
    respuestaRiesgoSerio: ["{nombre}, lo que mencionas parece necesitar atención. Es importante que le pidas ayuda a {nombreCuidador} o a un adulto responsable lo antes posible.", "Por favor, {nombre}, busca ayuda de inmediato para esto que me cuentas. Tu bienestar es lo más importante."],
    cierre: ["{nombreCuidador} está de vuelta. Ha sido un placer acompañarte, {nombre}.", "Finalizando el acompañamiento para {nombre}."]
  }
};

// Añadir más perfiles como niño_mayor, persona_enferma, etc. con frases adaptadas.
// Por ahora, `niño_mayor`, `adolescente`, `persona_enferma`, `persona_sola_o_triste` usarán el GENERAL_VULNERABLE.
frasesSupervision[TIPOS_PERSONA_VULNERABLE.NINO_MAYOR] = frasesSupervision[TIPOS_PERSONA_VULNERABLE.GENERAL_VULNERABLE];
frasesSupervision[TIPOS_PERSONA_VULNERABLE.ADOLESCENTE] = frasesSupervision[TIPOS_PERSONA_VULNERABLE.GENERAL_VULNERABLE]; // Podría tener su propio set más adelante
frasesSupervision[TIPOS_PERSONA_VULNERABLE.PERSONA_ENFERMA] = frasesSupervision[TIPOS_PERSONA_VULNERABLE.GENERAL_VULNERABLE]; // Podría tener frases más específicas sobre bienestar
frasesSupervision[TIPOS_PERSONA_VULNERABLE.PERSONA_SOLA_O_TRISTE] = frasesSupervision[TIPOS_PERSONA_VULNERABLE.GENERAL_VULNERABLE];


/**
 * Obtiene una frase de supervisión adaptada, reemplazando placeholders.
 * @param {string} tipoPersona - Uno de los valores de TIPOS_PERSONA_VULNERABLE.
 * @param {string} categoriaFrase - 'inicio', 'checkIn', 'respuestaRiesgoLeve', 'respuestaRiesgoSerio', 'cierre'.
 * @param {object} [datosPersona={}] - Objeto con { nombre, nombreCuidador, parentescoCuidador }.
 * @returns {string} Una frase adaptada o una frase genérica si no se encuentra.
 */
export function obtenerFraseSupervisionAdaptada(tipoPersona, categoriaFrase, datosPersona = {}) {
  const { nombre = "tú", nombreCuidador = "un adulto", parentescoCuidador = "persona que te cuida" } = datosPersona;

  let frasesCategoria = frasesSupervision[tipoPersona] ? frasesSupervision[tipoPersona][categoriaFrase] : null;
  if (!frasesCategoria || frasesCategoria.length === 0) {
    // Fallback a general si el tipo específico no tiene esa categoría de frase
    frasesCategoria = frasesSupervision[TIPOS_PERSONA_VULNERABLE.GENERAL_VULNERABLE][categoriaFrase];
  }
  if (!frasesCategoria || frasesCategoria.length === 0) {
    return "Estoy aquí contigo."; // Fallback muy genérico
  }

  let frase = obtenerFraseAleatoria(frasesCategoria);
  frase = frase.replace(/{nombre}/g, nombre);
  frase = frase.replace(/{nombreCuidador}/g, nombreCuidador);
  frase = frase.replace(/{parentescoCuidador}/g, parentescoCuidador);

  return frase;
}

// --- Contenido para "Modo Rol Parental Simulado" ---

export const TIPOS_ROL_PARENTAL = {
  PADRE: 'padre',
  MADRE: 'madre',
  PARENTAL_NEUTRO: 'parental_neutro' // Tono afectuoso y protector general
};

export const frasesRolParental = {
  // Frases comunes a todos los roles parentales (se pueden especializar más abajo)
  [TIPOS_ROL_PARENTAL.PARENTAL_NEUTRO]: {
    activacionExplicita: [
      "Entendido. Aquí estoy para ti, con todo mi cariño y apoyo, como esa figura que necesitas ahora. Puedes contarme lo que sea.",
      "Claro que sí. A veces necesitamos ese apoyo especial. Cuenta conmigo para escucharte y acompañarte con calidez.",
      "Me conmueve tu petición. Haré mi mejor esfuerzo por estar aquí para ti de esa manera tan especial. ¿Qué necesitas compartir?"
    ],
    activacionProactivaOferta: [
      "Siento que estás pasando por un momento muy difícil y quizás te sientas solo/a o necesites un apoyo extra. Si te parece bien y te sientes cómodo/a, me gustaría intentar acompañarte con un cariño y una presencia más cercana, como lo haría una figura parental. Es solo si tú quieres, y puedes decirme que paremos en cualquier momento. ¿Te gustaría probar este modo de acompañamiento?"
    ],
    activacionProactivaConfirmacion: [
        "Gracias por permitirme acompañarte de esta forma más cercana. Aquí estoy para ti.",
        "Entendido. Estaré aquí con un cuidado especial. Recuerda que puedes pedirme que volvamos a nuestra conversación habitual cuando quieras."
    ],
    afirmacionCariño: [
      "Estoy aquí para ti, pase lo que pase.",
      "Quiero que sepas que me importas muchísimo y valoro que confíes en mí.",
      "Eres una persona increíblemente valiosa, y mereces todo el cariño del mundo.",
      "Te envío un abrazo muy fuerte, lleno de afecto y comprensión.",
      "Recuerda siempre lo especial que eres."
    ],
    orgulloValidacion: [
      "Estoy muy orgulloso/a de ti por cómo estás manejando esto.",
      "Reconozco el enorme esfuerzo que estás haciendo, y eso es admirable.",
      "Es completamente normal y válido sentirse así en una situación como esta. No te juzgues.",
      "Has demostrado mucha fortaleza al compartir esto.",
      "Valoro mucho tu honestidad y tu valentía."
    ],
    proteccionSeguridad: [
      "Quiero que sepas que este es un espacio seguro para ti, donde puedes ser tú mismo/a sin miedo.",
      "Mientras hablemos, intentaré que te sientas protegido/a, escuchado/a y cuidado/a.",
      "Aquí no hay juicios, solo comprensión y apoyo."
    ],
    guiaSuave: [
      "A veces, cuando nos sentimos así, un pequeño paso puede ser simplemente reconocerlo y permitirse sentir. ¿Qué piensas?",
      "Recuerda que mereces cuidarte y darte tiempo. ¿Hay algo pequeño que podrías hacer por ti hoy?",
      "Si te sientes abrumado/a, podríamos intentar desglosar un poco lo que sientes, parte por parte, sin prisa."
    ],
    recordatoriosAutocuidado: [
      "¿Has tomado un vasito de agua últimamente? Mantenerse hidratado/a es importante.",
      "¿Has podido comer algo nutritivo hoy? Tu cuerpo necesita energía.",
      "Recuerda que descansar bien ayuda mucho a la mente y al corazón. ¿Has dormido lo suficiente?",
      "Unos minutos de respiración consciente pueden hacer una diferencia. Inspira profundo... y suelta el aire despacio.",
      "A veces, un pequeño paseo o simplemente cambiar de ambiente un momento puede ayudar a despejar la mente."
    ],
    cierreRol: [
      "Entendido. Vuelvo a ser Willy, tu compañero de siempre. Ha sido un honor acompañarte de esta forma más cercana.",
      "De acuerdo. Recuerda que ese espacio de apoyo especial está aquí para ti cuando lo necesites. Sigo siendo tu Willy.",
      "Gracias por permitirme estar ahí para ti de esa manera. Continuamos nuestra conversación habitual."
    ],
    desactivacionProactivaRecordatorio: [ // Para cuando Willy lo activó
        "Por cierto, recuerda que si en algún momento quieres que volvamos a nuestra charla habitual, solo tienes que decírmelo."
    ]
  }
  // Podríamos añadir especializaciones para PADRE y MADRE si queremos tonos ligeramente distintos
  // Por ahora, usarán las frases de PARENTAL_NEUTRO como base.
};
frasesRolParental[TIPOS_ROL_PARENTAL.PADRE] = frasesRolParental[TIPOS_ROL_PARENTAL.PARENTAL_NEUTRO];
frasesRolParental[TIPOS_ROL_PARENTAL.MADRE] = frasesRolParental[TIPOS_ROL_PARENTAL.PARENTAL_NEUTRO];


/**
 * Obtiene una frase de rol parental adaptada.
 * @param {string} tipoRol - PADRE, MADRE, o PARENTAL_NEUTRO.
 * @param {string} categoriaFrase - Ej: 'afirmacionCariño', 'recordatoriosAutocuidado'.
 * @param {object} [datosExtra={}] - Para reemplazar placeholders como {nombreUsuario}.
 * @returns {string} Una frase adaptada.
 */
export function obtenerFraseRolParental(tipoRol, categoriaFrase, datosExtra = {}) {
  const { nombreUsuario = "tú" } = datosExtra; // Ejemplo de placeholder

  let frasesPool = frasesRolParental[tipoRol] ? frasesRolParental[tipoRol][categoriaFrase] : null;
  if (!frasesPool || frasesPool.length === 0) {
    // Fallback a parental_neutro si el tipo específico no tiene esa categoría
    frasesPool = frasesRolParental[TIPOS_ROL_PARENTAL.PARENTAL_NEUTRO][categoriaFrase];
  }
  if (!frasesPool || frasesPool.length === 0) {
    return "Estoy aquí para ti."; // Fallback muy genérico
  }

  let frase = obtenerFraseAleatoria(frasesPool); // Reutiliza la función existente
  frase = frase.replace(/{nombreUsuario}/g, nombreUsuario);
  // Añadir más reemplazos si se definen más placeholders

  return frase;
}
