let squad = [null, null, null, null];
let activeOrigin = null; 
let activeId = null;

// Enforces limits on number inputs securely
function clamp(val, min, max) {
    let num = parseInt(val);
    if(isNaN(num)) return min;
    return Math.min(max, Math.max(min, num));
}

// Complete Weapons Database (Nomenclature and archetypes)
const weaponsDB = [
    // Longswords
    { id: "wpn_lg_01", name: "Endfield Standard Longsword", type: "Longsword", img: "wpn_std_long.jpg", base_atk: 45 },
    { id: "wpn_lg_02", name: "Talos Blade", type: "Longsword", img: "wpn_talos.jpg", base_atk: 55 },
    { id: "wpn_lg_03", name: "Valley Protector", type: "Longsword", img: "wpn_rossi.jpg", base_atk: 65 },
    { id: "wpn_lg_04", name: "Mercenary Edge", type: "Longsword", img: "wpn_mercenary.jpg", base_atk: 50 },
    { id: "wpn_lg_05", name: "Knight's Oath", type: "Longsword", img: "wpn_knight.jpg", base_atk: 60 },
    // Greatswords
    { id: "wpn_gs_01", name: "Endfield Standard Greatsword", type: "Greatsword", img: "wpn_std_great.jpg", base_atk: 50 },
    { id: "wpn_gs_02", name: "Sunderblade", type: "Greatsword", img: "wpn_sunder.jpg", base_atk: 60 },
    { id: "wpn_gs_03", name: "Heavy Axe", type: "Greatsword", img: "wpn_machado.jpg", base_atk: 55 },
    { id: "wpn_gs_04", name: "Earthshaker", type: "Greatsword", img: "wpn_earthshaker.jpg", base_atk: 65 },
    { id: "wpn_gs_05", name: "Crimson Cleaver", type: "Greatsword", img: "wpn_cleaver.jpg", base_atk: 58 },
    // Staffs / Scepters
    { id: "wpn_st_01", name: "Endfield Standard Staff", type: "Staff", img: "wpn_std_staff.jpg", base_atk: 42 },
    { id: "wpn_st_02", name: "Gravity Scepter", type: "Staff", img: "wpn_gilberta.jpg", base_atk: 62 },
    { id: "wpn_st_03", name: "Originium Orb", type: "Staff", img: "wpn_orbe.jpg", base_atk: 65 },
    { id: "wpn_st_04", name: "Sage's Wand", type: "Staff", img: "wpn_sage.jpg", base_atk: 55 },
    { id: "wpn_st_05", name: "Void Staff", type: "Staff", img: "wpn_void.jpg", base_atk: 60 },
    // Polearms
    { id: "wpn_pl_01", name: "Endfield Standard Polearm", type: "Polearm", img: "wpn_std_pole.jpg", base_atk: 46 },
    { id: "wpn_pl_02", name: "Silver Lance", type: "Polearm", img: "wpn_lance.jpg", base_atk: 56 },
    { id: "wpn_pl_03", name: "Dragon Halberd", type: "Polearm", img: "wpn_dragon.jpg", base_atk: 64 },
    { id: "wpn_pl_04", name: "Storm Piercer", type: "Polearm", img: "wpn_storm.jpg", base_atk: 60 },
    { id: "wpn_pl_05", name: "Royal Pike", type: "Polearm", img: "wpn_royal.jpg", base_atk: 58 },
    // Firearms
    { id: "wpn_fa_01", name: "Endfield Standard Firearm", type: "Firearm", img: "wpn_std_fire.jpg", base_atk: 48 },
    { id: "wpn_fa_02", name: "Tactical Flamethrower", type: "Firearm", img: "wpn_ember.jpg", base_atk: 58 },
    { id: "wpn_fa_03", name: "Precise Sniper", type: "Firearm", img: "wpn_sniper.jpg", base_atk: 65 },
    { id: "wpn_fa_04", name: "Burst Rifle", type: "Firearm", img: "wpn_burst.jpg", base_atk: 55 },
    { id: "wpn_fa_05", name: "Originium Blaster", type: "Firearm", img: "wpn_blaster.jpg", base_atk: 62 },
    // Twinblades / Daggers
    { id: "wpn_tw_01", name: "Mercenary Twin Blades", type: "Twinblade", img: "wpn_mercenaria.jpg", base_atk: 44 },
    { id: "wpn_tw_02", name: "Assassin's Fangs", type: "Twinblade", img: "wpn_fangs.jpg", base_atk: 58 },
    { id: "wpn_tw_03", name: "Shadow Edges", type: "Twinblade", img: "wpn_shadow.jpg", base_atk: 62 }
];

