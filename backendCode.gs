/**
 * FF GAMES — Backend de resultados sobre Google Sheets
 * -----------------------------------------------------
 * 1. Crea un Google Sheet nuevo. En la primera hoja (renómbrala "Resultados")
 *    pon esta fila de encabezados en la fila 1:
 *
 *    timestamp | sessionCode | gameId | gameTitle | playerName | playerRole |
 *    score | totalQuestions | percent | timeMs | mode | log
 *
 * 2. Extensiones > Apps Script. Borra el contenido de Code.gs y pega este archivo.
 * 3. Implementar > Nueva implementación > Tipo: Aplicación web.
 *      - Ejecutar como: Yo
 *      - Quién tiene acceso: Cualquier usuario (o "Cualquier usuario con Google" si
 *        quieres exigir login de tu dominio)
 * 4. Copia la URL de la Web App y pégala como `webAppUrl` al crear FFResults()
 *    en tu página del juego.
 */

const SHEET_NAME = 'Resultados';

function doPost(e) {
  const body = JSON.parse(e.postData.contents);

  if (body.action === 'submit') {
    const p = body.payload;
    const sheet = _getSheet();
    sheet.appendRow([
      new Date(),
      p.sessionCode || '',
      p.gameId || '',
      p.gameTitle || '',
      p.playerName || '',
      p.playerRole || '',
      p.score,
      p.totalQuestions,
      p.percent,
      p.timeMs,
      p.mode || '',
      JSON.stringify(p.log || []),
    ]);
    return _json({ ok: true });
  }

  return _json({ ok: false, error: 'acción no reconocida' });
}

function doGet(e) {
  const action = e.parameter.action;
  const sheet = _getSheet();
  const rows = sheet.getDataRange().getValues();
  const headers = rows.shift();

  const data = rows.map(row => {
    const obj = {};
    headers.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });

  if (action === 'session') {
    const code = e.parameter.code;
    const filtered = data
      .filter(r => String(r.sessionCode) === String(code))
      .sort((a, b) => b.percent - a.percent);
    return _json(filtered);
  }

  if (action === 'game') {
    const gameId = e.parameter.gameId;
    const filtered = data.filter(r => String(r.gameId) === String(gameId));
    return _json(filtered);
  }

  // sin parámetros: devuelve todo (útil para tu propio análisis en Power BI/Excel)
  return _json(data);
}

function _getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(['timestamp','sessionCode','gameId','gameTitle','playerName','playerRole','score','totalQuestions','percent','timeMs','mode','log']);
  }
  return sheet;
}

function _json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
