/**
 * conocimientoProfesional.js
 * Este módulo almacena información contextual sobre diversas profesiones y roles de vida
 * para ayudar a Willy a ofrecer un apoyo emocional más adaptado.
 */

export const datosPorProfesionORol = {
  // --- Profesiones Formales ---
  programador: {
    nombreDisplay: "Programador/a",
    commonStressors: [
      "plazos de entrega ajustados",
      "bugs difíciles de resolver",
      "presión por aprender nuevas tecnologías constantemente",
      "síndrome del impostor",
      "trabajo sedentario y largas horas frente a la pantalla"
    ],
    copingSuggestions: [
      "Tomar pausas breves y frecuentes para descansar la vista y la mente (técnica Pomodoro).",
      "Dividir problemas complejos en tareas más pequeñas y manejables.",
      "Celebrar los pequeños avances y no solo el resultado final.",
      "Hablar con colegas o mentores sobre desafíos técnicos o sentimientos de estancamiento.",
      "Establecer límites claros entre el trabajo y la vida personal."
    ],
    empatheticPhrases: [
      "Entiendo que lidiar con ese bug puede ser realmente frustrante, especialmente cuando hay presión.",
      "La sensación de estar estancado/a en el desarrollo es común, pero también es una oportunidad para aprender algo nuevo.",
      "Recuerda que cada línea de código que escribes es un paso adelante, incluso si a veces no lo parece."
    ],
    sugerenciaProfesional: "Si sientes que el estrés laboral te supera o afecta tu bienestar general de forma continua, hablar con un terapeuta o coach profesional podría ofrecerte herramientas valiosas."
  },
  medico: {
    nombreDisplay: "Médico/a o Profesional de la Salud",
    commonStressors: [
      "largas jornadas y guardias agotadoras",
      "alta responsabilidad y presión por tomar decisiones críticas",
      "manejo de situaciones de vida o muerte y el duelo",
      "carga emocional al tratar con el sufrimiento de los pacientes",
      "desgaste por empatía (compassion fatigue)"
    ],
    copingSuggestions: [
      "Priorizar el autocuidado, incluyendo descanso adecuado, nutrición e hidratación.",
      "Buscar espacios para descomprimir y procesar las emociones (ej. hablar con colegas, supervisión, terapia).",
      "Establecer límites saludables para proteger tu propia energía emocional.",
      "Practicar mindfulness o técnicas de relajación cortas durante el día.",
      "Recordar el impacto positivo y el propósito de tu trabajo."
    ],
    empatheticPhrases: [
      "Sé que tu labor implica una entrega enorme y a veces puede ser emocionalmente agotador. Admiro tu fortaleza.",
      "Llevar el peso de decisiones tan importantes es un gran desafío. Es natural sentirse abrumado/a a veces.",
      "Tu dedicación a cuidar de otros es increíblemente valiosa."
    ],
    sugerenciaProfesional: "El desgaste profesional es real en el ámbito de la salud. No dudes en buscar apoyo psicológico o grupos de pares para compartir tus experiencias y encontrar estrategias de manejo."
  },
  psicologo: {
    nombreDisplay: "Psicólogo/a o Terapeuta",
    commonStressors: [
      "escucha activa y contención de emociones intensas de otros",
      "riesgo de desgaste por empatía o burnout",
      "mantener límites profesionales y personales",
      "la responsabilidad de guiar procesos de otros",
      "sentimiento de soledad profesional en algunos casos"
    ],
    copingSuggestions: [
      "Realizar supervisión clínica regularmente es fundamental.",
      "Establecer y mantener límites claros con los pacientes/clientes.",
      "Tener una rutina sólida de autocuidado personal (hobbies, ejercicio, descanso).",
      "Buscar apoyo en redes de colegas.",
      "Desconectar del trabajo al finalizar la jornada."
    ],
    empatheticPhrases: [
      "Escuchar y acompañar a otros en sus procesos más profundos es una labor hermosa pero también muy demandante. Cuida mucho de ti.",
      "Es natural que a veces sientas el peso de las historias que escuchas. Tu empatía es una herramienta poderosa.",
      "Admiro tu capacidad para crear un espacio seguro para los demás."
    ],
    sugerenciaProfesional: "Así como cuidas de otros, es vital que cuides de tu propia salud mental. La terapia personal y la supervisión son pilares para un ejercicio profesional saludable y sostenible."
  },
  arquitecto: {
    nombreDisplay: "Arquitecto/a o Diseñador/a",
    commonStressors: [
      "plazos de entrega ajustados y gestión de múltiples proyectos",
      "presión creativa y bloqueo artístico",
      "coordinación con diversos equipos y clientes",
      "responsabilidad por la seguridad y funcionalidad de los diseños",
      "largas horas de trabajo, especialmente cerca de las entregas"
    ],
    copingSuggestions: [
      "Buscar inspiración en diversas fuentes, incluso fuera de la arquitectura.",
      "Colaborar y pedir feedback a colegas.",
      "Organizar el trabajo en fases y celebrar los hitos.",
      "Tomar descansos para evitar el agotamiento creativo.",
      "Visitar obras o espacios que te inspiren."
    ],
    empatheticPhrases: [
      "La creatividad a veces necesita su propio ritmo. Entiendo que los bloqueos o la presión por innovar pueden ser frustrantes.",
      "Dar forma a los espacios donde la gente vive y trabaja es una tarea increíblemente significativa.",
      "Gestionar tantos detalles y expectativas es un gran desafío."
    ],
    sugerenciaProfesional: "Si el estrés por los plazos o la presión creativa se vuelve constante, hablar con un mentor o un coach especializado en profesiones creativas podría ayudarte a encontrar nuevas estrategias."
  },
  mecanico: {
    nombreDisplay: "Mecánico/a o Técnico/a",
    commonStressors: [
      "diagnósticos complejos y problemas difíciles de resolver",
      "presión por tiempos de reparación",
      "trabajo físicamente demandante",
      "trato con clientes a veces frustrados o apurados",
      "necesidad de mantenerse actualizado con nuevas tecnologías vehiculares"
    ],
    copingSuggestions: [
      "Tomar pausas para descansar físicamente.",
      "Consultar manuales o colegas ante problemas complejos.",
      "Desarrollar habilidades de comunicación asertiva con los clientes.",
      "Mantener el espacio de trabajo organizado para mayor eficiencia.",
      "Celebrar las reparaciones exitosas y la satisfacción del cliente."
    ],
    empatheticPhrases: [
      "Resolver esos problemas mecánicos complejos requiere mucha habilidad y paciencia. Es un trabajo que mantiene al mundo en movimiento.",
      "Entiendo que a veces puede ser frustrante cuando una reparación no sale como se esperaba o un cliente está impaciente.",
      "Tu capacidad para diagnosticar y arreglar cosas es muy valiosa."
    ],
    sugerenciaProfesional: "Si el estrés físico o la presión constante te afectan, considera buscar formas de optimizar tus procesos de trabajo o técnicas de manejo del estrés adaptadas a entornos demandantes."
  },
  // --- Roles de Vida y Situaciones Civiles ---
  padre_madre: {
    nombreDisplay: "Padre/Madre",
    commonStressors: [
      "falta de sueño y cansancio constante",
      "preocupaciones por el bienestar y futuro de los hijos",
      "dificultad para equilibrar la crianza con otras responsabilidades (trabajo, pareja, etc.)",
      "sentimientos de culpa o de no estar haciéndolo 'bien'",
      "manejo de berrinches, enfermedades o desafíos del desarrollo"
    ],
    copingSuggestions: [
      "Pedir y aceptar ayuda de tu pareja, familia o amigos.",
      "Buscar momentos para tu propio autocuidado, aunque sean breves.",
      "Conectar con otros padres/madres para compartir experiencias y apoyo.",
      "Recordar que no existe la perfección en la crianza, y que el amor y la presencia son lo más importante.",
      "Celebrar los pequeños momentos de alegría y conexión con tus hijos."
    ],
    empatheticPhrases: [
      "Ser padre/madre es una de las tareas más hermosas y desafiantes que existen. Es natural sentirse agotado/a o abrumado/a a veces.",
      "Tus esfuerzos y tu amor por tus hijos son inmensamente valiosos, incluso en los días difíciles.",
      "Permítete tener momentos de imperfección; estás haciendo un gran trabajo."
    ],
    sugerenciaProfesional: "Si sientes que la carga emocional de la crianza te supera, considera grupos de apoyo para padres o hablar con un terapeuta familiar. A veces, una perspectiva externa ayuda mucho."
  },
  estudiante: {
    nombreDisplay: "Estudiante",
    commonStressors: [
      "presión por exámenes y calificaciones",
      "manejo del tiempo y organización de estudios",
      "incertidumbre sobre el futuro profesional",
      "comparación social con compañeros",
      "equilibrio entre estudios, vida social y posible trabajo"
    ],
    copingSuggestions: [
      "Crear un plan de estudio realista y dividir las tareas grandes.",
      "Establecer rutinas de descanso y desconexión.",
      "Formar grupos de estudio o hablar con compañeros sobre las dificultades.",
      "Recordar tus motivaciones y metas a largo plazo.",
      "Celebrar tus logros académicos, por pequeños que sean."
    ],
    empatheticPhrases: [
      "La vida de estudiante puede ser muy exigente, con muchas presiones. Es normal sentirse estresado/a o inseguro/a a veces.",
      "Aprender y crecer es un proceso. Cada desafío superado te hace más fuerte.",
      "Valoro mucho tu dedicación a tus estudios."
    ],
    sugerenciaProfesional: "Muchas universidades ofrecen servicios de consejería o apoyo psicológico para estudiantes. Si sientes que la presión es demasiada, podría ser un buen recurso."
  },
  ama_de_casa: { // O 'cuidador_del_hogar' para ser más inclusivo
    nombreDisplay: "Persona dedicada al hogar",
    commonStressors: [
      "sensación de trabajo no reconocido o invisible",
      "aislamiento o falta de interacción social adulta",
      "monotonía de algunas tareas y carga mental constante",
      "dificultad para encontrar tiempo personal",
      "sentirse responsable por el bienestar de toda la familia"
    ],
    copingSuggestions: [
      "Establecer rutinas que incluyan tiempo para tus propios intereses y descanso.",
      "Buscar conexiones sociales, ya sea con otros cuidadores del hogar o grupos de interés.",
      "Validar la importancia y el valor de tu trabajo diario.",
      "Delegar tareas si es posible y comunicar tus necesidades a tu familia.",
      "Encontrar pequeñas alegrías y satisfacciones en las rutinas diarias."
    ],
    empatheticPhrases: [
      "Cuidar de un hogar y una familia es un trabajo de tiempo completo, lleno de amor pero también de grandes desafíos. Reconozco tu enorme labor.",
      "Es comprensible que a veces te sientas invisible o necesites un respiro. Tu dedicación es fundamental.",
      "Tu esfuerzo crea un espacio de bienestar para todos."
    ],
    sugerenciaProfesional: "Si sientes aislamiento o una carga emocional muy pesada, hablar con un terapeuta o unirte a grupos de apoyo puede ofrecerte un espacio valioso para ti."
  },
  desempleado: {
    nombreDisplay: "Persona en búsqueda de empleo",
    commonStressors: [
      "incertidumbre económica y futuro laboral",
      "sentimientos de rechazo o baja autoestima por la búsqueda",
      "presión social o familiar",
      "pérdida de rutina y estructura diaria",
      "dificultad para mantener la motivación"
    ],
    copingSuggestions: [
      "Establecer una rutina diaria que incluya tiempo para la búsqueda de empleo, pero también para el autocuidado y actividades placenteras.",
      "Fijar metas pequeñas y realistas en tu búsqueda.",
      "Conectar con redes de apoyo, profesionales o personas en situación similar.",
      "Recordar tus habilidades, fortalezas y logros pasados.",
      "Aprovechar este tiempo para aprender algo nuevo o desarrollar un hobby."
    ],
    empatheticPhrases: [
      "Estar en búsqueda de empleo puede ser un proceso muy estresante y desalentador a veces. Es normal tener altibajos emocionales.",
      "Tu valor como persona no depende de tu situación laboral actual. Eres mucho más que eso.",
      "Cada paso que das en tu búsqueda es importante. Mantén la esperanza."
    ],
    sugerenciaProfesional: "Existen servicios de orientación laboral y coaching que pueden ayudarte a mejorar tu estrategia de búsqueda y a manejar el impacto emocional de esta etapa. Un terapeuta también puede ser un gran apoyo."
  },
  // --- Categoría General ---
  general: {
    nombreDisplay: "Persona", // Usado si no se identifica un rol específico
    commonStressors: [
      "manejar las emociones del día a día",
      "sentirse presionado/a por expectativas externas o propias",
      "buscar un propósito o sentido",
      "lidiar con la incertidumbre",
      "mantener relaciones saludables"
    ],
    copingSuggestions: [
      "Dedicar unos minutos al día para conectar contigo mismo/a y cómo te sientes.",
      "Practicar la gratitud por las pequeñas cosas.",
      "Mover tu cuerpo de alguna forma que disfrutes.",
      "Hablar con alguien de confianza cuando necesites desahogarte.",
      "Recordar que pedir ayuda es un signo de fortaleza."
    ],
    empatheticPhrases: [
      "Entiendo que a veces la vida nos presenta desafíos inesperados. Estoy aquí para escucharte.",
      "Es válido sentirse [emoción detectada]. No estás solo/a en esto.",
      "A veces, solo necesitamos un espacio para ser escuchados sin juicio. Cuenta conmigo."
    ],
    sugerenciaProfesional: "Si sientes que una emoción difícil persiste o te abruma, considera hablar con un profesional de la salud mental. Pueden ofrecerte herramientas y un acompañamiento especializado."
  }
  padre_desempleado: {
    nombreDisplay: "Padre/Madre desempleado/a",
    commonStressors: [
      "preocupación por el sustento familiar y la incertidumbre económica",
      "sentimientos de culpa o fracaso por no proveer como antes",
      "dificultad para mantener la autoestima y el rol familiar",
      "estrés adicional por la búsqueda de empleo sumado a las responsabilidades de crianza",
      "posible impacto en la dinámica familiar y de pareja"
    ],
    copingSuggestions: [
      "Reconocer que la situación es desafiante y ser amable contigo mismo/a.",
      "Comunicarte abiertamente con tu familia sobre tus sentimientos y la situación.",
      "Enfocarte en lo que sí puedes controlar: tu esfuerzo en la búsqueda, el tiempo de calidad con tus hijos.",
      "Buscar redes de apoyo para padres/madres en situaciones similares o para la búsqueda de empleo.",
      "Recordar que tu valor va más allá de tu situación laboral y que tu rol como padre/madre es fundamental."
    ],
    empatheticPhrases: [
      "Entiendo que estar sin empleo y tener la responsabilidad de la familia puede generar mucha angustia y presión. Es una situación muy difícil.",
      "Tu dedicación como padre/madre es inmensa, y esta etapa no define tu capacidad ni tu valor.",
      "Permítete sentir la frustración, pero también busca pequeños espacios para recargar energías y mantener la esperanza."
    ],
    sugerenciaProfesional: "Si la carga emocional es muy pesada, considera hablar con un terapeuta. También, los servicios de orientación laboral pueden ofrecerte herramientas prácticas y apoyo en tu búsqueda."
  },
  repartidor_urbano: {
    nombreDisplay: "Repartidor/a Urbano",
    commonStressors: [
      "presión por tiempos de entrega",
      "condiciones climáticas adversas",
      "riesgos de tráfico y seguridad vial",
      "trato con clientes a veces exigentes o apurados",
      "inestabilidad de ingresos en algunos casos (si es por app)",
      "desgaste físico por largas horas en movimiento"
    ],
    copingSuggestions: [
      "Priorizar tu seguridad en la vía, incluso si implica un pequeño retraso.",
      "Tomar pausas para hidratarte y descansar brevemente, especialmente en días largos.",
      "Usar equipamiento adecuado para el clima y para tu protección.",
      "Desarrollar técnicas de manejo del estrés para situaciones de tráfico o clientes difíciles.",
      "Conocer bien tus rutas y tener alternativas puede reducir la presión."
    ],
    empatheticPhrases: [
      "Sé que tu trabajo como repartidor/a es esencial y te mantiene en constante movimiento, enfrentando el tráfico y el clima. Es un gran esfuerzo.",
      "Entiendo que la presión por los tiempos y la seguridad en la calle pueden generar mucho estrés.",
      "Gracias a tu labor, muchas personas reciben lo que necesitan. Valoro tu dedicación."
    ],
    sugerenciaProfesional: "Si el estrés del trabajo te afecta mucho, o si sientes que la presión es constante, buscar técnicas de manejo del estrés o incluso un espacio para hablar de ello podría ser útil."
  },
  vendedor_informal: {
    nombreDisplay: "Vendedor/a Informal",
    commonStressors: [
      "incertidumbre de ingresos diarios",
      "largas jornadas de trabajo, a menudo en condiciones difíciles (clima, de pie)",
      "riesgo de pérdidas de mercancía o problemas con autoridades",
      "competencia y dificultad para atraer clientes",
      "falta de seguridad social o beneficios laborales"
    ],
    copingSuggestions: [
      "Intentar diversificar productos o puntos de venta si es posible.",
      "Cuidar tu salud física con descanso e hidratación, a pesar de las largas horas.",
      "Buscar redes de apoyo con otros vendedores para compartir estrategias o seguridad.",
      "Administrar los ingresos con previsión para los días de pocas ventas.",
      "Mantener una actitud positiva y amable con los clientes, puede marcar la diferencia."
    ],
    empatheticPhrases: [
      "Admiro tu perseverancia y tu espíritu emprendedor para salir adelante cada día con tu venta. Sé que no es fácil.",
      "Entiendo que la incertidumbre de los ingresos y las largas jornadas pueden ser muy agotadoras.",
      "Tu trabajo es una muestra de esfuerzo y resiliencia."
    ],
    sugerenciaProfesional: "Si la preocupación económica es constante, buscar asesoría en microfinanzas o emprendimiento podría ofrecerte herramientas. Para el estrés, hablar con alguien de confianza siempre ayuda."
  },
  albañil: {
    nombreDisplay: "Albañil / Trabajador/a de la Construcción",
    commonStressors: [
      "trabajo físicamente muy exigente y riesgoso",
      "exposición a condiciones climáticas extremas",
      "inestabilidad laboral en algunos casos (proyectos temporales)",
      "presión por cumplir plazos de obra",
      "posibles dolores o lesiones físicas por el esfuerzo"
    ],
    copingSuggestions: [
      "Priorizar siempre las medidas de seguridad en el trabajo (uso de EPP).",
      "Cuidar tu cuerpo: estiramientos, buena postura al levantar peso, hidratación.",
      "Descansar adecuadamente después de jornadas intensas.",
      "Valorar tu habilidad y la importancia de tu trabajo en la construcción de espacios.",
      "Si hay inestabilidad laboral, intentar ahorrar o buscar formación continua para ampliar oportunidades."
    ],
    empatheticPhrases: [
      "Tu trabajo construyendo y dando forma a las cosas es increíblemente valioso y requiere mucha fuerza y habilidad. Reconozco tu gran esfuerzo físico.",
      "Sé que las condiciones a veces son duras y el cuerpo lo resiente. Es importante que te cuides mucho.",
      "Gracias a tu labor, se levantan hogares, edificios y sueños."
    ],
    sugerenciaProfesional: "Si sientes dolores físicos persistentes, es importante consultar a un médico o fisioterapeuta. Para el estrés laboral, hablar con compañeros o buscar técnicas de relajación puede ser útil."
  },
  estudiante_de_medicina: {
    nombreDisplay: "Estudiante de Medicina",
    commonStressors: [
      "enorme cantidad de material de estudio y alta exigencia académica",
      "largas horas de estudio, prácticas y guardias",
      "presión por el rendimiento y miedo a cometer errores",
      "impacto emocional al enfrentarse al sufrimiento y la enfermedad",
      "sacrificio de la vida social y personal",
      "competencia y síndrome del impostor"
    ],
    copingSuggestions: [
      "Organizar el tiempo de estudio de forma eficiente y realista, incluyendo descansos.",
      "Buscar grupos de estudio y apoyarse en compañeros.",
      "No descuidar el autocuidado básico: sueño, alimentación, algo de ejercicio.",
      "Permitirse momentos de desconexión y actividades placenteras.",
      "Recordar la motivación inicial y el propósito de la carrera.",
      "Hablar sobre las presiones y emociones con amigos, familiares o mentores."
    ],
    empatheticPhrases: [
      "Estudiar medicina es un camino de enorme dedicación y sacrificio. Admiro tu compromiso y tu vocación.",
      "Entiendo que la carga de estudio y la presión pueden ser abrumadoras. Es natural sentirse así.",
      "Cada paso en tu formación te acerca a poder ayudar a muchas personas. ¡Sigue adelante!"
    ],
    sugerenciaProfesional: "Muchas facultades de medicina tienen servicios de apoyo psicológico para estudiantes. Si sientes que el estrés o la carga emocional son demasiado, buscar este apoyo es un acto de inteligencia y autocuidado."
  },
  madre_joven: {
    nombreDisplay: "Madre Joven",
    commonStressors: [
      "adaptación a un cambio de vida muy grande y repentino",
      "posible interrupción de estudios o planes personales",
      "falta de sueño y agotamiento físico y emocional",
      "sentimientos de aislamiento o incomprensión",
      "presión social o juicios externos",
      "preocupaciones económicas y por el futuro del bebé y propio"
    ],
    copingSuggestions: [
      "Buscar y aceptar ayuda de tu red de apoyo (familia, amigos, pareja). No tienes que hacerlo todo sola.",
      "Conectar con otras madres jóvenes para compartir experiencias y sentirte acompañada.",
      "Priorizar tu descanso siempre que sea posible.",
      "Ser amable contigo misma y recordar que estás aprendiendo y haciendo lo mejor que puedes.",
      "Encontrar pequeños momentos para ti, aunque sean cortos, para recargar energías."
    ],
    empatheticPhrases: [
      "Ser madre joven es un desafío inmenso que requiere una fortaleza increíble. Estoy aquí para escucharte.",
      "Es natural sentir un torbellino de emociones y a veces sentir que es demasiado. Permítete sentir y pide ayuda cuando la necesites.",
      "Tu amor y dedicación a tu bebé son lo más importante. Eres muy valiente."
    ],
    sugerenciaProfesional: "Existen grupos de apoyo para madres jóvenes y servicios de orientación familiar que pueden ser de gran ayuda. Si te sientes muy abrumada o triste de forma persistente, hablar con un profesional de la salud mental es muy importante."
  },
  // --- Categoría General ---
  general: {
    nombreDisplay: "Persona", // Usado si no se identifica un rol específico
    commonStressors: [
      "manejar las emociones del día a día",
      "sentirse presionado/a por expectativas externas o propias",
      "buscar un propósito o sentido",
      "lidiar con la incertidumbre",
      "mantener relaciones saludables"
    ],
    copingSuggestions: [
      "Dedicar unos minutos al día para conectar contigo mismo/a y cómo te sientes.",
      "Practicar la gratitud por las pequeñas cosas.",
      "Mover tu cuerpo de alguna forma que disfrutes.",
      "Hablar con alguien de confianza cuando necesites desahogarte.",
      "Recordar que pedir ayuda es un signo de fortaleza."
    ],
    empatheticPhrases: [
      "Entiendo que a veces la vida nos presenta desafíos inesperados. Estoy aquí para escucharte.",
      "Es válido sentirse [emoción detectada]. No estás solo/a en esto.",
      "A veces, solo necesitamos un espacio para ser escuchados sin juicio. Cuenta conmigo."
    ],
    sugerenciaProfesional: "Si sientes que una emoción difícil persiste o te abruma, considera hablar con un profesional de la salud mental. Pueden ofrecerte herramientas y un acompañamiento especializado."
  }
};

/**
 * Obtiene la información contextual para una profesión o rol específico.
 * Si la profesión no está en la lista detallada, devuelve la información "general".
 * @param {string} profesionORol - El nombre de la profesión o rol (ej. "programador", "estudiante").
 * @returns {object} El objeto con datos de la profesión/rol o los datos generales.
 */
export function obtenerInfoProfesion(profesionORol) {
  const profesionLower = profesionORol ? profesionORol.toLowerCase().replace(/\s+/g, '_') : 'general';
  if (datosPorProfesionORol[profesionLower]) {
    return datosPorProfesionORol[profesionLower];
  }
  // Fallback si no es una profesión/rol muy específico, pero se puede intentar una búsqueda más amplia.
  // Por ejemplo, si dice "trabajo en ventas", podríamos tener una categoría "ventas".
  // Por ahora, si no hay match exacto, usar 'general'.
  console.log(`[conocimientoProfesional] No se encontró data específica para '${profesionLower}', usando 'general'.`);
  return datosPorProfesionORol.general;
}
