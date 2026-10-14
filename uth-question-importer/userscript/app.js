const USERSCRIPT_STORAGE_KEY = 'uth-question-importer-job-v1';
const USERSCRIPT_ICON = '__UTH_ICON_DATA__';
const XLSX_GZIP_BASE64 = '__XLSX_GZIP_BASE64__';
let xlsxLoader;
async function ensureXLSX() {
  if (globalThis.XLSX) return globalThis.XLSX;
  if (!xlsxLoader) xlsxLoader = (async () => {
    if (typeof DecompressionStream !== 'function') throw Error('Trình duyệt không hỗ trợ nạp Excel theo yêu cầu. Hãy cập nhật Chrome.');
    const binary = atob(XLSX_GZIP_BASE64);
    const bytes = Uint8Array.from(binary, character => character.charCodeAt(0));
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
    const source = await new Response(stream).text();
    Function(source)();
    if (!globalThis.XLSX) throw Error('Không thể khởi tạo bộ đọc Excel.');
    return globalThis.XLSX;
  })();
  return xlsxLoader;
}
const $u = id => document.getElementById(id);
const node = (tag, text, className) => {
  const element = document.createElement(tag);
  element.textContent = text;
  if (className) element.className = className;
  return element;
};

GM_addStyle(`
#uthi-launcher{position:fixed;right:22px;bottom:22px;z-index:2147483645;width:58px;height:58px;border:0;border-radius:50%;padding:9px;background:#fff;box-shadow:0 8px 28px #061d1a55;cursor:pointer}#uthi-launcher img{display:block;width:100%;height:100%;object-fit:contain}
#uthi-overlay{position:fixed;inset:0;z-index:2147483646;display:none;align-items:center;justify-content:center;padding:18px;background:#071b18a8;backdrop-filter:blur(4px);font:15px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif;color:#123431}#uthi-overlay.uthi-open{display:flex}
#uthi-panel{width:min(1080px,100%);max-height:94vh;overflow:auto;background:#f2f7f6;border:1px solid #bfd0cc;border-radius:18px;box-shadow:0 24px 90px #0008}#uthi-panel *{box-sizing:border-box}#uthi-panel button,#uthi-panel input,#uthi-panel select{font:inherit}#uthi-panel button{border:1px solid #08766c;border-radius:8px;padding:9px 14px;background:#08766c;color:#fff;cursor:pointer}#uthi-panel button.uthi-secondary{background:#fff;color:#14665e;border-color:#b9ccc7}#uthi-panel button.uthi-danger{background:#fff;color:#a43b37;border-color:#d7aaa7}#uthi-panel button:disabled{opacity:.45;cursor:not-allowed}
.uthi-head{position:sticky;top:0;z-index:3;display:flex;align-items:center;gap:12px;padding:14px 18px;background:#f2f7f6;border-bottom:1px solid #d5e2df}.uthi-head img{width:42px;height:42px;object-fit:contain}.uthi-title{min-width:0;flex:1}.uthi-title strong{display:block;font-size:18px}.uthi-title small{color:#5c726d}.uthi-icon-button{width:40px;height:40px;padding:0!important;border-radius:50%!important;font-size:20px!important}.uthi-body{padding:18px}.uthi-grid{display:grid;grid-template-columns:1.08fr 1fr;gap:16px}.uthi-card{background:#fff;border:1px solid #dbe5e2;border-radius:14px;padding:18px}.uthi-card h3{margin:0 0 12px;font-size:18px}.uthi-card label{display:block;font-weight:650;margin:12px 0 5px}.uthi-card input[type=file],.uthi-card select{display:block;width:100%;padding:9px;border:1px solid #b8cbc5;background:#fff;color:inherit;border-radius:8px}.uthi-upload{padding:14px;border:2px dashed #b3d6cd;border-radius:10px;background:#f8fbfa}.uthi-actions{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:12px}.uthi-muted{font-size:13px;color:#5c726d}.uthi-success{color:#10734f}.uthi-error{color:#ad2929;white-space:pre-wrap}.uthi-status{display:inline-flex;align-items:center;gap:7px;padding:5px 9px;border-radius:8px;background:#d9eeea;color:#126458;font-size:12px;font-weight:750;text-transform:uppercase}.uthi-status:before{content:"";width:7px;height:7px;border-radius:50%;background:currentColor}.uthi-status[data-state=active]{background:#dbe9f5;color:#175a88}.uthi-status[data-state=warning]{background:#f9dddd;color:#9c3431}.uthi-status[data-state=review]{background:#fff0c9;color:#8a5a00}.uthi-progress{margin-top:16px}.uthi-progress progress{width:100%;height:14px;accent-color:#08766c}.uthi-next{padding:10px 12px;background:#eef7f5;border-left:4px solid #08766c;border-radius:7px}.uthi-logs{max-height:150px;overflow:auto;white-space:pre-wrap;font:12px/1.55 ui-monospace,monospace;color:#526a63}.uthi-footer{text-align:center;padding:12px;color:#5c726d;font-size:12px}.uthi-footer a{color:#08766c;font-weight:700;text-decoration:none}
#uthi-preview{width:min(760px,calc(100vw - 30px));max-height:86vh;overflow:auto;border:1px solid #dbe5e2;border-radius:15px;padding:20px;color:#123431;background:#fff}#uthi-preview::backdrop{background:#071b18aa;backdrop-filter:blur(3px)}.uthi-answer{padding:9px 12px;margin:7px 0;border-radius:7px;background:#f2f6f5}.uthi-correct{background:#e0f4e9;border-left:4px solid #138453}
#uthi-panel[data-theme=dark]{background:#091412;color:#e4efed;border-color:#2c413e}#uthi-panel[data-theme=dark] .uthi-head{background:#091412;border-color:#2c413e}#uthi-panel[data-theme=dark] .uthi-card,#uthi-panel[data-theme=dark] #uthi-preview{background:#12211f;border-color:#2c413e;color:#e4efed}#uthi-panel[data-theme=dark] input,#uthi-panel[data-theme=dark] select{background:#0c1917;color:#e4efed;border-color:#3b514d}#uthi-panel[data-theme=dark] .uthi-upload{background:#0d1b19;border-color:#3d6c64}#uthi-panel[data-theme=dark] button.uthi-secondary{background:#152825;color:#9cddd2;border-color:#46605c}#uthi-panel[data-theme=dark] button.uthi-danger{background:#251b1b;color:#f1aaa7;border-color:#754744}#uthi-panel[data-theme=dark] .uthi-muted,#uthi-panel[data-theme=dark] .uthi-title small,#uthi-panel[data-theme=dark] .uthi-footer{color:#9bb0ac}#uthi-panel[data-theme=dark] .uthi-answer{background:#1a2b28}#uthi-panel[data-theme=dark] .uthi-correct{background:#163a2d}#uthi-panel[data-theme=dark] .uthi-next{background:#17302c}#uthi-panel[data-theme=dark] .uthi-logs{color:#a9bbb7}
@media(max-width:760px){#uthi-overlay{padding:0;align-items:stretch}#uthi-panel{max-height:100vh;border-radius:0}.uthi-grid{grid-template-columns:1fr}.uthi-body{padding:12px}#uthi-launcher{right:12px;bottom:12px;width:52px;height:52px}}
`);

