// =========================================================================
// SISTEMA DE INTERNACIONALIZAÇÃO (PT-BR / EN)
// =========================================================================
let currentLang = 'pt';

const langDict = {
    "pt": {}, 
    "en": {
        "Formação": "Formation",
        "Arraste os personagens. Clique em ⚙️ para configurar.": "Drag characters. Click ⚙️ to configure.",
        "Personagens": "Characters",
        "Pesquisar por nome...": "Search by name...",
        "Todos Elementos": "All Elements",
        "Limpar Time": "Clear Team",
        "Resetar Tudo": "Reset All",
        "Simulação de Combo": "Combo Simulation",
        "Sugestões de Times": "Team Suggestions",
        "Escolha a formação que melhor se adapta à sua estratégia.": "Choose the formation that best fits your strategy.",
        "Configuração:": "Configuration:",
        "Nível do Operador:": "Operator Level:",
        "⚔️ Armamento Equipado": "⚔️ Equipped Weapon",
        "Nível": "Level",
        "Essência": "Essence",
        "Potencial": "Potential",
        "🛡️ Set de Fábrica / Armadura": "🛡️ Factory Set / Armor",
        "Nível do Set (Upgrade):": "Set Level (Upgrade):",
        "🧬 Matriz de Capacidade (Skills)": "🧬 Capacity Matrix (Skills)",
        "Ataque Básico": "Basic Attack",
        "Habilidade Ativa": "Active Skill",
        "Ultimate / Combo": "Ultimate / Combo",
        "Passiva / Talento": "Passive / Talent",
        "🔄 Resetar Padrão": "🔄 Reset Default",
        "💾 Salvar Atributos": "💾 Save Attributes",
        "Sugerir Times": "Suggest Teams",
        "Substituir Esquadrão": "Replace Squad",
        "Vazio": "Empty",
        "(Arraste)": "(Drag)",
        "Ficha Base": "Base Profile",
        "Esquadrão": "Squad",
        "AvisoResetTudo": "Are you sure you want to reset all characters to Level 1?",
        
        "Físico": "Physical",
        "Quebra de Toughness": "Toughness Break",
        "Nenhum": "None",
        "Inflição Térmica": "Thermal Infliction",
        "Vulnerabilidade": "Vulnerability",
        "Quebra de Postura": "Posture Break",
        "Inflição Cryo": "Cryo Infliction",
        "Congelamento": "Freeze",
        "Lentidão": "Slow",
        "Suscetibilidade Física": "Physical Susceptibility",
        "Dano em Área": "AoE Damage",
        "Dano Contínuo": "DoT Damage",
        "Paralisia": "Paralysis",
        "Stagger / Heat": "Stagger / Heat",
        "Vulnerabilidade Térmica": "Thermal Vulnerability",
        
        "precisa:": "needs:",
        "e então aplica:": "and then applies:",
        "Adicione personagens ao esquadrão para ver a lógica de combos.": "Add characters to the squad to see combo logic.",
        "Melhores Formações para": "Best Formations for",
        "Estratégia: Sinergia de Combo": "Strategy: Combo Synergy",
        "Estratégia: Foco Elemento": "Strategy: Element Focus",
        "Estratégia: Controle de Grupo Absoluto": "Strategy: Absolute Crowd Control",

        "Arma Inicial Padrão": "Default Starter Weapon",
        "Lâmina de Talos": "Talos Blade",
        "Espada Dupla Mercenária": "Mercenary Twin Blades",
        "Machado Pesado": "Heavy Axe",
        "Nenhum Set Equipado": "No Set Equipped",
        "Conjunto do Mercenário (Foco em Dano Físico)": "Mercenary Set (Physical Focus)",
        "Conjunto do Ponto de Ignição (Dano Heat)": "Flashpoint Set (Heat DMG)",
        "Conjunto Quebrador de Escudos (Toughness Dmg)": "Shieldbreaker Set (Toughness Dmg)",
        "Conjunto do Campo de Artes (Cura e Suporte)": "Arts Field Set (Heal & Support)",
        "Conjunto da Tempestade (Dano Elétrico)": "Storm Set (Electric DMG)",
        "Conjunto Zero Absoluto (Dano Cryo)": "Absolute Zero Set (Cryo DMG)",
        "Conjunto Anomalia Gravitacional (Nature)": "Gravity Anomaly Set (Nature)",
        "Conjunto Linha de Frente (Defesa/Taunt)": "Frontline Set (Defense/Taunt)"
    }
};

