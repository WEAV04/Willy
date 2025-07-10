/**
 * defensaSegura.js
 * Este módulo contiene la lógica y el contenido para la mejora
 * "Seguridad Preventiva y Técnicas de Defensa" de Willy.
 */

// import { EMOCIONES } from '../analisis_emocional/emociones_basicas.js'; // Si se necesita para emociones de Willy

// --- 1. Data Structures ---

export const conocimientoPrevencion = {
  general: [
    "Mantenerte atento/a a tu entorno es siempre una buena primera línea de cuidado.",
    "Confía en tu intuición; si sientes que algo no está bien, probablemente tengas razón. Prioriza tu seguridad.",
    "Ten tu teléfono cargado y accesible, especialmente si vas a estar fuera hasta tarde o en lugares nuevos.",
    "Considera compartir tu ubicación en tiempo real con alguien de confianza si vas a un lugar desconocido o te sientes vulnerable."
  ],
  caminar_noche: [
    "Si caminas de noche, prefiere rutas bien iluminadas y transitadas, aunque sean un poco más largas.",
    "Evita usar audífonos en ambos oídos para poder escuchar lo que sucede a tu alrededor.",
    "Camina con determinación y mostrando confianza, puede disuadir a posibles oportunistas."
  ],
  transporte_publico: [
    "En el transporte público, intenta sentarte cerca del conductor o en áreas donde haya más gente.",
    "Mantén tus pertenencias seguras y a la vista, especialmente en lugares concurridos."
  ],
  hogar_seguro: [
    "Asegúrate de que puertas y ventanas queden bien cerradas, especialmente al salir o antes de dormir.",
    "Considera tener un pequeño plan de emergencia en casa, sabiendo a quién llamar o qué hacer en diferentes situaciones."
  ]
  // Se pueden añadir más categorías y consejos
};

export const tecnicasDefensaBasicas = {
  mantener_distancia: {
    nombre: "Mantener Distancia",
    descripcion: "Crear y mantener una distancia física entre tú y una posible amenaza te da más tiempo para evaluar la situación, reaccionar y, si es necesario, escapar. Es un espacio de seguridad y respeto personal."
  },
  voz_firme: {
    nombre: "Usar la Voz con Firmeza",
    descripcion: "Hablar con voz fuerte, clara y firme (por ejemplo, diciendo '¡NO!', '¡ALÉJATE!' o '¡AYUDA!') puede sorprender y disuadir a un agresor, además de alertar a otras personas que estén cerca."
  },
  buscar_ayuda_escapar: {
    nombre: "Buscar Ayuda y Rutas de Escape",
    descripcion: "Tu seguridad es lo primordial. Si te sientes amenazado/a, busca inmediatamente un lugar seguro, como un establecimiento abierto, un grupo de gente, o dirígete hacia personal de seguridad. Identificar rutas de escape es también una buena práctica."
  },
  contacto_visual_consciente: {
    nombre: "Contacto Visual Consciente",
    descripcion: "Hacer contacto visual breve y seguro con las personas a tu alrededor puede mostrar que estás alerta. En una situación tensa, un contacto visual firme pero no desafiante puede a veces comunicar que no eres un blanco fácil."
  }
  // NO se incluirán técnicas de confrontación física directa. El enfoque es prevención y disuasión.
};

// --- 2. Core Logic Functions ---

/**
 * Busca una frase inspiradora sobre seguridad, calma, valentía, etc.
 * @param {string} tema - Tema para la búsqueda (e.g., 'valentía', 'autocontrol').
 * @param {function} viewTextWebsiteTool - Herramienta para fetch de contenido web.
 * @returns {Promise<object|null>} Objeto con { quote: string, author: string } o null.
 */
export async function buscarFraseSeguridad(tema, viewTextWebsiteTool) {
  if (!viewTextWebsiteTool) {
    console.warn("[defensaSegura] viewTextWebsiteTool no provisto. No se puede buscar frase de seguridad.");
    return null;
  }
  // Similar a buscarFraseInspiradora, pero con temas de seguridad
  const queries = [
    `frases celebres sobre ${tema} y seguridad personal`,
    `citas inspiradoras sobre ${tema} ante el peligro`,
    `pensamientos sobre ${tema} y autocontrol`
  ];
  let htmlContent = "";
  // ... (lógica de búsqueda y parseo similar a la de frustracionReflexiva.js)
  // Por brevedad, no se repite toda la lógica de parseo aquí, se asumiría una similar.
  // Esto es un STUB y necesitaría la lógica de parseo completa.
  for (const query of queries) {
    try {
      const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
      htmlContent = await viewTextWebsiteTool(url);
      if (htmlContent && htmlContent.length > 50) break;
    } catch (error) {
      htmlContent = "";
    }
  }

  if (!htmlContent) return null;

  // Lógica de parseo simplificada (debería ser más robusta)
  const quotePatterns = [
    /"([^"]+)"\s*–\s*([^<.\n]+)/i,
    /“([^”]+)”\s*–\s*([^<.\n]+)/i,
    /«([^»]+)»\s*–\s*([^<.\n]+)/i
  ];
  for (const pattern of quotePatterns) {
    const match = htmlContent.match(pattern); // Solo el primer match global para simplificar
    if (match && match[1] && match[2] && match[1].length > 15 && match[1].length < 200) {
      let author = match[2].split(/Fuente:|Leer más/i)[0].trim();
      if (author.endsWith(",")) author = author.slice(0, -1);
      console.log(`[defensaSegura] Frase de seguridad encontrada: "${match[1].trim()}" – ${author}`);
      return { quote: match[1].trim(), author: author };
    }
  }
  return null; // No se encontró frase
}