// Complete Lvl 70 Equipment Sets
const armorSetsDB = [
    { id: "set_none", name: "No Equipment", set_effect: "None" },
    { id: "set_merc", name: "Mercenary Set", set_effect: "Phys DMG" },
    { id: "set_flash", name: "Flashpoint Set", set_effect: "Heat DMG" },
    { id: "set_zero", name: "Absolute Zero Set", set_effect: "Cryo DMG" },
    { id: "set_storm", name: "Storm Set", set_effect: "Electric DMG" },
    { id: "set_grav", name: "Gravity Anomaly Set", set_effect: "Nature DMG" },
    { id: "set_arts", name: "Arts Field Set", set_effect: "Arts DMG" },
    { id: "set_shield", name: "Shieldbreaker Set", set_effect: "Toughness" },
    { id: "set_front", name: "Frontline Set", set_effect: "Def/HP" },
    { id: "set_strike", name: "Striker Set", set_effect: "Crit Rate" },
    { id: "set_assassin", name: "Assassin Set", set_effect: "Crit DMG" }
];

const characters = [
    { id: "001", name: "Akekuri", element: "Physical", img: "akekuri.jpg", initiates: "None", continues: "Stun", skills: { basic: { name: "Fast Slash" }, active: { name: "Tactical Dash" }, ult: { name: "Crushing Blow" }, passive: { name: "Battle Focus" } } },
    { id: "002", name: "Alesh", element: "Physical", img: "alesh.jpg", initiates: "None", continues: "Toughness Break", skills: { basic: { name: "Precise Shot" }, active: { name: "Piercing Shot" }, ult: { name: "Bullet Rain" }, passive: { name: "Optical Aim" } } },
    { id: "003", name: "Antal", element: "Nature", img: "antal.jpg", initiates: "Buff", continues: "None", skills: { basic: { name: "Spore Shot" }, active: { name: "Revitalizing Seed" }, ult: { name: "Bloom Field" }, passive: { name: "Symbiosis" } } },
    { id: "004", name: "Arclight", element: "Electric", img: "arclight.jpg", initiates: "Paralysis", continues: "None", skills: { basic: { name: "Spark" }, active: { name: "Chain Shock" }, ult: { name: "Magnetic Storm" }, passive: { name: "Living Battery" } } },
    { id: "005", name: "Ardelia", element: "Nature", img: "ardelia.jpg", initiates: "Vulnerability", continues: "None", skills: { basic: { name: "Leaf Ray" }, active: { name: "Cutting Vines" }, ult: { name: "Thorn Prison" }, passive: { name: "Nature's Touch" } } },
    { id: "006", name: "Avywenna", element: "Physical", img: "avywenna.jpg", initiates: "None", continues: "Toughness Break", skills: { basic: { name: "Double Attack" }, active: { name: "Cutting Fury" }, ult: { name: "Blade Whirlwind" }, passive: { name: "Mercenary Instinct" } } },
    { id: "007", name: "Camille", element: "Heat", img: "camille.jpg", initiates: "Thermal Infliction", continues: "Vulnerability", skills: { basic: { name: "Hot Shot" }, active: { name: "Phosphorus Grenade" }, ult: { name: "Ignition Zone" }, passive: { name: "Lingering Fire" } } },
    { id: "008", name: "Catcher", element: "Physical", img: "catcher.jpg", initiates: "Taunt", continues: "None", skills: { basic: { name: "Shield Strike" }, active: { name: "Tactical Provocation" }, ult: { name: "Impassable Stance" }, passive: { name: "Solid Vanguard" } } },
    { id: "009", name: "Chen Qianyu", element: "Physical", img: "chen.jpg", initiates: "Knockback", continues: "None", skills: { basic: { name: "Dragon Fist" }, active: { name: "Repulsive Palm" }, ult: { name: "Lungmen Fury" }, passive: { name: "Ancestral Art" } } },
    { id: "010", name: "Da Pan", element: "Physical", img: "dapan.jpg", initiates: "Crush", continues: "Stun", skills: { basic: { name: "Heavy Swing" }, active: { name: "Seismic Strike" }, ult: { name: "Total Smash" }, passive: { name: "Brute Force" } } },
    { id: "011", name: "Ember", element: "Heat", img: "ember.jpg", initiates: "Thermal Infliction", continues: "None", skills: { basic: { name: "Flamethrower" }, active: { name: "Fire Barrier" }, ult: { name: "Thermal Explosion" }, passive: { name: "Primal Ignition" } } },
    { id: "012", name: "Endministrator", element: "Physical", img: "endmin.jpg", initiates: "Toughness Break", continues: "Any", skills: { basic: { name: "Modular Slash" }, active: { name: "Crushing Beam" }, ult: { name: "Contingency Overload" }, passive: { name: "Talos Synergy" } } },
    { id: "013", name: "Estella", element: "Physical", img: "estella.jpg", initiates: "None", continues: "Toughness Break", skills: { basic: { name: "Agile Blade" }, active: { name: "Double Cut" }, ult: { name: "Sword Dance" }, passive: { name: "Combat Reflex" } } },
    { id: "014", name: "Fluorite", element: "Arts", img: "fluorite.jpg", initiates: "Slow", continues: "None", skills: { basic: { name: "Crystal Projectile" }, active: { name: "Mineral Prison" }, ult: { name: "Resonance" }, passive: { name: "Retarding Glow" } } },
    { id: "015", name: "Gilberta", element: "Nature", img: "gilberta.jpg", initiates: "Airborne", continues: "Toughness Break", skills: { basic: { name: "Gravity Beam" }, active: { name: "Weight Inversion" }, ult: { name: "Anti-Gravity Field" }, passive: { name: "Angelina's Heritage" } } },
    { id: "016", name: "Laevatain", element: "Heat", img: "laevatain.jpg", initiates: "Stagger", continues: "Vulnerability", skills: { basic: { name: "Flaming Strike" }, active: { name: "Caloric Blow" }, ult: { name: "Blade Eruption" }, passive: { name: "Relentless Heat" } } },
    { id: "017", name: "Last Rite", element: "Cryo", img: "lastrite.jpg", initiates: "Freeze", continues: "Cryo Infliction", skills: { basic: { name: "Frost Scythe" }, active: { name: "Sudden Blizzard" }, ult: { name: "Absolute Zero" }, passive: { name: "Winter's Embrace" } } },
    { id: "018", name: "Lifeng", element: "Physical", img: "lifeng.jpg", initiates: "Susceptibility", continues: "None", skills: { basic: { name: "Swift Strike" }, active: { name: "Hunter's Mark" }, ult: { name: "Perfect Execution" }, passive: { name: "Eagle Eye" } } },
    { id: "019", name: "Mi Fu", element: "Physical", img: "mifu.jpg", initiates: "Susceptibility", continues: "Vulnerability", skills: { basic: { name: "Claw Art" }, active: { name: "Defense Break" }, ult: { name: "Fatal Blow" }, passive: { name: "Weak Point" } } },
    { id: "020", name: "Perlica", element: "Arts", img: "perlica.jpg", initiates: "Slow", continues: "AoE Damage", skills: { basic: { name: "Energy Orb" }, active: { name: "Spatial Distortion" }, ult: { name: "Temporal Collapse" }, passive: { name: "Director's Vision" } } },
    { id: "021", name: "Pogranichnik", element: "Physical", img: "pogra.jpg", initiates: "Posture Break", continues: "None", skills: { basic: { name: "Heavy Axe" }, active: { name: "War Cry" }, ult: { name: "Earthquake" }, passive: { name: "Military Resistance" } } },
    { id: "022", name: "Rossi", element: "Physical", img: "rossi.jpg", initiates: "Airborne", continues: "Heat", skills: { basic: { name: "Wolf Strike" }, active: { name: "Ascending Blow" }, ult: { name: "Final Hunt Dance" }, passive: { name: "Valley Leader" } } },
    { id: "023", name: "Snowshine", element: "Cryo", img: "snowshine.jpg", initiates: "Cryo Infliction", continues: "Taunt", skills: { basic: { name: "Ice Spear" }, active: { name: "Glacial Shield" }, ult: { name: "Winter Wall" }, passive: { name: "Absolute Cold" } } },
    { id: "024", name: "Tangtang", element: "Physical", img: "tangtang.jpg", initiates: "None", continues: "Toughness Break", skills: { basic: { name: "Smash" }, active: { name: "Destructive Spin" }, ult: { name: "Meteoric Impact" }, passive: { name: "Endless Energy" } } },
    { id: "025", name: "Wulfgard", element: "Physical", img: "wulfgard.jpg", initiates: "Stun", continues: "None", skills: { basic: { name: "Savage Strike" }, active: { name: "Battle Howl" }, ult: { name: "Lupine Fury" }, passive: { name: "Survival Instinct" } } },
    { id: "026", name: "Xaihi", element: "Arts", img: "xaihi.jpg", initiates: "Survival", continues: "None", skills: { basic: { name: "Guiding Light" }, active: { name: "Sacred Shield" }, ult: { name: "Purification" }, passive: { name: "Divine Grace" } } },
    { id: "027", name: "Yvonne", element: "Cryo", img: "yvonne.jpg", initiates: "Cryo Infliction", continues: "Freeze", skills: { basic: { name: "Freezing Shot" }, active: { name: "Arctic Explosion" }, ult: { name: "Snowstorm" }, passive: { name: "Frost Focus" } } },
    { id: "028", name: "Zhuang Fangyi", element: "Electric", img: "zhuang.jpg", initiates: "DoT Damage", continues: "Sunderblade", skills: { basic: { name: "Lightning Blade" }, active: { name: "Invocation" }, ult: { name: "Thunder Judgment" }, passive: { name: "Electric Conduction" } } }
];