function t(texto) {
    if (currentLang === 'en' && langDict.en[texto]) return langDict.en[texto];
    return texto;
}

function toggleLang() {
    currentLang = currentLang === 'pt' ? 'en' : 'pt';
    atualizarTextosEstaticos();
    inicializarSelects();
    renderizarPersonagens();
    atualizarTelaEsquadrao();
}

function atualizarTextosEstaticos() {
    document.getElementById("btn-lang").innerText = currentLang === 'pt' ? "🇺🇸 English" : "🇧🇷 Português";
    
    document.getElementById("text-formacao-h2").innerHTML = `${t("Formação")} (<span id="contador-esquadrao">${esquadrao.filter(p=>p!==null).length}</span>/4)`;
    document.getElementById("text-arraste").innerText = t("Arraste os personagens. Clique em ⚙️ para configurar.");
    document.getElementById("text-personagens-h2").innerText = t("Personagens");
    document.getElementById("busca-nome").placeholder = t("Pesquisar por nome...");
    document.getElementById("btn-limpar").innerText = t("Limpar Time");
    document.getElementById("btn-reset-geral").innerText = t("Resetar Tudo");
    document.getElementById("text-combo-h2").innerText = t("Simulação de Combo");
    
    document.getElementById("modal-titulo-sinergia").innerText = t("Sugestões de Times");
    document.getElementById("text-modal-sinergia-desc").innerText = t("Escolha a formação que melhor se adapta à sua estratégia.");
    
    document.getElementById("label-config-titulo").innerText = t("Configuração:");
    document.getElementById("label-nivel").innerText = t("Nível do Operador:");
    document.getElementById("title-arma").innerText = t("⚔️ Armamento Equipado");
    document.getElementById("label-arma-nivel").innerText = t("Nível");
    document.getElementById("label-arma-essencia").innerText = t("Essência");
    document.getElementById("label-arma-potencial").innerText = t("Potencial");
    document.getElementById("title-set").innerText = t("🛡️ Set de Fábrica / Armadura");
    document.getElementById("label-set-nivel").innerText = t("Nível do Set (Upgrade):");
    document.getElementById("title-skills").innerText = t("🧬 Matriz de Capacidade (Skills)");
    document.getElementById("label-skill-1").innerText = t("Ataque Básico");
    document.getElementById("label-skill-2").innerText = t("Habilidade Ativa");
    document.getElementById("label-skill-3").innerText = t("Ultimate / Combo");
    document.getElementById("label-skill-4").innerText = t("Passiva / Talento");
    
    document.getElementById("btn-salvar-config").innerText = t("💾 Salvar Atributos");
    document.getElementById("btn-reset-config").innerText = t("🔄 Resetar Padrão");
}

// =========================================================================
// BANCOS DE DADOS GERAIS
// =========================================================================
const armasDB = [
    { id: "wpn_001", nome: "Arma Inicial Padrão", raridade: 3, img: "wpn_basica.jpg" },
    { id: "wpn_002", nome: "Lâmina de Talos", raridade: 4, img: "wpn_talos.jpg" },
    { id: "wpn_003", nome: "Protetor do Vale (Rossi)", raridade: 6, img: "wpn_rossi.jpg" },
    { id: "wpn_004", nome: "Vanguarda Endfield (Endmin)", raridade: 6, img: "wpn_endmin.jpg" },
    { id: "wpn_005", nome: "Cetro Gravitacional (Gilberta)", raridade: 6, img: "wpn_gilberta.jpg" },
    { id: "wpn_006", nome: "Lança-Chamas Tático (Ember)", raridade: 5, img: "wpn_ember.jpg" },
    { id: "wpn_007", nome: "Espada Dupla Mercenária", raridade: 5, img: "wpn_mercenaria.jpg" },
    { id: "wpn_008", nome: "Orbe de Originium Puro", raridade: 6, img: "wpn_orbe.jpg" },
    { id: "wpn_009", nome: "Machado Pesado", raridade: 5, img: "wpn_machado.jpg" },
    { id: "wpn_010", nome: "Sunderblade Elétrica", raridade: 6, img: "wpn_sunder.jpg" }
];

