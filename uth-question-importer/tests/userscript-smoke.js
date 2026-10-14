import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const toolRoot = path.resolve(root, '..');
const manifest = JSON.parse(await fs.readFile(path.join(root, 'manifest.json'), 'utf8'));
const userscript = path.join(toolRoot, `UTH-Question-Importer-v${manifest.version}.user.js`);
const userscriptSource = await fs.readFile(userscript, 'utf8');
const withoutServerScripts = html => html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
const bankHtml = withoutServerScripts(await fs.readFile(path.join(toolRoot, 'edit.html'), 'utf8'));
const formHtml = withoutServerScripts(await fs.readFile(path.join(toolRoot, 'bank-editquestion.html'), 'utf8'));
const harness = `<script>
globalThis.unsafeWindow=globalThis;
globalThis.GM_getValue=(key,fallback)=>{const value=localStorage.getItem('gm:'+key);return value===null?fallback:JSON.parse(value)};
globalThis.GM_setValue=(key,value)=>localStorage.setItem('gm:'+key,JSON.stringify(value));
globalThis.GM_deleteValue=key=>localStorage.removeItem('gm:'+key);
globalThis.GM_addStyle=css=>{const style=document.createElement('style');style.textContent=css;document.head.append(style);return style};
</script><script src="/userscript.js"></script>`;
const injectHarness = html => html.replace('</body>', `${harness}</body>`);
const saved = [];
const server = http.createServer(async (request, response) => {
  const pathname = new URL(request.url, 'http://localhost').pathname;
  if (pathname === '/userscript.js') {
    response.setHeader('Content-Type', 'text/javascript; charset=utf-8');
    response.end(userscriptSource);
    return;
  }
  if (request.method === 'POST') {
    let body = '';
    for await (const chunk of request) body += chunk;
    const form = new URLSearchParams(body);
    saved.push({id:form.get('idnumber') || form.get('id_idnumber'), name:form.get('name') || form.get('id_name')});
    response.writeHead(303, {Location:`/question/edit.php?courseid=29790&category=551668%2C1287577&lastchanged=${9000 + saved.length}`});
    response.end();
    return;
  }
  response.setHeader('Content-Type', 'text/html; charset=utf-8');
  if (pathname === '/question/bank/editquestion/question.php') {
    response.end(injectHarness(formHtml));
    return;
  }
  const rows = saved.map((question, index) => `<tr><td><input id="checkq${9001 + index}"></td><td>${question.name || ''}</td></tr>`).join('');
  response.end(injectHarness(bankHtml.replace('</tbody>', `${rows}</tbody>`)));
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));

let browser;
try {
  browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: true
  });
  const page = await browser.newPage({viewport:{width:1360,height:900}});
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const origin = `http://127.0.0.1:${server.address().port}`;
  await page.goto(`${origin}/question/edit.php?courseid=29790&category=551668%2C1287577&lastchanged=15109162`);
  await page.waitForSelector('#uthi-launcher');
  await page.locator('#uthi-launcher').click();
  assert.equal(await page.evaluate(() => typeof globalThis.XLSX), 'undefined');
  await page.locator('#uthi-file').setInputFiles(path.join(root, 'UTH-cau-hoi-mau.xlsx'));
  await page.waitForFunction(() => document.querySelector('#uthi-validation')?.textContent.includes('1 câu hợp lệ'));
  assert.equal(await page.evaluate(() => typeof globalThis.XLSX), 'object');
  await page.locator('#uthi-file').setInputFiles(path.resolve(toolRoot, '../Flip Flop/FF-T.md'));
  await page.waitForFunction(() => document.querySelector('#uthi-validation')?.textContent.includes('15 câu hợp lệ'));
  assert.equal(await page.locator('#uthi-start').isEnabled(), true);
  await page.locator('#uthi-preview-button').click();
  assert.match(await page.locator('.uthi-correct').textContent(), /^Choice 1/);
  await page.locator('#uthi-preview-close').click();
  await page.locator('#uthi-start').click();
  await page.waitForURL('**/question/bank/editquestion/question.php?**');
  await page.waitForFunction(() => document.querySelector('#id_name')?.value?.startsWith('[FF-T-001]'));
  assert.equal(await page.locator('#id_answernumbering').inputValue(), 'none');
  assert.notEqual(await page.locator('#id_answer_0').inputValue(), '<p></p>');
  assert.equal(await page.locator('#uthi-overlay').evaluate(element => element.classList.contains('uthi-open')), true);
  assert.match(await page.locator('#uthi-job-status').textContent(), /Đã điền FF-T-001/);
  page.once('dialog', dialog => dialog.accept());
  await page.locator('#uthi-auto').click();
  try {
    await page.waitForFunction(() => document.querySelector('#uthi-job-status')?.textContent.includes('Hoàn tất tất cả câu hỏi.'), null, {timeout:45000});
  } catch (error) {
    console.error({saved, errors, url:page.url(), status:await page.locator('#uthi-job-status').textContent().catch(() => ''), job:await page.evaluate(() => localStorage.getItem('gm:uth-question-importer-job-v1')).catch(() => '')});
    throw error;
  }
  assert.equal(saved.length, 15);
  assert.equal(new Set(saved.map(question => question.id)).size, 15);
  await fs.mkdir(path.join(root, 'test-results'), {recursive:true});
  await page.screenshot({path:path.join(root, 'test-results/userscript.png'), fullPage:true});
  assert.deepEqual(errors, []);
  console.log('PASS: userscript previews Choice 1, fills the first review question, then auto-saves all 15 Markdown questions.');
} finally {
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
}