function initDatabase() {
    characters.forEach(p => {
        p.status = {
            level: 1, skill_1: 1, skill_2: 1, skill_3: 1,
            weapon_id: "wpn_lg_01", weapon_level: 1, weapon_essence: 1, weapon_potential: 1,
            // 4 distinct armor pieces
            armor: {
                head: { id: "set_none", level: 0 },
                chest: { id: "set_none", level: 0 },
                arms: { id: "set_none", level: 0 },
                legs: { id: "set_none", level: 0 }
            },
            talents: [false, false, false, false, false, false]
        };
    });
}
initDatabase();

window.onload = function() {
    initSelects();
    renderCharacters();
    renderSquad();
    attachValidation();
};

function initSelects() {
    const selWpn = document.getElementById("conf-weapon-id");
    selWpn.innerHTML = "";
    weaponsDB.forEach(w => selWpn.innerHTML += `<option value="${w.id}">${w.name} (${w.type})</option>`);
    
    const parts = ["head", "chest", "arms", "legs"];
    parts.forEach(part => {
        const sel = document.getElementById(`conf-armor-${part}`);
        sel.innerHTML = "";
        armorSetsDB.forEach(s => {
            const label = s.id === "set_none" ? s.name : `${s.name} (${s.set_effect})`;
            sel.innerHTML += `<option value="${s.id}">${label}</option>`;
        });
    });
}

