import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {sample,validateRows,moodleXML,confirmsSave,parseQuestionText,filePrefix} from '../core.js';
test('valid sample and defaults, retain Vietnamese and multiline',()=>{
  const {questions,errors}=validateRows([{...sample,diem:'',noi_dung:'Tiếng Việt\nDòng 2'}],{diem:2});
  assert.deepEqual(errors,[]);assert.equal(questions[0].mark,2);assert.equal(questions[0].name,'[DEMO_001] Câu mẫu 01');assert.match(questions[0].text,/\n/);
});

test('Question status is Ready even when an older CSV row says draft',()=>{
  const blank=validateRows([{...sample,trang_thai:''}]);
  const old=validateRows([{...sample,trang_thai:'draft'}]);
  assert.deepEqual(blank.errors,[]);
  assert.deepEqual(old.errors,[]);
  assert.equal(blank.questions[0].status,'ready');
  assert.equal(old.questions[0].status,'ready');
  assert.equal(parseQuestionText('Question 1. Test\nA) One\nB) Two\nAnswer: A','TEST')[0].trang_thai,'ready');
});
test('reject incomplete answers, invalid grades, duplicate codes and multiple correct answers',()=>{
  const r=validateRows([{...sample,B:'',diem:-1,dap_an_dung:'A,C'},{...sample}]);
  for(const text of ['liên tiếp','lớn hơn','một chữ','trùng'])assert.ok(r.errors.some(e=>e.includes(text)),text);
});
test('XML escapes untrusted text and scores only one correct answer',()=>{
  const q=validateRows([{...sample,noi_dung:'<script> & "x"',giai_thich:'A > B'}]).questions;
  const xml=moodleXML(q);assert.ok(!xml.includes('<script>'));assert.ok(xml.includes('&lt;script&gt;'));assert.equal((xml.match(/fraction="100"/g)||[]).length,1);
});
test('correct answer is first, with feedback, regardless of original position; numbering is always none',()=>{
  for(const key of 'ABCD'){
    const q=validateRows([{...sample,dap_an_dung:key,danh_so:'ABCD',[`phan_hoi_${key}`]:'Correct feedback'}]).questions[0];
    assert.equal(q.numbering,'none');assert.equal(q.answers[0].key,key);assert.equal(q.answers[0].feedback,'Correct feedback');
    assert.deepEqual(q.answers.slice(1).map(a=>a.key),[...'ABCD'].filter(k=>k!==key));
    const xml=moodleXML([q]);assert.match(xml,/<answernumbering>none<\/answernumbering>/);assert.match(xml,/<answer fraction="100"/);
  }
});
test('confirmation requires new server ID and matching row, not merely navigation',()=>{
  const q=validateRows([sample]).questions[0];const job={before:'10'};
  const good={kind:'bank',lastchanged:'11',rows:[{id:'11',text:q.name}]};assert.ok(confirmsSave(good,job,q));
  assert.equal(confirmsSave({...good,lastchanged:'10'},job,q),false);
  assert.equal(confirmsSave({...good,rows:[{id:'11',text:'other'}]},job,q),false);
  assert.equal(confirmsSave({...good,kind:'form'},job,q),false);
});
test('parse the repository Markdown fixture without losing LaTeX',()=>{
  const source=fs.readFileSync(new URL('../../tests/fixtures/sample-questions.md',import.meta.url),'utf8');
  const rows=parseQuestionText(source,filePrefix('sample-questions.md'));
  assert.equal(rows.length,3);assert.equal(rows[0].ma_cau,'SAMPLE-001');assert.equal(rows[0].dap_an_dung,'C');assert.equal(rows[2].dap_an_dung,'D');
  assert.match(rows[1].noi_dung,/\\begin\{array\}/);assert.deepEqual(validateRows(rows).errors,[]);
});
test('parse Vietnamese sections and reject malformed text without guessing',()=>{
  const rows=parseQuestionText('## Câu 1. Nội dung\nDòng 2\nA) Một\nB) Hai\nĐáp án: B\nGiải thích: Vì vậy.\nDòng sau.','DE-01');
  assert.equal(rows[0].giai_thich,'Vì vậy.\nDòng sau.');assert.equal(rows[0].B,'Hai');
  for(const broken of ['Không có phân khu','Question 1. Test\nA) Một\nB) Hai','Question 1. Test\nA) Một\nB) Hai\nAnswer: E'])assert.throws(()=>parseQuestionText(broken,'TEST'));
});
test('preserves author-provided LaTeX delimiters and never adds display delimiters',()=>{
  const source='Question 1. Inline \\(x+y\\) và văn bản z.\nA) \\(a\\)\nB) b\nAnswer: A\n\nQuestion 2. Display:\n\\[x^2+y^2\\]\nA) Đúng\nB) Sai\nAnswer: A';
  const rows=parseQuestionText(source,'LATEX');
  assert.equal(rows[0].noi_dung,'Inline \\(x+y\\) và văn bản z.');
  assert.equal(rows[0].A,'\\(a\\)');
  assert.ok(!rows[0].noi_dung.includes('\\['));
  assert.equal(rows[1].noi_dung,'Display:\n\\[x^2+y^2\\]');
});

test('custom Name and ID metadata preserve defaults and infer bracketed IDs',()=>{
  const source='Ex 1. Mặc định\nA) Một\nB) Hai\nAnswer: A\n\nEx 2. Tên riêng\nA) Một\nB) Hai\nAnswer: B\nName: Tên do người dùng đặt\n\nEx 3. Lấy ID từ Name\nA) Một\nB) Hai\nAnswer: A\nName: [CUSTOM-003] Tên đã gắn ID\n\nEx 4. Đủ hai trường\nA) Một\nB) Hai\nAnswer: B\nTên câu hỏi: Tên tiếng Việt\nSố ID: VN-004\nGiải thích: Hợp lệ.';
  const rows=parseQuestionText(source,'FILE');
  assert.deepEqual(rows.map(row=>[row.ma_cau,row.ten_cau]),[
    ['FILE-001','FILE - Question 1'],['FILE-002','Tên do người dùng đặt'],
    ['CUSTOM-003','Tên đã gắn ID'],['VN-004','Tên tiếng Việt']
  ]);
  const questions=validateRows(rows).questions;
  assert.deepEqual(questions.map(q=>q.name),['[FILE-001] FILE - Question 1','[FILE-002] Tên do người dùng đặt','[CUSTOM-003] Tên đã gắn ID','[VN-004] Tên tiếng Việt']);
});
test('Excel and CSV aliases accept ID and Name and infer ID from a tagged Name',()=>{
  const base={noi_dung:'Nội dung',A:'Một',B:'Hai',dap_an_dung:'A'};
  const result=validateRows([{...base,ID:'CSV-001',Name:'Tên CSV'},{...base,Name:'[AUTO-002] Tên suy ra'}]);
  assert.deepEqual(result.errors,[]);
  assert.deepEqual(result.questions.map(q=>[q.id,q.name]),[['CSV-001','[CSV-001] Tên CSV'],['AUTO-002','[AUTO-002] Tên suy ra']]);
});
test('rejects conflicting explicit ID and bracketed Name ID',()=>{
  assert.throws(()=>parseQuestionText('Question 1. Test\nA) Một\nB) Hai\nAnswer: A\nName: [A-001] Tên\nID: B-001','FILE'),/không khớp/);
});