document.body.insertAdjacentHTML('beforeend', `
  <button id="uthi-launcher" type="button" title="Mở UTH Question Importer" aria-label="Mở UTH Question Importer"><img src="${USERSCRIPT_ICON}" alt=""></button>
  <div id="uthi-overlay" role="presentation">
    <section id="uthi-panel" role="dialog" aria-modal="true" aria-labelledby="uthi-heading">
      <div class="uthi-head">
        <img src="${USERSCRIPT_ICON}" alt="UTH">
        <div class="uthi-title"><strong id="uthi-heading">UTH Question Importer</strong><small>Tampermonkey · Excel, CSV, Markdown và TXT</small></div>
        <button id="uthi-theme" class="uthi-secondary uthi-icon-button" type="button" title="Đổi giao diện">☀</button>
        <button id="uthi-close" class="uthi-secondary uthi-icon-button" type="button" title="Đóng">×</button>
      </div>
      <div class="uthi-body">
        <div class="uthi-grid">
          <section class="uthi-card">
            <h3>1. Chuẩn bị câu hỏi</h3>
            <label class="uthi-upload">Chọn Excel, CSV, Markdown hoặc TXT UTF-8
              <input id="uthi-file" type="file" accept=".xlsx,.csv,.md,.txt">
            </label>
            <p id="uthi-file-name" class="uthi-muted">Chưa chọn file · tối đa 5 MB / 1000 câu</p>
            <div id="uthi-validation" role="status"></div>
            <div class="uthi-actions"><button id="uthi-preview-button" class="uthi-secondary" disabled>Xem trước câu hỏi</button></div>
          </section>
          <section class="uthi-card">
            <h3>2. Kết nối trang Moodle</h3>
            <button id="uthi-refresh" class="uthi-secondary" type="button">Đọc lại trang và danh mục</button>
            <p id="uthi-connection" class="uthi-muted">Đang kiểm tra trang hiện tại…</p>
            <label>Danh mục cho đợt nhập<select id="uthi-category" disabled><option value="">Theo file / danh mục hiện tại</option></select></label>
            <div class="uthi-actions"><button id="uthi-start" disabled>Bắt đầu</button><span id="uthi-start-status" class="uthi-status" data-state="waiting">Chờ file</span></div>
          </section>
        </div>
        <section class="uthi-card uthi-progress">
          <h3>Tiến độ và thao tác</h3>
          <progress id="uthi-progress" value="0" max="1"></progress>
          <p id="uthi-job-status">Chưa có đợt nhập.</p>
          <p id="uthi-next" class="uthi-next" hidden></p>
          <div class="uthi-actions">
            <button id="uthi-save" hidden>Lưu &amp; xem câu tiếp theo</button>
            <button id="uthi-auto" hidden>Auto hoàn thành phần còn lại</button>
            <button id="uthi-pause" class="uthi-secondary" hidden>Tạm dừng</button>
            <button id="uthi-resume" hidden>Tiếp tục</button>
            <button id="uthi-confirm-saved" class="uthi-secondary" hidden>Xác nhận: câu đã lưu</button>
            <button id="uthi-confirm-not-saved" class="uthi-secondary" hidden>Xác nhận: câu chưa lưu</button>
            <button id="uthi-cancel" class="uthi-danger" hidden>Kết thúc đợt</button>
          </div>
          <p id="uthi-notice" class="uthi-error" role="alert"></p>
          <pre id="uthi-logs" class="uthi-logs"></pre>
        </section>
      </div>
      <div class="uthi-footer">Được tạo bởi <a href="https://github.com/Glasspham" target="_blank" rel="noopener noreferrer">Glasspham</a>.</div>
    </section>
  </div>
  <dialog id="uthi-preview">
    <div class="uthi-actions"><strong style="flex:1">Xem trước câu hỏi</strong><button id="uthi-preview-close" class="uthi-secondary">Đóng</button></div>
    <label>Chọn câu<select id="uthi-preview-select"></select></label>
    <div id="uthi-preview-content"></div>
    <div class="uthi-actions"><button id="uthi-export-xml" class="uthi-secondary">Xuất Moodle XML</button></div>
  </dialog>
`);

