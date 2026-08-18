import http from "node:http";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { exec } from "node:child_process";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const files = {
  site: resolve(root, "content/site.json"),
  about: resolve(root, "content/pages/about.json"),
  contact: resolve(root, "content/pages/contact.json"),
  categories: resolve(root, "content/categories.json"),
  projects: resolve(root, "content/projects.json"),
};

async function readContent() {
  return Object.fromEntries(await Promise.all(Object.entries(files).map(async ([key, path]) => [key, JSON.parse(await readFile(path, "utf8"))])));
}

async function saveContent(content) {
  for (const [key, path] of Object.entries(files)) {
    if (!(key in content)) throw new Error(`Missing ${key}`);
    await writeFile(path, JSON.stringify(content[key], null, 2) + "\n", "utf8");
  }
}

const html = String.raw`<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Portfolio Content Manager</title>
<style>
:root{color-scheme:dark;--bg:#090a0c;--panel:#111318;--line:#292c33;--text:#f1f0ec;--muted:#9297a1;--accent:#8298ff}*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font:14px Arial,sans-serif}.app{display:grid;grid-template-columns:240px 1fr;min-height:100vh}.side{border-right:1px solid var(--line);padding:28px 18px;position:sticky;top:0;height:100vh}.side h1{font-size:17px;margin:0 10px 30px}.side button{display:block;width:100%;text-align:left;border:0;background:transparent;color:var(--muted);padding:12px;border-radius:5px;cursor:pointer}.side button.active,.side button:hover{background:#191c22;color:#fff}.main{padding:42px 5vw 100px;max-width:1100px}.top{display:flex;justify-content:space-between;align-items:center;margin-bottom:38px}.top h2{font-size:28px;margin:0}.save{background:var(--accent);color:#08090b;border:0;padding:12px 20px;font-weight:bold;cursor:pointer}.status{color:#78d1aa;margin-right:15px}.section{display:none}.section.active{display:block}.field{margin-bottom:22px}.field label{display:block;color:var(--muted);font-size:12px;margin-bottom:8px}.field input,.field textarea,.field select{width:100%;border:1px solid var(--line);background:var(--panel);color:var(--text);padding:12px;font:14px Arial,sans-serif}.field textarea{min-height:110px;resize:vertical}.grid{display:grid;grid-template-columns:1fr 1fr;gap:20px}.help{color:var(--muted);line-height:1.6}.project-layout{display:grid;grid-template-columns:270px 1fr;gap:28px}.project-list{border:1px solid var(--line)}.project-list button{display:block;width:100%;border:0;border-bottom:1px solid var(--line);background:transparent;color:var(--muted);padding:12px;text-align:left;cursor:pointer}.project-list button.active{background:#1a1d24;color:#fff}.row-actions{display:flex;gap:8px;margin-bottom:14px}.small{border:1px solid var(--line);background:var(--panel);color:var(--text);padding:8px 11px;cursor:pointer}.danger{color:#ff9b9b}.check{display:flex;gap:10px;align-items:center}.check input{width:auto}.work-area{border:1px solid var(--line);padding:16px;margin-bottom:12px}@media(max-width:750px){.app{grid-template-columns:1fr}.side{height:auto;position:static;border-right:0;border-bottom:1px solid var(--line)}.side button{display:inline-block;width:auto}.main{padding:28px 18px}.grid,.project-layout{grid-template-columns:1fr}}
.builder{margin-top:42px;padding-top:30px;border-top:1px solid var(--line)}.builder-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:18px}.add-blocks{display:flex;gap:7px;flex-wrap:wrap;margin-bottom:20px}.content-block{border:1px solid var(--line);background:#0d0f13;margin-bottom:13px}.block-bar{height:42px;padding:0 12px;background:#181b21;display:flex;align-items:center;gap:7px}.block-bar strong{margin-right:auto;text-transform:capitalize;font-size:12px}.block-body{padding:16px}.block-bar button{border:1px solid var(--line);background:transparent;color:var(--muted);cursor:pointer}.upload{display:block;margin-top:8px;color:var(--muted);font-size:11px}.upload input{margin-top:7px}.block-preview{max-width:180px;max-height:110px;display:block;margin-top:10px}
</style></head><body><div class="app"><aside class="side"><h1>Portfolio content</h1><button data-tab="site" class="active">Site & homepage</button><button data-tab="about">About</button><button data-tab="contact">Contact</button><button data-tab="categories">Categories</button><button data-tab="projects">Projects</button></aside><main class="main"><div class="top"><h2 id="title">Site & homepage</h2><div><span class="status" id="status"></span><button class="save" id="save">Save all changes</button></div></div>
<section id="site" class="section active"></section><section id="about" class="section"></section><section id="contact" class="section"></section><section id="categories" class="section"></section><section id="projects" class="section"></section>
</main></div>
<script>
let data, selectedProject=0; const $=s=>document.querySelector(s); const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function field(label,key,value,type='input'){return '<div class="field"><label>'+label+'</label><'+type+' data-key="'+key+'">'+(type==='textarea'?esc(value):'')+(type==='input'?'':'</'+type+'>')+(type==='input'?'':'')+'</div>'.replace('<input data-key="'+key+'">','<input data-key="'+key+'" value="'+esc(value)+'">')}
function render(){
 $('#site').innerHTML='<div class="grid">'+field('Name','name',data.site.name)+field('Role / tagline','role',data.site.role)+field('Location','location',data.site.location)+field('Email','email',data.site.email)+field('GitHub URL','github',data.site.github)+'</div><p class="help">The email is displayed on the Contact page and opens the visitor’s email app. No form or backend is used.</p>';
 $('#about').innerHTML=field('Heading','heading',data.about.heading)+field('Introduction','lead',data.about.lead,'textarea')+field('Background paragraphs (separate with a blank line)','background',data.about.background.join('\n\n'),'textarea')+'<h3>Work areas</h3><div id="workAreas"></div><button class="small" id="addArea">Add work area</button>'; renderAreas();
 $('#contact').innerHTML=field('Heading','heading',data.contact.heading)+field('Introduction','intro',data.contact.intro,'textarea');
 $('#categories').innerHTML=field('Categories (one per line)','categories',data.categories.join('\n'),'textarea')+'<p class="help">Categories appear across the Projects page. Projects assigned to a removed category are not deleted.</p>';
 renderProjects(); bindInputs();
}
function renderAreas(){const box=$('#workAreas'); if(!box)return; box.innerHTML=data.about.workAreas.map((a,i)=>'<div class="work-area"><div class="field"><label>Title</label><input data-area="'+i+'" data-prop="title" value="'+esc(a.title)+'"></div><div class="field"><label>Description</label><textarea data-area="'+i+'" data-prop="description">'+esc(a.description)+'</textarea></div><button class="small danger" data-delete-area="'+i+'">Remove</button></div>').join(''); box.querySelectorAll('[data-area]').forEach(el=>el.oninput=()=>data.about.workAreas[+el.dataset.area][el.dataset.prop]=el.value); box.querySelectorAll('[data-delete-area]').forEach(el=>el.onclick=()=>{data.about.workAreas.splice(+el.dataset.deleteArea,1);renderAreas()}); $('#addArea').onclick=()=>{data.about.workAreas.push({title:'New area',description:''});renderAreas()}}
function renderProjects(){const section=$('#projects');const p=data.projects[selectedProject];section.innerHTML='<div class="row-actions"><button class="small" id="newProject">New project</button>'+(p?'<button class="small danger" id="deleteProject">Delete selected</button>':'')+'</div><div class="project-layout"><div class="project-list">'+data.projects.map((x,i)=>'<button class="'+(i===selectedProject?'active':'')+'" data-project="'+i+'">'+esc(x.title)+'</button>').join('')+'</div><div id="projectForm">'+(p?projectForm(p):'<p class="help">Create your first project.</p>')+'</div></div>';section.querySelectorAll('[data-project]').forEach(el=>el.onclick=()=>{selectedProject=+el.dataset.project;renderProjects()});$('#newProject').onclick=()=>{data.projects.push({title:'New project',displayTitle:'New project',slug:'new-project',category:data.categories[0]||'Projects',year:String(new Date().getFullYear()),image:'',summary:'',description:'',technologies:[],visual:'portfolio',featured:false,blocks:[]});selectedProject=data.projects.length-1;renderProjects()};if($('#deleteProject'))$('#deleteProject').onclick=()=>{if(confirm('Delete this project?')){data.projects.splice(selectedProject,1);selectedProject=Math.max(0,selectedProject-1);renderProjects()}};section.querySelectorAll('[data-project-key]').forEach(el=>{el.oninput=()=>{const key=el.dataset.projectKey;p[key]=key==='featured'?el.checked:key==='technologies'?el.value.split(',').map(x=>x.trim()).filter(Boolean):el.value}});if(p)bindBlocks(p)}
function projectForm(p){p.blocks??=[];const options=data.categories.map(c=>'<option '+(c===p.category?'selected':'')+'>'+esc(c)+'</option>').join('');return '<div class="grid">'+pf('Title','title',p.title)+pf('Short display title','displayTitle',p.displayTitle)+pf('URL slug','slug',p.slug)+pf('Year','year',p.year)+'</div><div class="field"><label>Category</label><select data-project-key="category">'+options+'</select></div>'+pf('Summary','summary',p.summary,'textarea')+'<div class="grid">'+pf('Technologies (comma separated)','technologies',p.technologies.join(', '))+pf('Card / cover image','image',p.image)+pf('Visual colour key','visual',p.visual)+'</div><label class="check"><input type="checkbox" data-project-key="featured" '+(p.featured?'checked':'')+'> Featured on homepage</label><div class="builder"><div class="builder-head"><div><h3>Project page story</h3><p class="help">Blocks appear on the page in this order.</p></div></div><div class="add-blocks">'+['heading','text','image','video','split','divider'].map(type=>'<button type="button" class="small" data-add-block="'+type+'">+ '+type+'</button>').join('')+'</div><div id="blocks">'+p.blocks.map(blockHtml).join('')+'</div></div>'}
function pf(label,key,value,type='input'){return '<div class="field"><label>'+label+'</label>'+(type==='textarea'?'<textarea data-project-key="'+key+'">'+esc(value)+'</textarea>':'<input data-project-key="'+key+'" value="'+esc(value)+'">')+'</div>'}
function blockHtml(block,index){let body='';if(block.type==='heading')body=bf('Heading','heading',block.heading,index);if(block.type==='text')body=bf('Text (blank lines create paragraphs)','text',block.text,index,'textarea');if(block.type==='image'||block.type==='video')body=mediaFields(block,index);if(block.type==='split')body=bf('Section heading','heading',block.heading,index)+bf('Text','text',block.text,index,'textarea')+mediaFields(block,index)+selectField('Image side','side',block.side||'left',index,['left','right']);return '<div class="content-block"><div class="block-bar"><strong>'+block.type+'</strong><button data-up="'+index+'">↑</button><button data-down="'+index+'">↓</button><button class="danger" data-delete-block="'+index+'">×</button></div><div class="block-body">'+body+'</div></div>'}
function bf(label,key,value,index,type='input'){return '<div class="field"><label>'+label+'</label>'+(type==='textarea'?'<textarea data-block="'+index+'" data-block-key="'+key+'">'+esc(value||'')+'</textarea>':'<input data-block="'+index+'" data-block-key="'+key+'" value="'+esc(value||'')+'">')+'</div>'}
function selectField(label,key,value,index,options){return '<div class="field"><label>'+label+'</label><select data-block="'+index+'" data-block-key="'+key+'">'+options.map(x=>'<option '+(x===value?'selected':'')+'>'+x+'</option>').join('')+'</select></div>'}
function mediaFields(block,index){return bf('Media path','src',block.src,index)+bf('Alt text','alt',block.alt,index)+bf('Caption','caption',block.caption,index)+selectField('Width','size',block.size||'normal',index,['normal','wide','full'])+'<label class="upload">Choose a local file<input type="file" data-upload-block="'+index+'" accept="'+(block.type==='video'?'video/*':'image/*')+'"></label>'+(block.src?'<span class="help">Current: '+esc(block.src)+'</span>':'')}
function bindBlocks(p){document.querySelectorAll('[data-add-block]').forEach(el=>el.onclick=()=>{const type=el.dataset.addBlock;const block={type};if(type==='heading')block.heading='New section';if(type==='text')block.text='';if(type==='image'||type==='video')Object.assign(block,{src:'',alt:'',caption:'',size:type==='video'?'wide':'normal'});if(type==='split')Object.assign(block,{heading:'New section',text:'',src:'',alt:'',side:'left',size:'normal'});p.blocks.push(block);renderProjects()});document.querySelectorAll('[data-block-key]').forEach(el=>el.oninput=()=>p.blocks[+el.dataset.block][el.dataset.blockKey]=el.value);document.querySelectorAll('[data-delete-block]').forEach(el=>el.onclick=()=>{p.blocks.splice(+el.dataset.deleteBlock,1);renderProjects()});document.querySelectorAll('[data-up]').forEach(el=>el.onclick=()=>moveBlock(p,+el.dataset.up,-1));document.querySelectorAll('[data-down]').forEach(el=>el.onclick=()=>moveBlock(p,+el.dataset.down,1));document.querySelectorAll('[data-upload-block]').forEach(el=>el.onchange=async()=>{const file=el.files[0];if(!file)return;el.disabled=true;const response=await fetch('/api/upload?slug='+encodeURIComponent(p.slug)+'&name='+encodeURIComponent(file.name),{method:'POST',body:file});const result=await response.json();p.blocks[+el.dataset.uploadBlock].src=result.path;renderProjects()})}
function moveBlock(p,index,direction){const target=index+direction;if(target<0||target>=p.blocks.length)return;[p.blocks[index],p.blocks[target]]=[p.blocks[target],p.blocks[index]];renderProjects()}
function bindInputs(){document.querySelectorAll('#site [data-key]').forEach(el=>el.oninput=()=>data.site[el.dataset.key]=el.value);document.querySelectorAll('#about>[data-key],#about .field>[data-key]').forEach(el=>el.oninput=()=>{const k=el.dataset.key;data.about[k]=k==='background'?el.value.split(/\n\s*\n/).filter(Boolean):el.value});document.querySelectorAll('#contact [data-key]').forEach(el=>el.oninput=()=>data.contact[el.dataset.key]=el.value);$('#categories [data-key]').oninput=e=>data.categories=e.target.value.split('\n').map(x=>x.trim()).filter(Boolean)}
document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{document.querySelectorAll('[data-tab],.section').forEach(x=>x.classList.remove('active'));b.classList.add('active');$('#'+b.dataset.tab).classList.add('active');$('#title').textContent=b.textContent});
$('#save').onclick=async()=>{const r=await fetch('/api/content',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});$('#status').textContent=r.ok?'Saved':'Save failed';setTimeout(()=>$('#status').textContent='',2500)};
fetch('/api/content').then(r=>r.json()).then(x=>{data=x;render()});
</script></body></html>`;

