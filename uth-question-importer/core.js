export const columns = ['ma_cau','danh_muc','ten_cau','noi_dung','A','B','C','D','E','dap_an_dung','diem','giai_thich','tron_dap_an','trang_thai','danh_so','phan_hoi_A','phan_hoi_B','phan_hoi_C','phan_hoi_D','phan_hoi_E'];
export const sample = {ma_cau:'DEMO_001',danh_muc:'',ten_cau:'Câu mẫu 01',noi_dung:'Chọn phương án B.',A:'Phương án A',B:'Phương án B',C:'Phương án C',D:'Phương án D',dap_an_dung:'B',diem:1,giai_thich:'Đáp án theo yêu cầu của câu mẫu là B.',tron_dap_an:'co',trang_thai:'ready',danh_so:'none'};
const str = x => String(x ?? '').trim();
const keyAliases = new Map([
  ['macau','ma_cau'],['id','ma_cau'],['soid','ma_cau'],['questionid','ma_cau'],['idnumber','ma_cau'],
  ['tencau','ten_cau'],['tencauhoi','ten_cau'],['name','ten_cau'],['questionname','ten_cau']
]);
const canonicalKey = key => {
  const raw=String(key ?? '').trim();
  const folded=raw.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[\s_-]+/g,'');
  return keyAliases.get(folded) || raw;
};
function questionIdentity(rawName, rawId='') {
  let id=str(rawId), name=str(rawName);
  const tagged=name.match(/^\[([A-Za-z0-9_-]+)\]\s*(.*)$/);
  if(tagged){
    if(id && id!==tagged[1])return {id,name,error:`Số ID “${id}” không khớp ID “${tagged[1]}” trong Tên câu hỏi.`};
    id=id||tagged[1];name=tagged[2].trim()||id;
  }
  return {id,name};
}
export function validateRows(rows, defaults = {}) {
  const questions = [], errors = [], seen = new Set();
  rows.forEach((raw, index) => {
    if (!Object.values(raw).some(x => str(x))) return;
    const row={},collisions=[];
    for(const [rawKey,value] of Object.entries(raw)){
      const key=rawKey==='__row'?'__row':canonicalKey(rawKey);
      if(Object.hasOwn(row,key)&&str(row[key])&&str(value)&&str(row[key])!==str(value))collisions.push(key);
      else if(!Object.hasOwn(row,key)||!str(row[key]))row[key]=value;
    }
    for (const [k,v] of Object.entries(defaults)) if (!str(row[canonicalKey(k)])) row[canonicalKey(k)] = v;
    const line = raw.__row ?? index + 2;
    const fail = message => errors.push(`Dòng ${line}: ${message}`);
    if(collisions.length)fail(`Cột trùng ý nghĩa nhưng khác giá trị: ${[...new Set(collisions)].join(', ')}.`);
    const unknown=Object.keys(row).filter(k=>k!=='__row'&&!columns.includes(k));
    if(unknown.length) fail(`Cột không hỗ trợ: ${unknown.join(', ')}.`);
    if(Object.values(row).some(v=>/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(String(v)))) fail('Có ký tự điều khiển không hợp lệ trong dữ liệu.');
    const identity=questionIdentity(row.ten_cau,row.ma_cau),id=identity.id,name=identity.name||identity.id,text=str(row.noi_dung);
    if(identity.error)fail(identity.error);
    if (!id || id.length > 100) fail('ma_cau bắt buộc, tối đa 100 ký tự.');
    if (seen.has(id)) fail(`ma_cau trùng: ${id}`); seen.add(id);
    const fullName = `[${id}] ${name}`;
    if (fullName.length > 255) fail('Tên câu kèm mã dài quá 255 ký tự.');
    if (!text) fail('Thiếu noi_dung.');
    const answers = 'ABCDE'.split('').map(key => ({key,text:str(row[key]),feedback:str(row[`phan_hoi_${key}`])}));
    const last = answers.findLastIndex(a => a.text);
    if (last < 1 || answers.slice(0,last+1).some(a => !a.text)) fail('Cần 2–5 đáp án liên tiếp từ A, không để trống ở giữa.');
    const correct = str(row.dap_an_dung).toUpperCase();
    if (!answers.some(a => a.key === correct && a.text)) fail('dap_an_dung phải là một chữ A–E có nội dung. Bản này hỗ trợ một đáp án đúng.');
    const mark = Number(str(row.diem) || 1);
    if (!Number.isFinite(mark) || mark <= 0) fail('diem phải là số lớn hơn 0.');
    const shuffleRaw = str(row.tron_dap_an || 'co').toLowerCase();
    if (!['co','có','1','true','khong','không','0','false'].includes(shuffleRaw)) fail('tron_dap_an dùng co hoặc khong.');
    // Always create ready questions, including rows from older CSV files marked draft.
    const status = 'ready';
    const numbering = 'none';
    const ordered = answers.slice(0,last+1);
    ordered.sort((a,b)=>Number(b.key===correct)-Number(a.key===correct));
    questions.push({id,name:fullName,text,category:str(row.danh_muc),answers:ordered,correct,mark,shuffle:['co','có','1','true'].includes(shuffleRaw),status,numbering,feedback:str(row.giai_thich),line});
  });
  if (!questions.length) errors.push('File chưa có câu hỏi.');
  if (questions.length > 1000) errors.push('Mỗi đợt tối đa 1000 câu.');
  return {questions,errors};
}
export const escapeXML = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
export function filePrefix(filename) {
  const stem=String(filename).replace(/\.[^.]+$/,'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'');
  return stem.replace(/[^A-Za-z0-9_-]+/g,'-').replace(/^-+|-+$/g,'').toUpperCase() || 'QUESTION';
}
export function parseQuestionText(source, prefix='QUESTION', category='') {
  const text=String(source).replace(/^\uFEFF/,'').replace(/\r\n?/g,'\n');
  const headerRe=/^(?:#{1,6}[ \t]+)?(?:Question|Câu|Ex(?:ercise)?)[ \t]+(\d+)[.:][ \t]*(.*)$/gim;
  const choiceRe=/^([A-E])[).][ \t]*(.*)$/gm;
  const answerRe=/^(?:Answer|Đáp án)[ \t]*:[ \t]*([A-E])[ \t]*$/gim;
  const headers=[...text.matchAll(headerRe)];
  if(!headers.length)throw Error('Không tìm thấy “Question 1.” hoặc “Câu 1.” ở đầu dòng.');
  if(text.slice(0,headers[0].index).trim())throw Error('Có nội dung trước câu đầu tiên. File phải bắt đầu bằng Question/Câu.');
  if(!/^[A-Za-z0-9_-]+$/.test(prefix))throw Error('Tiền tố mã chỉ dùng chữ, số, dấu gạch ngang hoặc gạch dưới.');
  const rows=[],seen=new Set();
  for(let i=0;i<headers.length;i++){
    const header=headers[i],number=Number(header[1]);
    if(number<=0||seen.has(number))throw Error(`Số câu không hợp lệ hoặc trùng: ${number}.`);seen.add(number);
    const end=i+1<headers.length?headers[i+1].index:text.length;
    let body=(header[2]+text.slice(header.index+header[0].length,end)).trim().replace(/\n[ \t]*---[ \t]*$/,'').trimEnd();
    const answers=[...body.matchAll(answerRe)];
    if(answers.length!==1)throw Error(`Câu ${number}: cần đúng một dòng Answer: A–E / Đáp án: A–E.`);
    const answer=answers[0];let tail=body.slice(answer.index+answer[0].length).trim(),feedback='',customName='',customId='';
    if(tail){
      const lines=tail.split('\n');let cursor=0;
      while(cursor<lines.length){
        const line=lines[cursor].trim();if(!line){cursor++;continue;}
        const nameMatch=line.match(/^(?:Name|Tên câu hỏi)[ \t]*:[ \t]*(.+)$/i),idMatch=line.match(/^(?:ID|Số ID)[ \t]*:[ \t]*(.+)$/i);
        if(nameMatch){if(customName)throw Error(`Câu ${number}: Name / Tên câu hỏi chỉ được xuất hiện một lần.`);customName=nameMatch[1].trim();cursor++;continue;}
        if(idMatch){if(customId)throw Error(`Câu ${number}: ID / Số ID chỉ được xuất hiện một lần.`);customId=idMatch[1].trim();cursor++;continue;}
        break;
      }
      tail=lines.slice(cursor).join('\n').trim();
      if(tail){const explanation=tail.match(/^(?:Explanation|Giải thích)[ \t]*:[ \t]*(.*)/i);if(!explanation)throw Error(`Câu ${number}: sau Answer chỉ nhận Name, ID rồi Explanation / Giải thích.`);feedback=(explanation[1]+tail.slice(explanation[0].length)).trim();}
    }
    const questionAndChoices=body.slice(0,answer.index).trimEnd(),choices=[...questionAndChoices.matchAll(choiceRe)],letters=choices.map(m=>m[1]);
    if(choices.length<2||choices.length>5||letters.join('')!=='ABCDE'.slice(0,choices.length))throw Error(`Câu ${number}: cần 2–5 lựa chọn liên tiếp A) đến E), không trùng.`);
    const content=questionAndChoices.slice(0,choices[0].index).trim();if(!content)throw Error(`Câu ${number}: thiếu nội dung câu hỏi.`);
    const fallbackId=`${prefix}-${String(number).padStart(3,'0')}`,identity=questionIdentity(customName,customId);
    if(identity.error)throw Error(`Câu ${number}: ${identity.error}`);
    const row=Object.fromEntries(columns.map(k=>[k,'']));Object.assign(row,{ma_cau:identity.id||fallbackId,danh_muc:category,ten_cau:identity.name||`${prefix} - Question ${number}`,noi_dung:content,dap_an_dung:answer[1].toUpperCase(),diem:'1',giai_thich:feedback,tron_dap_an:'co',trang_thai:'ready',danh_so:'none'});
    choices.forEach((choice,j)=>{const choiceEnd=j+1<choices.length?choices[j+1].index:questionAndChoices.length;const value=(choice[2]+questionAndChoices.slice(choice.index+choice[0].length,choiceEnd)).trim();if(!value)throw Error(`Câu ${number}: lựa chọn ${choice[1]} trống.`);row[choice[1]]=value;});
    if(!letters.includes(row.dap_an_dung))throw Error(`Câu ${number}: đáp án đúng không có lựa chọn tương ứng.`);rows.push(row);
  }
  return rows;
}
export function moodleXML(questions) {
  const tag = (name,text) => `<${name}>${escapeXML(text)}</${name}>`;
  return '<?xml version="1.0" encoding="UTF-8"?>\n<quiz>\n' + questions.map(q => {
    const category = q.category ? `<question type="category"><category>${tag('text', '$course$/top/' + q.category)}</category></question>\n` : '';
    return category + `<question type="multichoice"><name>${tag('text',q.name)}</name>${tag('idnumber',q.id)}<questiontext format="plain_text">${tag('text',q.text)}</questiontext>${tag('defaultgrade',q.mark)}<generalfeedback format="plain_text">${tag('text',q.feedback)}</generalfeedback><single>true</single>${tag('shuffleanswers',q.shuffle?1:0)}${tag('answernumbering',q.numbering)}<penalty>0</penalty>` + q.answers.map(a => `<answer fraction="${a.key===q.correct?100:0}" format="plain_text">${tag('text',a.text)}<feedback format="plain_text">${tag('text',a.feedback)}</feedback></answer>`).join('') + '</question>';
  }).join('\n') + '\n</quiz>\n';
}
export function confirmsSave(snapshot, job, q) {
  return snapshot.kind === 'bank' && /^\d+$/.test(snapshot.lastchanged || '') && snapshot.lastchanged !== job.before && snapshot.rows.some(r => r.id === snapshot.lastchanged && r.text.includes(q.name));
}
