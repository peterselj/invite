/**
 * Birthday Party RSVP Form — Apps Script backend
 * ------------------------------------------------
 * The actual form lives at site/index.html (deployed to
 * peterselj.github.io/invite) — this QUESTIONS list is ONLY used here to
 * define the Sheet's column order/headers. It must list the same question
 * ids the static form's QUESTIONS graph can produce, or submitted answers
 * won't line up with columns. If you add/rename a question id in the static
 * form, mirror that change here too.
 */
const QUESTIONS = [
  { id: 'ack' },
  { id: 'power' },
  { id: 'shoot' },
  { id: 'dunks' },
  { id: 'eventNotice' },
  { id: 'name' },
  { id: 'attending' },
  { id: 'avatar_face' },
  { id: 'avatar_hair' },
  { id: 'avatar_beard' },
  { id: 'steal' },
  { id: 'block' },
];

const SHEET_NAME = 'Responses';

/**
 * EDIT ME: paste the ID of a Google Drive folder here to have each guest's
 * rendered player card (PNG) saved there automatically. Create a folder in
 * Drive, open it, and copy the ID out of its URL:
 *   https://drive.google.com/drive/folders/THIS_PART_IS_THE_ID
 * Leave as-is to skip card-saving (the Sheet will still record fine either
 * way). The FIRST time this runs with a real folder ID set, redeploying
 * will prompt you to re-authorize the script for Drive access — that's
 * expected, just accept it.
 */
const CARD_FOLDER_ID = '1642O5KKZkGFwJtef4xnjWtV8T3JQmqtx';

/**
 * The real form lives as a static page on GitHub Pages (peterselj.github.io/invite)
 * — this script is now just a JSON API the static page POSTs to on submit.
 * Visiting the /exec URL directly just confirms the API is alive.
 */
function doGet(e) {
  return ContentService.createTextOutput(
    JSON.stringify({ ok: true, message: 'RSVP API is running. Submit via POST.' })
  ).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Receives a guest's answers as a POST body (JSON, sent as text/plain to
 * dodge CORS preflight — see the static site's fetch call), appends a row
 * to the Sheet, and — if CARD_FOLDER_ID is configured — saves the guest's
 * rendered player card as a PNG into that Drive folder.
 */
function doPost(e) {
  let body = {};
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return jsonResponse_({ ok: false, error: 'Invalid JSON body' });
  }

  const cardPng = body.cardPng;
  delete body.cardPng; // don't let the (large) image bloat the Sheet row

  recordSubmission(body);

  if (cardPng) {
    try {
      saveCardToDrive_(cardPng, body.name);
    } catch (err) {
      // A Drive hiccup (e.g. folder not configured/shared) shouldn't fail
      // the whole submission — the Sheet row above already succeeded.
    }
  }

  return jsonResponse_({ ok: true });
}

function jsonResponse_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Appends one row to the Sheet for a completed submission.
 */
function recordSubmission(answers) {
  const sheet = getOrCreateSheet_();
  const headers = QUESTIONS.map(q => q.id);
  const row = [new Date()].concat(headers.map(id => (answers && answers[id] != null) ? String(answers[id]) : ''));
  sheet.appendRow(row);
  return { ok: true };
}

/**
 * Decodes a base64 PNG (as sent by the static form) and saves it into
 * CARD_FOLDER_ID, named after the guest. No-ops if CARD_FOLDER_ID hasn't
 * been set yet.
 */
function saveCardToDrive_(base64Png, rawName) {
  if (!CARD_FOLDER_ID || CARD_FOLDER_ID === 'PUT_YOUR_DRIVE_FOLDER_ID_HERE') return;
  const folder = DriveApp.getFolderById(CARD_FOLDER_ID);
  const safeName = String(rawName || 'guest').replace(/[^a-zA-Z0-9 _-]/g, '').trim() || 'guest';
  const bytes = Utilities.base64Decode(base64Png);
  const blob = Utilities.newBlob(bytes, 'image/png', safeName + ' - ' + new Date().toISOString() + '.png');
  folder.createFile(blob);
}

/**
 * Ensures the bound spreadsheet has a "Responses" sheet with a header row
 * that matches the current QUESTIONS list, creating/fixing it if needed.
 */
function getOrCreateSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  const expectedHeaders = ['Timestamp'].concat(QUESTIONS.map(q => q.id));
  const firstRow = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1)).getValues()[0];
  const needsHeader = firstRow.join('') === '' || expectedHeaders.some((h, i) => firstRow[i] !== h);
  if (needsHeader) {
    sheet.getRange(1, 1, 1, expectedHeaders.length).setValues([expectedHeaders]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}
