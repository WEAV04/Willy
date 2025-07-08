/**
 * emociones_basicas.js
 * Define una lista de emociones básicas que Willy puede intentar detectar.
 */

export const EMOCIONES = {
  ALEGRIA: 'alegria',
  TRISTEZA: 'tristeza',
  IRA: 'ira',
  MIEDO: 'miedo',
  ANSIEDAD: 'ansiedad',
  CALMA: 'calma',
  SORPRESA: 'sorpresa',
  DESMOTIVACION: 'desmotivacion',
  ESTRES: 'estres',
  CULPA: 'culpa',
  VERGUENZA: 'verguenza',
  FRUSTRACION: 'frustracion',
  ESPERANZA: 'esperanza',
  AMOR: 'amor', // Podría ser más afecto o cariño
  NEUTRO: 'neutro', // Cuando no se detecta una emoción clara
  OTRO: 'otro' // Para emociones no listadas o complejas
};

// También podríamos tener una lista simple si solo queremos los nombres
export const LISTA_EMOCIONES = Object.values(EMOCIONES);

// Podríamos asociar algunas emociones a categorías más amplias
export const CATEGORIAS_EMOCIONALES = {
  POSITIVA: [EMOCIONES.ALEGRIA, EMOCIONES.CALMA, EMOCIONES.ESPERANZA, EMOCIONES.AMOR],
  NEGATIVA: [
    EMOCIONES.TRISTEZA,
    EMOCIONES.IRA,
    EMOCIONES.MIEDO,
    EMOCIONES.ANSIEDAD,
    EMOCIONES.DESMOTIVACION,
    EMOCIONES.ESTRES,
    EMOCIONES.CULPA,
    EMOCIONES.VERGUENZA,
    EMOCIONES.FRUSTRACION
  ],
  NEUTRA: [EMOCIONES.NEUTRO, EMOCIONES.SORPRESA, EMOCIONES.OTRO], // Sorpresa puede ser +/-/neutra
};

/**
 * Verifica si una emoción es considerada negativa.
 * @param {string} emocion - La emoción a verificar (debe ser uno de los valores de EMOCIONES).
 * @returns {boolean}
 */
export function esEmocionNegativa(emocion) {
  return CATEGORIAS_EMOCIONALES.NEGATIVA.includes(emocion);
}

/**
 * Verifica si una emoción es considerada positiva.
 * @param {string} emocion - La emoción a verificar.
 * @returns {boolean}
 */
export function esEmocionPositiva(emocion) {
  return CATEGORIAS_EMOCIONALES.POSITIVA.includes(emocion);
}
