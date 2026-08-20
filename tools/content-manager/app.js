const $ = s => document.querySelector(s);
const esc = value => String(value ?? "").replace(/[&<>\"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const asset = src => src ? `/asset?path=${encodeURIComponent(src)}` : "";
const isHexColor = value => /^#[0-9a-f]{6}$/i.test(String(value||""));
const safeColor = value => isHexColor(value) ? String(value) : "#f28c28";
const homeFallbackAccent = project => ({pizza:"#d8845d",boids:"#58bdb3",mandelbrot:"#9a72db",daydrop:"#879cff"})[project?.visual]||"#879cff";
async function sampleImageAccent(src){
  if(!src)return null;
  return new Promise(resolve=>{
    const image=new Image();
    image.onload=()=>{
      const canvas=document.createElement("canvas");canvas.width=canvas.height=64;
      const context=canvas.getContext("2d",{willReadFrequently:true});if(!context)return resolve(null);
      context.drawImage(image,0,0,64,64);
      const pixels=context.getImageData(0,0,64,64).data;
      let red=0,green=0,blue=0,total=0;
      for(let i=0;i<pixels.length;i+=4){
        const alpha=pixels[i+3]/255,max=Math.max(pixels[i],pixels[i+1],pixels[i+2]),min=Math.min(pixels[i],pixels[i+1],pixels[i+2]);
        if(alpha<.18||max<24)continue;
        const saturation=max?(max-min)/max:0,weight=alpha*(.5+saturation);
        red+=pixels[i]*weight;green+=pixels[i+1]*weight;blue+=pixels[i+2]*weight;total+=weight;
      }
      if(!total)return resolve(null);
      resolve("#"+[red,green,blue].map(value=>Math.round(value/total).toString(16).padStart(2,"0")).join(""));
    };
    image.onerror=()=>resolve(null);image.src=asset(src);
  });
}
const cleanText = value => String(value ?? "").replace(/\r\n?/g,"\n").replace(/[\u200B-\u200D\uFEFF]/g,"").replace(/[ \t]+\n/g,"\n").replace(/\n[ \t]*\n(?:[ \t]*\n)+/g,"\n\n").trim();
function normaliseContent(){[...(data.projects||[]),...(data.products||[])].forEach(p=>{["title","summary","description"].forEach(key=>{if(typeof p[key]==="string")p[key]=cleanText(p[key])});(p.blocks||[]).forEach(block=>{["heading","text","caption","alt"].forEach(key=>{if(typeof block[key]==="string")block[key]=cleanText(block[key])})})})}
let data, contentMode = "home", projectIndex = 0, selected = "homeSettings", insertAt = null, dirty = false, uploadTarget = null, savedTextRange = null, homeSlideIndex = 0;
const defaults = {
  heading: {type:"heading",heading:"New heading"}, text:{type:"text",text:"Write your story here.",html:""},
  image:{type:"image",src:"",alt:"",caption:"",size:"normal"}, video:{type:"video",src:"",caption:"",size:"wide"},
  split:{type:"split",heading:"Section heading",text:"Add text that supports this image.",src:"",alt:"",side:"left"}, divider:{type:"divider"},
  binWidget:{type:"binWidget",heading:"Next bin collection",url:"",count:2,recyclingIcon:"",refuseIcon:""},
  gallery:{type:"gallery",heading:"Project gallery",images:[],interval:20},
  button:{type:"button",label:"Learn more",url:"/contact",shape:"square",hoverEffect:"default",hoverColor:"#f28c28"}
};
function collection(){return data[contentMode]||[]}
function project(){ return collection()[projectIndex]; }
function isProductMode(){return contentMode==="products"}
function isHomeMode(){return contentMode==="home"}
function homeSettings(){
  data.site??={};
  data.site.home??={title:data.site.name||"Peter Murphy",tagline:data.site.role||"",exploreLabel:"Explore all projects",exploreUrl:"/projects",footerLabel:"GitHub ↗",footerUrl:data.site.github||"",featured:(data.projects||[]).filter(item=>item.featured).map(item=>({slug:item.slug,image:""}))};
  data.site.home.featured??=[];
  return data.site.home;
}
function homeEntries(){return homeSettings().featured.map(entry=>({entry,project:data.projects.find(item=>item.slug===entry.slug)})).filter(item=>item.project)}
function homeEntry(slug){return homeSettings().featured.find(entry=>entry.slug===slug)}
function homeProject(slug){return data.projects.find(item=>item.slug===slug)}
function plainToHtml(value){return String(value||"").split(/\n\n+/).map(text=>`<p>${esc(text)}</p>`).join("")}
function markDirty(){ dirty=true; $("#status").textContent="Unsaved changes"; $("#status").className="toast"; }
function paragraphs(text){ return String(text||"").split(/\n\n+/).map(p=>`<p>${esc(p)}</p>`).join(""); }
function blockHTML(block){
  if(block.type==="heading") return `<h2 class="story-heading">${esc(block.heading)}</h2>`;
  if(block.type==="text") return `<div class="story-text story-rich-text">${block.html||paragraphs(block.text)}</div>`;
  if(block.type==="divider") return `<hr class="story-divider" style="border-top-width:${Number(block.thickness)||1}px">`;
  if(block.type==="image") return `<figure class="story-media ${block.size||"normal"}">${block.src?`<img src="${asset(block.src)}" alt="${esc(block.alt)}">`:`<div class="empty-blocks">Choose an image in the panel</div>`}${block.caption?`<figcaption>${esc(block.caption)}</figcaption>`:""}</figure>`;
  if(block.type==="video") return `<figure class="story-media ${block.size||"wide"}">${block.src?`<video src="${asset(block.src)}" controls></video>`:`<div class="empty-blocks">Choose a video in the panel</div>`}${block.caption?`<figcaption>${esc(block.caption)}</figcaption>`:""}</figure>`;
  if(block.type==="split") return `<section class="story-split ${block.side||"left"}"><div class="split-media">${block.src?`<img src="${asset(block.src)}" alt="${esc(block.alt)}">`:`<div class="empty-blocks">Choose an image</div>`}</div><div><h2>${esc(block.heading)}</h2>${paragraphs(block.text)}</div></section>`;
  if(block.type==="binWidget") return `<section class="bin-widget-preview"><div class="bin-preview-icons">${block.recyclingIcon?`<img src="${asset(block.recyclingIcon)}" alt="">`:`<div class="bin-preview-icon">♻</div>`}${block.refuseIcon?`<img src="${asset(block.refuseIcon)}" alt="">`:""}</div><div><span>Live council data</span><h2>${esc(block.heading||"Next bin collection")}</h2><p>${block.url?"Council URL configured":"Add the council calendar URL in the panel"}</p></div></section>`;
  if(block.type==="gallery"){const first=(block.images||[])[0];return `<section class="gallery-widget-preview">${first?`<img src="${asset(first.src)}" alt="">`:`<div class="gallery-preview-empty">Add images in the panel</div>`}<button class="gallery-preview-arrow left">←</button><button class="gallery-preview-arrow right">→</button><div class="gallery-preview-meta"><h2>${esc(block.heading||"Project gallery")}</h2><span>${(block.images||[]).length} image${(block.images||[]).length===1?"":"s"}</span></div></section>`;}
  if(block.type==="button") return `<div class="story-button-preview story-button-preview--${block.shape||"square"} story-button-preview--hover-${block.hoverEffect||"default"}" style="--button-hover:${safeColor(block.hoverColor)}"><span>${esc(block.label||"Learn more")}</span><i>→</i></div>`;
  return "";
}
function insertRow(index){ return `<div class="insert-row" data-insert="${index}"><button class="insert-button ${insertAt===index?"open":""}">＋</button>${insertAt===index?`<div class="add-menu">${Object.keys(defaults).map(t=>`<button data-add="${t}">${t==="split"?"Image + text":t==="binWidget"?"Bin widget":t==="gallery"?"Slideshow gallery":t[0].toUpperCase()+t.slice(1)}</button>`).join("")}</div>`:""}</div>`; }
function headerOptions(p){return Object.assign({showMeta:!isProductMode(),showTitle:true,showSummary:true,showTags:true,showDivider:false,showIcon:false,icon:""},p.header||{})}

function renderHomeCanvas(){
  const h=homeSettings(),items=homeEntries();
  if(homeSlideIndex>=items.length)homeSlideIndex=0;
  const current=items[homeSlideIndex],p=current?.project,image=current?(current.entry.image||p.image||""):"",accent=current?(isHexColor(current.entry.accent)?current.entry.accent:homeFallbackAccent(p)):"#879cff";
  $("#openPage").href="http://localhost:3000/";
  $("#canvas").innerHTML=`<div class="home-preview" style="--home-accent:${accent}">
    <div class="preview-nav"><span>Peter Murphy</span><span>Projects &nbsp; Products &nbsp; About &nbsp; Contact</span></div>
    <section class="home-preview-identity ${selected==="homeSettings"?"selected":""}" data-home-settings><span class="header-edit-label">Click to edit</span><h1>${esc(h.title||data.site.name)}</h1><p>${esc(h.tagline||data.site.role)}</p></section>
    <section class="home-preview-carousel ${typeof selected==="string"&&selected.startsWith("home:")?"selected":""}" data-home-feature>
      <button class="home-preview-arrow" data-home-prev>←</button>
      ${current?`<div class="home-preview-project"><div class="home-preview-art">${image?`<img src="${asset(image)}" alt="">`:`<span>${esc(p.title.charAt(0))}</span>`}</div><h2>${esc(p.title)}</h2><p>${esc(p.summary)}</p></div>`:`<div class="home-preview-empty">Choose projects to feature on your homepage.</div>`}
      <button class="home-preview-arrow" data-home-next>→</button>
    </section>
    <div class="home-preview-actions">${items.length>1?`<div class="home-preview-dots">${items.map((_,i)=>`<i class="${i===homeSlideIndex?"active":""}"></i>`).join("")}</div>`:""}<span class="home-preview-explore">${esc(h.exploreLabel||"Explore all projects")} <i>→</i></span></div>
    <div class="home-preview-footer">${esc(h.footerLabel||"GitHub ↗")}</div>
  </div>`;
  $("#canvas").querySelector("[data-home-settings]").onclick=()=>{selected="homeSettings";renderAll(false)};
  const feature=$("#canvas").querySelector("[data-home-feature]");if(feature)feature.onclick=()=>{if(current)selected=`home:${current.entry.slug}`;else selected="homeManage";renderAll(false)};
  const step=direction=>{if(!items.length)return;homeSlideIndex=(homeSlideIndex+direction+items.length)%items.length;selected=`home:${items[homeSlideIndex].entry.slug}`;renderAll(false)};
  const prev=$("#canvas").querySelector("[data-home-prev]");if(prev)prev.onclick=e=>{e.stopPropagation();step(-1)};
  const next=$("#canvas").querySelector("[data-home-next]");if(next)next.onclick=e=>{e.stopPropagation();step(1)};
  if(current&&image&&!isHexColor(current.entry.accent)&&!current.entry.detectingAccent){
    current.entry.detectingAccent=true;
    sampleImageAccent(image).then(colour=>{delete current.entry.detectingAccent;if(colour){current.entry.accent=colour;current.entry.accentSource="auto";markDirty();renderAll(false)}});
  }
}
function homeSettingsInspector(){
  const h=homeSettings();
  return `<h2>Home page</h2><p class="hint">Edit the identity and links shown around the featured project carousel.</p>${field("Name","title",h.title||data.site.name)}${field("Tagline","tagline",h.tagline||data.site.role)}${field("Explore button text","exploreLabel",h.exploreLabel||"Explore all projects")}${field("Explore button URL","exploreUrl",h.exploreUrl||"/projects")}${field("Footer link text","footerLabel",h.footerLabel||"GitHub ↗")}${field("Footer link URL","footerUrl",h.footerUrl||data.site.github)}<button class="add-widget-button" id="manageHomeProjects">Manage featured projects</button>`;
}
function homeFeatureInspector(slug){
  const entry=homeEntry(slug),p=homeProject(slug);if(!entry||!p)return homeManageInspector();
  const image=entry.image||p.image||"";
  const accent=isHexColor(entry.accent)?entry.accent:homeFallbackAccent(p),swatches=["#f4f3ef","#879cff","#d8845d","#f28c28","#ef4444","#ec4899","#a855f7","#22c55e","#14b8a6","#eab308"];
  return `<h2>${esc(p.title)}</h2><p class="hint">This image is used only in the homepage carousel. It does not change the square project-page logo.</p>${image?`<img class="home-feature-image" src="${asset(image)}" alt="">`:`<div class="home-feature-empty">No homepage image yet</div>`}<button class="media-button" id="chooseHomeImage">Choose circular homepage image…</button>${entry.image?`<button class="clear-icon" id="clearHomeImage">Use project image instead</button>`:""}<div class="home-accent-field"><span>Glow and line colour</span><div class="colour-value"><i style="background:${accent}"></i><input id="homeAccentHex" value="${accent}" maxlength="7" spellcheck="false"></div><div class="colour-swatches">${swatches.map(colour=>`<button type="button" data-home-accent-swatch="${colour}" class="${colour.toLowerCase()===accent.toLowerCase()?"active":""}" style="--swatch:${colour}"></button>`).join("")}</div><button class="detect-accent" id="detectHomeAccent">Auto-detect from icon</button><small>${entry.accentSource==="custom"?"Custom colour":"Automatically sampled from the icon"}</small></div><div class="inspector-actions"><button data-home-move="-1">Move earlier</button><button data-home-move="1">Move later</button><button class="danger" id="removeHomeFeature">Remove from home</button><button id="manageHomeProjects">Manage all</button></div>`;
}
function homeManageInspector(){
  const chosen=new Set(homeSettings().featured.map(item=>item.slug));
  return `<h2>Featured projects</h2><p class="hint">Choose exactly what appears in the homepage carousel. Open a selected project afterwards to give it a separate circular homepage image.</p><div class="home-project-picker">${data.projects.map(p=>`<label><input type="checkbox" data-home-toggle="${esc(p.slug)}" ${chosen.has(p.slug)?"checked":""}><span>${esc(p.title)}</span><small>${esc(p.category)}</small></label>`).join("")}</div>`;
}
function renderHomeInspector(){
  const h=homeSettings();
  $("#inspector").innerHTML=selected==="homeManage"?homeManageInspector():typeof selected==="string"&&selected.startsWith("home:")?homeFeatureInspector(selected.slice(5)):homeSettingsInspector();
  $("#inspector").querySelectorAll("[data-key]").forEach(el=>el.oninput=()=>{h[el.dataset.key]=el.value;markDirty();renderHomeCanvas()});
  const manage=$("#manageHomeProjects");if(manage)manage.onclick=()=>{selected="homeManage";renderAll(false)};
  $("#inspector").querySelectorAll("[data-home-toggle]").forEach(el=>el.onchange=()=>{const slug=el.dataset.homeToggle,index=h.featured.findIndex(item=>item.slug===slug);if(el.checked&&index<0)h.featured.push({slug,image:""});if(!el.checked&&index>=0)h.featured.splice(index,1);homeSlideIndex=0;markDirty();renderAll()});
  const choose=$("#chooseHomeImage");if(choose)choose.onclick=()=>{const slug=selected.slice(5);uploadTarget={type:"homeImage",slug};$("#mediaPicker").multiple=false;$("#mediaPicker").accept="image/*";$("#mediaPicker").click()};
  const clear=$("#clearHomeImage");if(clear)clear.onclick=()=>{const entry=homeEntry(selected.slice(5));delete entry.image;delete entry.accent;markDirty();renderAll(false)};
  const setAccent=colour=>{if(!isHexColor(colour))return;const entry=homeEntry(selected.slice(5));entry.accent=colour;entry.accentSource="custom";markDirty();renderAll(false)};
  const accentHex=$("#homeAccentHex");if(accentHex)accentHex.onchange=()=>setAccent(accentHex.value);
  $("#inspector").querySelectorAll("[data-home-accent-swatch]").forEach(el=>el.onclick=()=>setAccent(el.dataset.homeAccentSwatch));
  const detect=$("#detectHomeAccent");if(detect)detect.onclick=async()=>{const slug=selected.slice(5),entry=homeEntry(slug),p=homeProject(slug),image=entry.image||p.image||"";detect.disabled=true;detect.textContent="Detecting…";const colour=await sampleImageAccent(image);if(colour){entry.accent=colour;entry.accentSource="auto";markDirty();renderAll(false)}else{detect.disabled=false;detect.textContent="Could not detect colour"}};
  const remove=$("#removeHomeFeature");if(remove)remove.onclick=()=>{const slug=selected.slice(5),index=h.featured.findIndex(item=>item.slug===slug);if(index>=0)h.featured.splice(index,1);homeSlideIndex=0;selected="homeManage";markDirty();renderAll()};
  $("#inspector").querySelectorAll("[data-home-move]").forEach(el=>el.onclick=()=>{const slug=selected.slice(5),index=h.featured.findIndex(item=>item.slug===slug),next=index+Number(el.dataset.homeMove);if(index<0||next<0||next>=h.featured.length)return;[h.featured[index],h.featured[next]]=[h.featured[next],h.featured[index]];homeSlideIndex=next;markDirty();renderAll()});
}

function renderCanvas(){
  if(isHomeMode())return renderHomeCanvas();
  const p=project(),blocks=p.blocks||[],header=headerOptions(p),headerIcon=header.icon||p.image||"",showIcon=header.showIcon&&headerIcon;
  $("#openPage").href=isProductMode()?`http://localhost:3000/products/${p.slug}`:`http://localhost:3000/projects/${p.category.toLowerCase()}/${p.slug}`;
  $("#canvas").innerHTML=`<div class="preview-nav"><span>← ${isProductMode()?"Products":"Projects"}</span><span>Peter Murphy</span></div><header class="preview-hero editable-header ${selected==="header"?"selected":""} ${showIcon?"with-icon":""}" data-header><span class="header-edit-label">Click to edit header</span><div class="preview-hero-layout">${showIcon?`<img class="preview-hero-icon" src="${asset(headerIcon)}" alt="">`:""}<div class="preview-hero-copy">${header.showMeta?`<div class="preview-kicker">${esc(isProductMode()?"Product":p.category)}${p.year?` · ${esc(p.year)}`:""}</div>`:""}${header.showTitle?`<h1>${esc(p.title)}</h1>`:""}${header.showSummary?`<div class="preview-summary">${esc(p.summary)}</div>`:""}${header.showTags?`<div class="preview-tags">${(p.technologies||[]).map(x=>`<span>${esc(x)}</span>`).join("")}</div>`:""}</div></div></header>${header.showDivider?`<hr class="preview-header-divider">`:""}<div class="blocks">${insertRow(0)}${blocks.length?blocks.map((b,i)=>`<div class="block-shell ${selected===i?"selected":""}" data-block="${i}"><span class="block-actions">Click to edit</span>${blockHTML(b)}</div>${insertRow(i+1)}`).join(""):`<div class="empty-blocks">This page has no sections yet. Use + to add the first one.</div>`}</div>`;
  $("#canvas").querySelector("[data-header]").onclick=e=>{e.stopPropagation();selected="header";insertAt=null;renderAll(false)};
  $("#canvas").querySelectorAll("[data-block]").forEach(el=>el.onclick=e=>{e.stopPropagation();selected=+el.dataset.block;insertAt=null;renderAll(false)});
  $("#canvas").querySelectorAll(".insert-button").forEach(el=>el.onclick=e=>{e.stopPropagation();insertAt=+el.parentElement.dataset.insert;renderCanvas()});
  $("#canvas").querySelectorAll("[data-add]").forEach(el=>el.onclick=e=>{e.stopPropagation();const b=structuredClone(defaults[el.dataset.add]);project().blocks.splice(insertAt,0,b);selected=insertAt;insertAt=null;markDirty();renderAll(false)});
}
function field(label,key,value,type="input",extra=""){ return `<label class="field">${label}${type==="textarea"?`<textarea data-key="${key}" class="${extra}">${esc(value)}</textarea>`:type==="select"?`<select data-key="${key}">${extra.split("|").map(v=>`<option ${v===value?"selected":""}>${v}</option>`).join("")}</select>`:`<input data-key="${key}" value="${esc(value)}" ${extra}>`}</label>`; }
function colourPicker(value){
  const current=safeColor(value),swatches=["#8298ff","#f28c28","#ef4444","#ec4899","#a855f7","#22c55e","#14b8a6","#eab308","#f4f3ef","#64748b"];
  return `<div class="colour-field"><span>Hover colour</span><div class="colour-value"><i style="background:${current}"></i><input data-key="hoverColor" value="${current}" maxlength="7" spellcheck="false" aria-label="Hover colour hex value"></div><div class="colour-swatches">${swatches.map(colour=>`<button type="button" data-color-swatch="${colour}" class="${colour===current?"active":""}" style="--swatch:${colour}" aria-label="Use ${colour}"></button>`).join("")}</div></div>`;
}
function categoryChoices(current){return [...new Set([...(data.categories||[]),current].filter(Boolean))].join("|")}
function widgetPicker(){return `<div class="widget-picker"><label for="widgetType">Widgets</label><div><select id="widgetType"><option value="binWidget">Bin collection</option><option value="gallery">Slideshow gallery</option></select><button id="addWidget">＋ Add</button></div></div>`}
function projectInspector(){
  const p=project(),kind=isProductMode()?"Product":"Project";
  return `<h2>${kind} settings</h2><p class="hint">The circular icon is used on the ${kind.toLowerCase()} listing and featured areas.</p><button class="media-button" id="chooseIcon">Choose circular ${kind.toLowerCase()} icon…</button>${p.image?`<img class="icon-preview" src="${asset(p.image)}" alt="">`:""}${field("Title","title",p.title)}${field("Short summary","summary",p.summary,"textarea","small-text")}${!isProductMode()?field("Category","category",p.category,"select",categoryChoices(p.category)):""}${field("Year","year",p.year||"")}${field("Tags — separate with commas","technologies",(p.technologies||[]).join(", "))}<label class="check"><input data-key="featured" type="checkbox" ${p.featured?"checked":""}> Featured ${kind.toLowerCase()}</label>${widgetPicker()}`;
}
function headerInspector(){
  const p=project(),h=headerOptions(p),icon=h.icon||p.image||"";
  return `<h2>Page header</h2><p class="hint">Choose exactly what appears at the top of this ${isProductMode()?"product":"project"} page.</p>${field("Title","title",p.title)}${field("Short summary","summary",p.summary,"textarea","small-text")}${!isProductMode()?field("Category","category",p.category,"select",categoryChoices(p.category)):""}${field("Year","year",p.year||"")}${field("Tags — separate with commas","technologies",(p.technologies||[]).join(", "))}<div class="header-icon-control"><span>Header icon</span>${icon?`<img src="${asset(icon)}" alt="">`:`<div>No icon selected</div>`}<button class="media-button" id="chooseHeaderIcon">Choose header icon…</button>${h.icon?`<button class="clear-icon" id="clearHeaderIcon">Use listing icon</button>`:""}</div><label class="check"><input data-header-key="showIcon" type="checkbox" ${h.showIcon?"checked":""}> Show icon beside title</label><label class="check"><input data-header-key="showMeta" type="checkbox" ${h.showMeta?"checked":""}> Show ${isProductMode()?"product label and year":"category and year"}</label><label class="check"><input data-header-key="showTitle" type="checkbox" ${h.showTitle?"checked":""}> Show title</label><label class="check"><input data-header-key="showSummary" type="checkbox" ${h.showSummary?"checked":""}> Show summary</label><label class="check"><input data-header-key="showTags" type="checkbox" ${h.showTags?"checked":""}> Show tags</label><label class="check"><input data-header-key="showDivider" type="checkbox" ${h.showDivider?"checked":""}> Add compact divider below header</label><button class="media-button secondary" id="projectSettings">${isProductMode()?"Product":"Project"} icon and settings</button>${widgetPicker()}`;
}
function categoryInspector(){return `<h2>Project categories</h2><p class="hint">These become the filters across the Projects page. Renaming a category updates every project using it.</p><div class="category-list">${data.categories.map((name,index)=>`<div class="category-editor-row"><input data-category-index="${index}" value="${esc(name)}"><button data-category-up="${index}" title="Move up">↑</button><button data-category-down="${index}" title="Move down">↓</button><button class="danger" data-category-delete="${index}" title="Remove">×</button></div>`).join("")}</div><button class="media-button" id="addCategory">＋ Add category</button>`}
function richTextControls(b){
  const html=b.html||plainToHtml(b.text);
  return `<div class="rich-toolbar"><input id="richColor" type="color" value="#8298ff" title="Text colour"><button id="applyRichColor" type="button">Apply colour to selection</button><button id="clearRichColor" type="button">Default colour</button></div><div id="richTextEditor" class="rich-text-editor" contenteditable="true">${html}</div><p class="hint">Highlight text, choose a colour, then apply it.</p>`;
}
function blockInspector(b){
  let controls="";
  if(b.type==="heading")controls=field("Heading","heading",b.heading);
  if(b.type==="text")controls=richTextControls(b);
  if(["image","video","split"].includes(b.type))controls+=`<button class="media-button" id="chooseMedia">Choose ${b.type==="video"?"video":"image"}…</button>`;
  if(b.type==="image")controls+=field("Alt text","alt",b.alt)+field("Caption (optional)","caption",b.caption)+field("Width","size",b.size||"normal","select","normal|wide|full");
  if(b.type==="video")controls+=field("Caption (optional)","caption",b.caption)+field("Width","size",b.size||"wide","select","normal|wide|full");
  if(b.type==="split")controls+=field("Heading","heading",b.heading)+field("Text","text",b.text,"textarea")+field("Image side","side",b.side||"left","select","left|right")+field("Alt text","alt",b.alt);
  if(b.type==="divider")controls+=field("Border thickness","thickness",String(b.thickness||1),"select","1|2|3|4|5")+`<p class="hint">Divider spacing is intentionally compact.</p>`;
  if(b.type==="button")controls+=field("Button label","label",b.label||"Learn more")+field("Destination URL","url",b.url||"")+field("Shape","shape",b.shape||"square","select","square|rounded|pill")+field("Hover effect","hoverEffect",b.hoverEffect||"default","select","default|fade|fill")+colourPicker(b.hoverColor)+`<p class="hint">“Fill” sweeps the colour in from the left. “Fade” changes the whole button colour smoothly. “Default” uses it for the outline and glow.</p>`;
  if(b.type==="binWidget")controls+=field("Widget heading","heading",b.heading)+field("Council calendar URL","url",b.url,"textarea","small-text")+field("Upcoming collections to show","count",String(b.count||2),"select","1|2|3")+`<div class="bin-icon-settings"><div><span>Recycling bin</span>${b.recyclingIcon?`<img src="${asset(b.recyclingIcon)}" alt="">`:`<div class="bin-icon-default">Default icon</div>`}<button class="media-button bin-icon-button" id="chooseRecyclingIcon">Choose recycling icon…</button>${b.recyclingIcon?`<button class="clear-icon" data-clear-bin-icon="recyclingIcon">Use default</button>`:""}</div><div><span>Refuse / general waste</span>${b.refuseIcon?`<img src="${asset(b.refuseIcon)}" alt="">`:`<div class="bin-icon-default">Default icon</div>`}<button class="media-button bin-icon-button" id="chooseRefuseIcon">Choose refuse icon…</button>${b.refuseIcon?`<button class="clear-icon" data-clear-bin-icon="refuseIcon">Use default</button>`:""}</div></div>`;
  if(b.type==="gallery"){b.images??=[];controls+=field("Gallery heading","heading",b.heading)+field("Automatic change","interval",String(b.interval??20),"select","0|10|20|30|60")+`<p class="hint gallery-interval-help">Seconds between images. Choose 0 to disable automatic movement.</p><button class="media-button" id="chooseGalleryImages">Choose one or more images…</button><div class="gallery-image-list">${b.images.map((image,index)=>`<div class="gallery-image-row"><img src="${asset(image.src)}" alt=""><div><input data-gallery-alt="${index}" value="${esc(image.alt||"")}" placeholder="Alt text (optional)"><span>Image ${index+1}</span></div><button data-gallery-up="${index}" title="Move earlier">↑</button><button data-gallery-down="${index}" title="Move later">↓</button><button class="danger" data-gallery-delete="${index}" title="Remove">×</button></div>`).join("")}</div>`;}
  const title=b.type==="split"?"Image + text":b.type==="binWidget"?"Bin widget":b.type==="gallery"?"Slideshow gallery":b.type==="button"?"Button":b.type[0].toUpperCase()+b.type.slice(1);
  return `<h2>${title} section</h2><p class="hint">Changes appear on the page immediately.</p>${controls}${widgetPicker()}<div class="inspector-actions"><button data-action="up">Move up</button><button data-action="down">Move down</button><button data-action="duplicate">Duplicate</button><button class="danger" data-action="delete">Delete</button></div>`;
}
function renderInspector(){
  if(isHomeMode())return renderHomeInspector();
  const p=project(), isHeader=selected==="header", isCategories=selected==="categories", target=selected===null?p:isHeader?p.header??={}:isCategories?data.categories:p.blocks[selected];
  $("#inspector").innerHTML=isCategories?categoryInspector():selected===null?projectInspector():isHeader?headerInspector():blockInspector(target);
  if(isCategories){
    $("#inspector").querySelectorAll("[data-category-index]").forEach(el=>el.onchange=()=>{const index=+el.dataset.categoryIndex,old=data.categories[index],value=el.value.trim();if(!value){el.value=old;return}data.categories[index]=value;data.projects.forEach(item=>{if(item.category===old)item.category=value});markDirty();renderAll()});
    $("#inspector").querySelectorAll("[data-category-up]").forEach(el=>el.onclick=()=>moveCategory(+el.dataset.categoryUp,-1));
    $("#inspector").querySelectorAll("[data-category-down]").forEach(el=>el.onclick=()=>moveCategory(+el.dataset.categoryDown,1));
    $("#inspector").querySelectorAll("[data-category-delete]").forEach(el=>el.onclick=()=>deleteCategory(+el.dataset.categoryDelete));
    $("#addCategory").onclick=()=>{let name=prompt("New category name");name=name?.trim();if(!name||data.categories.includes(name))return;data.categories.push(name);markDirty();renderAll()};
    return;
  }
  $("#inspector").querySelectorAll("[data-key]").forEach(el=>{const owner=selected===null||isHeader?p:target;el.oninput=()=>{let v=el.type==="checkbox"?el.checked:el.value;if(el.dataset.key==="technologies")v=v.split(",").map(x=>x.trim()).filter(Boolean);if(["count","interval","thickness"].includes(el.dataset.key))v=Number(v);owner[el.dataset.key]=v;markDirty();renderCanvas();renderProjects()};if(el.tagName==="TEXTAREA")el.onblur=()=>{const cleaned=cleanText(el.value);if(cleaned!==el.value){el.value=cleaned;owner[el.dataset.key]=cleaned;markDirty();renderCanvas()}}});
  $("#inspector").querySelectorAll("[data-color-swatch]").forEach(el=>{el.onclick=()=>{target.hoverColor=el.dataset.colorSwatch;markDirty();renderAll(false)}});
  $("#inspector").querySelectorAll("[data-header-key]").forEach(el=>{el.oninput=()=>{p.header??={};p.header[el.dataset.headerKey]=el.checked;markDirty();renderCanvas()}});
  const headerIcon=$("#chooseHeaderIcon");if(headerIcon)headerIcon.onclick=()=>{uploadTarget={type:"headerIcon"};$("#mediaPicker").multiple=false;$("#mediaPicker").accept="image/*";$("#mediaPicker").click()};
  const clearHeaderIcon=$("#clearHeaderIcon");if(clearHeaderIcon)clearHeaderIcon.onclick=()=>{p.header??={};delete p.header.icon;markDirty();renderAll(false)};
  const rich=$("#richTextEditor");
  if(rich){
    const capture=()=>{const selection=window.getSelection();if(selection&&selection.rangeCount&&rich.contains(selection.anchorNode))savedTextRange=selection.getRangeAt(0).cloneRange()};
    rich.onmouseup=capture;rich.onkeyup=capture;rich.oninput=()=>{target.html=rich.innerHTML;target.text=rich.innerText;markDirty();renderCanvas()};
    const applyColour=colour=>{if(savedTextRange){const selection=window.getSelection();selection.removeAllRanges();selection.addRange(savedTextRange)}rich.focus();document.execCommand("foreColor",false,colour);target.html=rich.innerHTML;markDirty();renderCanvas();capture()};
    $("#applyRichColor").onmousedown=event=>event.preventDefault();$("#applyRichColor").onclick=()=>applyColour($("#richColor").value);
    $("#clearRichColor").onmousedown=event=>event.preventDefault();$("#clearRichColor").onclick=()=>applyColour("#b9b9bf");
  }
  const media=$("#chooseMedia");if(media)media.onclick=()=>{uploadTarget=selected;$("#mediaPicker").multiple=false;$("#mediaPicker").accept=target.type==="video"?"video/*":"image/*";$("#mediaPicker").click()};
  const icon=$("#chooseIcon");if(icon)icon.onclick=()=>{uploadTarget="icon";$("#mediaPicker").multiple=false;$("#mediaPicker").accept="image/*";$("#mediaPicker").click()};
  const recyclingIcon=$("#chooseRecyclingIcon");if(recyclingIcon)recyclingIcon.onclick=()=>{uploadTarget={type:"field",block:selected,key:"recyclingIcon"};$("#mediaPicker").multiple=false;$("#mediaPicker").accept="image/*";$("#mediaPicker").click()};
  const refuseIcon=$("#chooseRefuseIcon");if(refuseIcon)refuseIcon.onclick=()=>{uploadTarget={type:"field",block:selected,key:"refuseIcon"};$("#mediaPicker").multiple=false;$("#mediaPicker").accept="image/*";$("#mediaPicker").click()};
  $("#inspector").querySelectorAll("[data-clear-bin-icon]").forEach(el=>el.onclick=()=>{delete target[el.dataset.clearBinIcon];markDirty();renderAll(false)});
  const galleryImages=$("#chooseGalleryImages");if(galleryImages)galleryImages.onclick=()=>{uploadTarget={type:"gallery",block:selected};$("#mediaPicker").multiple=true;$("#mediaPicker").accept="image/*";$("#mediaPicker").click()};
  $("#inspector").querySelectorAll("[data-gallery-alt]").forEach(el=>el.oninput=()=>{target.images[+el.dataset.galleryAlt].alt=el.value;markDirty()});
  $("#inspector").querySelectorAll("[data-gallery-up]").forEach(el=>el.onclick=()=>{const index=+el.dataset.galleryUp;if(index<1)return;[target.images[index-1],target.images[index]]=[target.images[index],target.images[index-1]];markDirty();renderAll(false)});
  $("#inspector").querySelectorAll("[data-gallery-down]").forEach(el=>el.onclick=()=>{const index=+el.dataset.galleryDown;if(index>=target.images.length-1)return;[target.images[index+1],target.images[index]]=[target.images[index],target.images[index+1]];markDirty();renderAll(false)});
  $("#inspector").querySelectorAll("[data-gallery-delete]").forEach(el=>el.onclick=()=>{target.images.splice(+el.dataset.galleryDelete,1);markDirty();renderAll(false)});
  const settings=$("#projectSettings");if(settings)settings.onclick=()=>{selected=null;renderAll(false)};
  const addWidget=$("#addWidget");if(addWidget)addWidget.onclick=()=>{const type=$("#widgetType").value,blocks=project().blocks;blocks.push(structuredClone(defaults[type]));selected=blocks.length-1;markDirty();renderAll(false)};
  $("#inspector").querySelectorAll("[data-action]").forEach(el=>el.onclick=()=>blockAction(el.dataset.action));
}
function moveCategory(index,direction){const target=index+direction;if(target<0||target>=data.categories.length)return;[data.categories[index],data.categories[target]]=[data.categories[target],data.categories[index]];markDirty();renderAll()}
function deleteCategory(index){if(data.categories.length===1)return alert("You need at least one category.");const removed=data.categories[index];if(!confirm(`Remove "${removed}"? Projects in it will move to "${data.categories[index===0?1:0]}".`))return;data.categories.splice(index,1);const replacement=data.categories[0];data.projects.forEach(item=>{if(item.category===removed)item.category=replacement});markDirty();renderAll()}
function blockAction(action){const a=project().blocks,i=selected;if(action==="delete"){a.splice(i,1);selected=null}else if(action==="duplicate"){a.splice(i+1,0,structuredClone(a[i]));selected=i+1}else if(action==="up"&&i>0){[a[i-1],a[i]]=[a[i],a[i-1]];selected--}else if(action==="down"&&i<a.length-1){[a[i+1],a[i]]=[a[i],a[i+1]];selected++}markDirty();renderAll(false)}
function renderProjects(){
  $("#newProject").hidden=isHomeMode();
  if(isHomeMode()){
    const items=homeEntries();
    $("#projectList").innerHTML=`<button class="project-row ${selected==="homeSettings"?"active":""}" data-home-list="settings">Homepage content<span>Name, tagline and links</span></button><div class="home-list-title">Featured projects</div>${items.map((item,i)=>`<button class="project-row ${selected===`home:${item.entry.slug}`?"active":""}" data-home-slug="${esc(item.entry.slug)}">${i+1}. ${esc(item.project.title)}<span>Homepage carousel</span></button>`).join("")}<button class="manage-categories ${selected==="homeManage"?"active":""}" data-home-list="manage">Manage featured projects</button>`;
    $("#projectList").querySelector('[data-home-list="settings"]').onclick=()=>{selected="homeSettings";renderAll(false)};
    $("#projectList").querySelector('[data-home-list="manage"]').onclick=()=>{selected="homeManage";renderAll(false)};
    $("#projectList").querySelectorAll("[data-home-slug]").forEach(el=>el.onclick=()=>{selected=`home:${el.dataset.homeSlug}`;homeSlideIndex=Math.max(0,items.findIndex(item=>item.entry.slug===el.dataset.homeSlug));renderAll(false)});
    return;
  }
  const list=collection();
  $("#projectList").innerHTML=list.map((p,i)=>`<button class="project-row ${i===projectIndex&&selected!=="categories"?"active":""}" data-project="${i}">${esc(p.title)}<span>${esc(isProductMode()?"Product page":p.category)}</span></button>`).join("")+(!isProductMode()?`<button class="manage-categories ${selected==="categories"?"active":""}" id="manageCategories">Manage categories</button>`:"");
  $("#projectList").querySelectorAll("[data-project]").forEach(el=>el.onclick=()=>{projectIndex=+el.dataset.project;selected=null;insertAt=null;renderAll()});
  const categories=$("#manageCategories");if(categories)categories.onclick=()=>{selected="categories";insertAt=null;renderAll()};
}
function renderAll(list=true){if(list)renderProjects();renderCanvas();renderInspector()}
$("#mediaPicker").onchange=async e=>{
  const files=[...e.target.files];if(!files.length)return;
  const targetInfo=uploadTarget,p=isHomeMode()?null:project(),uploadSlug=isHomeMode()?targetInfo.slug:p.slug,uploadScope=isHomeMode()?"projects":contentMode;
  $("#status").textContent=files.length>1?`Uploading ${files.length} images…`:"Uploading media…";
  const uploaded=[];
  for(const file of files){const res=await fetch(`/api/upload?scope=${uploadScope}&slug=${encodeURIComponent(uploadSlug)}&name=${encodeURIComponent(file.name)}`,{method:"POST",body:file});if(!res.ok)throw new Error("Upload failed");uploaded.push(await res.json())}
  if(targetInfo?.type==="homeImage"){const entry=homeEntry(targetInfo.slug);entry.image=uploaded[0].path;const colour=await sampleImageAccent(entry.image);if(colour){entry.accent=colour;entry.accentSource="auto"}}
  else if(targetInfo==="icon")p.image=uploaded[0].path;
  else if(typeof targetInfo==="object"&&targetInfo.type==="headerIcon"){p.header??={};p.header.icon=uploaded[0].path;p.header.showIcon=true}
  else if(typeof targetInfo==="object"&&targetInfo.type==="gallery"){const block=p.blocks[targetInfo.block];block.images??=[];block.images.push(...uploaded.map((result,index)=>({src:result.path,alt:files[index].name.replace(/\.[^.]+$/,"")})))}
  else if(typeof targetInfo==="object")p.blocks[targetInfo.block][targetInfo.key]=uploaded[0].path;
  else p.blocks[targetInfo].src=uploaded[0].path;
  markDirty();e.target.value="";e.target.multiple=false;renderAll(false)
};
$("#save").onclick=async()=>{const button=$("#save");button.disabled=true;button.textContent="Saving…";normaliseContent();renderCanvas();const res=await fetch("/api/content",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)});button.disabled=false;button.textContent="Save changes";if(res.ok){dirty=false;$("#status").textContent="Saved";$("#status").className=""}else $("#status").textContent="Save failed"};
$("#newProject").onclick=()=>{
  if(isHomeMode())return;
  const kind=isProductMode()?"product":"project",title=prompt(`New ${kind} name`);if(!title)return;
  const slug=title.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,""),year=new Date().getFullYear().toString();
  const item=isProductMode()
    ?{title,displayTitle:title,slug,category:"Product",year,image:"",summary:"Add a short product summary.",description:"",technologies:[],visual:"default",featured:false,header:{showMeta:false,showTitle:true,showSummary:true,showTags:true,showDivider:false,showIcon:false,icon:""},blocks:[]}
    :{title,displayTitle:title,slug,category:data.categories[0]||"Software",year,image:"",summary:"Add a short summary.",description:"",technologies:[],visual:"portfolio",featured:false,blocks:[]};
  collection().push(item);projectIndex=collection().length-1;selected=null;markDirty();renderAll()
};
$("#contentMode").onchange=event=>{contentMode=event.target.value;projectIndex=0;selected=isHomeMode()?"homeSettings":null;insertAt=null;homeSlideIndex=0;renderAll()};
window.addEventListener("beforeunload",e=>{if(dirty){e.preventDefault();e.returnValue=""}});
fetch("/api/content").then(r=>r.json()).then(value=>{data=value;data.projects??=[];data.products??=[];[...data.projects,...data.products].forEach(p=>p.blocks??=[]);$("#loading").hidden=true;$("#app").hidden=false;renderAll()}).catch(e=>$("#loading").textContent=`Could not open content: ${e.message}`);
