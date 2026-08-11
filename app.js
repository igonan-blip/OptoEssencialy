const CAMPOS = [
"IdCliente","Nome","DataCadastro","CPF","RG","DataNascimento","Idade","Endereço","Cidade","Telefone","Observação",
"Dordecabeça","AvPerto","AvLonge","Tontura","DorOcular","Fotofobia","Diabetes","Hipertensão","Labirintite","Glaucoma","Pterigio","CirurgiaNosOlhos",
"DiabetesFamilia","hipertensãoFamilia","GlaucomaFamilia","EsfOdAnt","CIlOdAnt","EixOdAnt","EsfOeAnt","CilOeAnt","EixOeAnt","AddAnt",
"EsfAtualOd","CilAtualOd","EixAtualOd","EsfAtualOe","CilAtualOe","EixAtualOe","AddAtual",
"AcuidadeLongeOd","AcuidadePertoOd","AcuidadePertoOe","AcuidadeLongeOe","Biocromoverde","Biocromovermelho"
];

let pacientes = JSON.parse(localStorage.getItem("pacientes")) || [];
let pacienteAtual = null;

function hojeISO(){ return new Date().toISOString().slice(0,10); }
function normalizar(v){ return String(v ?? "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,""); }
function escapeHtml(v){ return String(v ?? "").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m])); }
function salvarStorage(){ localStorage.setItem("pacientes", JSON.stringify(pacientes)); }

function mostrarTela(tela){
    document.querySelectorAll(".screen").forEach(s=>s.classList.add("hidden"));
    document.getElementById("tela"+tela.charAt(0).toUpperCase()+tela.slice(1)).classList.remove("hidden");
    document.querySelectorAll(".menu-item").forEach(b=>b.classList.toggle("active", b.dataset.tela===tela));
    if(tela==="pacientes") carregarPacientes();
    if(tela==="inicio") carregarPacientesInicio();
    if(tela==="atendimentos") carregarExames();
    atualizarDashboard();
}

function novoPaciente(){
    pacienteAtual=null;
    document.getElementById("formPaciente").reset();
    document.getElementById("IdCliente").value="";
    document.getElementById("DataCadastro").value=hojeISO();
    document.getElementById("modalTitulo").textContent="Novo cliente";
    abrirAba("dados");
    document.getElementById("modal").classList.add("show");
}
function fecharModal(){ document.getElementById("modal").classList.remove("show"); }

function abrirAba(nome){
    document.querySelectorAll(".tab-content").forEach(x=>x.classList.remove("active"));
    document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));
    document.getElementById("aba-"+nome).classList.add("active");
    const ordem=["dados","anamnese","historico","anterior","atual","acuidade"];
    document.querySelectorAll(".tab")[ordem.indexOf(nome)].classList.add("active");
}

function calcularIdade(){
    const val=document.getElementById("DataNascimento").value;
    if(!val) return;
    const nasc=new Date(val+"T00:00:00"), hoje=new Date();
    let idade=hoje.getFullYear()-nasc.getFullYear();
    const m=hoje.getMonth()-nasc.getMonth();
    if(m<0 || (m===0 && hoje.getDate()<nasc.getDate())) idade--;
    document.getElementById("Idade").value=idade>=0?idade:"";
}

function lerFormulario(){
    const obj={};
    CAMPOS.forEach(c=>{
        const el=document.getElementById(c);
        if(!el) return;
        if(el.type==="checkbox") obj[c]=el.checked;
        else if(el.tagName==="SELECT") obj[c]=el.value==="true";
        else obj[c]=el.value;
    });
    obj.IdCliente=obj.IdCliente ? Number(obj.IdCliente) : Date.now();
    obj.DataCadastro=obj.DataCadastro || hojeISO();
    return obj;
}

function preencherFormulario(p){
    CAMPOS.forEach(c=>{
        const el=document.getElementById(c);
        if(!el) return;
        if(el.type==="checkbox") el.checked=!!p[c];
        else if(el.tagName==="SELECT") el.value=String(!!p[c]);
        else el.value=p[c] ?? "";
    });
}

function salvarPaciente(event){
    event.preventDefault();
    const obj=lerFormulario();
    const idx=pacientes.findIndex(p=>Number(p.IdCliente)===Number(obj.IdCliente));
    if(idx>=0) pacientes[idx]=obj; else pacientes.push(obj);
    salvarStorage();
    fecharModal();
    atualizarSistema();
    alert(idx>=0 ? "Cliente atualizado com sucesso!" : "Cliente cadastrado com sucesso!");
}