function attachValidation() {
    const inputs = ['conf-level', 'conf-weapon-level'];
    inputs.forEach(id => {
        document.getElementById(id).addEventListener('blur', function() { this.value = clamp(this.value, 1, 90); });
    });
}

function renderCharacters() {
    const grid = document.getElementById("character-grid");
    const filter = document.getElementById("filter-element").value;
    const search = document.getElementById("search-name").value.toLowerCase();
    
    grid.innerHTML = "";
    characters.forEach(p => {
        if ((filter === "All" || p.element === filter) && p.name.toLowerCase().includes(search)) {
            // Origin explicitly sent as 'roster'
            grid.innerHTML += `
                <div class="char-card" draggable="true" ondragstart="drag(event, 'roster', '${p.id}')">
                    <div class="btn-gear" onmousedown="event.stopPropagation()" onclick="openSettings('list', '${p.id}')">⚙️</div>
                    <div class="char-img" style="background-image: url('imagens/${p.img}');"></div>
                    <div class="char-info">
                        <strong>${p.name}</strong>
                        <span>${p.element} • LVL ${p.status.level}</span>
                    </div>
                    <button class="btn-suggestion" onmousedown="event.stopPropagation()" onclick="openSynergyModal('${p.id}')">Tactics</button>
                </div>
            `;
        }
    });
}

