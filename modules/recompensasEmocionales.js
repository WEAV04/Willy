/**
 * recompensasEmocionales.js
 * Lógica para el sistema de recompensas emocionales y refuerzo positivo.
 */

import {
  getFirestore,
  collection,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  Timestamp
} from "firebase/firestore";
import { initializeApp } from "firebase/app"; // Necesario si db no se pasa como parámetro
import { firebaseConfig } from "../firebaseConfig.js"; // Ajustar ruta
import { LOGROS_EMOCIONALES } from './contenidoRecompensas.js'; // Para usar los tipos de logro

// --- Inicialización de Firebase (considerar centralizarla si no se ha hecho) ---
// Esta es una forma de asegurar que db esté disponible.
// Si ya tienes una instancia 'db' exportada desde firestoreService.js u otro lugar,
// sería mejor importarla para evitar múltiples inicializaciones.
let db;
try {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
} catch (e) {
  // Podría ya estar inicializada, intentar obtener la instancia existente.
  // Esto es una simplificación; una app real usaría un singleton o pasaría 'db'.
  if (e.code === 'duplicate-app') {
    db = getFirestore();
  } else {
    console.error("Error inicializando Firebase en recompensasEmocionales.js:", e);
    // Lanzar el error o manejarlo de forma que el módulo no falle completamente si db no está disponible.
    // Por ahora, las funciones fallarán si db no está.
  }
}
const RECOMPENSAS_COLLECTION = "recompensasEmocionales";

/**
 * Guarda un reconocimiento emocional en Firestore.
 * @param {object} data - Datos del reconocimiento.
 * @param {string} data.userId - ID del usuario.
 * @param {string} data.tipoLogro - Tipo de logro (de LOGROS_EMOCIONALES).
 * @param {string} data.mensajeWilly - Mensaje de reconocimiento que dio Willy.
 * @param {string} [data.contextoUsuario=""] - Mensaje o contexto del usuario que disparó el reconocimiento.
 * @returns {Promise<string|null>} El ID del documento guardado o null si hay error.
 */
export async function guardarReconocimiento(data) {
  if (!db) {
    console.error("[recompensasEmocionales] Firestore DB no está inicializado.");
    return null;
  }
  try {
    const reconocimientoData = {
      userId: data.userId,
      timestamp: Timestamp.fromDate(new Date()),
      tipoLogro: data.tipoLogro,
      mensajeWilly: data.mensajeWilly,
      contextoUsuario: data.contextoUsuario || ""
    };
    const docRef = await addDoc(collection(db, RECOMPENSAS_COLLECTION), reconocimientoData);
    console.log(`[recompensasEmocionales] Reconocimiento guardado con ID: ${docRef.id}`);
    return docRef.id;
  } catch (error) {
    console.error("[recompensasEmocionales] Error al guardar reconocimiento:", error);
    return null;
  }
}

/**
 * Obtiene los reconocimientos recientes para un usuario.
 * @param {string} userId - ID del usuario.
 * @param {number} [limite=5] - Número máximo de reconocimientos a obtener.
 * @returns {Promise<object[]>} Array de objetos de reconocimiento.
 */
export async function obtenerReconocimientosRecientes(userId, limite = 5) {
  if (!db) {
    console.error("[recompensasEmocionales] Firestore DB no está inicializado.");
    return [];
  }
  try {
    const q = query(
      collection(db, RECOMPENSAS_COLLECTION),
      where("userId", "==", userId),
      orderBy("timestamp", "desc"),
      limit(limite)
    );
    const querySnapshot = await getDocs(q);
    const reconocimientos = [];
    querySnapshot.forEach((doc) => {
      reconocimientos.push({ id: doc.id, ...doc.data() });
    });
    console.log(`[recompensasEmocionales] Obtenidos ${reconocimientos.length} reconocimientos recientes.`);
    return reconocimientos; // Más recientes primero
  } catch (error) {
    console.error("[recompensasEmocionales] Error al obtener reconocimientos recientes:", error);
    return [];
  }
}

/**
 * Detecta un posible avance emocional o personal para otorgar un reconocimiento.
 * Esta es una función heurística y puede ser bastante compleja de hacer robusta.
 * Fase 1: Lógica simple basada en keywords y cambios de emoción recientes.
 * @param {string} userId - ID del usuario.
 * @param {string} mensajeUsuarioActual - Mensaje actual del usuario.
 * @param {string|null} emocionActual - Emoción detectada en el mensaje actual.
 * @param {Array<object>} historialMensajesRecientes - Array de los últimos mensajes (ej. los últimos 5-10).
 *                                                    Cada mensaje: { role: 'user'|'willy', message: '...', emotion: '...' }
 * @returns {Promise<string|null>} El `tipoLogro` (de LOGROS_EMOCIONALES) si se detecta un avance, o null.
 */