let sourceRows = [];
let sourceDefaults = {};
let parsedQuestions = [];
let fileValid = false;
let pageSnapshot = null;
let pumpLock = false;

const readJob = () => GM_getValue(USERSCRIPT_STORAGE_KEY, null);
const writeJob = job => {
  job.updated = Date.now();
  GM_setValue(USERSCRIPT_STORAGE_KEY, job);
  renderJob(job);
};
const appendLog = (job, message) => {
  job.message = message;
  (job.logs ||= []).push(`${new Date().toLocaleString('vi-VN')} — ${message}`);
};
const showPanel = () => $u('uthi-overlay').classList.add('uthi-open');
const hidePanel = () => $u('uthi-overlay').classList.remove('uthi-open');
const setNotice = (message = '', success = false) => {
  const target = $u('uthi-notice');
  target.textContent = message;
  target.className = success ? 'uthi-success' : 'uthi-error';
};
const safeRun = handler => async event => {
  setNotice();
  try { await handler(event); }
  catch (error) { setNotice(error?.message || String(error)); showPanel(); }
};

function renderStartState() {
  const job = readJob();
  const unfinished = job && !['done', 'cancelled'].includes(job.phase);
  const connected = pageSnapshot && ['bank', 'form'].includes(pageSnapshot.kind) && !pageSnapshot.editing && pageSnapshot.course && pageSnapshot.category;
  $u('uthi-start').disabled = !fileValid || !connected || !!unfinished;
  let text = 'Sẵn sàng', state = 'ready';
  if (!fileValid) { text = 'Chờ file'; state = 'waiting'; }
  else if (!connected) { text = 'Chờ kết nối'; state = 'warning'; }
  else if (unfinished) {
    if (job.phase === 'review') { text = 'Chờ kiểm tra'; state = 'review'; }
    else if (job.running) { text = 'Đang tiến hành…'; state = 'active'; }
    else if (job.phase === 'uncertain') { text = 'Cần đối chiếu'; state = 'warning'; }
    else { text = 'Đã tạm dừng'; state = 'waiting'; }
  }
  $u('uthi-start-status').textContent = text;
  $u('uthi-start-status').dataset.state = state;
}