const setsDB = [
    { id: "set_000", nome: "Nenhum Set Equipado" },
    { id: "set_001", nome: "Conjunto do Mercenário (Foco em Dano Físico)" },
    { id: "set_002", nome: "Conjunto do Ponto de Ignição (Dano Heat)" },
    { id: "set_003", nome: "Conjunto Quebrador de Escudos (Toughness Dmg)" },
    { id: "set_004", nome: "Conjunto do Campo de Artes (Cura e Suporte)" },
    { id: "set_005", nome: "Conjunto da Tempestade (Dano Elétrico)" },
    { id: "set_006", nome: "Conjunto Zero Absoluto (Dano Cryo)" },
    { id: "set_007", nome: "Conjunto Anomalia Gravitacional (Nature)" },
    { id: "set_008", nome: "Conjunto Linha de Frente (Defesa/Taunt)" }
];

const personagens = [
    { id: "001", nome: "Akekuri", tipo_dano: "Físico", img: "akekuri.jpg", inicia: "Nenhum", continua: "Stun", skills_nomes: { basico: "Corte Rápido", ativa: "Investida Tática", ult: "Golpe Esmagador", passiva: "Foco de Batalha" } },
    { id: "002", nome: "Alesh", tipo_dano: "Físico", img: "alesh.jpg", inicia: "Nenhum", continua: "Quebra de Toughness", skills_nomes: { basico: "Tiro Preciso", ativa: "Disparo Perfurante", ult: "Chuva de Balas", passiva: "Mira Óptica" } },
    { id: "003", nome: "Antal", tipo_dano: "Nature", img: "antal.jpg", inicia: "Buff", continua: "Nenhum", skills_nomes: { basico: "Disparo de Esporos", ativa: "Semente Revitalizante", ult: "Campo de Florescimento", passiva: "Simbiose" } },
    { id: "004", nome: "Arclight", tipo_dano: "Electric", img: "arclight.jpg", inicia: "Paralisia", continua: "Nenhum", skills_nomes: { basico: "Faísca", ativa: "Choque em Cadeia", ult: "Tempestade Magnética", passiva: "Bateria Viva" } },
    { id: "005", nome: "Ardelia", tipo_dano: "Nature", img: "ardelia.jpg", inicia: "Vulnerabilidade Elemental", continua: "Nenhum", skills_nomes: { basico: "Raio Foliar", ativa: "Vinhas Cortantes", ult: "Prisão de Espinheiros", passiva: "Toque da Natureza" } },
    { id: "006", nome: "Avywenna", tipo_dano: "Físico", img: "avywenna.jpg", inicia: "Nenhum", continua: "Quebra de Toughness", skills_nomes: { basico: "Ataque Duplo", ativa: "Fúria Cortante", ult: "Turbilhão de Lâminas", passiva: "Instinto Mercenário" } },
    { id: "007", nome: "Camille", tipo_dano: "Heat", img: "camille.jpg", inicia: "Inflição Térmica", continua: "Vulnerabilidade", skills_nomes: { basico: "Tiro Quente", ativa: "Granada de Fósforo", ult: "Zona de Ignição", passiva: "Fogo Persistente" } },
    { id: "008", nome: "Catcher", tipo_dano: "Físico", img: "catcher.jpg", inicia: "Taunt", continua: "Nenhum", skills_nomes: { basico: "Golpe de Escudo", ativa: "Provocação Tática", ult: "Postura Intransponível", passiva: "Vanguarda Sólida" } },
    { id: "009", nome: "Chen Qianyu", tipo_dano: "Físico", img: "chen.jpg", inicia: "Knockback", continua: "Nenhum", skills_nomes: { basico: "Punho do Dragão", ativa: "Palma Repulsora", ult: "Fúria de Lungmen", passiva: "Arte Ancestral" } },
    { id: "010", nome: "Da Pan", tipo_dano: "Físico", img: "dapan.jpg", inicia: "Crush", continua: "Stun", skills_nomes: { basico: "Balanço Pesado", ativa: "Golpe Sísmico", ult: "Esmagamento Total", passiva: "Força Bruta" } },
    { id: "011", nome: "Ember", tipo_dano: "Heat", img: "ember.jpg", inicia: "Inflição Térmica", continua: "Nenhum", skills_nomes: { basico: "Lança-Chamas", ativa: "Barreira de Fogo", ult: "Explosão Térmica", passiva: "Ignição Primordial" } },
    { id: "012", nome: "Endministrator", tipo_dano: "Físico", img: "endmin.jpg", inicia: "Quebra de Toughness / Crush", continua: "Qualquer", skills_nomes: { basico: "Corte Modular", ativa: "Feixe Esmagador", ult: "Sobrecarga de Contingência", passiva: "Sinergia de Talos" } },
    { id: "013", nome: "Estella", tipo_dano: "Físico", img: "estella.jpg", inicia: "Nenhum", continua: "Quebra de Toughness", skills_nomes: { basico: "Lâmina Ágil", ativa: "Corte Duplo", ult: "Dança de Espadas", passiva: "Reflexo de Combate" } },
    { id: "014", nome: "Fluorite", tipo_dano: "Originium Arts", img: "fluorite.jpg", inicia: "Lentidão", continua: "Nenhum", skills_nomes: { basico: "Projétil de Cristal", ativa: "Prisão Mineral", ult: "Ressonância", passiva: "Brilho Retardante" } },
    { id: "015", nome: "Gilberta", tipo_dano: "Nature", img: "gilberta.jpg", inicia: "Airborne", continua: "Quebra de Toughness", skills_nomes: { basico: "Feixe Gravitacional", ativa: "Inversão de Peso", ult: "Campo Anti-Gravidade", passiva: "Herança de Angelina" } },
    { id: "016", nome: "Laevatain", tipo_dano: "Heat", img: "laevatain.jpg", inicia: "Stagger / Heat", continua: "Vulnerabilidade Térmica", skills_nomes: { basico: "Ataque Flamejante", ativa: "Golpe Calórico", ult: "Erupção de Lâmina", passiva: "Calor Implacável" } },
    { id: "017", nome: "Last Rite", tipo_dano: "Cryo", img: "lastrite.jpg", inicia: "Congelamento", continua: "Inflição Cryo", skills_nomes: { basico: "Foice Gélida", ativa: "Nevasca Súbita", ult: "Zero Absoluto", passiva: "Abraço do Inverno" } },
    { id: "018", nome: "Lifeng", tipo_dano: "Físico", img: "lifeng.jpg", inicia: "Suscetibilidade Física", continua: "Nenhum", skills_nomes: { basico: "Golpe Veloz", ativa: "Marca do Caçador", ult: "Execução Perfeita", passiva: "Olho de Águia" } },
    { id: "019", nome: "Mi Fu", tipo_dano: "Físico", img: "mifu.jpg", inicia: "Suscetibilidade Física", continua: "Vulnerabilidade", skills_nomes: { basico: "Arte da Garra", ativa: "Quebra de Defesa", ult: "Golpe Fatal", passiva: "Ponto Fraco" } },
    { id: "020", nome: "Perlica", tipo_dano: "Originium Arts", img: "perlica.jpg", inicia: "Slow", continua: "Dano em Área", skills_nomes: { basico: "Orbe de Energia", ativa: "Distorção Espacial", ult: "Colapso Temporal", passiva: "Visão da Diretora" } },
    { id: "021", nome: "Pogranichnik", tipo_dano: "Físico", img: "pogra.jpg", inicia: "Quebra de Postura", continua: "Nenhum", skills_nomes: { basico: "Machado Pesado", ativa: "Grito de Guerra", ult: "Terremoto", passiva: "Resistência Militar" } },
    { id: "022", nome: "Rossi", tipo_dano: "Físico", img: "rossi.jpg", inicia: "Airborne / Vulnerabilidade", continua: "Inflição Heat/Arts", skills_nomes: { basico: "Ataque do Lobo", ativa: "Golpe Ascendente", ult: "Dança da Caçada Final", passiva: "Líder do Vale IV" } },
    { id: "023", nome: "Snowshine", tipo_dano: "Cryo", img: "snowshine.jpg", inicia: "Inflição Cryo", continua: "Taunt", skills_nomes: { basico: "Lança de Gelo", ativa: "Escudo Glacial", ult: "Muralha de Inverno", passiva: "Frieza Absoluta" } },
    { id: "024", nome: "Tangtang", tipo_dano: "Físico", img: "tangtang.jpg", inicia: "Nenhum", continua: "Quebra de Toughness", skills_nomes: { basico: "Pancada", ativa: "Giro Destrutivo", ult: "Impacto Meteórico", passiva: "Energia Inesgotável" } },
    { id: "025", nome: "Wulfgard", tipo_dano: "Físico", img: "wulfgard.jpg", inicia: "Stun / Sangramento", continua: "Nenhum", skills_nomes: { basico: "Golpe Selvagem", ativa: "Uivo de Batalha", ult: "Fúria Lupina", passiva: "Instinto de Sobrevivência" } },
    { id: "026", nome: "Xaihi", tipo_dano: "Originium Arts", img: "xaihi.jpg", inicia: "Buff de Sobrevivência", continua: "Nenhum", skills_nomes: { basico: "Luz Guia", ativa: "Escudo Sagrado", ult: "Purificação Absoluta", passiva: "Graça Divina" } },
    { id: "027", nome: "Yvonne", tipo_dano: "Cryo", img: "yvonne.jpg", inicia: "Inflição Cryo", continua: "Congelamento", skills_nomes: { basico: "Tiro Congelante", ativa: "Explosão Ártica", ult: "Tempestade de Neve", passiva: "Foco Gélido" } },
    { id: "028", nome: "Zhuang Fangyi", tipo_dano: "Electric", img: "zhuang.jpg", inicia: "Dano Contínuo", continua: "Setup de Sunderblade", skills_nomes: { basico: "Lâmina Relâmpago", ativa: "Invocação", ult: "Julgamento do Trovão", passiva: "Condução Elétrica" } }
];

