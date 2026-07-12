let squad = [null, null, null, null];
let activeOrigin = null; 
let activeId = null;
let currentTab = 'operators'; 
let currentWeaponModalId = null;

function clamp(val, min, max) {
    let num = parseInt(val);
    if(isNaN(num)) return min;
    return Math.min(max, Math.max(min, num));
}

function formatStat(key, value) {
    const percentKeys = ['crit_rate', 'crit_dmg', 'phys_res', 'arts_res', 'heat_res', 'elec_res', 'cryo_res', 'nature_res', 'aether_res', 'treat_bonus', 'treat_rec_bonus', 'combo_cd_red', 'ult_gain_eff', 'stagger_eff', 'phys_dmg_bonus', 'heat_dmg_bonus', 'elec_dmg_bonus', 'cryo_dmg_bonus', 'nature_dmg_bonus', 'ult_dmg_bonus'];
    if (percentKeys.includes(key)) {
        return Number((value * 100).toFixed(1)) + "%";
    }
    return Math.floor(value).toString();
}

function generateSkillOptions() {
    let html = "";
    for(let i=1; i<=9; i++) html += `<option value="${i}">Rank ${i}</option>`;
    html += `<option value="10">Mastery 1</option>`;
    html += `<option value="11">Mastery 2</option>`;
    html += `<option value="12">Mastery 3</option>`;
    return html;
}

const weaponsDB = [
    { 
        id: "wpn_test_00", name: "Empty Training Weapon (Any)", type: "Any", img: "", 
        base_atk: 0, max_atk: 0,
        effects_math: () => ({}),
        effects_info: []
    },
    { 
        id: "wpn_glorious_memory", name: "Glorious Memory", type: "Longsword", img: "wpn_glorious.jpg", 
        base_atk: 50, max_atk: 490,
        effects_math: (e1, e2, e3) => {
            const agi = [20, 36, 52, 68, 84, 100, 116, 132, 156];
            const cr = [0.025, 0.045, 0.065, 0.085, 0.105, 0.125, 0.145, 0.165, 0.195];
            const atkP = [0.07, 0.084, 0.098, 0.112, 0.126, 0.14, 0.154, 0.168, 0.196];
            const dmgD = [0.12, 0.144, 0.168, 0.192, 0.216, 0.24, 0.264, 0.288, 0.336];
            return {
                agility: agi[e1 - 1] || 0,
                crit_rate: cr[e2 - 1] || 0,
                atk_percent: atkP[e3 - 1] || 0,
                ult_dmg_bonus: dmgD[e3 - 1] || 0
            };
        },
        effects_info: [
            { name: "Agility Boost [G]", desc: (lv) => `Agility <span style="color:var(--primary-yellow)">+${[20, 36, 52, 68, 84, 100, 116, 132, 156][lv-1]}</span>` },
            { name: "Critical Rate Boost [L]", desc: (lv) => `Critical Rate <span style="color:var(--primary-yellow)">+${([0.025, 0.045, 0.065, 0.085, 0.105, 0.125, 0.145, 0.165, 0.195][lv-1]*100).toFixed(1)}%</span>` },
            { name: "Twilight: Lingering Glow", desc: (lv) => `ATK <span style="color:var(--primary-yellow)">+${([0.07, 0.084, 0.098, 0.112, 0.126, 0.14, 0.154, 0.168, 0.196][lv-1]*100).toFixed(1)}%</span>. When the wielder's skill applies Vulnerability, during the next ultimate cast within 30s, the wielder gains DMG Dealt <span style="color:var(--primary-yellow)">+${([0.12, 0.144, 0.168, 0.192, 0.216, 0.24, 0.264, 0.288, 0.336][lv-1]*100).toFixed(1)}%</span>. Max stacks for effects of the same name: 3. Duration of each stack is counted separately. Effect only triggers once every 0.5s.` }
        ]
    }
];

const generateGenericWeapon = (num) => ({
    id: `wpn_blank_${num.toString().padStart(2, '0')}`, name: `Classified Protocol ${num.toString().padStart(2, '0')}`, type: "Unknown", img: "", 
    base_atk: 50, max_atk: 500,
    effects_math: () => ({}),
    effects_info: [
        { name: "Locked Node Alpha", desc: (lv) => `Effect data missing (Lv.${lv}).` },
        { name: "Locked Node Beta", desc: (lv) => `Effect data missing (Lv.${lv}).` },
        { name: "Locked Node Gamma", desc: (lv) => `Effect data missing (Lv.${lv}).` }
    ]
});
for(let i=1; i<=35; i++) weaponsDB.push(generateGenericWeapon(i));

const armorSetsDB = [
    { id: "set_none", name: "No Equipment", mult: {} },
    { id: "set_merc", name: "Mercenary Set", mult: { phys_dmg_bonus: 0.15 } },
    { id: "set_flash", name: "Flashpoint Set", mult: { heat_dmg_bonus: 0.15 } },
    { id: "set_zero", name: "Absolute Zero Set", mult: { cryo_dmg_bonus: 0.15 } },
    { id: "set_storm", name: "Storm Set", mult: { elec_dmg_bonus: 0.15 } },
    { id: "set_grav", name: "Gravity Anomaly Set", mult: { nature_dmg_bonus: 0.15 } },
    { id: "set_arts", name: "Arts Field Set", mult: { treat_bonus: 0.15 } },
    { id: "set_shield", name: "Shieldbreaker Set", mult: { stagger_eff: 0.15 } },
    { id: "set_front", name: "Frontline Set", mult: { hp_bonus: 0.15, defense: 0.15 } },
    { id: "set_strike", name: "Striker Set", mult: { crit_rate: 0.10 } },
    { id: "set_assassin", name: "Assassin Set", mult: { crit_dmg: 0.20 } }
];

