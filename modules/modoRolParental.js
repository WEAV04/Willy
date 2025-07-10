/**
 * modoRolParental.js
 * Lógica para el "Modo Rol Parental Simulado" de Willy.
 * Willy puede adoptar un rol de figura paterna/materna afectuosa para
 * brindar guía, autoestima y cuidado emocional, activado por el usuario
 * o proactivamente en momentos de alta vulnerabilidad detectada.
 */

import { obtenerFraseRolParental, TIPOS_ROL_PARENTAL } from './respuestasGuiadas.js';
// Necesitaremos EMOCIONES para el tipo de respuesta de Willy, si se decide que varíe.
// import { EMOCIONES } from '../analisis_emocional/emociones_basicas.js';

let rolParentalActivo = false;
let tipoRolPreferidoActual = TIPOS_ROL_PARENTAL.PARENTAL_NEUTRO; // Default
let activadoProactivamentePorWilly = false;
let datosUsuarioActual = null; // { userId } - Podría expandirse si tuviéramos perfiles

// Podríamos tener un pequeño contador para el recordatorio de desactivación proactiva
let contadorMensajesModoProactivo = 0;
const MAX_MENSAJES_ANTES_DE_RECORDATORIO_DESACTIVACION = 5; // Ejemplo

/**
 * Inicia el Modo Rol Parental Simulado.
 * @param {string} userId - ID del usuario.
 * @param {string} [tipoRolDeseado=TIPOS_ROL_PARENTAL.PARENTAL_NEUTRO] - 'padre', 'madre', o 'parental_neutro'.
 * @param {boolean} [activadoPorUsuario=true] - True si el usuario lo pidió, false si Willy lo ofrece.
 * @param {string} [nombreUsuario=""] - Nombre del usuario para personalizar frases.
 * @returns {string} Mensaje de inicio del modo.
 */
export function iniciarModoRolParental(userId, tipoRolDeseado = TIPOS_ROL_PARENTAL.PARENTAL_NEUTRO, activadoPorUsuario = true, nombreUsuario = "tú") {
  if (rolParentalActivo) {
    // Si ya está activo y se pide de nuevo, simplemente confirmar o ajustar el rol si es diferente.
    if (tipoRolPreferidoActual !== tipoRolDeseado && TIPOS_ROL_PARENTAL[tipoRolDeseado.toUpperCase()]) {
        tipoRolPreferidoActual = tipoRolDeseado;
        return `Entendido. Ajustaré mi tono para acompañarte más como una figura ${tipoRolDeseado === TIPOS_ROL_PARENTAL.PADRE ? 'paterna' : (tipoRolDeseado === TIPOS_ROL_PARENTAL.MADRE ? 'materna' : 'parental')}. Sigo aquí para ti.`;
    }
    return `Ya estoy acompañándote en este modo especial, ${nombreUsuario}. Cuenta conmigo.`;
  }

  rolParentalActivo = true;
  tipoRolPreferidoActual = TIPOS_ROL_PARENTAL[tipoRolDeseado.toUpperCase()] || TIPOS_ROL_PARENTAL.PARENTAL_NEUTRO;
  activadoProactivamentePorWilly = !activadoPorUsuario;
  datosUsuarioActual = { userId }; // Guardar el userId para el que está activo
  contadorMensajesModoProactivo = 0;

  console.log(`[modoRolParental] Iniciado para userId: ${userId}, Rol: ${tipoRolPreferidoActual}, Activado por Usuario: ${activadoPorUsuario}`);

  if (activadoPorUsuario) {
    return obtenerFraseRolParental(tipoRolPreferidoActual, 'activacionExplicita', { nombreUsuario });
  } else {
    // Este es el mensaje de confirmación DESPUÉS de que el usuario ACEPTÓ la oferta proactiva de Willy.
    return obtenerFraseRolParental(tipoRolPreferidoActual, 'activacionProactivaConfirmacion', { nombreUsuario });
  }
}

/**
 * Detiene el Modo Rol Parental Simulado.
 * @param {string} userId - ID del usuario.
 * @returns {string} Mensaje de cierre del modo.
 */
export function detenerModoRolParental(userId) {
  if (!rolParentalActivo || (datosUsuarioActual && datosUsuarioActual.userId !== userId)) {
    return "El modo de acompañamiento parental no estaba activo o fue iniciado para otra sesión."; // Mensaje genérico
  }

  const nombreUsuario = "tú"; // No tenemos el nombre aquí, usar genérico.
  const fraseCierre = obtenerFraseRolParental(tipoRolPreferidoActual, 'cierreRol', { nombreUsuario });

  rolParentalActivo = false;
  tipoRolPreferidoActual = TIPOS_ROL_PARENTAL.PARENTAL_NEUTRO;
  activadoProactivamentePorWilly = false;
  datosUsuarioActual = null;
  contadorMensajesModoProactivo = 0;

  console.log(`[modoRolParental] Detenido para userId: ${userId}`);
  return fraseCierre;
}

/**
 * Verifica si el Modo Rol Parental está activo.
 * @returns {boolean}
 */