personagens.forEach(p => {
    p.status = {
        nivel: 1, skill_1: 1, skill_2: 1, skill_3: 1, skill_4: 1,
        arma_id: "wpn_001", arma_nivel: 1, arma_essencia: 1, arma_potencial: 1,
        armadura_id: "set_000", armadura_nivel: 0
    };
});

let esquadrao = [null, null, null, null];
let timesGeradosParaModal = [];
let origemConfig = null; 
let identificadorConfig = null; 

// =========================================================================
// RENDERIZAÇÃO DA LISTA E DRAG & DROP
// =========================================================================

function renderizarPersonagens() {
    const grid = document.getElementById("grid-personagens");
    const filtroElemento = document.getElementById("filtro-elemento").value;
    const termoBusca = document.getElementById("busca-nome").value.toLowerCase();
    
    document.getElementById("filtro-elemento").options[0].text = t("Todos Elementos");
    grid.innerHTML = "";

    personagens.forEach(p => {
        if ((filtroElemento === "Todos" || p.tipo_dano === filtroElemento) && p.nome.toLowerCase().includes(termoBusca)) {
            grid.innerHTML += `
                <div class="char-card" draggable="true" ondragstart="iniciarArraste(event, '${p.id}')">
                    <div class="btn-config" style="top: 5px; right: 5px; left: auto; bottom: auto;" onclick="abrirModalConfig('lista', '${p.id}')" title="Configurar Personagem">⚙️</div>
                    <div class="char-img" style="background-image: url('imagens/${p.img}');"></div>
                    <div class="char-info">
                        <strong>${p.nome}</strong>
                        <div class="char-element">${t(p.tipo_dano)} • Nv.${p.status.nivel}</div>
                    </div>
                    <button class="btn-sinergia" onclick="abrirModalSinergia('${p.id}')">${t("Sugerir Times")}</button>
                </div>
            `;
        }
    });
}