const advancedStatsKeys = [
    { key: "hp", name: "HP" }, { key: "attack", name: "Attack" }, { key: "defense", name: "Defense" },
    { key: "crit_rate", name: "Critical Rate" }, { key: "crit_dmg", name: "Critical DMG" },
    { key: "arts_intensity", name: "Arts Intensity" }, { key: "phys_res", name: "Physical Resistance" },
    { key: "arts_res", name: "Arts Resistance" }, { key: "heat_res", name: "Heat Resistance" }, 
    { key: "elec_res", name: "Electric Resistance" }, { key: "cryo_res", name: "Cryo Resistance" }, 
    { key: "nature_res", name: "Nature Resistance" }, { key: "aether_res", name: "Aether Resistance" }, 
    { key: "treat_bonus", name: "Treatment Bonus" }, { key: "treat_rec_bonus", name: "Heal Received" }, 
    { key: "combo_cd_red", name: "Combo Skill CD Reduction" }, { key: "ult_gain_eff", name: "Ultimate Gain Efficiency" }, 
    { key: "stagger_eff", name: "Stagger Efficiency Bonus" }, { key: "phys_dmg_bonus", name: "Physical DMG Bonus" }, 
    { key: "heat_dmg_bonus", name: "Heat DMG Bonus" }, { key: "elec_dmg_bonus", name: "Electric DMG Bonus" }, 
    { key: "cryo_dmg_bonus", name: "Cryo DMG Bonus" }, { key: "nature_dmg_bonus", name: "Nature DMG Bonus" }, 
    { key: "ult_dmg_bonus", name: "Ultimate DMG Bonus" }
];

const universalBaseStatsTemplate = {
    crit_rate: 0.05, crit_dmg: 0.50, arts_intensity: 0, phys_res: 0, arts_res: 0, heat_res: 0, elec_res: 0, 
    cryo_res: 0, nature_res: 0, aether_res: 0, treat_bonus: 0, treat_rec_bonus: 0, combo_cd_red: 0, 
    ult_gain_eff: 1.0, stagger_eff: 0, phys_dmg_bonus: 0, heat_dmg_bonus: 0, elec_dmg_bonus: 0, 
    cryo_dmg_bonus: 0, nature_dmg_bonus: 0, ult_dmg_bonus: 0
};

const generateGenericChar = (id, name, cls, el, img, p_attr, s_attr, ini, con) => ({
    id, name, class: cls, element: el, img, attr_prim: p_attr, attr_sec: s_attr,
    breakpoints: {
        1: { hp: 500, attack: 30, strength: 10, agility: 10, intellect: 10, will: 10 },
        90: { hp: 5000, attack: 300, strength: 100, agility: 100, intellect: 100, will: 100 }
    },
    initiates: ini, continues: con,
    skills: {
        basic: { name: "Basic Attack", desc: "Generic Basic Attack sequence." },
        active: { name: "Active Skill", desc: "Generic Active Skill." },
        ult: { name: "Ultimate Skill", desc: "Generic Ultimate Skill." },
        combo: { name: "Combo Skill", desc: "Generic Combo Skill." }
    },
    talents_data: {
        t1: { name: "Talent 1", lv1: "Lv.1 Data missing", lv2: "Lv.2 Data missing" },
        t2: { name: "Talent 2", lv1: "Lv.1 Data missing", lv2: "Lv.2 Data missing" }
    },
    affinity_bonus: [0, 0, 0, 0, 0],
    getPotentialStats: () => ({}),
    pot_desc: []
});

