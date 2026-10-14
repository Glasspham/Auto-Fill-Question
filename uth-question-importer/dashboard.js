import {columns,sample,validateRows,moodleXML,parseQuestionText,filePrefix} from './core.js';
const $=id=>document.getElementById(id), extension=!!globalThis.chrome?.runtime?.id;
let rows=[],defaults={},questions=[],previewQuestions=[],valid=false,connected=false,job=null,categoryContext='';
const node=(tag,text,className)=>{const e=document.createElement(tag);e.textContent=text;if(className)e.className=className;return e;};
function renderTheme(){const dark=document.documentElement.dataset.theme==='dark',button=$('themeToggle');button.querySelector('span').textContent=dark?'☾':'☀';button.setAttribute('aria-label',dark?'Giao diện tối, chuyển sang sáng':'Giao diện sáng, chuyển sang tối');button.title=dark?'Giao diện tối · bấm để chuyển sáng':'Giao diện sáng · bấm để chuyển tối';}
$('themeToggle').onclick=()=>{const next=document.documentElement.dataset.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=next;try{localStorage.setItem('uth-theme',next);}catch{}renderTheme();};renderTheme();
async function send(type,data={}) {const reply=await chrome.runtime.sendMessage({type,...data});if(reply.error)throw Error(reply.error);return reply.result;}
const run=fn=>async()=>{ $('notice').textContent='';try{await fn();}catch(e){$('notice').textContent=e.message;}};
function download(name,data,type) {const url=URL.createObjectURL(new Blob([data],{type}));const a=node('a','');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function check() {
  const result=validateRows(rows,defaults);questions=result.questions;valid=!result.errors.length;
  $('validation').replaceChildren(...(valid?[node('p',`${questions.length} câu hợp lệ. Hãy xem trước trước khi nhập.`,'success')]:result.errors.map(e=>node('p',e,'error'))));
  $('openPreview').disabled=!questions.length;$('openPreview').textContent=`Xem trước ${questions.length} câu hỏi`;
  $('xml').disabled=!valid;buttons();
}
function showPreview(data,kind='upload'){previewQuestions=data;
  $('question').replaceChildren(...data.map((q,i)=>{const o=node('option',q.name);o.value=i;return o;}));
  $('template').hidden=kind!=='demo';$('xml').hidden=kind!=='upload';$('xmlNote').hidden=kind!=='upload';
  $('count').textContent=`${data.length} câu`;preview();$('previewDialog').showModal();
}
function preview(){const q=previewQuestions[Number($('question').value)];if(!q)return;
  const category=$('category').value?$('category').selectedOptions[0].textContent:q.category||'Đang chọn trên website';
  $('preview').replaceChildren(node('h3',q.name),node('p',`Danh mục: ${category} · Điểm: ${q.mark} · ${q.status} · Trộn: ${q.shuffle?'Có':'Không'}`,'muted'),node('p',q.text),...q.answers.map((a,i)=>node('div',`Choice ${i+1} — ${a.text}${a.key===q.correct?'  ✓ Đúng':''}${a.feedback?'\nPhản hồi: '+a.feedback:''}`,`answer ${a.key===q.correct?'correct':''}`)),node('p',q.feedback?'Giải thích: '+q.feedback:''));
}
function buttons(){
  const unfinished=job&&!['done','cancelled'].includes(job.phase);
  $('start').disabled=!extension||!valid||!connected||!!unfinished;
  $('discardJob').hidden=!unfinished||job.running||['uncertain','review'].includes(job.phase);
  let text='Sẵn sàng',state='ready',detail='Sẵn sàng bắt đầu kiểm tra câu đầu tiên.';
  if(!extension){text='Chưa cài tiện ích';state='warning';detail='Cần cài tiện ích để nhập vào website.';}
  else if(!valid){text='Chờ file';state='waiting';detail='Hãy chọn file hợp lệ trước khi bắt đầu.';}
  else if(!connected){text='Chờ kết nối';state='warning';detail='Chưa kết nối được tab ngân hàng câu hỏi UTH.';}
  else if(unfinished){
    if(job.phase==='review'){text='Chờ kiểm tra';state='review';detail='Câu hiện tại đã được điền; chọn bước tiếp theo trong phần Tiến độ và nhật ký.';}
    else if(job.running){text='Đang tiến hành…';state='active';detail=job.message||'Đợt nhập đang chạy.';}
    else if(job.phase==='uncertain'){text='Cần đối chiếu';state='warning';detail='Lần lưu trước chưa rõ kết quả; hãy đối chiếu trong phần Tiến độ.';}
    else if(job.phase==='paused'){text='Đã tạm dừng';state='paused';detail=job.message||'Đợt nhập đã tạm dừng.';}
    else{text='Chưa kết thúc';state='waiting';detail=job.message||'Đợt nhập trước chưa kết thúc.';}
  }
  $('startReason').textContent=text;$('startReason').dataset.state=state;$('startReason').title=detail;
}
function renderJob(j){job=j;buttons();if(!j)return;
  $('progress').max=j.questions.length;$('progress').value=j.index;
  $('status').textContent=`Khóa học ${j.course} · Tab ${j.tabId} · ${j.index}/${j.questions.length} câu · ${j.message}`;
  $('logs').textContent=j.logs.join('\n');
  const reviewing=j.phase==='review';
  const remaining=j.questions.length-j.index-1;
  $('save').hidden=!reviewing;$('save').textContent=remaining>0?'Lưu & xem câu tiếp theo':'Lưu & hoàn tất';
  $('autoContinue').hidden=!reviewing||remaining<1;$('pause').hidden=!j.running;$('resume').hidden=j.phase!=='paused';
  $('nextAction').hidden=!reviewing;
  $('nextAction').textContent=reviewing?(remaining>0?'Câu hiện tại đã được điền trên website. Sau khi kiểm tra, chọn lưu từng câu hoặc Auto hoàn thành phần còn lại.':'Đây là câu cuối cùng. Sau khi kiểm tra, bấm “Lưu & hoàn tất”.'):'';
  $('resolved').hidden=!['review','uncertain','paused'].includes(j.phase);$('notSaved').hidden=j.phase!=='uncertain';
  $('resolved').textContent=reviewing?'Tôi đã tự lưu trên website':'Xác nhận: câu đã lưu';
  $('cancel').hidden=j.running||['done','cancelled','uncertain'].includes(j.phase);
  $('tabs').disabled=!!j.running;
  $('category').disabled=!connected||!!j.running;
}
async function inspect(){connected=false;buttons();const previous=$('category').value;$('category').disabled=true;const tabId=Number($('tabs').value);if(!tabId)throw Error('Chưa chọn tab website.');const s=await send('inspect',{tabId});connected=['form','bank'].includes(s.kind)&&!s.editing&&!!s.course&&!!s.category;
  $('connection').textContent=connected?`Đã kết nối khóa học ${s.course}. Danh mục hiện tại: ${s.categories.find(c=>c.value===s.category)?.label||s.category}.`:'Mở ngân hàng có chọn danh mục hoặc form tạo câu mới Nhiều lựa chọn.';
  const fallback=node('option','Theo file / danh mục đang chọn trên website');fallback.value='';
  $('category').replaceChildren(fallback,...s.categories.map(c=>{const o=node('option',`${c.label} — ${c.value}`);o.value=c.value;o.dataset.label=c.label;return o;}));
  const context=`${tabId}:${s.course}`;
  if(context===categoryContext&&s.categories.some(c=>c.value===previous))$('category').value=previous;
  categoryContext=context;$('category').disabled=!connected||!!job?.running;buttons();
}
async function refresh(){if(!extension)return;const previous=$('tabs').value || new URL(location.href).searchParams.get('tab');const tabs=await chrome.tabs.query({url:'https://courses.ut.edu.vn/*'});
  $('tabs').replaceChildren(...tabs.map(t=>{const o=node('option',`${t.title||'UTH'} (tab ${t.id})`);o.value=t.id;return o;}));
  if(tabs.some(t=>String(t.id)===previous))$('tabs').value=previous;
  else if(job&&tabs.some(t=>t.id===job.tabId))$('tabs').value=String(job.tabId);
  else if(tabs.length===1)$('tabs').value=String(tabs[0].id);
  else throw Error('Không xác định được tab UTH ban đầu. Quay lại ngân hàng câu hỏi và bấm biểu tượng tiện ích để mở lại.');
  await inspect();
}
$('template').onclick=run(()=>{
  const wb=XLSX.utils.book_new();const ws=XLSX.utils.json_to_sheet([sample],{header:columns});
  ws['!cols']=columns.map(c=>({wch:['noi_dung','giai_thich'].includes(c)?50:25}));XLSX.utils.book_append_sheet(wb,ws,'CauHoi');
  XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet([{thuoc_tinh:'diem',gia_tri:1},{thuoc_tinh:'tron_dap_an',gia_tri:'co'},{thuoc_tinh:'trang_thai',gia_tri:'ready'},{thuoc_tinh:'danh_so',gia_tri:'none'}]),'CauHinh');
  XLSX.writeFile(wb,'UTH-cau-hoi-mau.xlsx');
});
$('demo').onclick=()=>showPreview(validateRows([sample]).questions,'demo');
$('openPreview').onclick=()=>showPreview(questions,'upload');
$('closePreview').onclick=()=>$('previewDialog').close();
$('previewDialog').addEventListener('click',event=>{const r=$('previewDialog').getBoundingClientRect();if(event.target===$('previewDialog')&&(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom))$('previewDialog').close();});
$('infoButton').onclick=()=>$('rulesDialog').showModal();$('closeRules').onclick=()=>$('rulesDialog').close();
$('rulesDialog').addEventListener('click',event=>{const r=$('rulesDialog').getBoundingClientRect();if(event.target===$('rulesDialog')&&(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom))$('rulesDialog').close();});
$('file').onchange=run(async()=>{
  valid=false;rows=[];questions=[];$('validation').replaceChildren();$('preview').replaceChildren();$('question').replaceChildren();$('count').textContent='0 câu';$('openPreview').disabled=true;$('xml').disabled=true;buttons();
  const file=$('file').files[0];if(!file)return;if(file.size>5*1024*1024)throw Error('File vượt 5 MB.');
  const buffer=await file.arrayBuffer();const lower=file.name.toLowerCase(),isCSV=lower.endsWith('.csv'),isText=lower.endsWith('.txt')||lower.endsWith('.md');
  if(isText){const text=new TextDecoder('utf-8',{fatal:true}).decode(buffer);rows=parseQuestionText(text,filePrefix(file.name));defaults={};$('fileName').textContent=`${file.name} · nhận diện ${rows.length} câu từ văn bản`;check();return;}
  const wb=XLSX.read(isCSV?new TextDecoder('utf-8',{fatal:true}).decode(buffer):buffer,{type:isCSV?'string':'array',cellFormula:true});
  const sheet=wb.Sheets.CauHoi || (isCSV?wb.Sheets[wb.SheetNames[0]]:null);if(!sheet)throw Error('Excel phải có sheet CauHoi.');
  if(XLSX.utils.decode_range(sheet['!ref']||'A1').e.r>1001)throw Error('Sheet vượt 1000 dòng câu hỏi.');
  for(const s of [sheet,wb.Sheets.CauHinh].filter(Boolean))for(const [key,cell] of Object.entries(s))if(!key.startsWith('!')&&cell.f)throw Error(`Ô ${key} có công thức. Chuyển thành giá trị trước khi nhập.`);
  const headers=XLSX.utils.sheet_to_json(sheet,{header:1,blankrows:false})[0]||[];
  if(new Set(headers.map(v=>String(v).trim())).size!==headers.length)throw Error('File có tên cột trùng.');
  rows=XLSX.utils.sheet_to_json(sheet,{defval:'',raw:false}).map(r=>({...r,__row:r.__rowNum__+1}));defaults={};
  if(wb.Sheets.CauHinh)for(const r of XLSX.utils.sheet_to_json(wb.Sheets.CauHinh,{defval:''})){const key=String(r.thuoc_tinh||'').trim();if(!columns.includes(key))throw Error(`CauHinh: thuộc tính không hợp lệ ${key}`);defaults[key]=r.gia_tri;}
  $('fileName').textContent=file.name;check();
});
$('question').onchange=preview;$('category').onchange=()=>{if($('previewDialog').open)preview();};$('refresh').onclick=run(refresh);$('tabs').onchange=run(inspect);
$('xml').onclick=run(()=>{const exported=$('category').value?questions.map(q=>({...q,category:$('category').selectedOptions[0].dataset.label})):questions;if(exported.some(q=>/^\d+(,\d+)?$/.test(q.category)))throw Error('Xuất XML cần tên/đường dẫn danh mục, không dùng mã option. Sửa cột danh_muc hoặc chọn danh mục trong tool.');download('UTH-cau-hoi.xml',moodleXML(exported),'application/xml;charset=utf-8');});
$('start').onclick=run(async()=>{if(!valid||!connected)return;await send('start',{tabId:Number($('tabs').value),rows,defaults,selectedCategory:$('category').value,mode:'review'});});
$('autoContinue').onclick=run(async()=>{if(!job||job.phase!=='review')return;const remaining=job.questions.length-job.index;if(!confirm(`Tool sẽ lưu câu đang kiểm tra và tự hoàn thành ${remaining-1} câu còn lại. Bạn muốn tiếp tục?`))return;await send('auto');});
$('discardJob').onclick=run(async()=>{if(!confirm('Kết thúc đợt nhập cũ? Các câu đã lưu trên website vẫn được giữ.'))return;await send('cancel');});
for(const id of ['save','pause','resume','cancel','resolved','notSaved'])$(id).onclick=run(async()=>{
  if(['resolved','notSaved','cancel'].includes(id)&&!confirm(id==='resolved'?'Bạn đã tìm thấy đúng mã câu hiện tại trong ngân hàng? Chỉ xác nhận sau khi kiểm tra.':id==='notSaved'?'Bạn đã xác minh câu chưa được tạo? Mở form mới trống trước khi tiếp tục.':'Kết thúc đợt này? Các câu đã lưu trên website vẫn được giữ.'))return;
  await send(id);
});
$('exportLog').onclick=()=>download('UTH-nhat-ky.json',JSON.stringify(job?{course:job.course,results:job.results,phase:job.phase,index:job.index,logs:job.logs}:{},null,2),'application/json');
if(extension){chrome.storage.onChanged.addListener((changes,area)=>{if(area==='local'&&changes.job)renderJob(changes.job.newValue);});chrome.storage.local.get('job').then(r=>{renderJob(r.job);return run(refresh)();});}
else{$('connection').textContent='Chế độ xem trước. Cài tiện ích qua chrome://extensions để tự điền trên website.';}
