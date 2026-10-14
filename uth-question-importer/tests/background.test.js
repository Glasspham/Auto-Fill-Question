import test from 'node:test';
import assert from 'node:assert/strict';
import {sample} from '../core.js';
let stored={},listener,updated,alarm,snapshot,submitCount=0,actions=[];
const url='https://courses.ut.edu.vn/question/edit.php?courseid=29790&cat=551668%2C1287577&lastchanged=10';
globalThis.chrome={
  storage:{local:{async get(){return structuredClone(stored);},async set(v){stored=structuredClone({...stored,...v});}}},
  runtime:{getURL:p=>'chrome-extension://test/'+p,onMessage:{addListener:f=>listener=f},onStartup:{addListener(){}}},
  action:{onClicked:{addListener(){}}},
  tabs:{async get(){return {url,status:'complete'};},async update(id,data){actions.push(['navigate',data.url]);},onUpdated:{addListener:f=>updated=f}},
  alarms:{create(){},onAlarm:{addListener:f=>alarm=f}},
  scripting:{async executeScript({args}){const action=args[0];actions.push([action]);if(action==='inspect')return [{result:structuredClone(snapshot)}];if(action==='submit'){assert.equal(stored.job.phase,'submitting','persist submission before clicking');submitCount++;}return [{result:{ok:true}}];}}
};
await import('../background.js');
const message=(type,data={})=>new Promise((resolve,reject)=>listener({type,...data},{url:'chrome-extension://test/dashboard.html'},r=>r.error?reject(Error(r.error)):resolve(r.result)));
const settle=()=>new Promise(resolve=>setTimeout(resolve,15));
function reset(kind='bank') {stored={};actions=[];submitCount=0;snapshot={kind,url,course:'29790',category:'551668,1287577',categories:[],rows:[],errors:[],lastchanged:'10',editing:false,hasName:false,hasText:false};}
test('auto flow opens, fills, submits once and confirms server row',async()=>{
  reset();await message('start',{tabId:1,rows:[sample],mode:'auto'});assert.equal(stored.job.phase,'opening');
  snapshot.kind='form';updated(1,{status:'complete'});await settle();assert.equal(submitCount,1);assert.equal(stored.job.phase,'submitting');
  snapshot.kind='bank';snapshot.lastchanged='11';snapshot.rows=[{id:'11',text:stored.job.questions[0].name}];updated(1,{status:'complete'});await settle();
  assert.equal(stored.job.phase,'done');assert.equal(stored.job.results[0].questionId,'11');assert.equal(submitCount,1);
});
test('timeout never retries POST; user must reconcile',async()=>{
  reset('form');await message('start',{tabId:1,rows:[sample],mode:'auto'});assert.equal(submitCount,1);
  stored.job.submittedAt=Date.now()-60000;alarm();await settle();assert.equal(stored.job.phase,'uncertain');
  alarm();await settle();assert.equal(submitCount,1);await assert.rejects(message('resume'),/xử lý/);
  await message('notSaved');assert.equal(stored.job.phase,'paused');
});
test('review fills without submitting; existing batch prevents replacement',async()=>{
  reset('form');await message('start',{tabId:1,rows:[sample],mode:'review'});assert.equal(stored.job.phase,'review');assert.equal(submitCount,0);
  await assert.rejects(message('start',{tabId:1,rows:[sample]}),/Đợt trước/);
  await message('save');assert.equal(submitCount,1);
});
test('switching from reviewed first question to auto saves it then continues in auto mode',async()=>{
  reset('form');await message('start',{tabId:1,rows:[sample],mode:'review'});assert.equal(stored.job.phase,'review');assert.equal(submitCount,0);
  await message('auto');assert.equal(stored.job.mode,'auto');assert.equal(stored.job.phase,'submitting');assert.equal(submitCount,1);
  assert.ok(stored.job.logs.some(line=>line.includes('Auto hoàn thành')));
});
test('refuses filled form and skips processing after pause',async()=>{
  reset('form');snapshot.hasName=true;await message('start',{tabId:1,rows:[sample],mode:'auto'});assert.equal(stored.job.phase,'paused');assert.equal(submitCount,0);
  assert.ok(!actions.some(a=>a[0]==='fill'));alarm();await settle();assert.equal(submitCount,0);
});
test('selected category overrides file category and rejects options from another tab',async()=>{
  reset();snapshot.categories=[{value:'551670',label:'JK-FLIPFLOP'}];
  await message('start',{tabId:1,rows:[{...sample,danh_muc:'D-FLIPFLOP'}],selectedCategory:'551670',mode:'review'});
  assert.equal(stored.job.questions[0].category,'551670');
  assert.equal(new URL(actions.find(a=>a[0]==='navigate')[1]).searchParams.get('category'),'551670');
  reset('form');snapshot.categories=[];
  await assert.rejects(message('start',{tabId:1,rows:[sample],selectedCategory:'STALE'}),/không còn/);
});