const characters = [
    { 
        id: "022", name: "Rossi", class: "Guard", element: "Physical", img: "rossi.jpg", attr_prim: "agility", attr_sec: "intellect",
        breakpoints: {
            1:  { hp: 500,  attack: 30,  strength: 9,  agility: 23,  intellect: 14,  will: 9 },
            70: { hp: 4372, attack: 258, strength: 78, agility: 142, intellect: 94,  will: 71 },
            90: { hp: 5495, attack: 323, strength: 97, agility: 176, intellect: 118, will: 89 }
        },
        initiates: "Armor Break", continues: "Airborne",
        skills: { 
            basic: { name: "Seething Wolfblood", desc: "BASIC ATTACK: An attack with up to 5 sequences that deals Physical DMG. As the controlled operator, Final Strike also deals 1 Stagger. DIVE ATTACK: Basic attack performed in mid-air becomes a dive attack that deals Physical DMG to nearby enemies. FINISHER: Basic attack performed near a Staggered enemy becomes a finisher attack that deals massive Physical DMG and recovers some SP." }, 
            active: { name: "Crimson Shadow", desc: "Cost: 100. Charges to the target to deal Physical DMG and apply Lift. If the target already has Vulnerability stack(s), the skill also unleashes a Wolven Ambrage that charges at the target to deal Heat DMG." }, 
            ult: { name: "\"Razorclaw\" Ambuscade", desc: "Cost: 110, CD: 10s. Rossi flutters her cape and unleashes a flurry of stabs that quickly deals multiple sequences of Heat DMG to the target. She then performs a two-sequence slash attack with her dagger that deals massive Heat DMG and applies Heat Infliction. When this skill successfully scores a critical hit, it deals higher Critical DMG." }, 
            combo: { name: "Moment of Blazing Shadow", desc: "COMBO TRIGGER: When an enemy has both Vulnerability and Arts Infliction stacks. Rossi's combo skill has 2 consecutive sequences. COMBO SEQUENCE 1 deals Physical DMG to the target. COMBO SEQUENCE 2 consumes all Arts Infliction stacks from the target, deals Physical DMG based on the number of Arts Infliction stacks consumed, applies 1 instance of Lift, and buffs Rossi's Critical Rate and Critical DMG Dealt at the same time. If COMBO SEQUENCE 2 is cast with perfect timing, it applies 1 more stack of Vulnerability." }
        },
        talents_data: {
            t1: { name: "Nicks and Scratches", lv1: "Battle skill improved: After Wolven Ambrage deals DMG, Rossi applies Razor Clawmark to the target for 15s. This effect cannot stack. For the duration of Razor Clawmark, the target takes 25% ATK (Rossi's) of Physical DMG per second and suffers Physical DMG Taken and Heat DMG Taken +6%.", lv2: "Battle skill improved: After Wolven Ambrage deals DMG, Rossi applies Razor Clawmark to the target for 25s. This effect cannot stack. For the duration of Razor Clawmark, the target takes 30% ATK (Rossi's) of Physical DMG per second and suffers Physical DMG Taken and Heat DMG Taken +12%." },
            t2: { name: "Seething Blood", lv1: "When Rossi's skill deals Critical DMG to a Razor Clawmarked enemy, trigger another hit that deals 12% ATK (Rossi's) of Heat DMG and restores [Intellect × 0.04] HP to Rossi. If the target is also Combusted, then the aforementioned DMG and HP Restoration effects are increased to 1.5 times.", lv2: "When Rossi's skill deals Critical DMG to a Razor Clawmarked enemy, trigger another hit that deals 24% ATK (Rossi's) of Heat DMG and restores [Intellect × 0.08] HP to Rossi. If the target is also Combusted, then the aforementioned DMG and HP Restoration effects are increased to 1.5 times." }
        },
        affinity_bonus: [0, 10, 25, 40, 60],
        getPotentialStats: (potLevel) => {
            let b = { agility: 0, crit_rate: 0, crit_dmg: 0 };
            if(potLevel >= 2) { b.agility += 20; b.crit_rate += 0.07; }
            if(potLevel >= 5) { b.crit_dmg += 0.30; }
            return b;
        },
        pot_desc: [
            "Pot 1 (Origin of Admiration): Crimson Shadow & Moment of Blazing Shadow Multipliers x1.15. Wolven Ambrage returns 10 SP.",
            "Pot 2 (Gap to Perfection): Agility +20, Critical Rate +7%.",
            "Pot 3 (Tangible Duties): Talent Seething Blood improved: Base DMG Multiplier +8%, restores HP +[Intellect × 0.04].",
            "Pot 4 (Innocent Wish): Ultimate Energy cost -15%.",
            "Pot 5 (Legendary Destination): Ultimate DMG x1.1, Critical DMG Dealt +30%."
        ]
    },
    generateGenericChar("012", "Endministrator", "Striker", "Physical", "endmin.jpg", "will", "strength", "Airborne", "Armor Break"),
    generateGenericChar("020", "Perlica", "Caster", "Arts", "perlica.jpg", "intellect", "will", "Arts Vulnerability", "Slow"),
    generateGenericChar("001", "Akekuri", "Vanguard", "Physical", "akekuri.jpg", "agility", "will", "Stun", "Armor Break"),
    generateGenericChar("002", "Alesh", "Striker", "Physical", "alesh.jpg", "agility", "intellect", "Armor Break", "Slow"),
    generateGenericChar("003", "Antal", "Supporter", "Nature", "antal.jpg", "will", "intellect", "Nature's Bind", "Knockdown"),
    generateGenericChar("004", "Arclight", "Caster", "Electric", "arclight.jpg", "intellect", "agility", "Paralysis", "Stagger"),
    generateGenericChar("005", "Ardelia", "Supporter", "Nature", "ardelia.jpg", "will", "intellect", "Slow", "Nature's Bind"),
    generateGenericChar("006", "Avywenna", "Guard", "Physical", "avywenna.jpg", "agility", "strength", "Armor Break", "Stagger"),
    generateGenericChar("007", "Camille", "Caster", "Heat", "camille.jpg", "intellect", "will", "Burn", "Stun"),
    generateGenericChar("008", "Catcher", "Defender", "Physical", "catcher.jpg", "strength", "will", "Taunt", "Paralysis"),
    generateGenericChar("009", "Chen Qianyu", "Guard", "Physical", "chen.jpg", "strength", "will", "Knockdown", "Stagger"),
    generateGenericChar("010", "Da Pan", "Defender", "Physical", "dapan.jpg", "strength", "will", "Knockdown", "Airborne"),
    generateGenericChar("011", "Ember", "Caster", "Heat", "ember.jpg", "intellect", "agility", "Burn", "Armor Break"),
    generateGenericChar("013", "Estella", "Guard", "Physical", "estella.jpg", "agility", "strength", "Stagger", "Knockdown"),
    generateGenericChar("014", "Fluorite", "Supporter", "Arts", "fluorite.jpg", "will", "intellect", "Crystalize", "Arts Vulnerability"),
    generateGenericChar("015", "Gilberta", "Supporter", "Nature", "gilberta.jpg", "intellect", "will", "Slow", "Airborne"),
    generateGenericChar("016", "Laevatain", "Guard", "Heat", "laevatain.jpg", "strength", "intellect", "Arts Vulnerability", "Burn"),
    generateGenericChar("017", "Last Rite", "Caster", "Cryo", "lastrite.jpg", "intellect", "will", "Freeze", "Armor Break"),
    generateGenericChar("018", "Lifeng", "Striker", "Physical", "lifeng.jpg", "agility", "strength", "Knockback", "Airborne"),
    generateGenericChar("019", "Mi Fu", "Guard", "Physical", "mifu.jpg", "strength", "agility", "Armor Break", "Knockdown"),
    generateGenericChar("021", "Pogranichnik", "Defender", "Physical", "pogra.jpg", "will", "strength", "Stagger", "Freeze"),
    generateGenericChar("023", "Snowshine", "Defender", "Cryo", "snowshine.jpg", "strength", "will", "Slow", "Stagger"),
    generateGenericChar("024", "Tangtang", "Vanguard", "Physical", "tangtang.jpg", "strength", "agility", "Knockback", "Armor Break"),
    generateGenericChar("025", "Wulfgard", "Guard", "Physical", "wulfgard.jpg", "strength", "agility", "Stagger", "Knockdown"),
    generateGenericChar("026", "Xaihi", "Supporter", "Arts", "xaihi.jpg", "will", "intellect", "Arts Vulnerability", "Crystalize"),
    generateGenericChar("027", "Yvonne", "Striker", "Cryo", "yvonne.jpg", "agility", "intellect", "Freeze", "Airborne"),
    generateGenericChar("028", "Zhuang Fangyi", "Caster", "Electric", "zhuang.jpg", "intellect", "agility", "Paralysis", "Arts Vulnerability")
];

