/**
 * Shelf-Life Monitor — Google Sheet backend
 *
 * วิธีติดตั้ง (ทำครั้งเดียว):
 * 1. สร้าง Google Sheet ใหม่ → เมนู Extensions (ส่วนขยาย) → Apps Script
 * 2. ลบโค้ดเดิมทั้งหมด แล้ววางโค้ดในไฟล์นี้ → กด Save
 * 3. Deploy (ทำให้ใช้งานได้) → New deployment → เลือกประเภท Web app
 *      Execute as: Me   ·   Who has access: Anyone
 * 4. กด Deploy → อนุญาตสิทธิ์ → คัดลอก Web app URL (ลงท้ายด้วย /exec)
 * 5. นำ URL ไปใส่ใน SHEET_API ของไฟล์ shelf-life.html
 *
 * ข้อมูลเก็บเป็นแท็บ products / contacts / batches (คอลัมน์ id, data(JSON), updated)
 * แก้โค้ดแล้วต้อง Deploy → Manage deployments → Edit → Version: New version
 */
const COLS = ['products', 'contacts', 'batches'];

function sheet_(name) {
  const ss = SpreadsheetApp.getActive();
  let s = ss.getSheetByName(name);
  if (!s) {
    s = ss.insertSheet(name);
    s.appendRow(['id', 'data', 'updated']);
    s.setFrozenRows(1);
  }
  return s;
}

function readCol_(name) {
  const v = sheet_(name).getDataRange().getValues();
  const out = [];
  for (let i = 1; i < v.length; i++) {
    if (!v[i][0]) continue;
    let o = {};
    try { o = JSON.parse(v[i][1] || '{}'); } catch (e) {}
    o._id = String(v[i][0]);
    out.push(o);
  }
  return out;
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

function doGet() {
  const r = { ok: true };
  COLS.forEach(function (c) { r[c] = readCol_(c); });
  return json_(r);
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(25000);
  try {
    const req = JSON.parse(e.postData.contents);
    if (req.op === 'replace') {
      COLS.forEach(function (c) {
        const s = sheet_(c);
        s.clearContents();
        s.appendRow(['id', 'data', 'updated']);
        const now = new Date();
        const rows = (req.data[c] || []).map(function (o) {
          const id = String(o._id || Utilities.getUuid());
          const d = Object.assign({}, o); delete d._id;
          return [id, JSON.stringify(d), now];
        });
        if (rows.length) s.getRange(2, 1, rows.length, 3).setNumberFormat('@').setValues(rows);
      });
      return json_({ ok: true });
    }
    const writes = req.op === 'bulk' ? req.writes : [req];
    const cache = {};
    writes.forEach(function (w) { apply_(w, cache); });
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function apply_(w, cache) {
  if (COLS.indexOf(w.col) < 0 || !w.id) return;
  const s = sheet_(w.col);
  if (!cache[w.col]) cache[w.col] = s.getRange(1, 1, Math.max(s.getLastRow(), 1), 1).getValues().map(function (r) { return String(r[0]); });
  const ids = cache[w.col];
  const id = String(w.id);
  const i = ids.indexOf(id);
  if (w.op === 'delete') {
    if (i > 0) { s.deleteRow(i + 1); ids.splice(i, 1); }
    return;
  }
  let d = w.data || {};
  if (w.op === 'update' && i > 0) {
    let cur = {};
    try { cur = JSON.parse(s.getRange(i + 1, 2).getValue() || '{}'); } catch (e) {}
    d = Object.assign(cur, d);
  }
  const row = [[id, JSON.stringify(d), new Date()]];
  if (i > 0) s.getRange(i + 1, 1, 1, 3).setNumberFormat('@').setValues(row);
  else { s.getRange(ids.length + 1, 1, 1, 3).setNumberFormat('@').setValues(row); ids.push(id); }
}
