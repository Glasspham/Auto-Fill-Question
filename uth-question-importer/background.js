import {pageTask} from './page.js';
import {confirmsSave, validateRows} from './core.js';
let chain = Promise.resolve();
const serial = fn => { const result = chain.then(fn); chain = result.catch(()=>{}); return result; };
const read = async () => (await chrome.storage.local.get('job')).job;
const write = async j => { j.updated = Date.now(); await chrome.storage.local.set({job:j}); };
const log = (j,text) => { j.message=text; (j.logs ||= []).push(`${new Date().toLocaleString('vi-VN')} — ${text}`); };
async function onPage(tabId, action, q, course) {
  const tab = await chrome.tabs.get(tabId);
  if (!tab.url?.startsWith('https://courses.ut.edu.vn/')) throw Error('Tab đã rời website UTH hoặc bị đóng.');
  const result = await chrome.scripting.executeScript({target:{tabId},world:'MAIN',func:pageTask,args:[action,q || null,course || null]});
  return result[0].result;
}
async function stop(j,message, uncertain=false) {
  j.running=false; j.phase=uncertain?'uncertain':'paused'; log(j,message); await write(j);
}
async function submit(j) {
  // Persist BEFORE clicking: never automatically repeat a potentially accepted POST.
  j.phase='submitting'; j.submittedAt=Date.now(); log(j,`Đang lưu ${j.questions[j.index].id}…`); await write(j);
  try { await onPage(j.tabId,'submit',j.questions[j.index],j.course); }
  catch (e) { await stop(j,`Chưa xác minh được lần lưu: ${e.message}`,true); }
}
async function pump() {
  const j = await read(); if (!j?.running) return;
  try {
    const tab = await chrome.tabs.get(j.tabId); if (tab.status === 'loading') return;
    const s = await onPage(j.tabId,'inspect'); const q=j.questions[j.index];
    if (j.phase === 'submitting') {
      if (confirmsSave(s,j,q)) {
        j.results.push({id:q.id,status:'saved',questionId:s.lastchanged}); j.index++; log(j,`Đã xác minh lưu ${q.id}.`);
        if (j.index===j.questions.length) { j.running=false; j.phase='done'; log(j,'Hoàn tất tất cả câu hỏi.'); await write(j); return; }
        j.phase='ready'; await write(j);
      } else {
        if (s.errors.length || s.kind==='other' || Date.now()-j.submittedAt > 45000) await stop(j,'Chưa xác minh được câu vừa lưu. Kiểm tra ngân hàng rồi dùng nút xác nhận thủ công. '+s.errors.join(' '),true);
        return;
      }
    }
    if (s.course !== j.course) throw Error('Trang hiện tại không còn thuộc khóa học đã chọn.');
    const current = j.questions[j.index];
    if (s.kind === 'bank') {
      if (s.rows.some(r=>r.text.includes(current.name))) throw Error(`Danh sách hiện tại đã có ${current.name}; hãy kiểm tra trùng.`);
      const next = new URL('https://courses.ut.edu.vn/question/bank/editquestion/question.php');
      next.searchParams.set('qtype','multichoice'); next.searchParams.set('courseid',j.course);
      const targetCategory=/^\d+(,\d+)?$/.test(current.category) ? current.category : (s.category || j.category);
      next.searchParams.set('category',String(targetCategory).split(',')[0]);
      next.searchParams.set('returnurl',new URL(s.url).pathname+new URL(s.url).search);
      j.before=s.lastchanged; j.phase='opening'; await write(j); await chrome.tabs.update(j.tabId,{url:next.href}); return;
    }
    if (s.kind !== 'form' || s.editing) throw Error('Hãy mở ngân hàng câu hỏi hoặc form tạo mới loại Nhiều lựa chọn.');
    if (s.errors.length) throw Error(s.errors.join(' '));
    if (!['ready','opening'].includes(j.phase)) throw Error('Tiến trình bị gián đoạn. Kiểm tra form trước khi tiếp tục.');
    if (s.hasName || s.hasText) throw Error('Form đang có nội dung. Mở form mới trống để tránh ghi đè.');
    j.phase='filling'; await write(j);
    await onPage(j.tabId,'fill',current,j.course);
    if (j.mode === 'review') { j.running=false; j.phase='review'; log(j,`Đã điền ${current.id}. Kiểm tra trên website rồi bấm “Lưu câu đã kiểm tra”.`); await write(j); }
    else await submit(j);
  } catch (e) { await stop(j,e.message,j.phase==='submitting'); }
}
chrome.action.onClicked.addListener(tab => chrome.tabs.create({url:chrome.runtime.getURL('dashboard.html')+`?tab=${tab.id}`}));
chrome.tabs.onUpdated.addListener((id,info) => { if (info.status==='complete') serial(async()=>{if((await read())?.tabId===id) await pump();}); });
chrome.alarms.create('watch',{periodInMinutes:0.5});
chrome.alarms.onAlarm.addListener(()=>serial(pump));
chrome.runtime.onStartup.addListener(()=>serial(async()=>{const j=await read(); if(j?.running) await stop(j,'Trình duyệt đã khởi động lại. Kiểm tra tiến độ trước khi tiếp tục.',j.phase==='submitting');}));
chrome.runtime.onMessage.addListener((m,sender,respond) => {
  if (!sender.url?.startsWith(chrome.runtime.getURL('dashboard.html'))) return;
  serial(async()=>{
    if (m.type==='inspect') return onPage(m.tabId,'inspect');
    let j=await read();
    if (m.type==='start') {
      if (j && !['done','cancelled'].includes(j.phase)) throw Error('Đợt trước chưa kết thúc. Hoàn tất hoặc kết thúc đợt trước.');
      const validated=validateRows(m.rows,m.defaults);
      if(validated.errors.length) throw Error(validated.errors.join('\n'));
      const s=await onPage(m.tabId,'inspect');
      if (!['bank','form'].includes(s.kind) || s.editing || !s.course || !s.category) throw Error('Mở ngân hàng có chọn danh mục hoặc form tạo mới trước.');
      if(m.selectedCategory && !s.categories.some(c=>c.value===m.selectedCategory)) throw Error('Danh mục đã chọn không còn trong tab này. Đọc lại danh mục trước khi chạy.');
      validated.questions=validated.questions.map(q=>({...q,category:m.selectedCategory || q.category || s.category}));
      j={tabId:m.tabId,course:s.course,category:s.category,questions:validated.questions,index:0,results:[],logs:[],mode:m.mode==='auto'?'auto':'review',running:true,phase:'ready',before:s.lastchanged};
      log(j,'Bắt đầu đợt nhập.'); await write(j); await pump();
    } else if (m.type==='pause') {
      if (j) await stop(j,'Đã tạm dừng. Lệnh lưu đã gửi (nếu có) vẫn có thể hoàn thành.',j.phase==='submitting');
    } else if (m.type==='save') {
      if(j?.phase!=='review') throw Error('Chưa có câu chờ kiểm tra.'); j.running=true; await submit(j);
    } else if (m.type==='auto') {
      if(j?.phase!=='review') throw Error('Chưa có câu đã điền để chuyển sang Auto.');
      j.mode='auto';j.running=true;log(j,'Đã chuyển sang Auto hoàn thành; đang lưu câu đã kiểm tra.');await write(j);await submit(j);
    } else if (m.type==='resume') {
      if(j?.phase!=='paused') throw Error('Cần xử lý câu chưa rõ trạng thái trước.');
      j.running=true; j.phase='ready'; await write(j); await pump();
    } else if (m.type==='resolved') {
      if(!j || !['uncertain','paused','review'].includes(j.phase)) throw Error('Không có câu cần đối chiếu.');
      j.results.push({id:j.questions[j.index].id,status:'user-confirmed'}); j.index++;
      j.phase=j.index===j.questions.length?'done':'paused'; j.running=false;
      log(j,'Người dùng xác nhận câu hiện tại đã lưu. Mở ngân hàng rồi tiếp tục.'); await write(j);
    } else if (m.type==='notSaved') {
      if(j?.phase!=='uncertain') throw Error('Không có lần lưu cần đối chiếu.');
      j.phase='paused'; j.running=false;
      log(j,'Người dùng xác nhận câu chưa lưu. Mở form mới trống hoặc ngân hàng rồi tiếp tục.'); await write(j);
    } else if (m.type==='cancel') {
      if(j?.running || j?.phase==='uncertain') throw Error('Dừng và đối chiếu lần lưu chưa rõ trạng thái trước khi kết thúc.');
      if(j){j.phase='cancelled';j.running=false;log(j,'Đã kết thúc đợt; giữ nhật ký.');await write(j);}
    } else if (!['inspect','start'].includes(m.type)) throw Error('Thao tác không hợp lệ.');
    return {ok:true};
  }).then(result=>respond({result}),e=>respond({error:e.message})); return true;
});