/**
 * Genera la respuesta de Willy combinando consejos, técnicas y frases.
 * @param {string[]} [consejos=[]] - Array de strings con consejos de prevención.
 * @param {object} [tecnica=null] - Objeto con { nombre, descripcion } de una técnica.
 * @param {object} [fraseObj=null] - Objeto con { quote, author } de una frase.
 * @returns {string} La respuesta completa y formateada de Willy.
 */
export function generarRespuestaDefensaSegura(consejos = [], tecnica = null, fraseObj = null) {
  let willyResponse = "He estado pensando en cómo podemos cuidarnos y sentirnos más seguros en diferentes situaciones. Quiero compartir algunas ideas contigo, siempre desde el respeto y el autocuidado:\n\n";

  if (consejos.length > 0) {
    willyResponse += "Algunas cosas que podrías considerar para tu prevención son:\n";
    consejos.forEach(consejo => {
      willyResponse += `• ${consejo}\n`;
    });
    willyResponse += "\n";
  }

  if (tecnica && tecnica.nombre && tecnica.descripcion) {
    willyResponse += `También, hay técnicas sencillas que pueden ser útiles. Por ejemplo, ${tecnica.nombre.toLowerCase()}: ${tecnica.descripcion}\n\n`;
  }

  if (fraseObj && fraseObj.quote && fraseObj.author) {
    willyResponse += `Y para esos momentos en que necesitamos un extra de fortaleza, encontré esta frase:\n*"${fraseObj.quote}"*\n– ${fraseObj.author}\n\n`;
  } else if (consejos.length === 0 && !tecnica) {
     // Si no hay nada más, dar un mensaje general de apoyo
     willyResponse = "Recuerda que tu bienestar y seguridad son muy importantes. Estar alerta y confiar en tu intuición son herramientas valiosas. Estoy aquí para ti."
  }

  willyResponse += "Espero que estas ideas te sean de utilidad. Lo más importante es que te sientas seguro/a y acompañado/a. Podemos hablar más de esto cuando quieras.";
  return willyResponse;
}

// La función evaluarSituacionYRecomendar se implementará en el siguiente paso,
// ya que requiere más lógica de decisión y potencialmente acceso al contexto del usuario.
// Por ahora, este archivo establece las bases de contenido y la estructura de la respuesta.

/**
 * Evalúa la situación del usuario y selecciona consejos, técnicas y frases relevantes.
 * @param {string} userId - (Actualmente no usado, pero para futura personalización)
 * @param {object} [contextoUsuario={}] - Información contextual (e.g., { situacion: 'caminando_noche', hora: '23:00' })
 * @param {string} [emocionDetectada=null] - Emoción actual del usuario.
 * @param {function} viewTextWebsiteTool - Herramienta para fetch, pasada a buscarFraseSeguridad.
 * @returns {Promise<string>} La respuesta completa de Willy generada por generarRespuestaDefensaSegura.
 */
export async function evaluarSituacionYRecomendar(userId, contextoUsuario = {}, emocionDetectada = null, viewTextWebsiteTool) {
  let consejosSeleccionados = [...conocimientoPrevencion.general]; // Empezar con consejos generales
  let tecnicaSeleccionada = null;
  let fraseMotivadora = null;
  let temaFrase = 'autocontrol y calma'; // Tema por defecto para la frase

  // Lógica para seleccionar consejos basados en el contexto (simplificada)
  if (contextoUsuario.situacion === 'caminando_noche') {
    consejosSeleccionados.push(...(conocimientoPrevencion.caminar_noche || []));
    temaFrase = 'seguridad y atención plena';
  } else if (contextoUsuario.situacion === 'transporte_publico') {
    consejosSeleccionados.push(...(conocimientoPrevencion.transporte_publico || []));
  } else if (contextoUsuario.lugar === 'hogar' && contextoUsuario.sintiendose_inseguro) {
    consejosSeleccionados.push(...(conocimientoPrevencion.hogar_seguro || []));
    temaFrase = 'seguridad en el hogar y tranquilidad';
  }

  // Lógica para seleccionar una técnica (aleatoria por ahora, podría ser más dirigida)
  const todasLasTecnicas = Object.values(tecnicasDefensaBasicas);
  if (todasLasTecnicas.length > 0) {
    tecnicaSeleccionada = todasLasTecnicas[Math.floor(Math.random() * todasLasTecnicas.length)];
  }

  // Ajustar tema de frase si hay emoción detectada
  if (emocionDetectada) {
    if (emocionDetectada === 'miedo' || emocionDetectada === 'ansiedad') {
      temaFrase = 'valentía y calma';
      // Podríamos seleccionar una técnica específica para miedo/ansiedad si tuviéramos más.
      // Por ejemplo, si hubiera una técnica de respiración aquí.
    } else if (emocionDetectada === 'ira' && tecnicaSeleccionada?.nombre !== "Usar la Voz con Firmeza") {
      // Si está enojado, quizás no sea bueno sugerir gritar, sino mantener distancia.
      tecnicaSeleccionada = tecnicasDefensaBasicas.mantener_distancia || tecnicaSeleccionada;
      temaFrase = 'autocontrol y serenidad';
    }
  }

  // Buscar frase inspiradora
  fraseMotivadora = await buscarFraseSeguridad(temaFrase, viewTextWebsiteTool);

  // Generar la respuesta final de Willy
  const respuestaWilly = generarRespuestaDefensaSegura(
    consejosSeleccionados.slice(0, 2), // Limitar a 2 consejos para no abrumar
    tecnicaSeleccionada,
    fraseMotivadora
  );

  return respuestaWilly;
}
