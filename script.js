const fabrics=[
{code:"SJ-2701",name:"Vintage Daisy",cat:"jersey",desc:"100% Cotton 30s Single Jersey",bg:"#eadfcf",pat:"radial-gradient(#b6534b 3px,transparent 4px),radial-gradient(#d99787 2px,transparent 3px)"},
{code:"KN-2702",name:"Modern Leopard",cat:"knit",desc:"Acrylic Jacquard Knit",bg:"#c8b79d",pat:"radial-gradient(ellipse at center,#40352e 0 4px,#9b7654 5px 8px,transparent 9px)"},
{code:"WN-2703",name:"Dusty Blue Blossom",cat:"woven",desc:"Cotton Twill",bg:"#718391",pat:"radial-gradient(#eee6d5 3px,transparent 4px),radial-gradient(#b9a27f 2px,transparent 3px)"},
{code:"SJ-2704",name:"Mini Star",cat:"jersey",desc:"100% Cotton 20s Single Jersey",bg:"#e8dfd0",pat:"linear-gradient(45deg,transparent 44%,#31302f 45% 55%,transparent 56%),linear-gradient(-45deg,transparent 44%,#31302f 45% 55%,transparent 56%)"},
{code:"WN-2705",name:"Coral Garden",cat:"woven",desc:"Cotton Plain",bg:"#b77c70",pat:"radial-gradient(#f0dfcf 3px,transparent 4px),radial-gradient(#76463e 2px,transparent 3px)"},
{code:"KN-2706",name:"Heart Jacquard",cat:"knit",desc:"Acrylic Jacquard Knit",bg:"#e8dfcd",pat:"radial-gradient(circle at 35% 35%,#a44b4b 5px,transparent 6px),radial-gradient(circle at 55% 35%,#a44b4b 5px,transparent 6px)"},
{code:"ET-2707",name:"Soft Rib",cat:"etc",desc:"Cotton Rib",bg:"#c7b7a2",pat:"repeating-linear-gradient(90deg,#b5a38c 0 3px,transparent 3px 9px)"},
{code:"WN-2708",name:"Heritage Check",cat:"woven",desc:"Cotton Poplin",bg:"#d7c9b3",pat:"repeating-linear-gradient(0deg,transparent 0 15px,#7d6670 16px 19px),repeating-linear-gradient(90deg,transparent 0 15px,#56636b 16px 19px)"}
];
const grid=document.querySelector("#grid"), search=document.querySelector("#searchInput"), result=document.querySelector("#resultText");
let current="all";
function render(){
 const q=search.value.toLowerCase().trim();
 const rows=fabrics.filter(f=>(current==="all"||f.cat===current)&&(`${f.code} ${f.name} ${f.desc}`.toLowerCase().includes(q)));
 grid.innerHTML=rows.map(f=>`<article class="card" data-code="${f.code}"><div class="swatch" style="background-color:${f.bg};background-image:${f.pat}"><span class="badge">NEW</span></div><h3>${f.code} · ${f.name}</h3><p>${f.desc}</p></article>`).join("");
 result.textContent=`${rows.length} fabric${rows.length===1?"":"s"} shown`;
 document.querySelectorAll(".card").forEach(c=>c.onclick=()=>openFabric(c.dataset.code));
}
document.querySelectorAll("[data-filter]").forEach(b=>b.onclick=()=>{
 current=b.dataset.filter;
 document.querySelectorAll(".filters button").forEach(x=>x.classList.toggle("active",x.dataset.filter===current));
 document.querySelector("#lookbook").scrollIntoView({behavior:"smooth"}); render();
});
search.addEventListener("input",render);
function openFabric(code){
 const f=fabrics.find(x=>x.code===code);
 document.querySelector("#modalImage").style=`background-color:${f.bg};background-image:${f.pat}`;
 document.querySelector("#modalCat").textContent=f.cat.toUpperCase();
 document.querySelector("#modalName").textContent=f.name;
 document.querySelector("#modalCode").textContent=f.code;
 document.querySelector("#modalDesc").textContent=f.desc;
 document.querySelector("#modal").classList.add("open");
}
document.querySelector("#closeModal").onclick=()=>document.querySelector("#modal").classList.remove("open");
document.querySelector("#modal").onclick=e=>{if(e.target.id==="modal")e.currentTarget.classList.remove("open")};
render();