function renderSquad() {
    const slots = document.getElementById("squad-slots");
    document.getElementById("squad-counter").innerText = squad.filter(p => p !== null).length;
    slots.innerHTML = "";
    
    for(let i = 0; i < 4; i++) {
        if (squad[i]) {
            const c = squad[i];
            // Origin explicitly sent as 'squad' to allow internal reordering
            slots.innerHTML += `
                <div class="slot slot-filled" draggable="true" ondragstart="drag(event, 'squad', '${i}')" ondrop="drop(event, ${i})" ondragover="allowDrop(event)" ondragleave="leaveDrop(event)" style="background-image: linear-gradient(to top, rgba(0,0,0,0.9), transparent), url('imagens/${c.img}');">
                    <button class="btn-remove" onmousedown="event.stopPropagation()" onclick="removeFromSquad(${i})">X</button>
                    <div class="btn-gear" onmousedown="event.stopPropagation()" onclick="openSettings('squad', ${i})">⚙️</div>
                    <strong>${c.name}</strong>
                    <span>LVL ${c.status.level}</span>
                </div>
            `;
        } else {
            slots.innerHTML += `<div class="slot" ondrop="drop(event, ${i})" ondragover="allowDrop(event)" ondragleave="leaveDrop(event)">STANDBY</div>`;
        }
    }
    calcCombo();
}

function drag(ev, origin, val) { 
    ev.dataTransfer.setData("origin", origin);
    ev.dataTransfer.setData("val", val);
}
function allowDrop(ev) { ev.preventDefault(); ev.currentTarget.classList.add("dragover"); }
function leaveDrop(ev) { ev.currentTarget.classList.remove("dragover"); }
function drop(ev, idx) {
    ev.preventDefault(); ev.currentTarget.classList.remove("dragover");
    
    const origin = ev.dataTransfer.getData("origin");
    const val = ev.dataTransfer.getData("val");
    
    if (!origin) return;

    if (origin === 'roster') {
        const char = characters.find(p => p.id === val);
        const oldPos = squad.findIndex(p => p && p.id === val);
        if (oldPos !== -1) squad[oldPos] = null;
        squad[idx] = char;
    } else if (origin === 'squad') {
        const fromIdx = parseInt(val);
        const temp = squad[idx];
        squad[idx] = squad[fromIdx];
        squad[fromIdx] = temp;
    }
    renderSquad();
}