function iniciarArraste(ev, id) { ev.dataTransfer.setData("text", id); }
function permitirSoltar(ev) { ev.preventDefault(); ev.currentTarget.classList.add("dragover"); }
function sairSoltar(ev) { ev.currentTarget.classList.remove("dragover"); }

function soltarNoSlot(ev, index) {
    ev.preventDefault();
    ev.currentTarget.classList.remove("dragover");
    const id = ev.dataTransfer.getData("text");
    
    if (id) {
        const charOriginal = personagens.find(p => p.id === id);
        const posicaoAntiga = esquadrao.findIndex(p => p && p.id === id);
        if (posicaoAntiga !== -1) esquadrao[posicaoAntiga] = null;
        esquadrao[index] = charOriginal;
        atualizarTelaEsquadrao();
    }
}

function removerDoEsquadrao(index) { esquadrao[index] = null; atualizarTelaEsquadrao(); }
function limparEsquadrao() { esquadrao = [null, null, null, null]; atualizarTelaEsquadrao(); }

function atualizarTelaEsquadrao() {
    const slots = document.getElementById("slots-esquadrao");
    document.getElementById("contador-esquadrao").innerText = esquadrao.filter(p => p !== null).length;
    slots.innerHTML = "";
    
    for(let i = 0; i < 4; i++) {
        if (esquadrao[i]) {
            const char = esquadrao[i];
            slots.innerHTML += `
                <div class="slot" draggable="true" ondragstart="iniciarArraste(event, '${char.id}')" ondrop="soltarNoSlot(event, ${i})" ondragover="permitirSoltar(event)" ondragleave="sairSoltar(event)" style="border-color: #4facfe; background-image: linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.9)), url('imagens/${char.img}'); color: white; cursor: grab;">
                    <div class="slot-remover" onclick="removerDoEsquadrao(${i})">X</div>
                    <div class="btn-config" onclick="abrirModalConfig('esquadrao', ${i})" title="Configurar Personagem">⚙️</div>
                    <strong style="z-index: 2; margin-top: auto;">${char.nome}</strong>
                    <span style="font-size:10px; z-index:2; color:#4facfe; margin-bottom: 5px;">Nv. ${char.status.nivel}</span>
                </div>
            `;
        } else {
            slots.innerHTML += `<div class="slot" ondrop="soltarNoSlot(event, ${i})" ondragover="permitirSoltar(event)" ondragleave="sairSoltar(event)">${t("Vazio")}<br>${t("(Arraste)")}</div>`;
        }
    }
    calcularCombo();
}

