'use strict';
(() => {
  const $ = (id) => document.getElementById(id);
  const labels = ['Seus dados', 'Seu objetivo', 'Experiências', 'Formação', 'Cursos e habilidades', 'Sua foto', 'Revisar e finalizar'];
  const blank = () => ({name:'',birthYear:'',maritalStatus:'',license:'',city:'',uf:'',phone:'',email:'',link:'',objective:'',summary:'',firstJob:false,experiences:[],education:[],courses:[],technical:'',personal:'',languages:'',additional:'',photo:''});
  let data = blank(), step = 0, dirty = false, withPhoto = false, photoBusy = false, photoVersion = 0;
  let databaseToken = '', recordId = null, libraryItems = [];
  const measure = document.createElement('article');measure.id='measure-resume';measure.className='resume';measure.setAttribute('aria-hidden','true');document.body.append(measure);
  const printWarning=document.createElement('p');printWarning.id='print-warning';printWarning.textContent='O currículo ultrapassa uma folha A4. Volte ao aplicativo e reduza o conteúdo antes de imprimir.';document.body.append(printWarning);
  const escape = (value) => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const optional = '<span class="optional">(opcional)</span>';
  function field(key, label, options = {}) {
    const {value = data[key] || '', type = 'text', placeholder = '', hint = '', required = false, area = false, autocomplete = 'off'} = options;
    const id = 'field-' + key.replaceAll('.', '-');
    const attrs = `id="${id}" data-key="${key}" ${required ? 'required' : ''} ${hint ? `aria-describedby="hint-${id}"` : ''}`;
    return `<div class="field"><label for="${id}">${label} ${required ? '' : optional}</label>${area ? `<textarea ${attrs} maxlength="3000" placeholder="${escape(placeholder)}">${escape(value)}</textarea>` : `<input ${attrs} type="${type}" maxlength="${key === 'name' ? '120' : '300'}" autocomplete="${autocomplete}" value="${escape(value)}" placeholder="${escape(placeholder)}">`}${hint ? `<p class="hint" id="hint-${id}">${hint}</p>` : ''}</div>`;
  }
  function selectField(key, label, choices) {
    return `<div class="field"><label for="field-${key}">${label} ${optional}</label><select id="field-${key}" data-key="${key}"><option value="">Não informar</option>${choices.map(value=>`<option value="${escape(value)}" ${data[key]===value?'selected':''}>${escape(value)}</option>`).join('')}</select></div>`;
  }
  function cards(kind) {
    return data[kind].map((item, i) => {
      const f = (key, label, opts = {}) => field(`${kind}.${i}.${key}`, label, {value:item[key] || '', ...opts});
      let fields = '';
      if (kind === 'experiences') {
        fields = f('role','Qual era seu cargo ou atividade?',{placeholder:'Ex.: Auxiliar de vendas, diarista, voluntário'}) + f('company','Onde você trabalhou?',{placeholder:'Nome da empresa ou trabalho autônomo'}) + `<div class="field-row">${f('start','Quando começou?',{placeholder:'Ex.: 03/2023'})}${f('end','Quando terminou?',{placeholder:'Ex.: 12/2025 ou Atual'})}</div>` + f('description','O que você fazia?',{area:true,placeholder:'Uma atividade por linha. Ex.:\nAtendia clientes e organizava produtos.\nAjudava no controle do estoque.',hint:'Inclua trabalhos informais e voluntários. Conte suas atividades e conquistas com suas palavras.'});
      } else if (kind === 'education') {
        fields = f('course','Qual é o curso ou nível de ensino?',{placeholder:'Ex.: Ensino Médio, Técnico em Administração'}) + f('institution','Em qual escola ou instituição?') + f('status','Qual é a situação?',{placeholder:'Ex.: Concluído em 2024 ou Cursando, previsão 2027'});
      } else {
        fields = f('name','Qual curso ou certificação você fez?',{placeholder:'Ex.: Informática básica'}) + f('institution','Em qual instituição?') + `<div class="field-row">${f('hours','Carga horária',{placeholder:'Ex.: 40 horas'})}${f('year','Ano',{placeholder:'Ex.: 2025'})}</div>`;
      }
      return `<div class="entry-card"><div class="entry-card-heading"><h3>${kind === 'experiences' ? 'Experiência' : kind === 'education' ? 'Formação' : 'Curso'} ${i+1}</h3><button type="button" class="text-button danger" data-remove="${kind}" data-index="${i}">Remover<span class="sr-only"> item ${i+1}</span></button></div>${fields}</div>`;
    }).join('');
  }
  const heading = (title, description) => `<h2 tabindex="-1" id="step-title">${title}</h2><p class="step-description">${description}</p>`;
  function content() {
    switch(step) {
      case 0: return heading('Como podemos chamar você?', 'Vamos começar pelos dados que uma empresa pode usar para entrar em contato.') + field('name','Seu nome completo',{required:true,autocomplete:'name',placeholder:'Como você quer aparecer no currículo'}) + `<div class="field-row">${field('city','Cidade',{autocomplete:'address-level2',placeholder:'Ex.: São Paulo'})}${field('uf','Estado (UF)',{placeholder:'Ex.: SP'})}</div>` + field('phone','Telefone ou WhatsApp com DDD',{type:'tel',autocomplete:'tel',placeholder:'Ex.: (11) 99999-9999'}) + field('email','E-mail',{type:'email',autocomplete:'email',placeholder:'Ex.: seu.nome@email.com'}) + '<p class="hint">Informe pelo menos um contato: telefone ou e-mail.</p>' + field('link','LinkedIn ou portfólio',{placeholder:'Ex.: linkedin.com/in/seunome'}) + field('birthYear','Ano de nascimento',{placeholder:'Ex.: 1995',autocomplete:'bday-year'}) + selectField('maritalStatus','Estado civil',['Solteiro(a)','Casado(a)','União estável','Divorciado(a)','Separado(a)','Viúvo(a)']) + selectField('license','Habilitação (CNH)',['A','B','AB','C','AC','D','AD','E','AE']) + '<p class="hint">Se não tiver habilitação, deixe “Não informar”. Os dados opcionais só aparecem quando preenchidos.</p>';
      case 1: return heading('Que oportunidade você procura?', 'Um objetivo curto ajuda a empresa a entender o que você busca.') + field('objective','Qual cargo ou área você deseja?',{required:true,placeholder:'Ex.: Auxiliar administrativo ou primeiro emprego',hint:'Pode ser uma frase simples. Ex.: Busco uma oportunidade como auxiliar de cozinha.'}) + field('summary','Quer contar um pouco sobre você?',{area:true,placeholder:'Ex.: Tenho experiência com atendimento ao público, facilidade para aprender e gosto de trabalhar em equipe.',hint:'Use suas palavras. Se preferir, deixe em branco.'});
      case 2: return heading('Vamos contar sua experiência?', 'Vale emprego formal, trabalho autônomo, estágio e voluntariado. Você também pode pular esta etapa.') + `<label class="check-label"><input type="checkbox" id="first-job" ${data.firstJob ? 'checked' : ''}> Estou procurando meu primeiro emprego</label>${data.firstJob ? '<div class="tip">Tudo bem! Destaque sua formação, cursos, projetos e habilidades nas próximas etapas. Suas experiências preenchidas ficam guardadas, mas não aparecem enquanto esta opção estiver marcada.</div>' : cards('experiences') + '<button type="button" class="add-button" data-add="experiences">+ Adicionar experiência</button><p class="hint">Coloque a experiência mais recente primeiro.</p>'}`;
      case 3: return heading('O que você estudou ou está estudando?', 'Inclua sua escolaridade, mesmo que ainda esteja cursando ou tenha interrompido.') + cards('education') + '<button type="button" class="add-button" data-add="education">+ Adicionar formação</button>';
      case 4: return heading('O que você sabe fazer?', 'Cursos e habilidades também fazem parte da sua história. Preencha só o que fizer sentido para você.') + cards('courses') + '<button type="button" class="add-button" data-add="courses">+ Adicionar curso ou certificação</button><hr class="divider">' + field('technical','Ferramentas e conhecimentos',{area:true,placeholder:'Ex.: Excel básico, atendimento ao público, operação de caixa'}) + field('personal','Habilidades pessoais',{placeholder:'Ex.: Organização, pontualidade, trabalho em equipe'}) + field('languages','Idiomas e nível',{placeholder:'Ex.: Inglês básico, espanhol intermediário'}) + field('additional','Informações adicionais',{area:true,placeholder:'Ex.: Projetos da faculdade, trabalho voluntário, disponibilidade de horário ou CNH, se forem relevantes à vaga.'});
      case 5: return heading('Você quer colocar uma foto?', 'A foto é opcional. Um currículo sem foto também está completo.') + `<fieldset class="photo-fieldset"><legend class="group-label">Escolha uma opção</legend><div class="photo-options"><label><input type="radio" name="photo-choice" value="no" ${!withPhoto ? 'checked' : ''}> Sem foto</label><label><input type="radio" name="photo-choice" value="yes" ${withPhoto ? 'checked' : ''}> Com foto</label></div></fieldset>${withPhoto ? `<div class="field"><label for="photo-file">Escolher foto do computador</label><input id="photo-file" type="file" accept="image/jpeg,image/png,image/webp" aria-describedby="photo-hint"><p id="photo-hint" class="hint">JPG, PNG ou WebP de até 10 MB. A foto será ajustada ao espaço do currículo, com corte central.</p></div>${data.photo ? `<img class="photo-preview" src="${data.photo}" alt="Sua foto selecionada"><button type="button" id="remove-photo" class="text-button danger">Remover foto</button>` : ''}` : ''}<div class="tip">Se escolher uma foto, prefira um retrato com boa iluminação e fundo simples. A imagem permanece neste computador.</div>`;
      case 6: return heading('Seu currículo está pronto para revisar!', 'Confira os contatos e a escrita antes de compartilhar. Você pode voltar a qualquer etapa para corrigir.') + '<div id="page-fit" class="page-fit" role="status"></div><ul class="review-list"><li>Confirme se o telefone e o e-mail estão corretos.</li><li>Confira as datas, nomes de empresas e instituições.</li><li>Use apenas informações verdadeiras e relevantes para a vaga.</li></ul><div class="review-actions"><button type="button" id="print" class="primary large">Imprimir ou salvar em PDF</button><button type="button" id="save-final" class="secondary">Salvar arquivo para editar depois</button></div><div class="tip"><strong>Para salvar em PDF:</strong> na janela de impressão, escolha “Salvar como PDF” ou “Microsoft Print to PDF”. Use papel A4 e escala 100%. A impressão remove as informações do navegador nas margens. Se ainda aparecerem data, título ou caminho do arquivo, em “Mais configurações” desmarque “Cabeçalhos e rodapés”. O aplicativo ajusta o texto para uma folha, com fonte mínima de 9 pontos.</div><p class="hint">O arquivo para editar depois é um JSON, não um PDF. Ele contém seus dados pessoais e sua foto, se houver. Guarde em um local seguro.</p>';
    }
  }
  function render(focus = true) {
    $('welcome').hidden = true; $('builder').hidden = false;
    $('builder').classList.toggle('review-mode', step === 6);
    $('steps').innerHTML = labels.map((label,i) => `<li><button type="button" class="step-button" data-step="${i}" ${i === step ? 'aria-current="step"' : ''}><span class="step-number">${i+1}</span>${label}</button></li>`).join('');
    $('step-counter').textContent = `Etapa ${step+1} de ${labels.length}`;
    $('progress-percent').textContent = `${Math.round((step+1)/labels.length*100)}%`;
    $('progress').style.width = `${(step+1)/labels.length*100}%`;
    $('step-content').innerHTML = content();
    $('back').disabled = step === 0; $('next').hidden = step === 6;
    $('next').textContent = step === 5 ? 'Revisar currículo →' : 'Continuar →';
    $('form-error').hidden = true;
    updatePreview();
    if(focus) $('step-title').focus();
  }
  function section(title, body) { return body ? `<section><h2>${title}</h2>${body}</section>` : ''; }
  function paragraph(value) { return value.trim() ? `<p>${escape(value.trim())}</p>` : ''; }
  function entry(title, meta, body = '') { return `<div class="entry">${title ? `<p class="entry-title">${escape(title)}</p>` : ''}${meta ? `<p class="entry-meta">${escape(meta)}</p>` : ''}${body}</div>`; }
  function nonempty(item) { return Object.values(item).some(v => v.trim()); }
  function resumeHTML() {
    const location = [data.city.trim(),data.uf.trim()].filter(Boolean).join(' – ');
    const contact = [location,data.phone.trim(),data.email.trim(),data.link.trim()].filter(Boolean).join(' · ');
    const personal = [data.birthYear.trim() ? 'Ano de nascimento: '+data.birthYear.trim() : '', data.maritalStatus.trim() ? 'Estado civil: '+data.maritalStatus.trim() : '', data.license.trim() ? 'CNH: '+data.license.trim() : ''].filter(Boolean).join(' · ');
    let html = `<header class="resume-header"><div><h1>${escape(data.name.trim() || 'Seu nome completo')}</h1><p class="contact">${escape(contact)}</p>${personal ? `<p class="contact">${escape(personal)}</p>` : ''}</div>${data.photo ? `<img class="resume-photo" src="${data.photo}" alt="Foto de ${escape(data.name || 'perfil')}">` : ''}</header>`;
    html += section('Objetivo profissional', paragraph(data.objective));
    html += section('Resumo profissional', paragraph(data.summary));
    if(!data.firstJob) html += section('Experiência profissional',data.experiences.filter(nonempty).map(x => {
      const bullets = x.description.split('\n').map(s=>s.trim()).filter(Boolean);
      return entry([x.role,x.company].filter(Boolean).join(' · '),[x.start,x.end].filter(Boolean).join(' a '),bullets.length ? `<ul>${bullets.map(b=>`<li>${escape(b)}</li>`).join('')}</ul>` : '');
    }).join(''));
    html += section('Formação acadêmica', data.education.filter(nonempty).map(x=>entry(x.course,[x.institution,x.status].filter(Boolean).join(' · '))).join(''));
    html += section('Cursos e certificações', data.courses.filter(nonempty).map(x=>entry(x.name,[x.institution,x.hours,x.year].filter(Boolean).join(' · '))).join(''));
    html += section('Habilidades e idiomas', [['Técnicas',data.technical],['Pessoais',data.personal],['Idiomas',data.languages]].filter(([,v])=>v.trim()).map(([k,v])=>`<p><strong>${k}:</strong> ${escape(v)}</p>`).join(''));
    html += section('Informações adicionais',paragraph(data.additional));
    if(!data.name && !data.objective) html += '<p class="empty-preview">Suas respostas aparecem aqui, organizadas em um currículo.</p>';
    return html;
  }
  function updatePreview(){ const html=resumeHTML(); $('preview').innerHTML=html; $('print-resume').innerHTML=html;if(step===6)fitPage(); }
  function fitPage(){
    measure.innerHTML=resumeHTML();
    const maxHeight=265*96/25.4;
    let font=11;
    measure.style.fontSize=font+'pt';
    while(measure.getBoundingClientRect().height>maxHeight && font>9){font=Math.round((font-.25)*100)/100;measure.style.fontSize=font+'pt';}
    const fits=measure.getBoundingClientRect().height<=maxHeight;
    $('print-resume').style.fontSize=font+'pt';
    document.body.classList.toggle('print-too-long',!fits);
    const label=$('page-fit');if(label){label.classList.toggle('too-long',!fits);label.textContent=fits?`Cabe em uma folha A4. Texto ajustado para ${font.toLocaleString('pt-BR')} pontos.`:'O conteúdo ultrapassa uma folha. Resuma as atividades, remova itens menos relevantes ou encurte os textos. A impressão será liberada quando couber, sem reduzir a fonte abaixo de 9 pontos.';}
    if($('print'))$('print').disabled=!fits;
    return fits;
  }
  function message(text) { $('status').textContent = text; }
  function error(text, id) {
    $('form-error').textContent=text; $('form-error').hidden=false;
    if(id && $(id)){ $(id).setAttribute('aria-invalid','true'); $(id).focus(); }
    return false;
  }
  function validate(target = step) {
    if(target === 0) {
      if(data.birthYear.trim() && (!/^\d{4}$/.test(data.birthYear.trim()) || Number(data.birthYear)<1900 || Number(data.birthYear)>new Date().getFullYear())) return error('Informe um ano de nascimento válido, com quatro dígitos.','field-birthYear');
      if(!data.name.trim()) return error('Digite seu nome para continuar.','field-name');
      if(!data.phone.trim() && !data.email.trim()) return error('Informe um telefone ou e-mail para que a empresa consiga falar com você.','field-phone');
      if(data.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) return error('Confira o e-mail. Exemplo: seu.nome@email.com','field-email');
      if(data.phone.trim() && !/^\+?[\d\s().-]+$/.test(data.phone.trim())) return error('Confira o telefone. Use números com DDD.','field-phone');
      if(data.phone.trim() && (data.phone.replace(/\D/g,'').length<10 || data.phone.replace(/\D/g,'').length>15)) return error('Confira o telefone e inclua o DDD. Exemplo: (11) 99999-9999.','field-phone');
    }
    if(target === 1 && !data.objective.trim()) return error('Conte qual cargo ou área você procura.','field-objective');
    if(target === 5 && photoBusy) return error('Aguarde a foto terminar de carregar.');
    if(target === 5 && withPhoto && !data.photo) return error('Escolha uma foto ou marque “Sem foto” para continuar.','photo-file');
    return true;
  }
  function go(next) {
    if(next > step && !validate()) return;
    if(next === 6) {
      for(const required of [0,1,5]) {
        // Show missing required fields on their own step, including after direct navigation.
        const previous = step; step = required; render(false);
        if(!validate(required)) return;
        step=previous;
      }
    }
    step=next; render();
  }
  $('begin').addEventListener('click',()=>{step=0;render();});
  $('step-form').addEventListener('submit',e=>{e.preventDefault();go(Math.min(step+1,6));});
  $('back').addEventListener('click',()=>go(Math.max(0,step-1)));
  $('steps').addEventListener('click',e=>{const b=e.target.closest('[data-step]');if(b)go(Number(b.dataset.step));});
  $('step-content').addEventListener('input', e=>{
    const key=e.target.dataset.key;if(!key)return;
    if(key.includes('.')){const [kind,index,name]=key.split('.');data[kind][Number(index)][name]=e.target.value;}
    else data[key]=e.target.value;
    e.target.removeAttribute('aria-invalid');$('form-error').hidden=true;dirty=true;updatePreview();
  });
  $('step-content').addEventListener('change',async e=>{
    if(e.target.id==='first-job'){data.firstJob=e.target.checked;dirty=true;render(false);$('first-job').focus();}
    if(e.target.name==='photo-choice'){
      withPhoto=e.target.value==='yes';photoVersion++;photoBusy=false;
      if(!withPhoto){data.photo='';dirty=true;}
      render(false);document.querySelector(`[name="photo-choice"][value="${withPhoto?'yes':'no'}"]`).focus();
    }
    if(e.target.id==='photo-file' && e.target.files[0]) await selectPhoto(e.target.files[0]);
  });
  $('step-content').addEventListener('click',e=>{
    const b=e.target.closest('button');if(!b)return;
    if(b.dataset.add){const kind=b.dataset.add;if(data[kind].length>=20){message('Você pode adicionar até 20 itens por seção.');return;} const templates={experiences:{role:'',company:'',start:'',end:'',description:''},education:{course:'',institution:'',status:''},courses:{name:'',institution:'',hours:'',year:''}};data[kind].push({...templates[kind]});dirty=true;render(false);document.querySelectorAll('.entry-card input')[document.querySelectorAll('.entry-card input').length-Object.keys(templates[kind]).filter(k=>k!=='description').length]?.focus();}
    if(b.dataset.remove){data[b.dataset.remove].splice(Number(b.dataset.index),1);dirty=true;render(false);document.querySelector(`[data-add="${b.dataset.remove}"]`).focus();}
    if(b.id==='remove-photo'){data.photo='';photoVersion++;dirty=true;render(false);$('photo-file').focus();}
    if(b.id==='print'){
      updatePreview();if(!fitPage())return;const oldTitle=document.title;document.title=(data.name.trim()||'Currículo')+' - Currículo';
      window.print();document.title=oldTitle;
    }
    if(b.id==='save-final')saveDraft();
  });
  async function selectPhoto(file) {
    const version=++photoVersion;
    if(file.size>10*1024*1024)return error('A foto é muito grande. Escolha uma imagem de até 10 MB.','photo-file');
    if(!['image/jpeg','image/png','image/webp'].includes(file.type))return error('Escolha uma foto JPG, PNG ou WebP.','photo-file');
    photoBusy=true;message('Preparando sua foto…');
    const url=URL.createObjectURL(file);
    try{
      const img=new Image();img.src=url;await img.decode();
      if(img.naturalWidth*img.naturalHeight>40000000)throw new Error('large');
      const canvas=document.createElement('canvas');const scale=Math.min(1,600/Math.max(img.naturalWidth,img.naturalHeight));
      canvas.width=Math.max(1,Math.round(img.naturalWidth*scale));canvas.height=Math.max(1,Math.round(img.naturalHeight*scale));
      const context=canvas.getContext('2d');context.fillStyle='#fff';context.fillRect(0,0,canvas.width,canvas.height);context.drawImage(img,0,0,canvas.width,canvas.height);
      if(version!==photoVersion)return;
      data.photo=canvas.toDataURL('image/jpeg',.85);dirty=true;photoBusy=false;render(false);message('Foto adicionada. Confira o enquadramento na prévia.');
    }catch{if(version===photoVersion)error('Não foi possível abrir a foto. Tente outra imagem JPG ou PNG.','photo-file');}
    finally{URL.revokeObjectURL(url);if(version===photoVersion)photoBusy=false;}
  }
  function saveDraft() {
    if(photoBusy){message('Aguarde a foto terminar de carregar antes de salvar.');return;}
    const blob=new Blob([JSON.stringify({format:'meu-curriculo',version:1,data},null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='meu-curriculo-para-editar.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);dirty=false;
    message('Arquivo de edição enviado aos downloads. Confira se ele foi salvo antes de fechar a página. Em computadores compartilhados, apague o arquivo ao terminar.');
  }
  function parseDraft(raw) {
    const doc=JSON.parse(raw);
    if(!doc || doc.format!=='meu-curriculo' || doc.version!==1 || !doc.data || typeof doc.data!=='object')throw new Error('format');
    const clean=blank();
    for(const key of Object.keys(clean)){
      if(['experiences','education','courses'].includes(key))continue;
      if(key==='firstJob'){if(typeof doc.data[key]!=='boolean')throw new Error('type');clean[key]=doc.data[key];continue;}
      if(['birthYear','maritalStatus','license'].includes(key) && doc.data[key]===undefined)continue;
      if(typeof doc.data[key]!=='string' || doc.data[key].length>(key==='photo'?1500000:3000))throw new Error('type');
      clean[key]=doc.data[key];
    }
    if(clean.photo && !/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(clean.photo))throw new Error('photo');
    for(const [kind,keys] of Object.entries({experiences:['role','company','start','end','description'],education:['course','institution','status'],courses:['name','institution','hours','year']})){
      const list=doc.data[kind];if(!Array.isArray(list)||list.length>20)throw new Error('list');
      clean[kind]=list.map(item=>{if(!item || typeof item!=='object')throw new Error('item');const result={};for(const key of keys){if(typeof item[key]!=='string'||item[key].length>3000)throw new Error('value');result[key]=item[key];}return result;});
    }
    return clean;
  }
  $('save-draft').addEventListener('click',saveDraft);
  for(const id of ['load-welcome','load-builder'])$(id).addEventListener('click',()=>{$('draft-file').value='';$('draft-file').click();});
  $('draft-file').addEventListener('change',async e=>{
    const file=e.target.files[0];if(!file)return;
    try{
      if(file.size>2*1024*1024)throw new Error('size');
      const loaded=parseDraft(await file.text());
      if(loaded.photo){const img=new Image();img.src=loaded.photo;await img.decode();if(img.naturalWidth>600||img.naturalHeight>600)throw new Error('photo');}
      if(dirty && !window.confirm('Abrir este arquivo substitui o que você está preenchendo. Deseja continuar?'))return;
      photoVersion++;photoBusy=false;data=loaded;recordId=null;dirty=false;withPhoto=Boolean(data.photo);step=0;render();message('Currículo aberto. Revise as informações e continue de onde preferir.');
    }catch{message('Não foi possível abrir este arquivo. Escolha um JSON criado pelo botão “Salvar para continuar depois”. Seus dados atuais foram mantidos.');}
  });
  $('reset').addEventListener('click',()=>{
    if(!window.confirm('Apagar os dados desta tela e começar outro currículo? Arquivos já baixados não serão apagados.'))return;
    photoVersion++;photoBusy=false;data=blank();recordId=null;dirty=false;withPhoto=false;step=0;render();message('Dados da tela apagados. Currículos já salvos no banco permanecem na consulta.');
  });
  window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue='';}});
  window.addEventListener('beforeprint',()=>{updatePreview();fitPage();});
  async function api(path,options={}){
    const response=await fetch('/api/'+path,{...options,headers:{'Content-Type':'application/json','X-Local-Token':databaseToken,...options.headers}});
    const result=await response.json();if(!response.ok)throw new Error(result.error||'Não foi possível acessar o banco local.');return result;
  }
  async function saveDatabase(){
    if(photoBusy){message('Aguarde a foto terminar de carregar.');return;}
    if(!data.name.trim()){step=0;render();error('Informe o nome antes de salvar.','field-name');return;}
    const button=$('save-db');button.disabled=true;
    // Capture exactly what is saved; edits made during the request stay unsaved.
    const snapshot=JSON.stringify(data);
    try{const saved=await api('curriculos',{method:'POST',body:JSON.stringify({id:recordId,document:{format:'meu-curriculo',version:1,data:JSON.parse(snapshot)}})});recordId=saved.id;if(JSON.stringify(data)===snapshot)dirty=false;message('Currículo salvo no banco deste computador. Use “Consultar salvos” para abrir e editar depois.');}
    catch(e){message('Não foi possível salvar no banco. '+e.message+' Você pode baixar um arquivo de edição como alternativa.');}
    finally{button.disabled=false;}
  }
  function renderLibrary(){
    const search=$('library-search').value.toLocaleLowerCase('pt-BR');
    const items=libraryItems.filter(x=>x.nome.toLocaleLowerCase('pt-BR').includes(search));
    $('library-list').innerHTML=items.map(x=>`<div class="library-item"><div><p><strong>${escape(x.nome)}</strong></p><small>Atualizado em ${escape(new Date(x.atualizado).toLocaleString('pt-BR'))}</small></div><div class="actions"><button class="secondary" data-open-record="${x.id}">Editar</button><button class="text-button danger" data-delete-record="${x.id}">Excluir</button></div></div>`).join('');
    $('library-status').textContent=items.length?`${items.length} currículo(s) encontrado(s).`:'Nenhum currículo encontrado.';
  }
  async function openLibrary(){
    if(!$('library').open)$('library').showModal();$('library-status').textContent='Consultando banco local…';
    try{libraryItems=await api('curriculos');renderLibrary();}catch{libraryItems=[];$('library-list').innerHTML='';$('library-status').textContent='Banco indisponível. Verifique se a janela do servidor continua aberta.';}
  }
  for(const id of ['library-welcome','library-builder'])$(id).addEventListener('click',openLibrary);
  $('close-library').addEventListener('click',()=>$('library').close());
  $('library-search').addEventListener('input',renderLibrary);
  $('save-db').addEventListener('click',saveDatabase);
  $('library-list').addEventListener('click',async e=>{
    const button=e.target.closest('button');if(!button)return;
    try{
      if(button.dataset.openRecord){
        if(dirty&&!window.confirm('Você tem alterações não salvas. Abrir outro currículo e descartá-las?'))return;
        const saved=await api('curriculos/'+button.dataset.openRecord);const loaded=parseDraft(JSON.stringify(saved.document));
        photoVersion++;photoBusy=false;data=loaded;recordId=saved.id;withPhoto=Boolean(data.photo);dirty=false;step=0;$('library').close();render();message('Currículo aberto. Após editar, clique em “Salvar no computador” para atualizar o mesmo cadastro.');
      }
      if(button.dataset.deleteRecord){
        if(!window.confirm('Excluir este currículo do banco local? Esta ação não pode ser desfeita. Arquivos baixados continuam no computador.'))return;
        const id=Number(button.dataset.deleteRecord);await api('curriculos/'+id,{method:'DELETE'});
        if(recordId===id){recordId=null;dirty=true;}
        await openLibrary();
      }
    }catch(e){$('library-status').textContent='Não foi possível concluir a operação. '+e.message;}
  });
  if(location.protocol==='http:' || location.protocol==='https:'){
    api('status').then(result=>{databaseToken=result.token;for(const id of ['library-welcome','library-builder','save-db'])$(id).hidden=false;}).catch(()=>message('Modo sem banco local. Para consultar currículos, inicie pelo arquivo “Abrir no Windows.bat” ou execute servidor.py.'));
  }
})();