const server = http.createServer(async (request, response) => {
  try {
    const requestUrl = new URL(request.url, "http://127.0.0.1:4173");
    if (requestUrl.pathname === "/api/upload" && request.method === "POST") {
      const safeSlug = (requestUrl.searchParams.get("slug") || "project").replace(/[^a-z0-9-]/gi, "-").toLowerCase();
      const safeName = (requestUrl.searchParams.get("name") || "media").replace(/[^a-z0-9._-]/gi, "-");
      const mediaDirectory = resolve(root, "public/projects", safeSlug);
      await mkdir(mediaDirectory, { recursive: true });
      const chunks = []; for await (const chunk of request) chunks.push(chunk);
      await writeFile(resolve(mediaDirectory, safeName), Buffer.concat(chunks));
      response.setHeader("Content-Type", "application/json");
      response.end(JSON.stringify({ path: `/projects/${safeSlug}/${safeName}` })); return;
    }
    if (request.url === "/api/content" && request.method === "GET") {
      response.setHeader("Content-Type", "application/json"); response.end(JSON.stringify(await readContent())); return;
    }
    if (request.url === "/api/content" && request.method === "POST") {
      let body = ""; for await (const chunk of request) body += chunk;
      await saveContent(JSON.parse(body)); response.end("saved"); return;
    }
    response.setHeader("Content-Type", "text/html; charset=utf-8"); response.end(html);
  } catch (error) { response.statusCode = 500; response.end(String(error)); }
});

server.listen(4173, "127.0.0.1", () => {
  const url = "http://127.0.0.1:4173";
  console.log(`Portfolio Content Manager: ${url}`);
  if (process.platform === "win32") exec(`start "" "${url}"`);
});
