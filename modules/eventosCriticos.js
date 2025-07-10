import { guardarMensajeFirestore, obtenerMensajesRecientes } from '../services/firestoreService.js'; // Asumiendo que aquí está la config de Firebase
import { EMOCIONES } from './analisis_emocional/emociones_basicas.js'; // Para tags o emociones del sistema

// Firestore no está directamente disponible en el frontend de la misma manera,
// pero este módulo es para la lógica del backend/API donde sí lo estaría.
// Si esto fuera a ejecutarse en un entorno sin acceso directo a Firebase Admin SDK,
// necesitaría interactuar con una API backend que sí lo tenga.
// Para esta simulación, asumimos que tenemos acceso a funciones que interactúan con Firestore.

const COLECCION_EVENTOS_CRITICOS = 'eventosCriticos';

/**
 * Prepara el mensaje y los datos para solicitar consentimiento al usuario antes de registrar un evento crítico.
 * No guarda nada, solo prepara la solicitud.
 *
 * @param {string} userId - ID del usuario.
 * @param {string} tipoEvento - Tipo de evento crítico (ej: "crisis_detectada", "no_responde_timer", "expresion_riesgo_alta").
 * @param {string} detalleEvento - Descripción o mensaje que originó el evento.
 * @param {string|null} modoActivado - Modo de Willy que estaba activo (ej: "ModoCrisis", "SupervisionVulnerable", null).
 * @returns {object} Objeto con el mensaje para Willy y los datos del evento pendiente.
 */
export function solicitarConsentimientoRegistroEvento(userId, tipoEvento, detalleEvento, modoActivado) {
    const mensajeParaWilly = `He detectado un momento que podría ser importante recordar (${tipoEvento}). ` +
                             "¿Quieres que guarde este momento de forma segura y privada en tus registros emocionales, " +
                             "por si necesitamos revisarlo juntos más adelante? Solo tú tendrás acceso.";

    const datosEventoPendiente = {
        userId,
        tipoEvento,
        detalleEvento, // El mensaje o situación que lo originó
        modoActivado, // Modo actual de Willy, si aplica
        // timestamp y consentimiento se añadirán al guardar
    };

    console.log(`[eventosCriticos.js] Preparando solicitud de consentimiento para evento: ${tipoEvento} para userId: ${userId}`);
    return { mensajeParaWilly, datosEventoPendiente };
}

/**
 * Guarda un evento crítico en Firestore DESPUÉS de obtener el consentimiento explícito del usuario.
 *
 * @param {object} datosEvento - Objeto con los datos del evento a guardar.
 * @param {string} datosEvento.userId - ID del usuario.
 * @param {string} datosEvento.tipoEvento - Tipo de evento.
 * @param {string} datosEvento.detalleEvento - Detalle del evento.
 * @param {string|null} datosEvento.modoActivado - Modo de Willy activo.
 * @param {boolean} datosEvento.consentimiento - Siempre debe ser true para llamar a esta función.
 * @returns {Promise<string|null>} ID del documento guardado o null en caso de error.
 */
export async function guardarEventoCritico(datosEvento) {
    if (!datosEvento.consentimiento) {
        console.warn("[eventosCriticos.js] Intento de guardar evento crítico sin consentimiento. Operación denegada.", datosEvento);
        return null;
    }

    const eventoAGuardar = {
        ...datosEvento,
        timestamp: new Date(), // Usar new Date() para que Firestore lo convierta a su Timestamp
    };

    console.log("[eventosCriticos.js] Guardando evento crítico con consentimiento:", eventoAGuardar);
    try {
        // Asumimos que guardarMensajeFirestore puede adaptarse o necesitamos una nueva función
        // para guardar en una colección específica. Por ahora, conceptualmente es:
        // const docRef = await firestore.collection(COLECCION_EVENTOS_CRITICOS).add(eventoAGuardar);
        // Simularemos el guardado y devolveremos un ID conceptual.
        // En una implementación real, esto llamaría a una función de firestoreService.js
        // que maneje la escritura en la colección 'eventosCriticos'.

        // Para la simulación, y si `guardarMensajeFirestore` es genérico y puede tomar una colección:
        // O mejor, crear una función específica en firestoreService.js:
        // import { guardarDocumentoEnColeccion } from '../services/firestoreService.js';
        // const docId = await guardarDocumentoEnColeccion(COLECCION_EVENTOS_CRITICOS, eventoAGuardar);
        // if (docId) {
        //   console.log(`[eventosCriticos.js] Evento crítico guardado con ID: ${docId}`);
        //   return docId;
        // }
        // Por ahora, solo log y simulación de éxito:
        console.log("[eventosCriticos.js] SIMULACIÓN: Evento crítico guardado en Firestore.");
        return `simulated_${Date.now()}`; // Simular un ID
    } catch (error) {
        console.error("[eventosCriticos.js] Error al guardar evento crítico en Firestore:", error);
        return null;
    }
}