// =========================================================================
// SISTEMA DE CONFIGURAÇÃO (MODAL E RESET)
// =========================================================================

function inicializarSelects() {
    const selectArma = document.getElementById("conf-arma-id");
    const selectArmadura = document.getElementById("conf-armadura-id");
    selectArma.innerHTML = ""; selectArmadura.innerHTML = "";
    armasDB.forEach(arma => { selectArma.innerHTML += `<option value="${arma.id}">${t(arma.nome)} (⭐${arma.raridade})</option>`; });
    setsDB.forEach(set => { selectArmadura.innerHTML += `<option value="${set.id}">${t(set.nome)}</option>`; });
}

function atualizarPreviewArma() {
    const idArmaSelecionada = document.getElementById("conf-arma-id").value;
    const arma = armasDB.find(a => a.id === idArmaSelecionada);
    if(arma) document.getElementById("preview-arma").style.backgroundImage = `url('imagens/${arma.img}')`;
}

function abrirModalConfig(origem, idOuIndex) {
    origemConfig = origem;
    identificadorConfig = idOuIndex;

    let charAlvo = origem === 'lista' ? personagens.find(p => p.id === idOuIndex) : esquadrao[idOuIndex];
    if (!charAlvo) return;

    document.getElementById("config-avatar").style.backgroundImage = `url('imagens/${charAlvo.img}')`;
    document.getElementById("config-nome-personagem").innerText = charAlvo.nome + (origem === 'lista' ? ` (${t("Ficha Base")})` : ` (${t("Esquadrão")})`);
    
    document.getElementById("conf-nivel").value = charAlvo.status.nivel;
    document.getElementById("nome-skill-1").innerText = charAlvo.skills_nomes.basico;
    document.getElementById("nome-skill-2").innerText = charAlvo.skills_nomes.ativa;
    document.getElementById("nome-skill-3").innerText = charAlvo.skills_nomes.ult;
    document.getElementById("nome-skill-4").innerText = charAlvo.skills_nomes.passiva;
    document.getElementById("conf-skill-1").value = charAlvo.status.skill_1;
    document.getElementById("conf-skill-2").value = charAlvo.status.skill_2;
    document.getElementById("conf-skill-3").value = charAlvo.status.skill_3;
    document.getElementById("conf-skill-4").value = charAlvo.status.skill_4;
    
    document.getElementById("conf-arma-id").value = charAlvo.status.arma_id;
    document.getElementById("conf-arma-nivel").value = charAlvo.status.arma_nivel;
    document.getElementById("conf-arma-essencia").value = charAlvo.status.arma_essencia;
    document.getElementById("conf-arma-potencial").value = charAlvo.status.arma_potencial;
    atualizarPreviewArma();
    
    document.getElementById("conf-armadura-id").value = charAlvo.status.armadura_id;
    document.getElementById("conf-armadura-nivel").value = charAlvo.status.armadura_nivel;

    document.getElementById("modal-config").style.display = "flex";
}

