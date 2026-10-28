/* Teste funcional sem dependências externas: Node 22+ e Chromium. */
const {spawn,execFileSync}=require('node:child_process');
const fs=require('node:fs');const os=require('node:os');const path=require('node:path');const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),temp=fs.mkdtempSync(path.join(os.tmpdir(),'curriculo-test-'));
const children=[];let socket;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function until(fn){for(let i=0;i<120;i++){try{const v=await fn();if(v)return v;}catch{}await sleep(100);}throw Error('Tempo esgotado');}
function launch(command,args){const child=spawn(command,args,{cwd:root,stdio:['ignore','pipe','pipe']});children.push(child);return child;}
async function server(){let output='';const p=launch(process.env.PYTHON||'python3',['servidor.py','--no-browser','--database',path.join(temp,'test.sqlite3')]);p.stdout.on('data',x=>output+=x);p.stderr.on('data',x=>output+=x);const url=await until(()=>output.match(/http:\/\/127\.0\.0\.1:\d+/)?.[0]);return {p,url};}
async function run(){
 let srv=await server();
 const request=async(suffix,options={})=>{const res=await fetch(srv.url+'/api/'+suffix,options);return {status:res.status,data:await res.json()};};
 let token=(await request('status')).data.token;
 const doc={format:'meu-curriculo',version:1,data:{name:'Ana Souza',city:'Recife',uf:'PE',phone:'(81) 99999-1234',email:'ana@example.com',link:'',objective:'Auxiliar administrativo',summary:'Organizada, com experiência em atendimento ao público.',firstJob:false,experiences:[{role:'Atendente',company:'Loja Exemplo',start:'03/2023',end:'Atual',description:'Atendimento aos clientes.\nOrganização de produtos e controle de estoque.'}],education:[{course:'Ensino Médio',institution:'Escola Exemplo',status:'Concluído em 2022'}],courses:[{name:'Informática básica',institution:'Centro de Formação',hours:'40 horas',year:'2023'}],technical:'Word e Excel básico',personal:'Organização e trabalho em equipe',languages:'Inglês básico',additional:'Disponibilidade no período da manhã.',photo:''}};
 const write=d=>({method:'POST',headers:{'Content-Type':'application/json','X-Local-Token':token},body:JSON.stringify(d)});
 assert.equal((await request('curriculos',write({document:doc}))).status,200);
 let list=(await request('curriculos')).data;assert.equal(list.length,1);const id=list[0].id;
 doc.data.summary='Experiência com atendimento e organização de estoque.';
 assert.equal((await request('curriculos',write({id,document:doc}))).status,200);
 assert.equal((await request('curriculos/'+id)).data.document.data.summary,doc.data.summary);
 assert.equal((await request('curriculos',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'})).status,403);
 assert.equal((await request('curriculos',{...write({document:doc}),headers:{...write({}).headers,Origin:'https://example.com'}})).status,403);
 assert.equal((await request('curriculos',write({document:{}}))).status,400);
 srv.p.kill();await new Promise(r=>srv.p.once('exit',r));srv=await server();token=(await request('status')).data.token;
 assert.equal((await request('curriculos')).data.length,1);console.log('PASS: SQLite cria, lista, edita, persiste após reinício e recusa escrita externa/inválida.');
 const chrome=launch(process.env.CHROMIUM_PATH||'chromium',['--headless','--no-sandbox','--disable-gpu','--no-proxy-server','--remote-debugging-port=0','--user-data-dir='+path.join(temp,'browser'),'about:blank']);let err='';chrome.stderr.on('data',x=>err+=x);
 const endpoint=await until(()=>err.match(/DevTools listening on (ws:\/\/[^\s]+)/)?.[1]);const http=endpoint.replace('ws:','http:').split('/devtools')[0];
 const pages=await (await fetch(http+'/json/list')).json();socket=new WebSocket(pages.find(p=>p.type==='page').webSocketDebuggerUrl);await new Promise(r=>socket.addEventListener('open',r,{once:true}));let seq=0;const pending=new Map();socket.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result);}};
 const cdp=(method,params={})=>new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}));});
 const js=async(expression)=>{const r=await cdp('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
 const click=selector=>js(`document.querySelector(${JSON.stringify(selector)}).click()`);
 const set=(key,value)=>js(`(()=>{const el=document.querySelector('[data-key="${key}"]');el.value=${JSON.stringify(value)};el.dispatchEvent(new Event('input',{bubbles:true}));})()`);
 await cdp('Page.enable');
 const navigation=await cdp('Page.navigate',{url:'file://'+path.join(root,'index.html')});
 if(navigation.errorText){console.log('INFO: política do Chromium bloqueou file://; validando a mesma interface pelo servidor local.');await cdp('Page.navigate',{url:srv.url});}
 await until(()=>js('!!document.getElementById("begin")'));
 await click('#begin');await click('#next');assert.match(await js('document.getElementById("form-error").textContent'),/nome/);
 await set('name','Ana <script>alert(1)</script>');await set('email','errado');await click('#next');assert.equal(await js('document.querySelector("[aria-current=step]").dataset.step'),'0');
 await set('name','Ana Souza');await set('email','ana@example.com');await click('#next');await set('objective','Auxiliar administrativo');await click('#next');await click('[data-add=experiences]');await set('experiences.0.role','Atendente');await set('experiences.0.company','<script>alert(1)</script>');assert.equal(await js('document.querySelectorAll("#preview script").length'),0);
 await click('#first-job');assert.equal(await js('document.getElementById("preview").textContent.includes("Atendente")'),false);await click('#first-job');assert.equal(await js('document.getElementById("preview").textContent.includes("Atendente")'),true);
 await click('#next');await click('[data-add=education]');await set('education.0.course','Ensino Médio');await click('#next');await set('technical','Excel básico');await click('#next');await click('[name=photo-choice][value=yes]');await click('#next');assert.match(await js('document.getElementById("form-error").textContent'),/foto/);
 const png=path.join(temp,'foto.png');fs.writeFileSync(png,Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aF9sAAAAASUVORK5CYII=','base64'));
 async function upload(selector,file){const {root:dom}=await cdp('DOM.getDocument');const {nodeId}=await cdp('DOM.querySelector',{nodeId:dom.nodeId,selector});await cdp('DOM.setFileInputFiles',{nodeId,files:[file]});}
 await upload('#photo-file',png);await until(()=>js('!!document.querySelector(".photo-preview")'));await click('#next');assert.equal(await js('document.getElementById("print").disabled'),false);
 await cdp('Browser.setDownloadBehavior',{behavior:'allow',downloadPath:temp});await click('#save-final');const draft=path.join(temp,'meu-curriculo-para-editar.json');await until(()=>fs.existsSync(draft));assert.equal(JSON.parse(fs.readFileSync(draft)).data.name,'Ana Souza');
 const pdf=await cdp('Page.printToPDF',{preferCSSPageSize:true,displayHeaderFooter:false,printBackground:true});const pdfPath=path.join(temp,'curriculo.pdf');fs.writeFileSync(pdfPath,Buffer.from(pdf.data,'base64'));const info=execFileSync('pdfinfo',[pdfPath],{encoding:'utf8'});assert.match(info,/Pages:\s+1\b/);
 const text=execFileSync('pdftotext',[pdfPath,'-'],{encoding:'utf8'});assert.match(text,/Ana Souza/);assert.match(text,/Auxiliar administrativo/);assert.doesNotMatch(text,/Continuar|Funciona sem internet/);
 console.log('PASS: interface local, validações, primeiro emprego, escape de HTML, foto, exportação e PDF de uma página com conteúdo.');
 // Importe uma versão longa para confirmar o limite e depois uma versão normal.
 const long=structuredClone(doc);long.data.summary=('Uma atividade muito extensa com muitos detalhes e resultados. ').repeat(45);long.data.experiences=Array.from({length:12},()=>({...doc.data.experiences[0],description:'Atendia clientes e organizava os produtos.\n'.repeat(25)}));const longFile=path.join(temp,'long.json');fs.writeFileSync(longFile,JSON.stringify(long));await upload('#draft-file',longFile);await until(()=>js('document.querySelector("[aria-current=step]").dataset.step==="0"'));await click('[data-step="6"]');assert.equal(await js('document.getElementById("print").disabled'),true);assert.match(await js('document.getElementById("page-fit").textContent'),/ultrapassa/);
 const normal=path.join(temp,'normal.json');fs.writeFileSync(normal,JSON.stringify(doc));await upload('#draft-file',normal);await until(()=>js('document.querySelector("[aria-current=step]").dataset.step==="0"'));await click('[data-step="6"]');assert.equal(await js('document.getElementById("print").disabled'),false);
 await cdp('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});assert.equal(await js('document.documentElement.scrollWidth<=window.innerWidth'),true);await cdp('Emulation.clearDeviceMetricsOverride');
 const shot=await cdp('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});fs.writeFileSync(path.join(temp,'revisao.png'),Buffer.from(shot.data,'base64'));
 console.log('PASS: importação, bloqueio de excesso de conteúdo e layout móvel sem rolagem horizontal.');
 await cdp('Page.navigate',{url:srv.url});await until(()=>js('!document.getElementById("library-welcome").hidden'));await click('#library-welcome');await until(()=>js('!!document.querySelector("[data-open-record]")'));await click('[data-open-record]');await until(()=>js('!!document.getElementById("field-name")'));await set('name','Ana Souza atualizada');await click('#save-db');await until(async()=>((await request('curriculos/'+id)).data.document.data.name==='Ana Souza atualizada'));
 assert.equal((await request('curriculos')).data.length,1);
 await click('#library-builder');await until(()=>js('!!document.querySelector("[data-delete-record]")'));await cdp('Page.handleJavaScriptDialog',{accept:true}).catch(()=>{});
 // API deletion checks persistence and the same authenticated endpoint used by the UI.
 assert.equal((await request('curriculos/'+id,{method:'DELETE',headers:{'X-Local-Token':token}})).status,200);assert.equal((await request('curriculos')).data.length,0);
 console.log('PASS: consulta e edição pela interface atualizam o mesmo cadastro; exclusão no banco.');
 if(process.env.ARTIFACT_DIR){fs.mkdirSync(process.env.ARTIFACT_DIR,{recursive:true});for(const name of ['curriculo.pdf','revisao.png'])fs.copyFileSync(path.join(temp,name),path.join(process.env.ARTIFACT_DIR,name));}
 console.log('Todos os testes passaram. Dados utilizados são fictícios.');
}
run().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>{socket?.close();for(const c of children)c.kill();setTimeout(()=>{fs.rmSync(temp,{recursive:true,force:true});},500);});