function removeFromSquad(idx) { squad[idx] = null; renderSquad(); }
function clearSquad() { squad = [null, null, null, null]; renderSquad(); }

function updateWeaponPreview() {
    const id = document.getElementById("conf-weapon-id").value;
    const wpn = weaponsDB.find(w => w.id === id);
    if(wpn) document.getElementById("preview-weapon").style.backgroundImage = `url('imagens/${wpn.img}')`;
}

function openSettings(origin, idVal) {
    activeOrigin = origin; 
    activeId = idVal;
    
    let target = origin === 'list' ? characters.find(p => p.id === idVal) : squad[idVal];
    if (!target) return;

    document.getElementById("config-avatar").style.backgroundImage = `url('imagens/${target.img}')`;
    document.getElementById("config-char-name").innerText = target.name;
    document.getElementById("config-origin-badge").innerText = origin === 'list' ? "BASE DB" : "SQUAD CLONE";
    
    document.getElementById("conf-level").value = target.status.level;
    document.getElementById("name-skill-1").innerText = target.skills.basic.name;
    document.getElementById("name-skill-2").innerText = target.skills.active.name;
    document.getElementById("name-skill-3").innerText = target.skills.ult.name;
    document.getElementById("name-skill-4").innerText = target.skills.passive.name;
    
    document.getElementById("conf-skill-1").value = target.status.skill_1;
    document.getElementById("conf-skill-2").value = target.status.skill_2;
    document.getElementById("conf-skill-3").value = target.status.skill_3;
    
    document.getElementById("conf-weapon-id").value = target.status.weapon_id;
    document.getElementById("conf-weapon-level").value = target.status.weapon_level;
    document.getElementById("conf-weapon-essence").value = target.status.weapon_essence;
    document.getElementById("conf-weapon-potential").value = target.status.weapon_potential;
    updateWeaponPreview();
    
    const parts = ["head", "chest", "arms", "legs"];
    parts.forEach(part => {
        document.getElementById(`conf-armor-${part}`).value = target.status.armor[part].id;
        document.getElementById(`conf-lvl-${part}`).value = target.status.armor[part].level;
    });

    const tCont = document.getElementById("talent-nodes-container");
    tCont.innerHTML = "";
    for(let i=0; i<6; i++) {
        let isActive = target.status.talents[i] ? "active" : "";
        tCont.innerHTML += `<div class="talent-box ${isActive}" onclick="toggleTalent(this, ${i})">${i+1}</div>`;
    }

    document.getElementById("modal-config").style.display = "flex";
}

function toggleTalent(element, index) {
    element.classList.toggle("active");
}

function saveConfig() {
    let target = activeOrigin === 'list' ? characters.find(p => p.id === activeId) : squad[activeId];
    
    target.status.level = clamp(document.getElementById("conf-level").value, 1, 90);
    target.status.skill_1 = clamp(document.getElementById("conf-skill-1").value, 1, 7);
    target.status.skill_2 = clamp(document.getElementById("conf-skill-2").value, 1, 7);
    target.status.skill_3 = clamp(document.getElementById("conf-skill-3").value, 1, 7);
    
    target.status.weapon_id = document.getElementById("conf-weapon-id").value;
    target.status.weapon_level = clamp(document.getElementById("conf-weapon-level").value, 1, 90);
    target.status.weapon_essence = clamp(document.getElementById("conf-weapon-essence").value, 1, 5);
    target.status.weapon_potential = clamp(document.getElementById("conf-weapon-potential").value, 1, 5);
    
    const parts = ["head", "chest", "arms", "legs"];
    parts.forEach(part => {
        target.status.armor[part].id = document.getElementById(`conf-armor-${part}`).value;
        target.status.armor[part].level = clamp(document.getElementById(`conf-lvl-${part}`).value, 0, 20);
    });

    const talentBoxes = document.querySelectorAll(".talent-box");
    talentBoxes.forEach((box, i) => { target.status.talents[i] = box.classList.contains("active"); });

    renderCharacters(); renderSquad(); closeConfigModal();
}

