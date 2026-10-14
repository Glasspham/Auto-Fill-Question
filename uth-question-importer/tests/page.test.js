import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';
import {pageTask} from '../page.js';
import {sample,validateRows} from '../core.js';
const source=fs.readFileSync(new URL('../../bank-editquestion.html',import.meta.url),'utf8');
function fixture(html=source,url='https://courses.ut.edu.vn/question/bank/editquestion/question.php?courseid=29790'){
  const dom=new JSDOM(html,{url});
  for(const key of ['window','document','location','Event'])globalThis[key]=dom.window[key];
  const editors=new Map([...document.querySelectorAll('textarea[data-fieldtype="editor"]')].map(el=>[el.id,{initialized:true,setContent(value){this.content=value;},save(){el.value=this.content||'';}}]));
  window.tinymce={get:id=>editors.get(id),triggerSave(){for(const e of editors.values())e.save();}};
  return dom;
}
test('fills actual provided Moodle HTML including TinyMCE, scores and category',async()=>{
  const dom=fixture();const q=validateRows([{...sample,danh_muc:'551668',noi_dung:'A < B\nTiếng Việt\nCông thức \\(x+y\\)',phan_hoi_B:'Đúng rồi',phan_hoi_A:'Sai rồi',danh_so:'ABCD'}]).questions[0];
  assert.equal((await pageTask('inspect')).kind,'form');
  await pageTask('fill',q,'29790');
  assert.equal(document.querySelector('#id_name').value,q.name);
  assert.equal(document.querySelector('#id_category').value,'551668,1287577');
  assert.equal(document.querySelector('#id_questiontext').value,'<p>A &lt; B<br>Tiếng Việt<br>Công thức \\(x+y\\)</p>');
  assert.ok(!document.querySelector('#id_questiontext').value.includes('\\['));
  assert.equal(Number(document.querySelector('#id_fraction_0').value),1);
  assert.equal(Number(document.querySelector('#id_fraction_1').value),0);
  assert.equal(document.querySelector('#id_answer_0').value,'<p>Phương án B</p>');
  assert.equal(document.querySelector('#id_feedback_0').value,'<p>Đúng rồi</p>');
  assert.equal(document.querySelector('#id_feedback_1').value,'<p>Sai rồi</p>');
  assert.equal(document.querySelector('#id_answernumbering').value,'none');
  assert.equal(document.querySelector('#id_answer_4').value,'');
  assert.equal(document.querySelector('#id_status').value,'ready');dom.window.close();
});

test('sets Ready even for a previously queued draft question',async()=>{
  const dom=fixture();
  const q={...validateRows([sample]).questions[0],status:'draft'};
  await pageTask('fill',q,'29790');
  assert.equal(document.querySelector('#id_status').value,'ready');
  dom.window.close();
});
test('refuses to edit existing question, wrong course, unknown category',async()=>{
  const dom=fixture();const q=validateRows([sample]).questions[0];
  await assert.rejects(pageTask('fill',q,'OTHER'),/Khóa học/);
  await assert.rejects(pageTask('fill',{...q,category:'MISSING'},'29790'),/không tồn tại/);
  document.querySelector('form[data-qtype] [name="id"]').value='123';
  await assert.rejects(pageTask('fill',q,'29790'),/không sửa/);dom.window.close();
});
test('fills underlying fields when secondary TinyMCE editors are not initialized yet',async()=>{
  const dom=fixture();const q=validateRows([{...sample,danh_muc:'551668'}]).questions[0];
  const questionEditor=window.tinymce.get('id_questiontext');
  window.tinymce={get:id=>id==='id_questiontext'?questionEditor:undefined,triggerSave(){}};
  await pageTask('fill',q,'29790');
  assert.equal(document.querySelector('#id_answer_0').value,'<p>Phương án B</p>');
  assert.equal(document.querySelector('#id_feedback_0').value,'');
  assert.equal(document.querySelector('#id_answernumbering').value,'none');dom.window.close();
});
test('bank snapshots extract server question IDs from provided HTML',async()=>{
  const dom=fixture(fs.readFileSync(new URL('../../edit.html',import.meta.url),'utf8'),'https://courses.ut.edu.vn/question/edit.php?courseid=29790&lastchanged=15109162');
  const s=await pageTask('inspect');assert.equal(s.kind,'bank');assert.ok(s.rows.length>0);assert.ok(s.rows.some(r=>r.id==='15109160'));dom.window.close();
});
