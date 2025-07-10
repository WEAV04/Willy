/**
 * cameraSupervisor.js
 * Simula una supervisión pasiva de cámaras, generando eventos simulados
 * para que Willy pueda reaccionar. No accede a cámaras reales.
 */

let isSupervisingActive = false;
let supervisionIntervalId = null;
let currentUserId = null; // Para saber a qué usuario notificar
let detectionCallbackRef = null; // Referencia al callback para enviar el evento

const SIMULATED_EVENT_TYPES = [
  { type: 'SIMULATED_MOVEMENT', description: 'un movimiento leve en la periferia (simulado)' },
  { type: 'SIMULATED_SOUND', description: 'un sonido suave inesperado cercano (simulado)' },
  { type: 'SIMULATED_LIGHT_CHANGE', description: 'un cambio repentino en la iluminación del entorno (simulado)' },
  { type: 'SIMULATED_PRESENCE', description: 'algo que podría interpretarse como una presencia fugaz (simulado)' }
];

/**
 * Inicia la supervisión simulada.
 * @param {string} userId - El ID del usuario para el que se activa la supervisión.
 * @param {function} detectionCallback - Función a llamar cuando se simula una detección.
 *                                      Debe aceptar (userId, eventDetails).
 */
export function startSupervision(userId, detectionCallback) {
  if (isSupervisingActive) {
    console.log("[cameraSupervisor] La supervisión ya está activa.");
    return false; // Ya estaba activa
  }
  isSupervisingActive = true;
  currentUserId = userId;
  detectionCallbackRef = detectionCallback;

  // Simular una detección cada X tiempo (e.g., entre 1 y 5 minutos)
  const randomInterval = Math.floor(Math.random() * (5 * 60 * 1000 - 1 * 60 * 1000 + 1)) + 1 * 60 * 1000;
  // const fixedInterval = 30 * 1000; // Para pruebas más rápidas: cada 30 segundos

  supervisionIntervalId = setInterval(() => {
    if (isSupervisingActive && detectionCallbackRef && currentUserId) {
      // Seleccionar un evento simulado aleatorio
      const randomEvent = SIMULATED_EVENT_TYPES[Math.floor(Math.random() * SIMULATED_EVENT_TYPES.length)];
      const eventDetails = {
        type: randomEvent.type,
        description: randomEvent.description, // Descripción para Willy
        timestamp: new Date().toISOString()
      };
      console.log(`[cameraSupervisor] Simulando detección: ${eventDetails.type} para userId: ${currentUserId}`);
      detectionCallbackRef(currentUserId, eventDetails);
    }
  }, randomInterval); // Usar randomInterval para producción, fixedInterval para test

  console.log(`[cameraSupervisor] Supervisión simulada iniciada para userId: ${userId}. Próxima simulación en aprox. ${Math.round(randomInterval/(60*1000))} min.`);
  return true;
}

/**
 * Detiene la supervisión simulada.
 */
export function stopSupervision() {
  if (!isSupervisingActive) {
    console.log("[cameraSupervisor] La supervisión no estaba activa.");
    return false;
  }
  isSupervisingActive = false;
  if (supervisionIntervalId) {
    clearInterval(supervisionIntervalId);
    supervisionIntervalId = null;
  }
  detectionCallbackRef = null;
  // currentUserId = null; // Mantener por si se quiere saber quién fue el último supervisado.
  console.log("[cameraSupervisor] Supervisión simulada detenida para userId: ", currentUserId);
  return true;
}

/**
 * Verifica si la supervisión simulada está activa.
 * @returns {boolean}
 */
export function isSupervisionOn() {
  return isSupervisingActive;
}

/**
 * Obtiene el ID del usuario actualmente bajo supervisión (si la hay).
 * @returns {string|null}
 */
export function getSupervisedUserId() {
    return isSupervisingActive ? currentUserId : null;
}