function renderJob(job = readJob()) {
  renderStartState();
  if (!job) {
    $u('uthi-progress').max = 1;
    $u('uthi-progress').value = 0;
    $u('uthi-job-status').textContent = 'Chưa có đợt nhập.';
    $u('uthi-logs').textContent = '';
    return;
  }
  const total = job.questions?.length || 0;
  const reviewing = job.phase === 'review';
  const uncertain = job.phase === 'uncertain';
  const paused = job.phase === 'paused';
  const remaining = Math.max(0, total - job.index - 1);
  $u('uthi-progress').max = total || 1;
  $u('uthi-progress').value = job.index || 0;
  $u('uthi-job-status').textContent = `${job.index}/${total} câu · ${job.message || job.phase}`;
  $u('uthi-logs').textContent = (job.logs || []).join('\n');
  $u('uthi-save').hidden = !reviewing;
  $u('uthi-save').textContent = remaining ? 'Lưu & xem câu tiếp theo' : 'Lưu & hoàn tất';
  $u('uthi-auto').hidden = !reviewing || remaining < 1;
  $u('uthi-pause').hidden = !job.running || job.phase === 'submitting';
  $u('uthi-resume').hidden = !paused;
  $u('uthi-confirm-saved').hidden = !['review', 'uncertain', 'paused'].includes(job.phase);
  $u('uthi-confirm-saved').textContent = reviewing ? 'Tôi đã tự lưu trên Moodle' : 'Xác nhận: câu đã lưu';
  $u('uthi-confirm-not-saved').hidden = !uncertain;
  $u('uthi-cancel').hidden = job.running || uncertain || ['done', 'cancelled'].includes(job.phase);
  $u('uthi-next').hidden = !reviewing;
  $u('uthi-next').textContent = reviewing ? (remaining ? 'Kiểm tra câu đang được điền trên Moodle. Sau đó lưu từng câu hoặc chọn Auto hoàn thành.' : 'Đây là câu cuối. Kiểm tra rồi chọn “Lưu & hoàn tất”.') : '';
  if (reviewing || uncertain) showPanel();
}