function atualizarSistema(){ atualizarDashboard(); carregarPacientes(); carregarPacientesInicio(); }
function atualizarDashboard(){
    document.getElementById("totalPacientes").textContent=pacientes.length;
    document.getElementById("cadastradosHoje").textContent=pacientes.filter(p=>String(p.DataCadastro).slice(0,10)===hojeISO()).length;
    document.getElementById("comExame").textContent=pacientes.filter(p=>temExame(p)).length;
}
function temExame(p){
    return ["EsfAtualOd","CilAtualOd","EixAtualOd","EsfAtualOe","CilAtualOe","EixAtualOe","AcuidadeLongeOd","AcuidadeLongeOe"].some(c=>String(p[c]??"").trim()!=="");
}

function cardPaciente(p){
    return `<div class="patient-item">
        <div><strong>${escapeHtml(p.Nome || "Sem nome")}</strong>
        <small>${escapeHtml(p.CPF || p.Telefone || p.Cidade || "Sem dados complementares")}</small></div>
        <div class="patient-actions">
            <button class="btn-secondary" onclick="abrirFicha(${p.IdCliente})">Abrir ficha</button>
            <button class="btn-danger" onclick="excluirPaciente(${p.IdCliente})">Excluir</button>
        </div>
    </div>`;
}
function carregarPacientes(lista=pacientes){
    const el=document.getElementById("listaPacientes"); if(!el)return;
    if(!lista.length){el.innerHTML=`<div class="empty"><div class="empty-icon">👤</div><h3>Nenhum cliente cadastrado</h3><p>Cadastre o primeiro cliente.</p></div>`;return;}
    el.innerHTML=[...lista].sort((a,b)=>String(b.DataCadastro).localeCompare(String(a.DataCadastro))).map(cardPaciente).join("");
}
function carregarPacientesInicio(lista=pacientes){
    const el=document.getElementById("listaPacientesInicio"); if(!el)return;
    if(!lista.length){el.innerHTML=`<div class="empty"><div class="empty-icon">👤</div><h3>Nenhum cliente cadastrado</h3><p>Clique em “Novo cliente”.</p></div>`;return;}
    el.innerHTML=[...lista].sort((a,b)=>Number(b.IdCliente)-Number(a.IdCliente)).slice(0,7).map(cardPaciente).join("");
}
function pesquisarPacientes(){
    const t=normalizar(document.getElementById("pesquisaPacientes").value);
    carregarPacientes(pacientes.filter(p=>["Nome","CPF","Telefone","Cidade","RG"].some(c=>normalizar(p[c]).includes(t))));
}
function pesquisarInicio(){
    const t=normalizar(document.getElementById("pesquisaInicio").value);
    carregarPacientesInicio(pacientes.filter(p=>["Nome","CPF","Telefone","Cidade"].some(c=>normalizar(p[c]).includes(t))));
}

function linhaRefracao(titulo, esfOd,cilOd,eixoOd, esfOe,cilOe,eixoOe, add){
    const val=v=>escapeHtml(v===""||v==null?"-":v);
    return `<div class="ficha-section">
        <h3>${titulo}</h3>
        <div class="refracao-table">
            <div></div><strong>Esférico</strong><strong>Cilíndrico</strong><strong>Eixo</strong>
            <span>OD</span><span>${val(esfOd)}</span><span>${val(cilOd)}</span><span>${val(eixoOd)}</span>
            <span>OE</span><span>${val(esfOe)}</span><span>${val(cilOe)}</span><span>${val(eixoOe)}</span>
        </div>
        <div class="refracao-add"><span>Adição</span><span>${val(add)}</span></div>
    </div>`;
}

