// Serialized by chrome.scripting into MAIN world to use the live TinyMCE API.
export async function pageTask(action, q, expectedCourse) {
  const pageWindow = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;
  const $ = selector => document.querySelector(selector);
  const norm = s => s.replace(/\u00a0/g,' ').replace(/\s+/g,' ').trim();
  const categoryName = s => norm(s).replace(/\s*\(\d+\)\s*$/, '');
  const categoryId = value => String(value || '').split(',')[0];
  const url = new URL(location.href);
  const course = $('[name="courseid"]')?.value || url.searchParams.get('courseid');
  if (action !== 'inspect' && course !== expectedCourse) throw Error('Khóa học đã thay đổi. Dừng để kiểm tra.');
  const form = $('form[data-qtype="multichoice"]');
  const errors = [...document.querySelectorAll('.invalid-feedback, .alert-danger, .error, [data-fieldtype="error"]')].filter(e => e.getClientRects().length && e.textContent.trim()).map(e => norm(e.textContent));
  const isBank = url.pathname === '/question/edit.php' && !!$('#categoryquestions, .categoryquestionscontainer');
  if (action === 'inspect') {
    const categorySelect = $('#id_category') || $('#filter-value-category');
    const add = $('form[action$="addquestion.php"]');
    return {
      kind: form ? 'form' : isBank ? 'bank' : 'other', url:location.href, course, errors,
      editing:!!form?.querySelector('[name="id"]')?.value,
      lastchanged:url.searchParams.get('lastchanged'),
      category: categorySelect?.value || add?.querySelector('[name="category"]')?.value || '',
      categories: categorySelect ? [...categorySelect.options].filter(o=>o.value).map(o=>({value:o.value,label:categoryName(o.textContent)})) : [],
      rows:[...document.querySelectorAll('tr')].map(r=>({id:r.querySelector('input[id^="checkq"]')?.id.replace('checkq',''),text:norm(r.textContent)})).filter(r=>r.id),
      hasName: !!$('#id_name')?.value,
      hasText: !!$('#id_questiontext')?.value
    };
  }
  if (!form || form.querySelector('[name="id"]')?.value) throw Error('Chỉ điền form tạo câu mới; không sửa câu đang tồn tại.');
  const set = (id,value) => {
    const el = document.getElementById(id);
    if (!el) throw Error(`Không tìm thấy trường ${id}.`);
    if (el.tagName === 'SELECT' && ![...el.options].some(o=>o.value===String(value))) throw Error(`Trường ${id} không hỗ trợ giá trị ${value}.`);
    if (el.type === 'checkbox') el.checked = !!value; else el.value = String(value);
    el.dispatchEvent(new Event('input',{bubbles:true})); el.dispatchEvent(new Event('change',{bubbles:true}));
  };
  const html = s => '<p>' + String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\r?\n/g,'<br>') + '</p>';
  const editor = (id,text) => {
    const el = document.getElementById(id);
    if (!el) throw Error(`Thiếu trình soạn thảo ${id}.`);
    // Moodle only removes an unused Choice when the field is truly empty.
    // `<p></p>` is treated as content and produces a blank radio option.
    const content=String(text ?? '').trim() ? html(text) : '';
    el.value=content;
    const tiny=pageWindow.tinymce || pageWindow.tinyMCE;
    const ed=tiny?.get?.(id);
    if(ed && typeof ed.setContent==='function'){
      try{ed.setContent(content);if(typeof ed.save==='function')ed.save();}catch{el.value=content;}
    }
    el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));
  };
  if (action === 'fill') {
    if (q.category) {
      const matches = [...$('#id_category').options].filter(o=>o.value===q.category || categoryId(o.value)===categoryId(q.category) || categoryName(o.textContent)===q.category);
      if (matches.length !== 1) throw Error(`Danh mục “${q.category}” không tồn tại hoặc trùng tên. Dùng giá trị danh mục hiển thị trong tool.`);
      set('id_category', matches[0].value);
      const returnField=form.querySelector('[name="returnurl"]');
      if(returnField){
        const back=new URL(returnField.value,location.origin);
        if(back.origin!==location.origin || back.pathname!=='/question/edit.php') throw Error('Đường dẫn trở về ngân hàng không hợp lệ.');
        back.searchParams.set('cat',matches[0].value);
        if(back.searchParams.has('category')) back.searchParams.set('category',matches[0].value);
        returnField.value=back.pathname+back.search;
      }
    }
    set('id_name',q.name); set('id_idnumber',q.id); set('id_defaultmark',q.mark);
    set('id_status','ready'); set('id_single','1'); set('id_shuffleanswers',q.shuffle); set('id_answernumbering','none');
    editor('id_questiontext',q.text); editor('id_generalfeedback',q.feedback);
    const ordered=[...q.answers].sort((a,b)=>Number(b.key===q.correct)-Number(a.key===q.correct));
    for (let i=0; document.getElementById(`id_answer_${i}`); i++) {
      const a = ordered[i];
      editor(`id_answer_${i}`,a?.text || ''); editor(`id_feedback_${i}`,a?.feedback || '');
      const el = document.getElementById(`id_fraction_${i}`);
      const score = a?.key === q.correct ? 1 : 0;
      const option = [...el.options].find(o=>Number(o.value)===score);
      if (!option) throw Error('Không tìm thấy tỷ lệ điểm đáp án.');
      set(el.id, option.value);
    }
    return {filled:true};
  }
  if (action === 'submit') {
    if ($('#id_idnumber')?.value !== q.id || $('#id_name')?.value !== q.name) throw Error('Mã hoặc tên câu trên form đã thay đổi.');
    set('id_answernumbering','none');
    (pageWindow.tinymce || pageWindow.tinyMCE)?.triggerSave?.();
    if (!form.reportValidity()) throw Error('Form còn trường không hợp lệ.');
    const button = $('#id_submitbutton');
    if (!button || button.disabled) throw Error('Không tìm thấy nút lưu khả dụng.');
    button.click(); return {submitted:true};
  }
  throw Error('Thao tác không hỗ trợ.');
}
