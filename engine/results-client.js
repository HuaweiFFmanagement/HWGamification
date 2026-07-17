/**
 * FF RESULTS — envío y lectura de resultados usando Google Sheets como base de datos.
 *
 * Requiere haber desplegado el archivo backend/Code.gs como "Web App" de Google Apps
 * Script (ver README.md, sección "Configurar el backend"). Usa el mismo patrón que
 * ya usas en tu app de asistencia: POST en texto plano para evitar el preflight de
 * CORS, y GET con parámetros de consulta para leer datos (ranking en vivo).
 */

class FFResults {
  constructor({ webAppUrl }) {
    this.webAppUrl = webAppUrl;
  }

  /** Envía el resultado de una partida terminada. */
  async submit(payload) {
    if (!this.webAppUrl) throw new Error('Falta configurar webAppUrl en FFResults');
    // text/plain evita que el navegador dispare un preflight OPTIONS,
    // que Apps Script Web Apps no maneja bien.
    await fetch(this.webAppUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'submit', payload }),
    });
    // Los Web Apps de Apps Script en modo "cualquiera puede acceder" no siempre
    // devuelven un cuerpo legible en modo no-cors; si tu despliegue sí lo permite,
    // puedes leer la respuesta aquí para confirmar guardado.
  }

  /** Lee el ranking en vivo de una sesión (modo 'live'), para pantalla de host. */
  async fetchSessionScores(sessionCode) {
    if (!this.webAppUrl) throw new Error('Falta configurar webAppUrl en FFResults');
    const url = `${this.webAppUrl}?action=session&code=${encodeURIComponent(sessionCode)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('No se pudo leer el ranking de la sesión');
    return res.json(); // -> [{playerName, playerRole, score, totalQuestions, percent, timeMs}, ...]
  }

  /** Lee todos los resultados de un juego (para tus propios análisis / exportar). */
  async fetchGameResults(gameId) {
    if (!this.webAppUrl) throw new Error('Falta configurar webAppUrl en FFResults');
    const url = `${this.webAppUrl}?action=game&gameId=${encodeURIComponent(gameId)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('No se pudo leer los resultados del juego');
    return res.json();
  }
}