async function refreshConnection() {
  pageSnapshot = await pageTask('inspect', null, null);
  const connected = ['bank', 'form'].includes(pageSnapshot.kind) && !pageSnapshot.editing && pageSnapshot.course && pageSnapshot.category;
  $u('uthi-connection').textContent = connected
    ? `Đã kết nối khóa học ${pageSnapshot.course}. Trang hiện tại: ${pageSnapshot.kind === 'bank' ? 'ngân hàng câu hỏi' : 'form Nhiều lựa chọn'}.`
    : 'Hãy mở ngân hàng câu hỏi hoặc form tạo mới loại Nhiều lựa chọn.';
  const previous = $u('uthi-category').value;
  const fallback = node('option', 'Theo file / danh mục hiện tại');
  fallback.value = '';
  const options = (pageSnapshot.categories || []).map(category => {
    const option = node('option', `${category.label} — ${category.value}`);
    option.value = category.value;
    option.dataset.label = category.label;
    return option;
  });
  $u('uthi-category').replaceChildren(fallback, ...options);
  if (options.some(option => option.value === previous)) $u('uthi-category').value = previous;
  $u('uthi-category').disabled = !connected || !!readJob()?.running;
  renderStartState();
  return pageSnapshot;
}

function validateSource() {
  const result = validateRows(sourceRows, sourceDefaults);
  parsedQuestions = result.questions;
  fileValid = result.errors.length === 0;
  $u('uthi-validation').replaceChildren(...(fileValid
    ? [node('p', `${parsedQuestions.length} câu hợp lệ. Hãy xem trước trước khi nhập.`, 'uthi-success')]
    : result.errors.map(error => node('p', error, 'uthi-error'))));
  $u('uthi-preview-button').disabled = !parsedQuestions.length;
  $u('uthi-preview-button').textContent = `Xem trước ${parsedQuestions.length} câu hỏi`;
  renderStartState();
}

async function readSelectedFile() {
  sourceRows = [];
  sourceDefaults = {};
  parsedQuestions = [];
  fileValid = false;
  const file = $u('uthi-file').files[0];
  if (!file) { validateSource(); return; }
  if (file.size > 5 * 1024 * 1024) throw Error('File vượt quá 5 MB.');
  const buffer = await file.arrayBuffer();
  const lower = file.name.toLowerCase();
  const isCSV = lower.endsWith('.csv');
  const isText = lower.endsWith('.txt') || lower.endsWith('.md');
  if (isText) {
    const text = new TextDecoder('utf-8', {fatal:true}).decode(buffer);
    sourceRows = parseQuestionText(text, filePrefix(file.name));
    $u('uthi-file-name').textContent = `${file.name} · nhận diện ${sourceRows.length} câu`;
    validateSource();
    return;
  }
  const XLSX = await ensureXLSX();
  const workbook = XLSX.read(isCSV ? new TextDecoder('utf-8', {fatal:true}).decode(buffer) : buffer, {type:isCSV?'string':'array', cellFormula:true});
  const sheet = workbook.Sheets.CauHoi || (isCSV ? workbook.Sheets[workbook.SheetNames[0]] : null);
  if (!sheet) throw Error('Excel phải có sheet CauHoi.');
  if (XLSX.utils.decode_range(sheet['!ref'] || 'A1').e.r > 1001) throw Error('Sheet vượt 1000 dòng câu hỏi.');
  for (const currentSheet of [sheet, workbook.Sheets.CauHinh].filter(Boolean)) {
    for (const [cellName, cell] of Object.entries(currentSheet)) {
      if (!cellName.startsWith('!') && cell.f) throw Error(`Ô ${cellName} có công thức. Hãy chuyển thành giá trị trước khi nhập.`);
    }
  }
  const headers = XLSX.utils.sheet_to_json(sheet, {header:1, blankrows:false})[0] || [];
  if (new Set(headers.map(value => String(value).trim())).size !== headers.length) throw Error('File có tên cột trùng.');
  sourceRows = XLSX.utils.sheet_to_json(sheet, {defval:'', raw:false}).map(row => ({...row, __row:row.__rowNum__ + 1}));
  if (workbook.Sheets.CauHinh) {
    for (const row of XLSX.utils.sheet_to_json(workbook.Sheets.CauHinh, {defval:''})) {
      const key = String(row.thuoc_tinh || '').trim();
      if (!columns.includes(key)) throw Error(`CauHinh: thuộc tính không hợp lệ ${key}.`);
      sourceDefaults[key] = row.gia_tri;
    }
  }
  $u('uthi-file-name').textContent = file.name;
  validateSource();
}