function resetarTudo() {
    let aviso = currentLang === 'pt' ? "Tem certeza que deseja resetar as configurações de TODOS os personagens para o nível 1?" : t("AvisoResetTudo");
    if(confirm(aviso)) {
        personagens.forEach(p => {
            p.status = {
                nivel: 1, skill_1: 1, skill_2: 1, skill_3: 1, skill_4: 1,
                arma_id: "wpn_001", arma_nivel: 1, arma_essencia: 1, arma_potencial: 1,
                armadura_id: "set_000", armadura_nivel: 0
            };
        });
        renderizarPersonagens();
        atualizarTelaEsquadrao();
    }
}

function resetarConfiguracao() {
    document.getElementById("conf-nivel").value = 1;
    document.getElementById("conf-skill-1").value = 1;
    document.getElementById("conf-skill-2").value = 1;
    document.getElementById("conf-skill-3").value = 1;
    document.getElementById("conf-skill-4").value = 1;
    document.getElementById("conf-arma-id").value = "wpn_001";
    document.getElementById("conf-arma-nivel").value = 1;
    document.getElementById("conf-arma-essencia").value = 1;
    document.getElementById("conf-arma-potencial").value = 1;
    document.getElementById("conf-armadura-id").value = "set_000";
    document.getElementById("conf-armadura-nivel").value = 0;
    atualizarPreviewArma();
    salvarConfiguracao();
}

function salvarConfiguracao() {
    let statusAtualizado = {
        nivel: parseInt(document.getElementById("conf-nivel").value),
        skill_1: parseInt(document.getElementById("conf-skill-1").value),
        skill_2: parseInt(document.getElementById("conf-skill-2").value),
        skill_3: parseInt(document.getElementById("conf-skill-3").value),
        skill_4: parseInt(document.getElementById("conf-skill-4").value),
        arma_id: document.getElementById("conf-arma-id").value,
        arma_nivel: parseInt(document.getElementById("conf-arma-nivel").value),
        arma_essencia: parseInt(document.getElementById("conf-arma-essencia").value),
        arma_potencial: parseInt(document.getElementById("conf-arma-potencial").value),
        armadura_id: document.getElementById("conf-armadura-id").value,
        armadura_nivel: parseInt(document.getElementById("conf-armadura-nivel").value)
    };

    let charAlvo = origemConfig === 'lista' ? personagens.find(p => p.id === identificadorConfig) : esquadrao[identificadorConfig];
    charAlvo.status = statusAtualizado;

    renderizarPersonagens(); 
    atualizarTelaEsquadrao(); 
    fecharModalConfig();
}

function fecharModalConfig() { document.getElementById("modal-config").style.display = "none"; }

// =========================================================================
// TRILHA DE COMBOS E ALGORITMO DE SUGESTÃO
// =========================================================================

function calcularCombo() {
    const trilha = document.getElementById("trilha-combo");
    trilha.innerHTML = "";
    const timeAtivo = esquadrao.filter(p => p !== null);

    if (timeAtivo.length === 0) {
        trilha.innerHTML = `<p class="instrucao-texto">${t("Adicione personagens ao esquadrão para ver a lógica de combos.")}</p>`;
        return;
    }

    timeAtivo.forEach((char, index) => {
        trilha.innerHTML += `
            <div class="combo-step">
                <span>${char.nome} ${t("precisa:")}</span>
                <div class="mecanica" style="color: #ff4757;">${t(char.continua)}</div>
                <hr style="border: 1px solid #2a3f54;">
                <span>${t("e então aplica:")}</span>
                <div class="mecanica" style="color: #4facfe;">${t(char.inicia)}</div>
            </div>
        `;
        if (index < timeAtivo.length - 1) { trilha.innerHTML += `<div class="seta">➞</div>`; }
    });
}

