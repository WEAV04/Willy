// services/firestoreService.js
import { initializeApp } from "firebase/app";
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
      relevante: data.relevante || false,
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
