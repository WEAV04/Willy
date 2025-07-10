/**
 * diarioEmocional.js
 * Este módulo se encarga de la lógica para guardar, recuperar y analizar
 * las entradas del diario emocional y de sueños del usuario en Firestore.
 */

import {
  getFirestore,
  collection,
  addDoc,
  query,
  where,
  orderBy,
  getDocs,
  Timestamp,
  limit // Asegurarse de importar limit si se usa
} from "firebase/firestore";
// Asumimos que firebaseConfig.js y la inicialización de Firebase (app, db) ya existen
// y son accesibles, similar a como se hace en firestoreService.js.
// Por simplicidad, si este módulo se usa junto a firestoreService.js, podría
// compartir la instancia 'db'. Si es independiente, necesitaría su propia inicialización.
// Para este ejemplo, asumiré que 'db' puede ser importado o ya está disponible globalmente (no ideal para prod).

// Para este módulo, vamos a re-importar y re-inicializar para que sea autocontenido,
// aunque en una app más grande se centralizaría la inicialización de Firebase.
import { initializeApp } from "firebase/app";
import { firebaseConfig } from "../firebaseConfig.js"; // Ajustar ruta si es necesario

const app = initializeApp(firebaseConfig); // Esto podría causar problemas si ya está inicializado en otro lado.
const db = getFirestore(app);             // Idealmente, pasar 'db' como parámetro o usar un singleton.

const REGISTROS_COLLECTION = "registrosDiarioEmocional";

/**
 * Guarda una nueva entrada en el diario emocional o de sueños.
 * @param {object} data - Datos de la entrada.
 * @param {string} data.userId - ID del usuario.
 * @param {"sueño"|"pensamiento_diario"|"reflexion_libre"} data.tipoRegistro - Tipo de entrada.
 * @param {string} data.contenidoTexto - Contenido textual.
 * @param {string|null} [data.emocionDetectadaPrimaria=null] - Emoción principal.
 * @param {string[]} [data.emocionesSecundarias=[]] - Otras emociones.
 * @param {string[]} [data.temasClave=[]] - Temas clave (futuro).
 * @returns {Promise<string>} El ID del documento guardado.
 */
export async function guardarEntradaDiario(data) {
  try {
    const entryData = {
      userId: data.userId,
      timestamp: Timestamp.fromDate(new Date()),
      fechaCreacionISO: new Date().toISOString(),
      tipoRegistro: data.tipoRegistro,
      contenidoTexto: data.contenidoTexto,
      emocionDetectadaPrimaria: data.emocionDetectadaPrimaria || null,
      emocionesSecundarias: data.emocionesSecundarias || [],
      temasClave: data.temasClave || [],
      privacidad: "privado_usuario" // Fijo
    };
    const docRef = await addDoc(collection(db, REGISTROS_COLLECTION), entryData);
    console.log(`[diarioEmocional] Entrada de diario guardada con ID: ${docRef.id}`);
    return docRef.id;
  } catch (error) {
    console.error("[diarioEmocional] Error al guardar entrada de diario:", error);
    throw error;
  }
}

/**
 * Obtiene entradas del diario para un usuario, opcionalmente filtradas.
 * @param {string} userId - ID del usuario.
 * @param {object} [options={}] - Opciones de filtro.
 * @param {{fechaInicio: Date, fechaFin: Date}} [options.rangoFechas] - Rango de fechas.
 * @param {"sueño"|"pensamiento_diario"|"reflexion_libre"} [options.tipoRegistro] - Tipo específico de registro.
 * @param {number} [options.limite=50] - Cantidad máxima de entradas a devolver.
 * @returns {Promise<object[]>} Array de entradas del diario.
 */
export async function obtenerEntradasDiario(userId, options = {}) {
  try {
    const { rangoFechas, tipoRegistro, limite = 50 } = options;
    const constraints = [
      where("userId", "==", userId),
      orderBy("timestamp", "desc") // Más recientes primero por defecto
    ];

    if (tipoRegistro) {
      constraints.push(where("tipoRegistro", "==", tipoRegistro));
    }
    if (rangoFechas?.fechaInicio) {
      constraints.push(where("timestamp", ">=", Timestamp.fromDate(rangoFechas.fechaInicio)));
    }
    if (rangoFechas?.fechaFin) {
      // Para que la fecha fin sea inclusiva, ajustamos al final del día.
      const finDeDia = new Date(rangoFechas.fechaFin);
      finDeDia.setHours(23, 59, 59, 999);
      constraints.push(where("timestamp", "<=", Timestamp.fromDate(finDeDia)));
    }

    constraints.push(limit(limite));

    const q = query(collection(db, REGISTROS_COLLECTION), ...constraints);
    const querySnapshot = await getDocs(q);
    const entradas = [];
    querySnapshot.forEach((doc) => {
      entradas.push({ id: doc.id, ...doc.data() });
    });
    console.log(`[diarioEmocional] Obtenidas ${entradas.length} entradas del diario.`);
    return entradas; // Devueltas más recientes primero debido al orderBy
  } catch (error) {
    console.error("[diarioEmocional] Error al obtener entradas del diario:", error);
    throw error;
  }
}