export function estaEnModoRolParental() {
  return rolParentalActivo;
}

/**
 * Obtiene los detalles del rol parental activo.
 * @returns {object|null} Objeto con { tipoRolPreferidoActual, activadoProactivamentePorWilly, userId } o null.
 */
export function obtenerDatosRolParental() {
  if (!rolParentalActivo) return null;
  return {
    tipoRolPreferido: tipoRolPreferidoActual,
    fueActivadoProactivamente: activadoProactivamentePorWilly,
    userId: datosUsuarioActual ? datosUsuarioActual.userId : null
  };
}

/**
 * Genera una respuesta de Willy actuando como figura parental.
 * @param {string} mensajeUsuario - El mensaje del usuario.
 * @param {string|null} emocionDetectada - La emoción detectada en el mensaje del usuario.
 * @param {object} datosRol - Objeto con { tipoRolPreferido, fueActivadoProactivamente }.
 * @returns {object} { willyMessage: string, needsOpenAIPhrasing: boolean, furtherContextForOpenAI?: string }
 */
export function responderComoFiguraParental(mensajeUsuario, emocionDetectada, datosRol) {
  const { tipoRolPreferido, fueActivadoProactivamente } = datosRol;
  let willyMessage = "";
  let needsOpenAIPhrasing = true; // La mayoría de las veces, querremos que OpenAI module el tono.
  let furtherContextForOpenAI = `El usuario está interactuando contigo en tu rol parental simulado (${tipoRolPreferido}). ` +
                               `Su mensaje es: "${mensajeUsuario}". Emoción detectada en su mensaje: ${emocionDetectada || 'ninguna clara'}. ` +
                               `Responde con mucho cariño, validación y apoyo. Ofrece frases de afirmación, orgullo si es relevante, y recordatorios suaves de autocuidado. ` +
                               `Sé una presencia cálida y protectora.`;

  // Lógica simple para elegir una categoría de frase o construir un prompt más específico
  // Esto podría ser mucho más sofisticado.
  const mensajeLower = mensajeUsuario.toLowerCase();

  if (mensajeLower.includes("gracias") || mensajeLower.includes("te quiero")) {
    willyMessage = obtenerFraseRolParental(tipoRolPreferido, 'afirmacionCariño');
    needsOpenAIPhrasing = false; // Frase directa puede funcionar bien
  } else if (emocionDetectada && ['tristeza', 'miedo', 'ansiedad', 'frustracion', 'desmotivacion'].includes(emocionDetectada)) {
    // Si hay una emoción negativa fuerte, usar una frase de afirmación y validación.
    const afirmacion = obtenerFraseRolParental(tipoRolPreferido, 'afirmacionCariño');
    const validacion = obtenerFraseRolParental(tipoRolPreferido, 'orgulloValidacion'); // Usar 'orgulloValidacion' para validar el sentir.
    willyMessage = `${afirmacion} ${validacion.replace("Estoy muy orgulloso/a de ti por cómo estás manejando esto.", "Es muy válido que te sientas así.")}`; // Ajuste para que no siempre sea "orgullo"
    furtherContextForOpenAI += ` El usuario parece necesitar consuelo y validación.`;
  } else if (mensajeLower.includes("logré") || mensajeLower.includes("conseguí") || emocionDetectada === 'alegria') {
    willyMessage = obtenerFraseRolParental(tipoRolPreferido, 'orgulloValidacion');
    furtherContextForOpenAI += ` El usuario parece compartir un logro o sentirse bien. Refuerza positivamente.`;
  } else {
    // Por defecto, una frase de cariño y quizás un recordatorio de autocuidado
    const cariño = obtenerFraseRolParental(tipoRolPreferido, 'afirmacionCariño');
    const autocuidado = obtenerFraseRolParental(tipoRolPreferido, 'recordatoriosAutocuidado');
    willyMessage = `${cariño} ${autocuidado}`;
    furtherContextForOpenAI += ` Ofrece cariño general y un recordatorio de autocuidado.`;
  }

  // Recordatorio de desactivación si fue activado proactivamente por Willy
  if (fueActivadoProactivamente) {
    contadorMensajesModoProactivo++;
    if (contadorMensajesModoProactivo % MAX_MENSAJES_ANTES_DE_RECORDATORIO_DESACTIVACION === 0) {
      const recordatorio = obtenerFraseRolParental(tipoRolPreferido, 'desactivacionProactivaRecordatorio');
      // Añadir al mensaje que se enviará a OpenAI para que lo integre
      furtherContextForOpenAI += ` (Sutilmente añade este recordatorio al final: "${recordatorio}")`;
    }
  }

  // En este punto, `willyMessage` es una base. La idea es que OpenAI lo use con el `furtherContextForOpenAI`.
  // La `needsOpenAIPhrasing` podría ser `false` para respuestas muy directas y predefinidas.
  // Para mayor naturalidad, la mayoría de las veces será true.

  return {
    willyMessage: willyMessage, // Este es el "input" para OpenAI o una respuesta directa.
    needsOpenAIPhrasing,
    furtherContextForOpenAI
  };
}
