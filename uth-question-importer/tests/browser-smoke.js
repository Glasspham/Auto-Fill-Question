import {chromium} from 'playwright';
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const server=http.createServer(async(req,res)=>{
  const target=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
  if(!target.startsWith(root)){res.writeHead(403).end();return;}
  try{const bytes=await fs.readFile(target);res.setHeader('Content-Type',({'html':'text/html; charset=utf-8','js':'text/javascript; charset=utf-8','css':'text/css'})[target.split('.').pop()]||'application/octet-stream');res.end(bytes);}catch{res.writeHead(404).end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
let browser;
try{
  browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
  const page=await browser.newPage({viewport:{width:1360,height:1100}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`http://127.0.0.1:${server.address().port}/dashboard.html`);
  const firstTheme=await page.locator('html').getAttribute('data-theme'),firstBg=await page.locator('html').evaluate(el=>getComputedStyle(el).backgroundColor),toggleBox=await page.locator('#themeToggle').boundingBox();
  assert.ok(['light','dark'].includes(firstTheme));assert.equal(Math.round(toggleBox.width),Math.round(toggleBox.height));
  assert.equal(await page.locator('#themeToggle span').textContent(),firstTheme==='dark'?'☾':'☀');
  await page.locator('#themeToggle').click();const switched=firstTheme==='dark'?'light':'dark';assert.equal(await page.locator('html').getAttribute('data-theme'),switched);await page.waitForTimeout(250);assert.notEqual(await page.locator('html').evaluate(el=>getComputedStyle(el).backgroundColor),firstBg);
  await page.reload();assert.equal(await page.locator('html').getAttribute('data-theme'),switched);if(switched==='dark')await page.locator('#themeToggle').click();
  await page.getByRole('button',{name:'Xem dữ liệu mẫu'}).click();
  await page.waitForSelector('dialog[open] .correct');assert.equal(await page.locator('.correct').textContent(),'Choice 1 — Phương án B  ✓ Đúng');
  assert.equal(await page.locator('#template').isVisible(),true);assert.equal(await page.locator('#xml').isVisible(),false);
  const downloadEvent=page.waitForEvent('download');await page.locator('#template').click();const download=await downloadEvent;
  await download.saveAs(path.join(root,'UTH-cau-hoi-mau.xlsx'));
  await page.locator('#closePreview').click();assert.equal(await page.locator('#previewDialog').isVisible(),false);
  await page.locator('#infoButton').click();assert.match(await page.locator('#rulesDialog').textContent(),/Markdown \/ TXT/);await page.locator('#closeRules').click();
  await page.locator('#file').setInputFiles(path.join(root,'UTH-cau-hoi-mau.xlsx'));
  await page.waitForFunction(()=>document.querySelector('#validation').textContent.includes('1 câu hợp lệ'));
  assert.equal(await page.locator('#xml').isEnabled(),true);
  await page.locator('#openPreview').click();assert.equal(await page.locator('#xml').isVisible(),true);assert.equal(await page.locator('#template').isVisible(),false);await page.keyboard.press('Escape');assert.equal(await page.locator('#previewDialog').isVisible(),false);
  await page.locator('#file').setInputFiles(path.resolve(root,'../tests/fixtures/sample-questions.md'));
  await page.waitForFunction(()=>document.querySelector('#validation').textContent.includes('3 câu hợp lệ'));
  assert.match(await page.locator('#fileName').textContent(),/nhận diện 3 câu/);
  await page.locator('#openPreview').click();assert.match(await page.locator('.correct').textContent(),/^Choice 1/);await page.locator('#closePreview').click();
  await page.locator('#demo').click();await page.locator('#closePreview').click();assert.equal(await page.locator('#xml').isEnabled(),true);
  await page.locator('#file').setInputFiles({name:'invalid.csv',mimeType:'text/csv',buffer:Buffer.from('ma_cau,noi_dung,A,B,dap_an_dung\nBAD,Câu lỗi,A,B,Z')});
  await page.waitForFunction(()=>document.querySelector('#validation').textContent.includes('dap_an_dung'));
  assert.equal(await page.locator('#xml').isEnabled(),false);
  await page.locator('#demo').click();
  await fs.mkdir(path.join(root,'test-results'),{recursive:true});await page.screenshot({path:path.join(root,'test-results/preview.png'),fullPage:true});
  await page.setViewportSize({width:390,height:844});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.locator('#closePreview').click();
  const connectedPage=await browser.newPage({viewport:{width:1360,height:1100}});
  connectedPage.on('pageerror',e=>errors.push(e.message));
  await connectedPage.addInitScript(()=>{
    globalThis.chrome ||= {};
    Object.assign(globalThis.chrome,{
      runtime:{id:'test',async sendMessage(message){globalThis.lastMessage=message;return {result:message.type==='inspect'?{kind:'bank',course:'29790',category:'1',editing:false,categories:[{value:'1',label:'D-FLIPFLOP'},{value:'2',label:'T-FLIPFLOP'}]}:{ok:true}};}},
      tabs:{async query(){return [{id:123,title:'UTH fixture'}];}},
      storage:{onChanged:{addListener(){}},local:{async get(){return {};}}}
    });
  });
  await connectedPage.goto(`http://127.0.0.1:${server.address().port}/dashboard.html?tab=123`);
  await connectedPage.waitForFunction(()=>!document.querySelector('#category').disabled);
  assert.equal(await connectedPage.locator('#tabs').isVisible(),false);
  await connectedPage.locator('#category').selectOption('2');
  await connectedPage.locator('#refresh').click();assert.equal(await connectedPage.locator('#category').inputValue(),'2');
  await connectedPage.locator('#file').setInputFiles(path.join(root,'UTH-cau-hoi-mau.xlsx'));
  await connectedPage.waitForFunction(()=>!document.querySelector('#start').disabled);
  assert.equal(await connectedPage.locator('#startReason').textContent(),'Sẵn sàng');
  await connectedPage.locator('#themeToggle').click();await connectedPage.waitForTimeout(250);assert.equal(await connectedPage.locator('#themeToggle span').textContent(),'☾');
  await connectedPage.screenshot({path:path.join(root,'test-results/dark-mode.png'),fullPage:true});await connectedPage.locator('#themeToggle').click();
  await connectedPage.locator('#openPreview').click();assert.match(await connectedPage.locator('#preview').textContent(),/T-FLIPFLOP/);
  await connectedPage.locator('#closePreview').click();
  await connectedPage.locator('#start').click();
  assert.equal(await connectedPage.evaluate(()=>lastMessage.mode),'review');assert.equal(await connectedPage.evaluate(()=>lastMessage.selectedCategory),'2');
  await connectedPage.screenshot({path:path.join(root,'test-results/dashboard.png'),fullPage:true});
  const stalePage=await browser.newPage({viewport:{width:1100,height:850}});
  stalePage.on('pageerror',e=>errors.push(e.message));
  await stalePage.addInitScript(()=>{
    globalThis.chrome ||= {};
    Object.assign(globalThis.chrome,{
      runtime:{id:'test',async sendMessage(message){globalThis.lastMessage=message;return {result:message.type==='inspect'?{kind:'bank',course:'29790',category:'1,100',editing:false,categories:[{value:'1,100',label:'T-FLIPFLOP'}]}:{ok:true}};}},
      tabs:{async query(){return [{id:123,title:'UTH fixture'}];}},
      storage:{onChanged:{addListener(){}},local:{async get(){return {job:{tabId:123,course:'29790',phase:'review',running:false,index:0,questions:[{id:'OLD-1'},{id:'OLD-2'}],logs:['old'],message:'Đang chờ kiểm tra.'}};}}}
    });
  });
  await stalePage.goto(`http://127.0.0.1:${server.address().port}/dashboard.html?tab=123`);
  await stalePage.locator('#file').setInputFiles(path.join(root,'UTH-cau-hoi-mau.xlsx'));
  await stalePage.waitForFunction(()=>document.querySelector('#startReason').textContent==='Chờ kiểm tra');
  assert.equal(await stalePage.locator('#start').isDisabled(),true);assert.equal(await stalePage.locator('#discardJob').isVisible(),false);assert.equal(await stalePage.locator('#autoContinue').isVisible(),true);
  await stalePage.screenshot({path:path.join(root,'test-results/review-actions.png'),fullPage:true});
  stalePage.once('dialog',dialog=>dialog.accept());await stalePage.locator('#autoContinue').click();assert.equal(await stalePage.evaluate(()=>lastMessage.type),'auto');
  assert.deepEqual(errors,[]);console.log('PASS: Chrome modal, XLSX/CSV/Markdown fixture, correct-first preview, category selection + start payload, mobile width.');
}finally{await browser?.close();server.close();}