function renderPreview() {
  const question = parsedQuestions[Number($u('uthi-preview-select').value)];
  if (!question) return;
  const category = $u('uthi-category').value ? $u('uthi-category').selectedOptions[0].textContent : question.category || 'Danh mục hiện tại';
  $u('uthi-preview-content').replaceChildren(
    node('h3', question.name),
    node('p', `Danh mục: ${category} · Điểm: ${question.mark} · ${question.status}`, 'uthi-muted'),
    node('p', question.text),
    ...question.answers.map((answer, index) => node('div', `Choice ${index + 1} — ${answer.text}${answer.key === question.correct ? '  ✓ Đúng' : ''}${answer.feedback ? '\nPhản hồi: ' + answer.feedback : ''}`, `uthi-answer ${answer.key === question.correct ? 'uthi-correct' : ''}`)),
    node('p', question.feedback ? `Giải thích: ${question.feedback}` : '')
  );
}

function openPreview() {
  $u('uthi-preview-select').replaceChildren(...parsedQuestions.map((question, index) => {
    const option = node('option', question.name);
    option.value = index;
    return option;
  }));
  renderPreview();
  $u('uthi-preview').showModal();
}

function download(name, data, type) {
  const url = URL.createObjectURL(new Blob([data], {type}));
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function stopJob(job, message, uncertain = false) {
  job.running = false;
  job.phase = uncertain ? 'uncertain' : 'paused';
  appendLog(job, message);
  writeJob(job);
}

async function submitCurrent(job) {
  job.phase = 'submitting';
  job.submittedAt = Date.now();
  appendLog(job, `Đang lưu ${job.questions[job.index].id}…`);
  writeJob(job);
  try { await pageTask('submit', job.questions[job.index], job.course); }
  catch (error) { await stopJob(job, `Chưa xác minh được lần lưu: ${error.message}`, true); }
}

async function pump() {
  if (pumpLock) return;
  const job = readJob();
  if (!job?.running) return;
  pumpLock = true;
  try {
    const snapshot = await pageTask('inspect', null, null);
    const question = job.questions[job.index];
    if (job.phase === 'submitting') {
      if (confirmsSave(snapshot, job, question)) {
        job.results.push({id:question.id, status:'saved', questionId:snapshot.lastchanged});
        job.index++;
        appendLog(job, `Đã xác minh lưu ${question.id}.`);
        if (job.index === job.questions.length) {
          job.running = false;
          job.phase = 'done';
          appendLog(job, 'Hoàn tất tất cả câu hỏi.');
          writeJob(job);
          showPanel();
          return;
        }
        job.phase = 'ready';
        writeJob(job);
      } else {
        if (snapshot.errors.length || snapshot.kind === 'other' || Date.now() - job.submittedAt > 45000) {
          await stopJob(job, `Chưa xác minh được câu vừa lưu. Hãy kiểm tra ngân hàng. ${snapshot.errors.join(' ')}`, true);
        }
        return;
      }
    }
    if (snapshot.course !== job.course) throw Error('Trang hiện tại không còn thuộc khóa học đã chọn.');
    const current = job.questions[job.index];
    if (snapshot.kind === 'bank') {
      if (snapshot.rows.some(row => row.text.includes(current.name))) throw Error(`Danh sách hiện tại đã có ${current.name}; hãy kiểm tra trùng.`);
      const next = new URL('/question/bank/editquestion/question.php', location.origin);
      next.searchParams.set('qtype', 'multichoice');
      next.searchParams.set('courseid', job.course);
      const targetCategory = /^\d+(,\d+)?$/.test(current.category) ? current.category : (snapshot.category || job.category);
      next.searchParams.set('category', String(targetCategory).split(',')[0]);
      next.searchParams.set('returnurl', location.pathname + location.search);
      job.before = snapshot.lastchanged;
      job.phase = 'opening';
      writeJob(job);
      location.assign(next.href);
      return;
    }
    if (snapshot.kind !== 'form' || snapshot.editing) throw Error('Hãy mở ngân hàng câu hỏi hoặc form tạo mới loại Nhiều lựa chọn.');
    if (snapshot.errors.length) throw Error(snapshot.errors.join(' '));
    if (!['ready', 'opening'].includes(job.phase)) throw Error('Tiến trình bị gián đoạn. Hãy kiểm tra form trước khi tiếp tục.');
    if (snapshot.hasName || snapshot.hasText) throw Error('Form đang có nội dung. Hãy mở form mới trống để tránh ghi đè.');
    job.phase = 'filling';
    writeJob(job);
    await pageTask('fill', current, job.course);
    if (job.mode === 'review') {
      job.running = false;
      job.phase = 'review';
      appendLog(job, `Đã điền ${current.id}. Hãy kiểm tra câu trên Moodle.`);
      writeJob(job);
      showPanel();
    } else {
      await submitCurrent(job);
    }
  } catch (error) {
    const current = readJob();
    if (current) await stopJob(current, error.message, current.phase === 'submitting');
  } finally {
    pumpLock = false;
  }
}

async function startImport() {
  if (!fileValid) throw Error('Hãy chọn file hợp lệ.');
  const snapshot = await refreshConnection();
  if (!['bank', 'form'].includes(snapshot.kind) || snapshot.editing || !snapshot.course || !snapshot.category) throw Error('Hãy mở ngân hàng có chọn danh mục hoặc form tạo mới.');
  const existing = readJob();
  if (existing && !['done', 'cancelled'].includes(existing.phase)) throw Error('Đợt trước chưa kết thúc.');
  const selectedCategory = $u('uthi-category').value;
  if (selectedCategory && !snapshot.categories.some(category => category.value === selectedCategory)) throw Error('Danh mục đã chọn không còn trên trang.');
  const result = validateRows(sourceRows, sourceDefaults);
  if (result.errors.length) throw Error(result.errors.join('\n'));
  const questions = result.questions.map(question => ({...question, category:selectedCategory || question.category || snapshot.category}));
  const job = {course:snapshot.course, category:snapshot.category, questions, index:0, results:[], logs:[], mode:'review', running:true, phase:'ready', before:snapshot.lastchanged};
  appendLog(job, 'Bắt đầu đợt nhập; đang chuẩn bị câu đầu tiên.');
  writeJob(job);
  hidePanel();
  await pump();
}

$u('uthi-launcher').addEventListener('click', safeRun(async () => { showPanel(); await refreshConnection(); renderJob(); }));
$u('uthi-close').addEventListener('click', hidePanel);
$u('uthi-overlay').addEventListener('click', event => { if (event.target === $u('uthi-overlay')) hidePanel(); });
$u('uthi-theme').addEventListener('click', () => {
  const panel = $u('uthi-panel');
  const dark = panel.dataset.theme === 'dark';
  panel.dataset.theme = dark ? 'light' : 'dark';
  $u('uthi-theme').textContent = dark ? '☀' : '☾';
  GM_setValue('uth-question-importer-theme', panel.dataset.theme);
});
$u('uthi-file').addEventListener('change', safeRun(readSelectedFile));
$u('uthi-refresh').addEventListener('click', safeRun(refreshConnection));
$u('uthi-start').addEventListener('click', safeRun(startImport));
$u('uthi-preview-button').addEventListener('click', openPreview);
$u('uthi-preview-close').addEventListener('click', () => $u('uthi-preview').close());
$u('uthi-preview-select').addEventListener('change', renderPreview);
$u('uthi-category').addEventListener('change', () => { if ($u('uthi-preview').open) renderPreview(); });
$u('uthi-export-xml').addEventListener('click', safeRun(async () => {
  const selected = $u('uthi-category').value;
  const exported = selected ? parsedQuestions.map(question => ({...question, category:$u('uthi-category').selectedOptions[0].dataset.label})) : parsedQuestions;
  if (exported.some(question => /^\d+(,\d+)?$/.test(question.category))) throw Error('Xuất XML cần tên danh mục, không dùng mã option.');
  download('UTH-cau-hoi.xml', moodleXML(exported), 'application/xml;charset=utf-8');
}));
$u('uthi-save').addEventListener('click', safeRun(async () => {
  const job = readJob();
  if (job?.phase !== 'review') throw Error('Không có câu đang chờ kiểm tra.');
  job.running = true;
  writeJob(job);
  hidePanel();
  await submitCurrent(job);
}));
$u('uthi-auto').addEventListener('click', safeRun(async () => {
  const job = readJob();
  if (job?.phase !== 'review') throw Error('Không có câu đang chờ kiểm tra.');
  if (!confirm(`Tool sẽ lưu câu hiện tại và tự hoàn thành ${job.questions.length - job.index - 1} câu còn lại. Tiếp tục?`)) return;
  job.mode = 'auto';
  job.running = true;
  appendLog(job, 'Đã chuyển sang Auto hoàn thành.');
  writeJob(job);
  hidePanel();
  await submitCurrent(job);
}));
$u('uthi-pause').addEventListener('click', safeRun(async () => {
  const job = readJob();
  if (!job || job.phase === 'submitting') throw Error('Không thể tạm dừng khi đang xác minh thao tác lưu.');
  await stopJob(job, 'Đã tạm dừng theo yêu cầu.');
}));
$u('uthi-resume').addEventListener('click', safeRun(async () => {
  const job = readJob();
  if (job?.phase !== 'paused') throw Error('Đợt nhập không ở trạng thái tạm dừng.');
  job.running = true;
  job.phase = 'ready';
  appendLog(job, 'Tiếp tục đợt nhập.');
  writeJob(job);
  hidePanel();
  await pump();
}));
$u('uthi-confirm-saved').addEventListener('click', safeRun(async () => {
  const job = readJob();
  if (!job || !['review', 'uncertain', 'paused'].includes(job.phase)) throw Error('Không có câu cần xác nhận.');
  if (!confirm('Bạn đã tìm thấy đúng mã câu hiện tại trong ngân hàng Moodle?')) return;
  job.results.push({id:job.questions[job.index].id, status:'user-confirmed'});
  job.index++;
  job.running = false;
  job.phase = job.index === job.questions.length ? 'done' : 'paused';
  appendLog(job, job.phase === 'done' ? 'Hoàn tất tất cả câu hỏi.' : 'Đã xác nhận câu; mở ngân hàng rồi bấm Tiếp tục.');
  writeJob(job);
}));
$u('uthi-confirm-not-saved').addEventListener('click', safeRun(async () => {
  const job = readJob();
  if (job?.phase !== 'uncertain') throw Error('Không có lần lưu cần đối chiếu.');
  if (!confirm('Bạn đã xác minh câu hiện tại chưa được tạo?')) return;
  job.phase = 'paused';
  job.running = false;
  appendLog(job, 'Đã xác nhận câu chưa lưu. Mở form mới trống hoặc ngân hàng rồi tiếp tục.');
  writeJob(job);
}));
$u('uthi-cancel').addEventListener('click', safeRun(async () => {
  const job = readJob();
  if (!job || job.running || job.phase === 'uncertain') throw Error('Hãy dừng và đối chiếu thao tác lưu trước khi kết thúc.');
  if (!confirm('Kết thúc đợt nhập? Các câu đã lưu trên Moodle vẫn được giữ.')) return;
  job.phase = 'cancelled';
  appendLog(job, 'Đã kết thúc đợt nhập.');
  writeJob(job);
}));

const initialTheme = GM_getValue('uth-question-importer-theme', matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
$u('uthi-panel').dataset.theme = initialTheme;
$u('uthi-theme').textContent = initialTheme === 'dark' ? '☾' : '☀';
renderJob();
refreshConnection().catch(() => { pageSnapshot = null; renderStartState(); });
const startupJob = readJob();
if (startupJob?.running) setTimeout(pump, 250);
else if (startupJob && ['review', 'uncertain'].includes(startupJob.phase)) showPanel();
setInterval(() => { if (readJob()?.running) pump(); }, 2500);