/**
 * Analiza patrones emocionales en las entradas del diario (Fase 1: frecuencia de emociones).
 * @param {string} userId - ID del usuario.
 * @param {{fechaInicio: Date, fechaFin: Date}} [rangoFechas] - Rango opcional para el análisis.
 * @returns {Promise<string>} Un resumen textual de los patrones emocionales.
 */
export async function analizarPatronesDiario(userId, rangoFechas) {
  try {
    // Si no hay rango, tomar por ejemplo el último mes
    let fechaInicioAnalisis = rangoFechas?.fechaInicio;
    let fechaFinAnalisis = rangoFechas?.fechaFin;

    if (!fechaInicioAnalisis) {
      fechaInicioAnalisis = new Date();
      fechaInicioAnalisis.setMonth(fechaInicioAnalisis.getMonth() - 1); // Último mes
      fechaInicioAnalisis.setHours(0,0,0,0);
    }
    if(!fechaFinAnalisis) {
        fechaFinAnalisis = new Date();
        fechaFinAnalisis.setHours(23,59,59,999);
    }

    const entradas = await obtenerEntradasDiario(userId, {
        rangoFechas: { fechaInicio: fechaInicioAnalisis, fechaFin: fechaFinAnalisis },
        limite: 200 // Un límite razonable para análisis de patrones
    });

    if (entradas.length === 0) {
      return "No he encontrado suficientes registros recientes en tu diario para analizar patrones emocionales. ¡Anímate a escribir un poco más cuando quieras!";
    }

    const emocionCounts = {};
    let totalEntradasConEmocion = 0;
    entradas.forEach(entrada => {
      if (entrada.emocionDetectadaPrimaria && entrada.emocionDetectadaPrimaria !== 'neutro' && entrada.emocionDetectadaPrimaria !== 'otro') {
        emocionCounts[entrada.emocionDetectadaPrimaria] = (emocionCounts[entrada.emocionDetectadaPrimaria] || 0) + 1;
        totalEntradasConEmocion++;
      }
      // Podríamos incluir emocionesSecundarias también si quisiéramos un análisis más profundo
    });

    if (totalEntradasConEmocion === 0) {
      return "En tus registros recientes del diario, no he detectado emociones predominantes claras. A veces, simplemente expresar es el primer paso.";
    }

    const sortedEmociones = Object.entries(emocionCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3); // Tomar las 3 más frecuentes

    let resumen = `Analizando tus entradas del diario ${rangoFechas ? `entre el ${fechaInicioAnalisis.toLocaleDateString()} y el ${fechaFinAnalisis.toLocaleDateString()}` : 'recientes'}, he notado algunas cosas:\n`;

    if (sortedEmociones.length > 0) {
      resumen += "Parece que las emociones que más has expresado son: ";
      resumen += sortedEmociones.map(([em, count]) => `${em} (en ${count} ${count > 1 ? 'ocasiones' : 'ocasión'})`).join(', ');
      resumen += ".\n";

      // Un comentario adicional simple basado en la emoción más frecuente
      const emocionPrincipal = sortedEmociones[0][0];
      if (['alegria', 'calma', 'esperanza', 'amor'].includes(emocionPrincipal)) {
        resumen += `Es bueno ver que la ${emocionPrincipal} ha estado presente. `;
      } else if (['tristeza', 'ansiedad', 'frustracion', 'miedo', 'estres'].includes(emocionPrincipal)) {
        resumen += `Noto que la ${emocionPrincipal} ha sido recurrente. Recuerda que estoy aquí si necesitas hablar sobre ello. `;
      }
    } else {
      resumen += "No identifiqué un patrón emocional muy marcado, pero cada reflexión es valiosa.\n";
    }

    resumen += "\nSeguir escribiendo en tu diario puede ser una herramienta muy útil para conocerte mejor. ¿Hay algo de esto sobre lo que te gustaría que conversemos?";

    console.log("[diarioEmocional] Resumen de patrones del diario generado.");
    return resumen;

  } catch (error) {
    console.error("[diarioEmocional] Error al analizar patrones del diario:", error);
    return "Tuve un pequeño inconveniente al intentar analizar los patrones de tu diario en este momento. Podemos intentarlo más tarde si quieres.";
  }
}