function abrirFicha(id){
    pacienteAtual=pacientes.find(p=>Number(p.IdCliente)===Number(id));
    if(!pacienteAtual)return;
    const p=pacienteAtual;
    document.getElementById("fichaSubtitulo").textContent=`${p.Nome || "Cliente"} • ID ${p.IdCliente}`;
    const section=(titulo,rows)=>`<div class="ficha-section"><h3>${titulo}</h3>${rows.map(([a,b])=>`<div class="ficha-row"><span>${a}</span><span>${escapeHtml(b===""||b==null?"-":b)}</span></div>`).join("")}</div>`;
    const sim=v=>v?"Sim":"Não";
    document.getElementById("dadosFicha").innerHTML=
        section("Dados pessoais",[["Nome",p.Nome],["CPF",p.CPF],["RG",p.RG],["Nascimento",p.DataNascimento],["Idade",p.Idade],["Cadastro",p.DataCadastro],["Endereço",p.Endereço],["Cidade",p.Cidade],["Telefone",p.Telefone],["Observação",p.Observação]])+
        `<div class="ficha-grid">`+
        section("Anamnese",[["Dor de cabeça",sim(p.Dordecabeça)],["Visão de perto",sim(p.AvPerto)],["Visão de longe",sim(p.AvLonge)],["Tontura",sim(p.Tontura)],["Dor ocular",sim(p.DorOcular)],["Fotofobia",sim(p.Fotofobia)]])+
        section("Histórico",[["Diabetes",sim(p.Diabetes)],["Hipertensão",sim(p.Hipertensão)],["Labirintite",sim(p.Labirintite)],["Glaucoma",sim(p.Glaucoma)],["Pterígio",sim(p.Pterigio)],["Cirurgia nos olhos",sim(p.CirurgiaNosOlhos)],["Diabetes família",sim(p.DiabetesFamilia)],["Hipertensão família",sim(p["hipertensãoFamilia"])],["Glaucoma família",sim(p.GlaucomaFamilia)]])+
        `</div>`+
        linhaRefracao("Refração anterior", p.EsfOdAnt,p.CIlOdAnt,p.EixOdAnt, p.EsfOeAnt,p.CilOeAnt,p.EixOeAnt, p.AddAnt)+
        linhaRefracao("Refração atual", p.EsfAtualOd,p.CilAtualOd,p.EixAtualOd, p.EsfAtualOe,p.CilAtualOe,p.EixAtualOe, p.AddAtual)+
        section("Acuidade / Bicromático",[["Longe OD",p.AcuidadeLongeOd],["Longe OE",p.AcuidadeLongeOe],["Perto OD",p.AcuidadePertoOd],["Perto OE",p.AcuidadePertoOe],["Bicromático verde",sim(p.Biocromoverde)],["Bicromático vermelho",sim(p.Biocromovermelho)]]);
    document.getElementById("modalFicha").classList.add("show");
}
function fecharFicha(){document.getElementById("modalFicha").classList.remove("show")}
function editarPacienteAtual(){
    if(!pacienteAtual)return;
    fecharFicha(); preencherFormulario(pacienteAtual);
    document.getElementById("modalTitulo").textContent="Editar cliente";
    abrirAba("dados"); document.getElementById("modal").classList.add("show");
}
function excluirPaciente(id){
    const p=pacientes.find(x=>Number(x.IdCliente)===Number(id)); if(!p)return;
    if(!confirm(`Deseja excluir ${p.Nome || "este cliente"}?`))return;
    pacientes=pacientes.filter(x=>Number(x.IdCliente)!==Number(id));
    salvarStorage(); atualizarSistema();
}
function carregarExames(){
    const el=document.getElementById("listaExames");
    const com=pacientes.filter(temExame);
    if(!com.length){el.innerHTML=`<div class="empty"><div class="empty-icon">👁</div><h3>Nenhum exame registrado</h3><p>Os clientes com refração ou acuidade preenchidas aparecerão aqui.</p></div>`;return;}
    el.innerHTML=com.map(p=>`<div class="exam-card"><div><strong>${escapeHtml(p.Nome)}</strong><br><small>Refração atual: OD ${escapeHtml(p.EsfAtualOd||"-")} / OE ${escapeHtml(p.EsfAtualOe||"-")}</small></div><button class="btn-secondary" onclick="abrirFicha(${p.IdCliente})">Ver ficha</button></div>`).join("");
}
function exportarDados(){
    const blob=new Blob([JSON.stringify(pacientes,null,2)],{type:"application/json"});
    const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`backup-optometria-${hojeISO()}.json`;a.click();URL.revokeObjectURL(a.href);
}
function importarDados(event){
    const file=event.target.files[0];if(!file)return;
    const reader=new FileReader();
    reader.onload=()=>{try{
        const dados=JSON.parse(reader.result);
        if(!Array.isArray(dados))throw new Error();
        pacientes=dados;salvarStorage();atualizarSistema();alert("Backup importado com sucesso.");
    }catch(e){alert("Arquivo de backup inválido.");}};
    reader.readAsText(file);
}
function limparTodosDados(){
    if(!confirm("ATENÇÃO: isso apagará todos os clientes deste navegador. Continuar?"))return;
    pacientes=[];salvarStorage();atualizarSistema();
}

document.addEventListener("DOMContentLoaded",()=>{document.getElementById("DataCadastro").value=hojeISO();atualizarSistema();});