export async function detectarAvanceParaReconocimiento(userId, mensajeUsuarioActual, emocionActual, historialMensajesRecientes = []) {
  // Asegurarse que el historial tenga al menos el mensaje actual (o el anterior si este es de Willy)
  const mensajesUsuario = historialMensajesRecientes.filter(m => m.role === 'user');

  // 1. Logro explícito compartido
  const keywordsLogro = ["logré", "conseguí", "superé", "he terminado", "estoy orgulloso de mí", "me siento orgullosa por"];
  if (keywordsLogro.some(kw => mensajeUsuarioActual.toLowerCase().includes(kw)) && emocionActual === LOGROS_EMOCIONALES.ALEGRIA) { // Asumiendo que LOGROS_EMOCIONALES.ALEGRIA es 'alegria'
    return LOGROS_EMOCIONALES.LOGRO_PERSONAL_COMPARTIDO;
  }

  // 2. Enfrentar un miedo (si antes mencionó miedo y ahora no, o dice que lo enfrentó)
  if (mensajesUsuario.length >= 2) {
    const ultimoMensajeUsuario = mensajesUsuario[mensajesUsuario.length - 1]; // Este sería el actual
    const penultimoMensajeUsuario = mensajesUsuario[mensajesUsuario.length - 2];
    if (penultimoMensajeUsuario.emotion === LOGROS_EMOCIONALES.MIEDO || penultimoMensajeUsuario.emotion === LOGROS_EMOCIONALES.ANSIEDAD) {
      if (emocionActual === LOGROS_EMOCIONALES.CALMA || emocionActual === LOGROS_EMOCIONALES.ALEGRIA || mensajeUsuarioActual.toLowerCase().includes("ya no tengo miedo") || mensajeUsuarioActual.toLowerCase().includes("lo hice aunque temía")) {
        return LOGROS_EMOCIONALES.ENFRENTAR_MIEDO;
      }
    }
  }

  // 3. Mejora de ánimo sostenida (simplificado: si antes había emoción negativa y ahora positiva)
  if (mensajesUsuario.length >= 2) {
     const emocionAnterior = mensajesUsuario[mensajesUsuario.length - 2].emotion;
     const esNegativaAnterior = ['tristeza', 'ira', 'miedo', 'ansiedad', 'frustracion', 'desmotivacion', 'estres'].includes(emocionAnterior);
     const esPositivaActual = ['alegria', 'calma', 'esperanza', 'amor'].includes(emocionActual);
     if (esNegativaAnterior && esPositivaActual) {
         return LOGROS_EMOCIONALES.MEJORA_ANIMO_SOSTENIDA;
     }
  }

  // 4. Acto de autocuidado (si Willy lo sugirió y el usuario confirma haberlo hecho y sentirse mejor)
  // Esto requiere que Willy recuerde sus propias sugerencias. Más complejo.
  // Por ahora, si el usuario dice "me tomé el descanso que dijiste y me siento mejor"
  const keywordsAutocuidadoRealizado = ["hice lo que dijiste", "seguí tu consejo", "me sirvió tu sugerencia", "me tomé el descanso", "medité como dijiste"];
  if (keywordsAutocuidadoRealizado.some(kw => mensajeUsuarioActual.toLowerCase().includes(kw)) && (emocionActual === LOGROS_EMOCIONALES.CALMA || emocionActual === LOGROS_EMOCIONALES.ALEGRIA)) {
      return LOGROS_EMOCIONALES.ACTO_AUTOCUIDADO;
  }

  // 5. Resiliencia ante frustración (si hubo frustración y ahora hay calma/aceptación o una solución)
  if (mensajesUsuario.length >= 2 && mensajesUsuario[mensajesUsuario.length - 2].emotion === LOGROS_EMOCIONALES.FRUSTRACION) {
      if ([LOGROS_EMOCIONALES.CALMA, LOGROS_EMOCIONALES.ESPERANZA, LOGROS_EMOCIONALES.ALEGRIA].includes(emocionActual) || mensajeUsuarioActual.toLowerCase().includes("ya lo resolví") || mensajeUsuarioActual.toLowerCase().includes("encontré la forma")) {
          return LOGROS_EMOCIONALES.RESILIENCIA_FRUSTRACION;
      }
  }

  // 6. Expresión de vulnerabilidad (si el usuario comparte algo profundo o difícil)
  // Podría detectarse por intensidad emocional o ciertas frases clave.
  // Simplificación: si la emoción es tristeza profunda y el mensaje es largo.
  if (emocionActual === LOGROS_EMOCIONALES.TRISTEZA && mensajeUsuarioActual.length > 100) { // Umbral arbitrario
      return LOGROS_EMOCIONALES.EXPRESION_VULNERABILIDAD;
  }

  // 7. Persistencia positiva (si el usuario expresa optimismo/esperanza en medio de dificultades previas)
  if (emocionActual === LOGROS_EMOCIONALES.ESPERANZA && mensajesUsuario.length >=1) {
      const mensajePrevio = mensajesUsuario[mensajesUsuario.length-1]; // El actual
      // Si el mensaje previo tenía una emoción negativa
      if (mensajePrevio && ['tristeza', 'frustracion', 'desmotivacion', 'miedo', 'ansiedad'].includes(mensajePrevio.emotion)){
          // Y el actual es de esperanza, es un buen indicador.
          // Esta lógica es un poco circular con la detección de mejora de ánimo.
          // Podríamos buscar keywords específicas de persistencia en el mensaje actual.
          if (mensajeUsuarioActual.toLowerCase().includes("saldré adelante") || mensajeUsuarioActual.toLowerCase().includes("no me rendiré")) {
            return LOGROS_EMOCIONALES.PERSISTENCIA_POSITIVA;
          }
      }
  }


  // TODO: Añadir más heurísticas y mejorar las existentes.
  // Considerar el contexto de las respuestas de Willy también.
  // Esta función es un punto de partida.
  return null;
}