function initDatabase() {
    characters.forEach(p => {
        p.status = {
            level: 1, affinity: 0, potential: 0, 
            talent_1_brk: 1, talent_2_brk: 1, 
            skill_1: 1, skill_2: 1, skill_3: 1, skill_4: 1,
            weapon_id: "wpn_test_00", weapon_level: 1, weapon_e1: 1, weapon_e2: 1, weapon_e3: 1,
            armor: { head: { id: "set_none", level: 0 }, chest: { id: "set_none", level: 0 }, arms: { id: "set_none", level: 0 }, legs: { id: "set_none", level: 0 } },
            talents: Array(10).fill(false),
            stats: {}
        };
    });
}
initDatabase();

window.onload = function() {
    initSelects();
    renderRoster();
    renderSquad();
    attachValidation();
};

function switchTab(tab) {
    currentTab = tab;
    document.getElementById('tab-btn-operators').classList.toggle('active', tab === 'operators');
    document.getElementById('tab-btn-weapons').classList.toggle('active', tab === 'weapons');
    document.getElementById('filter-element').style.display = tab === 'operators' ? 'inline-block' : 'none';
    renderRoster();
}

function initSelects() {
    const selWpn = document.getElementById("conf-weapon-id");
    selWpn.innerHTML = "";
    weaponsDB.forEach(w => selWpn.innerHTML += `<option value="${w.id}">${w.name} (${w.type})</option>`);
    
    const parts = ["head", "chest", "arms", "legs"];
    parts.forEach(part => {
        const sel = document.getElementById(`conf-armor-${part}`);
        sel.innerHTML = "";
        armorSetsDB.forEach(s => { sel.innerHTML += `<option value="${s.id}">${s.name}</option>`; });
    });

    const skillOptions = generateSkillOptions();
    for (let i = 1; i <= 4; i++) { document.getElementById(`conf-skill-${i}`).innerHTML = skillOptions; }
}

function attachValidation() {
    const inputs = ['conf-level', 'conf-weapon-level'];
    inputs.forEach(id => {
        document.getElementById(id).addEventListener('blur', function() { this.value = clamp(this.value, 1, 90); });
    });
}

function renderRoster() {
    const grid = document.getElementById("character-grid");
    const search = document.getElementById("search-name").value.toLowerCase();
    grid.innerHTML = "";

    if (currentTab === 'operators') {
        const filter = document.getElementById("filter-element").value;
        characters.forEach(p => {
            if ((filter === "All" || p.element === filter) && p.name.toLowerCase().includes(search)) {
                grid.innerHTML += `
                    <div class="char-card" draggable="true" ondragstart="drag(event, 'roster', '${p.id}')" onclick="openSettings('list', '${p.id}')">
                        <div class="char-img" style="${p.img ? `background-image: url('imagens/${p.img}');` : ''}">
                            ${!p.img ? '<span style="color: var(--border-dim); font-size: 40px; font-weight: bold;">?</span>' : ''}
                        </div>
                        <div class="char-info">
                            <strong>${p.name}</strong>
                            <span>${p.class} • ${p.element} • LVL ${p.status.level}</span>
                        </div>
                        <button class="btn-suggestion" onclick="event.stopPropagation(); openSynergyModal('${p.id}')">Tactics</button>
                    </div>
                `;
            }
        });
    } else {
        weaponsDB.forEach(w => {
            if (w.name.toLowerCase().includes(search)) {
                grid.innerHTML += `
                    <div class="char-card" onclick="openWeaponModal('${w.id}')">
                        <div class="wpn-img" style="${w.img ? `background-image: url('imagens/${w.img}');` : ''}">
                            ${!w.img ? '<span style="color: var(--border-dim); font-size: 40px; font-weight: bold;">?</span>' : ''}
                        </div>
                        <div class="char-info">
                            <strong>${w.name}</strong>
                            <span>${w.type}</span>
                        </div>
                    </div>
                `;
            }
        });
    }
}