/**
 * Obtiene los eventos críticos registrados para un usuario.
 * Solo devuelve eventos que fueron guardados con consentimiento.
 *
 * @param {string} userId - ID del usuario.
 * @param {number} [limite=10] - Número máximo de eventos a obtener.
 * @returns {Promise<Array<object>>} Array de objetos de eventos críticos.
 */
export async function obtenerEventosCriticos(userId, limite = 10) {
    console.log(`[eventosCriticos.js] Obteniendo eventos críticos para userId: ${userId} con límite: ${limite}`);
    try {
        // En una implementación real, esto llamaría a una función de firestoreService.js
        // que consulte la colección 'eventosCriticos' con filtros y ordenación.
        // import { consultarColeccion } from '../services/firestoreService.js';
        // const eventos = await consultarColeccion(
        //   COLECCION_EVENTOS_CRITICOS,
        //   { field: 'userId', operator: '==', value: userId },
        //   { field: 'consentimiento', operator: '==', value: true }, // Asegurar doblemente el consentimiento
        //   { field: 'timestamp', direction: 'desc' },
        //   limite
        // );
        // return eventos;

        // Simulación:
        console.log("[eventosCriticos.js] SIMULACIÓN: Devolviendo eventos críticos de prueba.");
        return [
            { userId, timestamp: new Date(Date.now() - 86400000), tipoEvento: "crisis_detectada_simulada", detalleEvento: "Usuario expresó sentirse sin esperanza (simulado).", modoActivado: "ModoCrisis", consentimiento: true },
            { userId, timestamp: new Date(Date.now() - 172800000), tipoEvento: "no_responde_timer_simulado", detalleEvento: "Usuario no respondió tras timer en Modo Supervisión (simulado).", modoActivado: "SupervisionVulnerable", consentimiento: true }
        ].slice(0, limite);
    } catch (error) {
        console.error("[eventosCriticos.js] Error al obtener eventos críticos de Firestore:", error);
        return [];
    }
}

/**
 * Formatea un resumen de eventos críticos para que Willy lo presente al usuario.
 * Esta función es un placeholder para una futura mejora más elaborada.
 * @param {Array<object>} eventos - Array de eventos críticos obtenidos de Firestore.
 * @returns {string} Un mensaje resumen para el usuario.
 */
export function formatearResumenEventosParaUsuario(eventos) {
    if (!eventos || eventos.length === 0) {
        return "No he encontrado momentos difíciles recientes que hayamos guardado juntos con tu permiso. Si alguna vez pasas por algo complicado y quieres que lo recordemos para ver cuánto has avanzado, solo dímelo.";
    }

    let resumen = "He estado revisando algunos momentos que guardamos juntos con tu permiso, donde enfrentaste situaciones difíciles. Recordarlos puede ayudarnos a ver tu fortaleza y cómo has avanzado:\n";
    eventos.forEach(evento => {
        const fecha = evento.timestamp.toLocaleDateString ? evento.timestamp.toLocaleDateString() : new Date(evento.timestamp).toLocaleDateString(); // Adaptar si es timestamp de Firebase
        resumen += `\n- El ${fecha}, registramos un evento de tipo "${evento.tipoEvento}". El detalle fue: "${evento.detalleEvento}".`;
        if (evento.modoActivado) {
            resumen += ` Estabas usando ${evento.modoActivado}.`;
        }
    });
    resumen += "\n\nRecordar estos momentos nos muestra tu capacidad de superación. Estoy aquí para hablar de ellos si quieres, o simplemente para reconocer tu camino. ¿Hay algo en particular sobre esto que te gustaría conversar?";
    return resumen;
}

// Ejemplo de tipos de evento (podrían ser constantes exportadas)
export const TIPOS_EVENTO_CRITICO = {
    CRISIS_DETECTADA: "crisis_detectada",
    NO_RESPONDE_TIMER_CRISIS: "no_responde_timer_crisis",
    NO_RESPONDE_TIMER_SUPERVISION: "no_responde_timer_supervision",
    EXPRESION_RIESGO_ALTA: "expresion_riesgo_alta", // Para cuando se detecta algo muy negativo pero no llega a crisis mode
    CONSENTIMIENTO_SENSORES_DENEGADO_TRAS_ALERTA: "consentimiento_sensores_denegado_alerta", // Ejemplo
    INTERVENCION_EXITOSA_SUGERIDA: "intervencion_exitosa_sugerida" // Ejemplo de algo positivo post-evento
};