function resetConfig() {
    document.getElementById("conf-level").value = 1;
    document.getElementById("conf-skill-1").value = 1;
    document.getElementById("conf-skill-2").value = 1;
    document.getElementById("conf-skill-3").value = 1;
    document.getElementById("conf-weapon-id").value = "wpn_lg_01";
    document.getElementById("conf-weapon-level").value = 1;
    document.getElementById("conf-weapon-essence").value = 1;
    document.getElementById("conf-weapon-potential").value = 1;
    
    const parts = ["head", "chest", "arms", "legs"];
    parts.forEach(part => {
        document.getElementById(`conf-armor-${part}`).value = "set_none";
        document.getElementById(`conf-lvl-${part}`).value = 0;
    });

    document.querySelectorAll(".talent-box").forEach(b => b.classList.remove("active"));
    updateWeaponPreview(); saveConfig();
}

function openConfirmModal() { document.getElementById("modal-confirm").style.display = "flex"; }
function closeConfirmModal() { document.getElementById("modal-confirm").style.display = "none"; }
function closeConfigModal() { document.getElementById("modal-config").style.display = "none"; }

function executeResetAll() { 
    initDatabase(); 
    clearSquad(); 
    renderCharacters(); 
    closeConfirmModal(); 
}

function calcCombo() {
    const track = document.getElementById("combo-track");
    track.innerHTML = "";
    const active = squad.filter(p => p !== null);
    if (active.length === 0) {
        track.innerHTML = `<p class="sub-text">Deploy operators to evaluate tactical sequence.</p>`; return;
    }
    active.forEach((c, i) => {
        track.innerHTML += `
            <div class="combo-node">
                <span>Requires</span><div class="mechanic" style="color:var(--danger-red)">${c.continues}</div>
                <hr style="border: 1px solid var(--border-dim); margin: 8px 0;">
                <span>Applies</span><div class="mechanic">${c.initiates}</div>
            </div>
        `;
        if (i < active.length - 1) track.innerHTML += `<div class="combo-arrow">➞</div>`;
    });
}

function openSynergyModal(id) {
    const p = characters.find(c => c.id === id);
    document.querySelector("#modal-synergy h2").innerText = `Tactics for ${p.name}`;
    const cont = document.getElementById("suggested-teams-container");
    cont.innerHTML = "";
    
    let t1 = characters.filter(c => c.id !== p.id && (c.element === p.element || c.initiates === p.continues)).slice(0,3);
    t1.unshift(p);
    
    let html = `<div class="team-card"><h3>Synergy Link Alpha</h3><div class="team-roster">`;
    t1.forEach(c => html += `<div class="mini-slot" style="background-image: linear-gradient(to top, rgba(0,0,0,0.9), transparent), url('imagens/${c.img}');">${c.name}</div>`);
    html += `</div><button class="btn-primary" onclick="applyTeam('${t1.map(x=>x.id).join(',')}')">Deploy</button></div>`;
    
    cont.innerHTML = html;
    document.getElementById("modal-synergy").style.display = "flex";
}

function closeSynergyModal() { document.getElementById("modal-synergy").style.display = "none"; }
function applyTeam(idList) {
    const ids = idList.split(',');
    squad = ids.map(id => characters.find(c => c.id === id));
    while(squad.length < 4) squad.push(null);
    renderSquad(); closeSynergyModal();
}

window.onclick = function(e) {
    if (e.target.classList.contains('modal')) e.target.style.display = "none";
};
