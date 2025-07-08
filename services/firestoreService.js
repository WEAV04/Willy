// services/firestoreService.js
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  doc, // Import doc
  updateDoc, // Import updateDoc
  query,
  where,
  orderBy,
  limit,
  getDocs,
  Timestamp
} from "firebase/firestore";
import { firebaseConfig } from "../firebaseConfig.js";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const MESSAGES_COLLECTION = "messages"; // Nombre de la colección en Firestore

/**
 * Guarda un mensaje en Firestore.
 * @param {object} data - El objeto del mensaje.
 * @param {string} data.userId - ID del usuario.
 * @param {"user" | "willy"} data.role - Rol del remitente.
 * @param {string} data.message - Contenido del mensaje.
 * @param {string | null} [data.topic=null] - Tema principal (opcional).
 * @param {string | null} [data.emotion=null] - Emoción dominante (opcional).
 * @param {boolean} [data.relevante=false] - Si es importante para recordar.
 * @returns {Promise<string>} El ID del documento guardado en Firestore.
 */
export async function guardarMensajeFirestore(data) {
  try {
    const messageData = {
      userId: data.userId,
      role: data.role,
      message: data.message,
      timestamp: Timestamp.fromDate(new Date()), // Usar Firestore Timestamp
      topic: data.topic || null,
      emotion: data.emotion || null,
      relevante: data.relevante || false, // Mantener 'relevante' por si se usa para otra cosa
      memorable: data.memorable || false, // Nuevo campo 'memorable'
    };
    const docRef = await addDoc(collection(db, MESSAGES_COLLECTION), messageData);
    console.log("[FirestoreService] Mensaje guardado con ID: ", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("[FirestoreService] Error al guardar mensaje: ", error);
    throw error; // Propagar el error para manejo superior
  }
}

/**
 * Busca mensajes en Firestore por palabra clave en el contenido del mensaje.
 * La búsqueda es case-insensitive (simulada, Firestore no soporta case-insensitive nativo fácilmente).
 * Para una búsqueda real case-insensitive o full-text, se requerirían soluciones como Algolia/Elasticsearch
 * o almacenar una versión en minúsculas del mensaje.
 * Esta implementación hace un filtrado básico post-query si es necesario o usa `where` si es posible.
 * @param {string} userId - ID del usuario.
 * @param {string} keyword - Palabra clave a buscar.
 * @returns {Promise<object[]>} Un array de objetos de mensaje.
 */
export async function buscarMensajesPorPalabraClave(userId, keyword) {
  try {
    const lowerKeyword = keyword.toLowerCase();
    // Firestore no tiene un 'contains' case-insensitive nativo.
    // Una forma es buscar por rangos si se tiene un campo de array de keywords en minúsculas.
    // Otra es traer más datos y filtrar en cliente (menos eficiente para grandes datasets).
    // Por simplicidad, vamos a traer todos los mensajes del usuario y filtrar.
    // Esto NO es eficiente para grandes cantidades de mensajes.
    // TODO: Implementar una estrategia de búsqueda más eficiente (ej. campo de keywords en minúsculas).

    const q = query(
      collection(db, MESSAGES_COLLECTION),
      where("userId", "==", userId),
      orderBy("timestamp", "desc") // Ordenar para poder filtrar los más recientes si es necesario
    );
    const querySnapshot = await getDocs(q);
    const messages = [];
    querySnapshot.forEach((doc) => {
      const messageData = doc.data();
      if (messageData.message.toLowerCase().includes(lowerKeyword)) {
        messages.push({ id: doc.id, ...messageData });
      }
    });
    console.log(`[FirestoreService] Encontrados ${messages.length} mensajes para keyword "${keyword}"`);
    return messages; // Devolver los mensajes que coinciden localmente
  } catch (error) {
    console.error("[FirestoreService] Error al buscar mensajes por palabra clave: ", error);
    throw error;
  }
}

/**
 * Marca un mensaje como memorable en Firestore.
 * @param {string} mensajeId - El ID del documento del mensaje a marcar.
 * @returns {Promise<void>}
 */
export async function marcarComoMemorable(mensajeId) {
  try {
    if (!mensajeId) {
      throw new Error("Se requiere mensajeId para marcar como memorable.");
    }
    const messageRef = doc(db, MESSAGES_COLLECTION, mensajeId);
    await updateDoc(messageRef, {
      memorable: true
    });
    console.log(`[FirestoreService] Mensaje ${mensajeId} marcado como memorable.`);
  } catch (error) {
    console.error(`[FirestoreService] Error al marcar mensaje ${mensajeId} como memorable: `, error);
    throw error;
  }
}

/**
 * Obtiene mensajes marcados como memorables para un usuario.
 * @param {string} userId - ID del usuario.
 * @param {number} [cantidad] - Número opcional de mensajes a obtener.
 * @returns {Promise<object[]>} Un array de objetos de mensaje memorables.
 */
export async function obtenerMomentosMemorables(userId, cantidad) {
  try {
    const constraints = [
      where("userId", "==", userId),
      where("memorable", "==", true),
      orderBy("timestamp", "desc") // Los más recientes primero, o podría ser aleatorio
    ];

    if (cantidad && typeof cantidad === 'number' && cantidad > 0) {
      constraints.push(limit(cantidad));
    }

    const q = query(collection(db, MESSAGES_COLLECTION), ...constraints);
    const querySnapshot = await getDocs(q);
    const messages = [];
    querySnapshot.forEach((doc) => {
      messages.push({ id: doc.id, ...doc.data() });
    });
    console.log(`[FirestoreService] Encontrados ${messages.length} momentos memorables.`);
    // Si se quiere uno aleatorio de los encontrados (si cantidad no se especificó o es > 1)
    // if (messages.length > 0 && !cantidad) {
    //   return [messages[Math.floor(Math.random() * messages.length)]];
    // }
    return messages; // Devuelve los encontrados, ordenados por fecha (o el límite especificado)
  } catch (error) {
    console.error("[FirestoreService] Error al obtener momentos memorables: ", error);
    throw error;
  }
}

/**
 * Obtiene todos los mensajes de un usuario, opcionalmente dentro de un rango de fechas.
 * @param {string} userId - ID del usuario.
 * @param {Date} [fechaInicio] - Fecha de inicio del rango (opcional).
 * @param {Date} [fechaFin] - Fecha de fin del rango (opcional).
 * @returns {Promise<object[]>} Un array de objetos de mensaje.
 */
export async function obtenerMensajesPorRangoFecha(userId, fechaInicio, fechaFin) {
  try {
    let q;
    const constraints = [
      where("userId", "==", userId),
      orderBy("timestamp", "asc") // Procesar en orden cronológico
    ];

    if (fechaInicio) {
      constraints.push(where("timestamp", ">=", Timestamp.fromDate(fechaInicio)));
    }
    if (fechaFin) {
      // Para que la fecha fin sea inclusiva, ajustamos al final del día.
      const finDeDia = new Date(fechaFin);
      finDeDia.setHours(23, 59, 59, 999);
      constraints.push(where("timestamp", "<=", Timestamp.fromDate(finDeDia)));
    }

    q = query(collection(db, MESSAGES_COLLECTION), ...constraints);

    const querySnapshot = await getDocs(q);
    const messages = [];
    querySnapshot.forEach((doc) => {
      messages.push({ id: doc.id, ...doc.data() });
    });
    console.log(`[FirestoreService] Obtenidos ${messages.length} mensajes para el rango especificado.`);
    return messages;
  } catch (error) {
    console.error("[FirestoreService] Error al obtener mensajes por rango de fecha: ", error);
    throw error;
  }
}

/**
 * Genera un resumen emocional basado en los mensajes de un usuario.
 * @param {string} userId - ID del usuario.
 * @param {Date} [fechaInicio] - Fecha de inicio del rango (opcional).
 * @param {Date} [fechaFin] - Fecha de fin del rango (opcional).
 * @returns {Promise<string>} Un string con el resumen emocional.
 */
export async function generarResumenEmocional(userId, fechaInicio, fechaFin) {
  try {
    const messages = await obtenerMensajesPorRangoFecha(userId, fechaInicio, fechaFin);
    if (messages.length === 0) {
      return "No encontré mensajes tuyos en el período especificado para generar un resumen emocional.";
    }

    const emocionCounts = {};
    const temasRelevantesPorEmocion = {}; // Para la parte opcional de temas
    let mensajesRelevantesCount = 0;

    messages.forEach(msg => {
      if (msg.emotion && msg.emotion !== 'neutro' && msg.emotion !== 'otro') { // Excluir neutro/otro del conteo principal
        emocionCounts[msg.emotion] = (emocionCounts[msg.emotion] || 0) + 1;

        // Para la parte opcional de temas (requiere que 'topic' se guarde)
        if (msg.topic && msg.topic.trim() !== "") {
          if (!temasRelevantesPorEmocion[msg.emotion]) {
            temasRelevantesPorEmocion[msg.emotion] = {};
          }
          temasRelevantesPorEmocion[msg.emotion][msg.topic] = (temasRelevantesPorEmocion[msg.emotion][msg.topic] || 0) + 1;
        }
      }
      if (msg.relevante === true) {
        mensajesRelevantesCount++;
      }
    });

    const sortedEmociones = Object.entries(emocionCounts).sort(([, a], [, b]) => b - a);

    let resumen = "";
    if (fechaInicio && fechaFin) {
      const diffTime = Math.abs(fechaFin - fechaInicio);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) +1; // +1 para incluir ambos días
      resumen += `En los últimos ${diffDays} día(s) (desde ${fechaInicio.toLocaleDateString()} hasta ${fechaFin.toLocaleDateString()}), `;
    } else if (fechaInicio) {
       resumen += `Desde ${fechaInicio.toLocaleDateString()}, `;
    } else {
      // Podríamos calcular el rango si solo se da fechaFin o si no se da ninguna (ej. "histórico")
      // Por ahora, si no hay rango, decimos "En general" o calculamos desde el primer mensaje.
      // Para simplificar, si no hay rango, no especificamos el período de forma detallada.
      resumen += "Analizando tus emociones registradas, ";
    }

    if (sortedEmociones.length > 0) {
      resumen += "tus emociones más frecuentes han sido: ";
      resumen += sortedEmociones.slice(0, 3).map(([em, count]) => `${em} (${count} ${count > 1 ? 'veces' : 'vez'})`).join(', ');
      resumen += ".";

      // Opcional: Detalle de temas por emoción (muy básico)
      // Esto podría ser muy verboso, se necesitaría una forma más inteligente de resumirlo.
      /*
      if (Object.keys(temasRelevantesPorEmocion).length > 0) {
        resumen += "\nAlgunas observaciones sobre temas y emociones:\n";
        for (const emocion of sortedEmociones.slice(0,2).map(e=>e[0])) { // Solo para las 2 emociones top
            if (temasRelevantesPorEmocion[emocion]) {
                const topTema = Object.entries(temasRelevantesPorEmocion[emocion]).sort(([,a],[,b])=>b-a)[0];
                if (topTema) {
                    resumen += `- Cuando te sentiste ${emocion}, a menudo hablabas sobre "${topTema[0]}".\n`;
                }
            }
        }
      }
      */

    } else {
      resumen += "no he detectado un patrón claro de emociones específicas (aparte de neutras) en tus mensajes.";
    }

    if (mensajesRelevantesCount > 0) {
      resumen += ` También registré ${mensajesRelevantesCount} momento(s) que marcaste como relevante(s).`;
      // Podríamos añadir una forma de consultar estos mensajes relevantes específicamente.
    }

    console.log("[FirestoreService] Resumen emocional generado:", resumen);
    return resumen;

  } catch (error) {
    console.error("[FirestoreService] Error al generar resumen emocional: ", error);
    throw error;
  }
}