function renderSquad() {
    const slots = document.getElementById("squad-slots");
    document.getElementById("squad-counter").innerText = squad.filter(p => p !== null).length;
    slots.innerHTML = "";
    for(let i = 0; i < 4; i++) {
        if (squad[i]) {
            const c = squad[i];
            slots.innerHTML += `
                <div class="slot slot-filled" draggable="true" ondragstart="drag(event, 'squad', '${i}')" ondrop="drop(event, ${i})" ondragover="allowDrop(event)" ondragleave="leaveDrop(event)" style="${c.img ? `background-image: linear-gradient(to top, rgba(0,0,0,0.9), transparent), url('imagens/${c.img}'); background-size: cover;` : `background: var(--bg-dark);`}" onclick="openSettings('squad', ${i})">
                    <button class="btn-remove" onclick="event.stopPropagation(); removeFromSquad(${i})">X</button>
                    ${!c.img ? '<span style="color: var(--border-dim); font-size: 40px; font-weight: bold; position: absolute; top: 30%;">?</span>' : ''}
                    <div style="flex:1;"></div>
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

function drag(ev, origin, val) { ev.dataTransfer.setData("origin", origin); ev.dataTransfer.setData("val", val); }
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
    const preview = document.getElementById("preview-weapon");
    if(wpn && wpn.img) {
        preview.style.backgroundImage = `url('imagens/${wpn.img}')`;
        preview.innerHTML = "";
    } else {
        preview.style.backgroundImage = "none";
        preview.innerHTML = '<span style="color: var(--border-dim); font-size: 24px; font-weight: bold;">?</span>';
    }
}

function renderAdvancedStats(statsObj) {
    const container = document.getElementById("advanced-stats-container");
    container.innerHTML = "";
    advancedStatsKeys.forEach(stat => {
        let val = formatStat(stat.key, statsObj[stat.key] || 0);
        container.innerHTML += `<div class="stat-row"><span class="stat-name">${stat.name}</span><span class="stat-val">${val}</span></div>`;
    });
}

function getBP(bp, key, lvl) {
    let levels = Object.keys(bp).map(Number).sort((a,b)=>a-b);
    if (lvl <= levels[0]) return bp[levels[0]][key];
    if (lvl >= levels[levels.length-1]) return bp[levels[levels.length-1]][key];
    
    let lower = levels[0], upper = levels[levels.length-1];
    for (let i = 0; i < levels.length - 1; i++) {
        if (lvl >= levels[i] && lvl <= levels[i+1]) {
            lower = levels[i]; upper = levels[i+1]; break;
        }
    }
    let t = (lvl - lower) / (upper - lower);
    return bp[lower][key] + (bp[upper][key] - bp[lower][key]) * t;
}

window.setTalentBrk = function(talentNum, val) {
    if (activeId === null) return;
    let c = activeOrigin === 'list' ? characters.find(p => p.id === activeId) : squad[activeId];
    if (!c) return;
    if (talentNum === 1) c.status.talent_1_brk = parseInt(val);
    if (talentNum === 2) c.status.talent_2_brk = parseInt(val);
    updateDescriptions();
};

function updateDescriptions() {
    if (activeId === null) return;
    let c = activeOrigin === 'list' ? characters.find(p => p.id === activeId) : squad[activeId];
    if (!c) return;

    let pot = clamp(document.getElementById("conf-char-potential").value, 0, 5) || 0;
    let box = document.getElementById("intel-box");

    let t1_lvl = c.status.talent_1_brk || 1;
    let t2_lvl = c.status.talent_2_brk || 1;

    let html = `
        <div class="intel-item">
            <span class="intel-title">Basic Attack</span>
            <span class="intel-subtitle">${c.skills.basic.name}</span>
            <p class="intel-desc">${c.skills.basic.desc}</p>
        </div>
        <div class="intel-item">
            <span class="intel-title">Normal Skill</span>
            <span class="intel-subtitle">${c.skills.active.name}</span>
            <p class="intel-desc">${c.skills.active.desc}</p>
        </div>
        <div class="intel-item">
            <span class="intel-title">Ultimate Skill</span>
            <span class="intel-subtitle">${c.skills.ult.name}</span>
            <p class="intel-desc">${c.skills.ult.desc}</p>
        </div>
        <div class="intel-item">
            <span class="intel-title">Combo Skill</span>
            <span class="intel-subtitle">${c.skills.combo.name}</span>
            <p class="intel-desc">${c.skills.combo.desc}</p>
        </div>
        <div class="intel-item">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                <span class="intel-title" style="margin-bottom: 0;">Talent 1 Breakthrough</span>
                <select class="tech-input" style="padding: 2px 5px; font-size: 10px; width: auto;" onchange="setTalentBrk(1, this.value)">
                    <option value="1" ${t1_lvl === 1 ? 'selected' : ''}>Lv.1 (E1)</option>
                    <option value="2" ${t1_lvl === 2 ? 'selected' : ''}>Lv.2 (E2)</option>
                </select>
            </div>
            <span class="intel-subtitle">${c.talents_data.t1.name}</span>
            <p class="intel-desc" style="color:var(--primary-yellow); font-style:italic;">${t1_lvl === 1 ? c.talents_data.t1.lv1 : c.talents_data.t1.lv2}</p>
        </div>
        <div class="intel-item">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                <span class="intel-title" style="margin-bottom: 0;">Talent 2 Breakthrough</span>
                <select class="tech-input" style="padding: 2px 5px; font-size: 10px; width: auto;" onchange="setTalentBrk(2, this.value)">
                    <option value="1" ${t2_lvl === 1 ? 'selected' : ''}>Lv.1 (E2)</option>
                    <option value="2" ${t2_lvl === 2 ? 'selected' : ''}>Lv.2 (E3)</option>
                </select>
            </div>
            <span class="intel-subtitle">${c.talents_data.t2.name}</span>
            <p class="intel-desc" style="color:var(--primary-yellow); font-style:italic;">${t2_lvl === 1 ? c.talents_data.t2.lv1 : c.talents_data.t2.lv2}</p>
        </div>
    `;

    if (pot > 0 && c.pot_desc && c.pot_desc.length > 0) {
        html += `<div class="intel-item"><span class="intel-title">Active Potentials</span>`;
        for (let i = 0; i < pot; i++) {
            if (c.pot_desc[i]) {
                html += `<p class="intel-desc" style="margin-top: 4px;">• ${c.pot_desc[i]}</p>`;
            }
        }
        html += `</div>`;
    }

    box.innerHTML = html;
}

function updateLiveStats() {
    if (activeId === null) return;
    let c = activeOrigin === 'list' ? characters.find(p => p.id === activeId) : squad[activeId];
    if (!c) return;

    let lvl = clamp(document.getElementById("conf-level").value, 1, 90) || 1;
    let affinity = clamp(document.getElementById("conf-char-affinity").value, 0, 4) || 0;
    let potential = clamp(document.getElementById("conf-char-potential").value, 0, 5) || 0;

    let wpnId = document.getElementById("conf-weapon-id").value;
    let wpnLvl = clamp(document.getElementById("conf-weapon-level").value, 1, 90) || 1;
    let wpnE1 = clamp(document.getElementById("conf-weapon-e1").value, 1, 9) || 1;
    let wpnE2 = clamp(document.getElementById("conf-weapon-e2").value, 1, 9) || 1;
    let wpnE3 = clamp(document.getElementById("conf-weapon-e3").value, 1, 9) || 1;
    
    let armors = [
        document.getElementById("conf-armor-head").value, document.getElementById("conf-armor-chest").value,
        document.getElementById("conf-armor-arms").value, document.getElementById("conf-armor-legs").value
    ];
    let armLvls = [
        clamp(document.getElementById("conf-lvl-head").value, 0, 20) || 0, clamp(document.getElementById("conf-lvl-chest").value, 0, 20) || 0,
        clamp(document.getElementById("conf-lvl-arms").value, 0, 20) || 0, clamp(document.getElementById("conf-lvl-legs").value, 0, 20) || 0
    ];

    let attr = {
        strength: Math.round(getBP(c.breakpoints, 'strength', lvl)),
        agility: Math.round(getBP(c.breakpoints, 'agility', lvl)),
        intellect: Math.round(getBP(c.breakpoints, 'intellect', lvl)),
        will: Math.round(getBP(c.breakpoints, 'will', lvl))
    };

    if (c.affinity_bonus && c.affinity_bonus[affinity]) attr.agility += c.affinity_bonus[affinity];
    
    let potBonus = c.getPotentialStats(potential);
    if (potBonus.agility) attr.agility += potBonus.agility;

    let stats = { ...universalBaseStatsTemplate };
    let base_hp = getBP(c.breakpoints, 'hp', lvl);
    let base_atk = getBP(c.breakpoints, 'attack', lvl);
    stats.defense = 0; 
    
    if (potBonus.crit_rate) stats.crit_rate += potBonus.crit_rate;
    if (potBonus.crit_dmg) stats.crit_dmg += potBonus.crit_dmg;

    let wpn = weaponsDB.find(w => w.id === wpnId);
    let wpnTotalAtk = 0;
    let wpnBonus = null;

    if (wpn && wpn.max_atk > 0) {
        let wpnGrowth = (wpn.max_atk - wpn.base_atk) / 89;
        wpnTotalAtk = wpn.base_atk + (wpnLvl - 1) * wpnGrowth;
        if (wpn.effects_math) {
            wpnBonus = wpn.effects_math(wpnE1, wpnE2, wpnE3);
        }
    }

    if (wpnBonus && wpnBonus.agility) {
        attr.agility += wpnBonus.agility;
    }

    stats.hp = Math.floor(base_hp + attr.strength * 5); 
    
    let mainBonus = attr[c.attr_prim] * 0.005;
    let subBonus = attr[c.attr_sec] * 0.002;
    let attrAtkMultiplier = mainBonus + subBonus;

    if (wpnBonus && wpnBonus.atk_percent) {
        attrAtkMultiplier += wpnBonus.atk_percent;
    }

    stats.attack = Math.floor((base_atk + wpnTotalAtk) * (1 + attrAtkMultiplier));
    stats.phys_res = attr.agility * 0.001;
    stats.arts_res = attr.intellect * 0.001;
    stats.treat_rec_bonus = attr.will * 0.001;

    if (wpnBonus && wpnBonus.crit_rate) stats.crit_rate += wpnBonus.crit_rate;
    if (wpnBonus && wpnBonus.ult_dmg_bonus) stats.ult_dmg_bonus += wpnBonus.ult_dmg_bonus;

    let totalArmLvl = armLvls.reduce((a,b)=>a+b, 0);
    stats.hp += totalArmLvl * 25;
    stats.defense += totalArmLvl * 3;

    let setsCount = {};
    armors.forEach(id => { if(id !== "set_none") setsCount[id] = (setsCount[id] || 0) + 1; });
    for (let setId in setsCount) {
        if (setsCount[setId] >= 4) {
            let setObj = armorSetsDB.find(s => s.id === setId);
            if (setObj && setObj.mult) {
                for (let key in setObj.mult) { stats[key] += setObj.mult[key]; }
            }
        }
    }

    let talents = [];
    document.querySelectorAll(".talent-box").forEach(b => talents.push(b.classList.contains("active")));

    let minorAtkBonus = 0, minorHpBonus = 0;
    if (talents[4]) minorAtkBonus += 0.05;
    if (talents[5]) minorAtkBonus += 0.05;
    if (talents[6]) minorHpBonus += 0.05;
    if (talents[7]) minorHpBonus += 0.05;
    if (talents[8]) stats.defense += 30;
    if (talents[9]) stats.crit_rate += 0.03;

    stats.attack = Math.floor(stats.attack * (1 + minorAtkBonus));
    stats.hp = Math.floor(stats.hp * (1 + minorHpBonus));

    c.status.stats = stats;
    renderAdvancedStats(stats);
    updateDescriptions();
}

window.updateWeaponModalStats = function() {
    if (!currentWeaponModalId) return;
    const w = weaponsDB.find(x => x.id === currentWeaponModalId);
    if (!w) return;

    let lvl = clamp(document.getElementById("wpn-modal-level").value, 1, 90) || 1;
    let atk = 0;
    
    if (w.max_atk > 0) {
        let wpnGrowth = (w.max_atk - w.base_atk) / 89;
        atk = Math.round(w.base_atk + (lvl - 1) * wpnGrowth);
    }
    document.getElementById("wpn-modal-atk").innerText = atk;

    let e1 = clamp(document.getElementById("wpn-modal-e1") ? document.getElementById("wpn-modal-e1").value : 1, 1, 9);
    let e2 = clamp(document.getElementById("wpn-modal-e2") ? document.getElementById("wpn-modal-e2").value : 1, 1, 9);
    let e3 = clamp(document.getElementById("wpn-modal-e3") ? document.getElementById("wpn-modal-e3").value : 1, 1, 9);

    const cont = document.getElementById("wpn-modal-effects-container");
    if (!w.effects_info || w.effects_info.length === 0) {
        cont.innerHTML = "<p class='sub-text'>No advanced nodes available for this weapon.</p>";
        return;
    }

    let html = `<h3>Node Progression</h3>`;
    let lvls = [e1, e2, e3];
    
    w.effects_info.forEach((eff, i) => {
        html += `
        <div class="intel-item">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                <span class="intel-title" style="margin-bottom: 0;">${eff.name}</span>
                <select class="tech-input" style="padding: 2px 5px; font-size: 10px; width: auto;" id="wpn-modal-e${i+1}" onchange="updateWeaponModalStats()">
                    ${[1,2,3,4,5,6,7,8,9].map(n => `<option value="${n}" ${lvls[i] === n ? 'selected' : ''}>Lv.${n}</option>`).join('')}
                </select>
            </div>
            <p class="intel-desc">${eff.desc(lvls[i])}</p>
        </div>`;
    });
    cont.innerHTML = html;
};

function openWeaponModal(wpnId) {
    currentWeaponModalId = wpnId;
    const w = weaponsDB.find(x => x.id === wpnId);
    if (!w) return;

    const imgDiv = document.getElementById("wpn-modal-img");
    if(w.img) {
        imgDiv.style.backgroundImage = `url('imagens/${w.img}')`;
        imgDiv.innerHTML = "";
    } else {
        imgDiv.style.backgroundImage = "none";
        imgDiv.innerHTML = '<span style="color: var(--border-dim); font-size: 30px; font-weight: bold;">?</span>';
    }

    document.getElementById("wpn-modal-name").innerText = w.name;
    document.getElementById("wpn-modal-type").innerText = w.type;
    document.getElementById("wpn-modal-level").value = 1;
    
    document.getElementById("modal-weapon").style.display = "flex";
    updateWeaponModalStats();
}

function closeWeaponModal() {
    document.getElementById("modal-weapon").style.display = "none";
    currentWeaponModalId = null;
}

function saveWeaponModal() {
    const btn = document.getElementById("btn-save-weapon");
    const originalText = btn.innerText;
    btn.innerText = "SAVED ✓";
    btn.style.backgroundColor = "#2ECC71";
    btn.style.color = "#000";
    setTimeout(() => {
        btn.innerText = originalText;
        btn.style.backgroundColor = "";
        btn.style.color = "";
    }, 1500);
}

function openSettings(origin, idVal) {
    activeOrigin = origin; activeId = idVal;
    let target = origin === 'list' ? characters.find(p => p.id === idVal) : squad[idVal];
    if (!target) return;

    const avatarDiv = document.getElementById("config-avatar");
    if(target.img) {
        avatarDiv.style.backgroundImage = `url('imagens/${target.img}')`;
        avatarDiv.innerHTML = "";
    } else {
        avatarDiv.style.backgroundImage = "none";
        avatarDiv.innerHTML = '<span style="color: var(--border-dim); font-size: 30px; font-weight: bold;">?</span>';
    }

    document.getElementById("config-char-name").innerText = target.name;
    document.getElementById("config-origin-badge").innerText = origin === 'list' ? "BASE DB" : "SQUAD CLONE";
    document.getElementById("attr-primary").innerText = target.attr_prim.toUpperCase();
    document.getElementById("attr-secondary").innerText = target.attr_sec.toUpperCase();

    document.getElementById("conf-level").value = target.status.level;
    document.getElementById("conf-char-affinity").value = target.status.affinity;
    document.getElementById("conf-char-potential").value = target.status.potential;

    document.getElementById("name-skill-1").innerText = target.skills.basic.name;
    document.getElementById("name-skill-2").innerText = target.skills.active.name;
    document.getElementById("name-skill-3").innerText = target.skills.ult.name;
    document.getElementById("name-skill-4").innerText = target.skills.combo.name;
    
    document.getElementById("conf-skill-1").value = target.status.skill_1;
    document.getElementById("conf-skill-2").value = target.status.skill_2;
    document.getElementById("conf-skill-3").value = target.status.skill_3;
    document.getElementById("conf-skill-4").value = target.status.skill_4;
    
    document.getElementById("conf-weapon-id").value = target.status.weapon_id;
    document.getElementById("conf-weapon-level").value = target.status.weapon_level;
    document.getElementById("conf-weapon-e1").value = target.status.weapon_e1 || 1;
    document.getElementById("conf-weapon-e2").value = target.status.weapon_e2 || 1;
    document.getElementById("conf-weapon-e3").value = target.status.weapon_e3 || 1;
    
    updateWeaponPreview();
    
    const parts = ["head", "chest", "arms", "legs"];
    parts.forEach(part => {
        document.getElementById(`conf-armor-${part}`).value = target.status.armor[part].id;
        document.getElementById(`conf-lvl-${part}`).value = target.status.armor[part].level;
    });

    const tCont = document.getElementById("talent-nodes-container");
    tCont.innerHTML = "";
    for(let i=0; i<10; i++) {
        let isActive = target.status.talents[i] ? "active" : "";
        let nodeClass = i < 4 ? "major" : "minor";
        let icon = i < 4 ? ["α", "β", "γ", "δ"][i] : "+";
        tCont.innerHTML += `<div class="talent-box ${nodeClass} ${isActive}" onclick="toggleTalent(this, ${i})">${icon}</div>`;
    }

    document.getElementById("modal-config").style.display = "flex";
    updateLiveStats();
}

function saveConfig() {
    let target = activeOrigin === 'list' ? characters.find(p => p.id === activeId) : squad[activeId];
    
    target.status.level = clamp(document.getElementById("conf-level").value, 1, 90);
    target.status.affinity = clamp(document.getElementById("conf-char-affinity").value, 0, 4);
    target.status.potential = clamp(document.getElementById("conf-char-potential").value, 0, 5);

    target.status.skill_1 = parseInt(document.getElementById("conf-skill-1").value);
    target.status.skill_2 = parseInt(document.getElementById("conf-skill-2").value);
    target.status.skill_3 = parseInt(document.getElementById("conf-skill-3").value);
    target.status.skill_4 = parseInt(document.getElementById("conf-skill-4").value);
    
    target.status.weapon_id = document.getElementById("conf-weapon-id").value;
    target.status.weapon_level = clamp(document.getElementById("conf-weapon-level").value, 1, 90);
    target.status.weapon_e1 = clamp(document.getElementById("conf-weapon-e1").value, 1, 9);
    target.status.weapon_e2 = clamp(document.getElementById("conf-weapon-e2").value, 1, 9);
    target.status.weapon_e3 = clamp(document.getElementById("conf-weapon-e3").value, 1, 9);
    
    const parts = ["head", "chest", "arms", "legs"];
    parts.forEach(part => {
        target.status.armor[part].id = document.getElementById(`conf-armor-${part}`).value;
        target.status.armor[part].level = clamp(document.getElementById(`conf-lvl-${part}`).value, 0, 20);
    });

    const talentBoxes = document.querySelectorAll(".talent-box");
    talentBoxes.forEach((box, i) => { target.status.talents[i] = box.classList.contains("active"); });

    const btn = document.getElementById("btn-save-config");
    const originalText = btn.innerText;
    btn.innerText = "SAVED ✓";
    btn.style.backgroundColor = "#2ECC71";
    btn.style.color = "#000";
    setTimeout(() => {
        btn.innerText = originalText;
        btn.style.backgroundColor = "";
        btn.style.color = "";
    }, 1500);

    renderRoster(); 
    renderSquad(); 
}

function resetConfig() {
    document.getElementById("conf-level").value = 1;
    document.getElementById("conf-char-affinity").value = 0;
    document.getElementById("conf-char-potential").value = 0;

    if (activeId !== null) {
        let c = activeOrigin === 'list' ? characters.find(p => p.id === activeId) : squad[activeId];
        if (c) {
            c.status.talent_1_brk = 1;
            c.status.talent_2_brk = 1;
        }
    }

    document.getElementById("conf-skill-1").value = 1;
    document.getElementById("conf-skill-2").value = 1;
    document.getElementById("conf-skill-3").value = 1;
    document.getElementById("conf-skill-4").value = 1;
    document.getElementById("conf-weapon-id").value = "wpn_test_00";
    document.getElementById("conf-weapon-level").value = 1;
    document.getElementById("conf-weapon-e1").value = 1;
    document.getElementById("conf-weapon-e2").value = 1;
    document.getElementById("conf-weapon-e3").value = 1;
    
    const parts = ["head", "chest", "arms", "legs"];
    parts.forEach(part => {
        document.getElementById(`conf-armor-${part}`).value = "set_none";
        document.getElementById(`conf-lvl-${part}`).value = 0;
    });

    document.querySelectorAll(".talent-box").forEach(b => b.classList.remove("active"));
    updateWeaponPreview(); 
    updateLiveStats();
}

function closeConfigModal() { document.getElementById("modal-config").style.display = "none"; }
function openConfirmModal() { document.getElementById("modal-confirm").style.display = "flex"; }
function closeConfirmModal() { document.getElementById("modal-confirm").style.display = "none"; }
function executeResetAll() { initDatabase(); clearSquad(); renderRoster(); closeConfirmModal(); }

function calcCombo() {
    const track = document.getElementById("combo-track");
    track.innerHTML = "";
    const active = squad.filter(p => p !== null);
    
    if (active.length < 2) {
        track.innerHTML = `<p class="sub-text">Deploy at least two operators to evaluate tactical sequence.</p>`; 
        return;
    }
    
    let html = "";
    for (let i = 0; i < active.length - 1; i++) {
        let current = active[i];
        let next = active[i+1];
        
        let primaryMatch = (current.initiates !== "None" && current.initiates === next.continues);
        let passiveMatch = (current.skills.passive && current.skills.passive.extra_initiates && current.skills.passive.extra_initiates === next.continues);
        
        let isMatch = primaryMatch || passiveMatch;
        let colorStatus = isMatch ? "var(--primary-yellow)" : "var(--danger-red)";
        let matchText = primaryMatch ? "SYNERGY LINKED (SKILL)" : (passiveMatch ? "SYNERGY LINKED (PASSIVE)" : "NO SYNERGY");

        let appliesText = current.initiates;
        if (passiveMatch && !primaryMatch) {
            appliesText = current.skills.passive.extra_initiates;
        } else if (current.skills.passive && current.skills.passive.extra_initiates) {
            appliesText += ` <br><span style="color: #FFF; font-size: 10px;">or</span> ${current.skills.passive.extra_initiates}`;
        }

        html += `
            <div class="combo-node">
                <span>${current.name} Applies</span>
                <div class="mechanic">${appliesText}</div>
                <hr style="border: 1px solid var(--border-dim); margin: 8px 0;">
                <span style="color: ${colorStatus}; font-weight: bold; font-size: 10px;">${matchText}</span>
                <hr style="border: 1px solid var(--border-dim); margin: 8px 0;">
                <span>${next.name} Needs</span>
                <div class="mechanic" style="color: ${colorStatus}">${next.continues}</div>
            </div>
        `;
        if (i < active.length - 2) html += `<div class="combo-arrow">➞</div>`;
    }
    track.innerHTML = html;
}

function openSynergyModal(id) {
    const p = characters.find(c => c.id === id);
    document.querySelector("#modal-synergy h2").innerText = `Tactics for ${p.name}`;
    const cont = document.getElementById("suggested-teams-container");
    cont.innerHTML = "";
    
    let t1 = characters.filter(c => c.id !== p.id && (c.continues === p.initiates || (p.skills.passive && c.continues === p.skills.passive.extra_initiates))).slice(0,3);
    t1.unshift(p);
    
    let html = `<div class="team-card"><h3>Synergy Link Alpha (Mechanic Based)</h3><div class="team-roster">`;
    t1.forEach(c => html += `<div class="mini-slot" style="${c.img ? `background-image: linear-gradient(to top, rgba(0,0,0,0.9), transparent), url('imagens/${c.img}');` : `background: var(--bg-dark);`}">${c.name}</div>`);
    html += `</div><button class="btn-primary" onclick="applyTeam('${t1.map(x=>x.id).join(',')}')">Deploy Squad</button></div>`;
    
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