function abrirModalSinergia(idPrincipal) {
    const p = personagens.find(char => char.id === idPrincipal);
    document.getElementById("modal-titulo-sinergia").innerText = `${t("Melhores Formações para")} ${p.nome}`;
    timesGeradosParaModal = [];

    function completarTime(timeAtual) {
        let novoTime = [...timeAtual];
        let suportesEDefensores = personagens.filter(char => !novoTime.some(nc => nc.id === char.id) && (char.inicia.includes("Buff") || char.inicia.includes("Taunt") || char.inicia.includes("Sobrevivência") || char.inicia.includes("Cura")));
        let qualquerOutro = personagens.filter(char => !novoTime.some(nc => nc.id === char.id));

        for (let sup of suportesEDefensores) { if (novoTime.length < 4) novoTime.push(sup); }
        for (let out of qualquerOutro) { if (novoTime.length < 4) novoTime.push(out); }
        return novoTime;
    }

    let time1 = [p];
    let parceirosCombo = personagens.filter(char => char.id !== p.id && ((char.continua !== "Nenhum" && p.inicia.includes(char.continua)) || (p.continua !== "Nenhum" && char.inicia.includes(p.continua))));
    parceirosCombo.forEach(parceiro => { if (time1.length < 4) time1.push(parceiro); });
    time1 = completarTime(time1);
    timesGeradosParaModal.push({ titulo: t("Estratégia: Sinergia de Combo"), time: time1 });

    let time2 = [p];
    let parceirosElementais = personagens.filter(char => char.id !== p.id && char.tipo_dano === p.tipo_dano);
    if (p.tipo_dano === "Físico") {
        parceirosElementais = personagens.filter(char => char.id !== p.id && char.tipo_dano === "Físico" && (char.inicia.includes("Suscetibilidade") || char.inicia.includes("Vulnerabilidade") || char.continua.includes("Vulnerabilidade")));
    }
    parceirosElementais.forEach(parceiro => { if (time2.length < 4) time2.push(parceiro); });
    time2 = completarTime(time2);
    timesGeradosParaModal.push({ titulo: `${t("Estratégia: Foco Elemento")} (${t(p.tipo_dano)})`, time: time2 });

    let time3 = [p];
    let parceirosControle = personagens.filter(char => char.id !== p.id && (char.inicia.includes("Stun") || char.inicia.includes("Airborne") || char.inicia.includes("Slow") || char.inicia.includes("Congelamento") || char.inicia.includes("Paralisia")));
    parceirosControle.forEach(parceiro => { if (time3.length < 4 && !time2.some(t2 => t2.id === parceiro.id)) time3.push(parceiro); });
    time3 = completarTime(time3);
    timesGeradosParaModal.push({ titulo: t("Estratégia: Controle de Grupo Absoluto"), time: time3 });

    desenharModalSinergia();
}

function desenharModalSinergia() {
    const container = document.getElementById("container-times-sugeridos");
    container.innerHTML = "";

    timesGeradosParaModal.forEach((opcao, index) => {
        let slotsHtml = "";
        opcao.time.forEach(char => {
            slotsHtml += `<div class="modal-slot-mini" style="background-image: linear-gradient(to top, rgba(0,0,0,0.9), rgba(0,0,0,0.2)), url('imagens/${char.img}'); color: white;">${char.nome}</div>`;
        });

        container.innerHTML += `
            <div class="linha-time">
                <h3>${opcao.titulo}</h3>
                <div class="modal-slots">${slotsHtml}</div>
                <button class="btn-aplicar-time" onclick="aplicarTimeDoModal(${index})">${t("Substituir Esquadrão")}</button>
            </div>
        `;
    });
    document.getElementById("modal-sinergia").style.display = "flex";
}

function fecharModalSinergia() { document.getElementById("modal-sinergia").style.display = "none"; }

function aplicarTimeDoModal(indexDoTime) {
    esquadrao = timesGeradosParaModal[indexDoTime].time.map(charOriginal => charOriginal);
    while (esquadrao.length < 4) esquadrao.push(null);
    atualizarTelaEsquadrao();
    fecharModalSinergia();
}

// =========================================================================
// INICIALIZAÇÃO
// =========================================================================

window.onload = function() {
    atualizarTextosEstaticos();
    inicializarSelects();
    renderizarPersonagens();
    atualizarTelaEsquadrao();
    document.getElementById("conf-arma-id").addEventListener("change", atualizarPreviewArma);
};

window.onclick = function(event) {
    if (event.target === document.getElementById("modal-config")) fecharModalConfig();
    if (event.target === document.getElementById("modal-sinergia")) fecharModalSinergia();
};