/**
 * Obtiene mensajes marcados como relevantes para un usuario.
 * @param {string} userId - ID del usuario.
 * @returns {Promise<object[]>} Un array de objetos de mensaje relevantes.
 */
export async function obtenerMensajesRelevantes(userId) {
  try {
    const q = query(
      collection(db, MESSAGES_COLLECTION),
      where("userId", "==", userId),
      where("relevante", "==", true),
      orderBy("timestamp", "desc")
    );
    const querySnapshot = await getDocs(q);
    const messages = [];
    querySnapshot.forEach((doc) => {
      messages.push({ id: doc.id, ...doc.data() });
    });
    console.log(`[FirestoreService] Encontrados ${messages.length} mensajes relevantes`);
    return messages;
  } catch (error) {
    console.error("[FirestoreService] Error al obtener mensajes relevantes: ", error);
    throw error;
  }
}

/**
 * Obtiene los N mensajes más recientes para un usuario.
 * @param {string} userId - ID del usuario.
 * @param {number} n - Número de mensajes a obtener.
 * @returns {Promise<object[]>} Un array de los N mensajes más recientes.
 */
export async function obtenerMensajesRecientes(userId, n) {
  try {
    const q = query(
      collection(db, MESSAGES_COLLECTION),
      where("userId", "==", userId),
      orderBy("timestamp", "desc"),
      limit(n)
    );
    const querySnapshot = await getDocs(q);
    const messages = [];
    querySnapshot.forEach((doc) => {
      // Convert Firestore Timestamp to Date object or ISO string if needed by the app
      const data = doc.data();
      messages.push({
        id: doc.id,
        ...data,
        // timestamp: data.timestamp.toDate() // Ejemplo si se necesita Date object
      });
    });
    // Firestore devuelve en orden descendente, pero para historial de chat usualmente se quiere ascendente.
    // O la lógica que consume esto debe estar al tanto. Por ahora, los devolvemos como vienen (más recientes primero).
    console.log(`[FirestoreService] Obtenidos ${messages.length} mensajes recientes`);
    return messages.reverse(); // Revertir para tener los más antiguos primero, como historial de chat
  } catch (error) {
    console.error("[FirestoreService] Error al obtener mensajes recientes: ", error);
    throw error;
  }
}
