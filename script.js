let squad = [null, null, null, null];
let activeOrigin = null; 
let activeId = null;
let currentTab = 'operators'; 
let currentWeaponModalId = null;

// ---------------- SOUND SYSTEM ---------------- //
let isAudioPlaying = false;

function playVoiceLine(audioFileName) {
    if (!audioFileName || isAudioPlaying) return;
    const audio = new Audio(`sound/${audioFileName}`);
    isAudioPlaying = true;
    audio.play().catch(err => {
        console.warn("Audio playback prevented by browser policy or missing file:", err);
        isAudioPlaying = false;
    });
    audio.onended = () => { isAudioPlaying = false; };
}

// ---------------- UTILITIES ---------------- //
function clamp(val, min, max) {
    let num = parseInt(val);
    if(isNaN(num)) return min;
    return Math.min(max, Math.max(min, num));
}

function formatStat(key, value) {
    const percentKeys = [
        'crit_rate', 'crit_dmg', 'phys_res', 'arts_res', 'heat_res', 'elec_res', 'cryo_res', 'nature_res', 
        'aether_res', 'treat_bonus', 'treat_rec_bonus', 'combo_cd_red', 'ult_gain_eff', 'stagger_eff', 
        'phys_dmg_bonus', 'heat_dmg_bonus', 'elec_dmg_bonus', 'cryo_dmg_bonus', 'nature_dmg_bonus', 
        'ult_dmg_bonus', 'basic_dmg_bonus', 'skill_dmg_bonus'
    ];
    if (percentKeys.includes(key)) {
        return Number((value * 100).toFixed(1)) + "%";
    }
    return Math.floor(value).toString();
}

function generateSkillOptions(currentVal) {
    let html = "";
    for(let i=1; i<=9; i++) html += `<option value="${i}" ${currentVal == i ? 'selected' : ''}>Rank ${i}</option>`;
    html += `<option value="10" ${currentVal == 10 ? 'selected' : ''}>Mastery 1</option>`;
    html += `<option value="11" ${currentVal == 11 ? 'selected' : ''}>Mastery 2</option>`;
    html += `<option value="12" ${currentVal == 12 ? 'selected' : ''}>Mastery 3</option>`;
    return html;
}

window.showToast = function(msg) {
    let container = document.getElementById("toast-container");
    if (!container) return;
    let toast = document.createElement("div");
    toast.className = "toast";
    toast.innerText = msg;
    container.appendChild(toast);
    setTimeout(() => { if (toast.parentElement) toast.remove(); }, 5000);
}

// ---------------- WEAPONS DATABASE (100% Expanded) ---------------- //
const weaponsDB = [
    { 
        id: "wpn_test_00", 
        name: "Empty Training Weapon (Any)", 
        type: "Any", 
        img: "wpn_empty.jpg", 
        base_atk: 0, 
        max_atk: 0, 
        effects_math: () => ({}), 
        effects_info: []
    },
    { 
        id: "wpn_glorious_memory", 
        name: "Glorious Memory", 
        type: "Sword", 
        img: "wpn_glorious.jpg", 
        base_atk: 50, 
        max_atk: 490,
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
    },
    {
        id: "wpn_flickers", 
        name: "Flickers in the Mist", 
        type: "Arts Unit", 
        img: "wpn_flickers.jpg", 
        base_atk: 50, 
        max_atk: 490, 
        effects_math: (e1, e2, e3) => ({}),
        effects_info: [
            { name: "Will Boost (L)", desc: (lv) => `Will +156` },
            { name: "Electric DMG Boost (M)", desc: (lv) => `Electric DMG Dealt +34.7%` },
            { name: "Efficacy: Overlapping Borders", desc: (lv) => `ATK +19.6%. When the wielder gains Electric Amp, the wielder also gains Electric DMG Dealt +15.4% for 30s. Max stacks for effects of the same name: 3. Duration of each stack is counted separately. This effect only triggers once every 0.1s.` }
        ]
    },
    {
        id: "wpn_delivery", 
        name: "Delivery Guaranteed", 
        type: "Arts Unit", 
        img: "wpn_delivery.jpg", 
        base_atk: 50, 
        max_atk: 500, 
        effects_math: (e1, e2, e3) => ({}),
        effects_info: [
            { name: "Will Boost (L)", desc: (lv) => `Will +156` },
            { name: "Ultimate Gain Efficiency Boost (L)", desc: (lv) => `Ultimate Gain Efficiency +46.4%` },
            { name: "Pursuit: Duty Fulfilled", desc: (lv) => `Nature DMG Dealt +44.8%. After the wielder's combo skill applies Lifted, the team gains Arts DMG Dealt +28.0% for 15s. For every enemy Lifted, the team gains bonus Arts DMG Dealt +5.6%, up to a max of 22.4%. Effects of the same name cannot stack.` }
        ]
    },
    {
        id: "wpn_artzy", 
        name: "Artzy Tyrannical", 
        type: "Handcannon", 
        img: "wpn_artzy.jpg", 
        base_atk: 50, 
        max_atk: 505, 
        effects_math: (e1, e2, e3) => ({}),
        effects_info: [
            { name: "Intellect Boost (L)", desc: (lv) => `Intellect +156` },
            { name: "Critical Rate Boost (L)", desc: (lv) => `Critical Rate +19.5%` },
            { name: "Fracture: Artzy Exaggeration", desc: (lv) => `Cryo DMG Dealt +44.8%. After the wielder scores a critical hit with a battle skill or combo skill, the wielder gains Cryo DMG Dealt +39.2% for 30s. Max stacks of the same name: 3. Duration of each stack is counted separately. Effect only triggers once every 0.1s.` }
        ]
    },
    {
        id: "wpn_dreams", 
        name: "Dreams of the Starry Beach", 
        type: "Arts Unit", 
        img: "wpn_dreams.jpg", 
        base_atk: 50, 
        max_atk: 495, 
        effects_math: (e1, e2, e3) => ({}),
        effects_info: [
            { name: "Intellect Boost (L)", desc: (lv) => `Intellect +156` },
            { name: "Treatment Efficiency Boost (L)", desc: (lv) => `Treatment Efficiency +46.4%` },
            { name: "Infliction: Tidal Murmurs", desc: (lv) => `Secondary Attribute +44.8%. After the wielder consumes Corrosion, target enemy suffers Arts DMG Taken +28.0% for 25s. Effects of the same name cannot stack.` }
        ]
    },
    {
        id: "wpn_sundered", 
        name: "Sundered Prince", 
        type: "Greatsword", 
        img: "wpn_sundered.jpg", 
        base_atk: 50, 
        max_atk: 490, 
        effects_math: (e1, e2, e3) => ({}),
        effects_info: [
            { name: "Strength Boost (L)", desc: (lv) => `Strength +156` },
            { name: "Critical Rate Boost (L)", desc: (lv) => `Critical Rate +19.5%` },
            { name: "Crusher: Princely Deterrence", desc: (lv) => `When the wielder performs a Final Strike on the enemy, ATK +28.0% for 8s. If the wielder is also the controlled operator, Final Strike deals Stagger +33.6% to the enemy. Effects of the same name cannot stack.` }
        ]
    },
    {
        id: "wpn_brigand", 
        name: "Brigand’s Calling", 
        type: "Handcannon", 
        img: "wpn_brigand.jpg", 
        base_atk: 50, 
        max_atk: 505, 
        effects_math: (e1, e2, e3) => ({}),
        effects_info: [
            { name: "Agility Boost (L)", desc: (lv) => `Agility +156` },
            { name: "Attack Boost (L)", desc: (lv) => `Attack +39.0%` },
            { name: "Detonate: Brigand's Bane", desc: (lv) => `Cryo DMG Dealt +44.8%. When the wielder applies Cryo Infliction via battle skills or ultimates, the wielder gains Cryo DMG Dealt +56.0% for 20s. When the wielder's battle skill or ultimate applies Arts Susceptibility, the target enemy suffers Arts DMG Taken +16.8% for 20s. The two effects apply separately and do not stack with themselves.` }
        ]
    },
    {
        id: "wpn_lupine", 
        name: "Lupine Scarlet", 
        type: "Sword", 
        img: "wpn_lupine.jpg", 
        base_atk: 50, 
        max_atk: 505, 
        effects_math: (e1, e2, e3) => ({}),
        effects_info: [
            { name: "Agility Boost (L)", desc: (lv) => `Agility +156` },
            { name: "Critical Rate Boost (L)", desc: (lv) => `Critical Rate +19.5%` },
            { name: "Fracture: Gnashing Wolves", desc: (lv) => `ATK +44.8%. After the wielder's skill deals Critical DMG, the wielder gains 1 stack of Wolven Blood that grants Physical and Heat DMG Dealth +2.8%. Wolven Blood can reach 16 stacks. After reaching 16 stacks, the wielder gains another Physical and Heat DMG Dealt +67.2% for 20s. After the duration ends, all Wolven Blood stacks are removed.` }
        ]
    },
    {
        id: "wpn_home", 
        name: "Home Longing", 
        type: "Handcannon", 
        img: "wpn_home.jpg", 
        base_atk: 50, 
        max_atk: 490, 
        effects_math: (e1, e2, e3) => ({}),
        effects_info: [
            { name: "Agility Boost (L)", desc: (lv) => `Agility +156` },
            { name: "Cryo DMG Boost (L)", desc: (lv) => `Cryo DMG Dealt +43.3%` },
            { name: "Suppression: Olden Moon", desc: (lv) => `ATK +19.6%. For 20s after the wielder casts a combo skill, the wielder's next battle skill gains Cryo and Nature DMG Dealt +22.4%. Max stacks for effects of the same name: 2. Duration of each stack is counted separately.` }
        ]
    },
    {
        id: "wpn_lone_barge", 
        name: "Lone Barge", 
        type: "Arts Unit", 
        img: "wpn_lone_barge.jpg", 
        base_atk: 50, 
        max_atk: 510, 
        effects_math: (e1, e2, e3) => ({}),
        effects_info: [
            { name: "Will Boost (L)", desc: (lv) => `Will +156` },
            { name: "Attack Boost (L)", desc: (lv) => `Attack +39.0%` },
            { name: "Suppression: Streaming Blitz", desc: (lv) => `Electric DMG Dealt +44.8%. When the wielder's battle skill consumes Arts Reactions, the wielder gains Battle Skill Electric DMG Dealt +56.0% for 20s. This effect can reach a max of 2 stacks and can only trigger once every 0.1s. Duration of each stack is counted separately. After the wielder casts an ultimate, the wielder gains Battle Skill Electric DMG Dealt +112.0% for 25s. This effect cannot stack.` }
        ]
    },
    {
        id: "wpn_forgeborn", 
        name: "Forgeborn Scathe", 
        type: "Sword", 
        img: "wpn_forgeborn.jpg", 
        base_atk: 50, 
        max_atk: 510, 
        effects_math: (e1, e2, e3) => ({}),
        effects_info: [
            { name: "Intellect Boost (L)", desc: (lv) => `Intellect +156` },
            { name: "Attack Boost (L)", desc: (lv) => `Attack +39.0%` },
            { name: "Twilight: Blazing Wail", desc: (lv) => `Heat DMG Dealt +44.8%. When the wielder casts an ultimate, the wielder gains Basic Attack DMG Dealt +210.0% for 20s. Effects of the same name cannot stack.` }
        ]
    },
    {
        id: "wpn_amaranthine", 
        name: "Amaranthine Tassel", 
        type: "Greatsword", 
        img: "wpn_amaranthine.jpg", 
        base_atk: 50, 
        max_atk: 510, 
        effects_math: (e1, e2, e3) => ({}),
        effects_info: [
            { name: "Strength Boost (L)", desc: (lv) => `Strength +156` },
            { name: "Attack Boost (L)", desc: (lv) => `Attack +39.0%` },
            { name: "Combative: Amaranthine Cleave", desc: (lv) => `Physical DMG Dealt +44.8%. When the wielder applies Physical Susceptibility, the wielder gains Arts Intensity +84 for 20s. When the wielder applies Crush, the wielder gains Physical DMG Dealt +(25.2% + (8.4% x Max number of Vulnerability stacks consumed from one enemy)) for 30s. The two effects apply separately and do not stack with themselves.` }
        ]
    },
    {
        id: "wpn_blessing", 
        name: "Blessing of Lustrous Carmine", 
        type: "Polearm", 
        img: "wpn_blessing.jpg", 
        base_atk: 50, 
        max_atk: 500, 
        effects_math: (e1, e2, e3) => ({}),
        effects_info: [
            { name: "Agility Boost (L)", desc: (lv) => `Agility +156` },
            { name: "Heat DMG Boost (L)", desc: (lv) => `Heat DMG Dealt +43.3%` },
            { name: "Flow: Absolver of Guilt", desc: (lv) => `Ultimate Gain Efficiency +50.4%. When the wielder's skill recovers SP, the entire team gains ATK +16.8% for 20s. When the wielder's skill applies Heat Infliction, the entire team gains Heat DMG Dealt +16.8% for 20s. The two effects apply separately and do not stack with themselves.` }
        ]
    },
    {
        id: "wpn_phantom", 
        name: "Phantom Pain", 
        type: "Greatsword", 
        img: "wpn_phantom.jpg", 
        base_atk: 50, 
        max_atk: 490, 
        effects_math: (e1, e2, e3) => ({}),
        effects_info: [
            { name: "Strength Boost (L)", desc: (lv) => `Strength +156` },
            { name: "Arts Intensity Boost (L)", desc: (lv) => `Arts Intensity +78` },
            { name: "Suppression: Layered Suffering", desc: (lv) => `Physical DMG Dealt +19.6%. When the wielder casts battle skills or combo skills, the wielder gains Physical DMG Dealt +15.4% for 20s. Max stacks for effects of the same name: 3. Duration of each stack is counted separately. Effect only triggers once every 0.1s.` }
        ]
    },
    {
        id: "wpn_beacon", 
        name: "Beacon of Duty", 
        type: "Polearm", 
        img: "wpn_beacon.jpg", 
        base_atk: 50, 
        max_atk: 485, 
        effects_math: (e1, e2, e3) => ({}),
        effects_info: [
            { name: "Agility Boost (L)", desc: (lv) => `Agility +156` },
            { name: "Ultimate Gain Efficiency Boost (L)", desc: (lv) => `Ultimate Gain Efficiency +46.4%` },
            { name: "Efficacy: Fuel for the Torch", desc: (lv) => `Heat DMG Dealt +19.6%. When the wielder's skill applies Heat Infliction, the wielder gains Physical and Heat DMG Dealt +22.4% for 20s. When the wielder's skill applies Heat Susceptibility, the entire team gains Physical and Heat DMG Dealt +11.2% for 30s. The two effects apply separately and do not stack with themselves.` }
        ]
    },
    {
        id: "wpn_white_night", 
        name: "White Night Nova", 
        type: "Sword", 
        img: "wpn_white_night.jpg", 
        base_atk: 50, 
        max_atk: 505, 
        effects_math: (e1, e2, e3) => ({}),
        effects_info: [
            { name: "Main Attribute Boost (L)", desc: (lv) => `Main Attribute +132` },
            { name: "Arts Intensity Boost (L)", desc: (lv) => `Arts Intensity +78` },
            { name: "Infliction: White Night Nova", desc: (lv) => `Arts DMG Dealt +33.6%. After the wielder applies Combustion or Electrification, the wielder gains Arts DMG Dealt +33.6% and Arts Intensity +70 for 15s. Effects of the same name cannot stack.` }
        ]
    },
    {
        id: "wpn_opus", 
        name: "Opus: Etch Figure", 
        type: "Arts Unit", 
        img: "wpn_opus.jpg", 
        base_atk: 50, 
        max_atk: 485, 
        effects_math: (e1, e2, e3) => ({}),
        effects_info: [
            { name: "Will Boost (L)", desc: (lv) => `Will +156` },
            { name: "Nature DMG Boost (L)", desc: (lv) => `Nature DMG Dealt+43.3%` },
            { name: "Suppression: Tillite Etchings", desc: (lv) => `ATK +19.6%. When the wielder's battle skill applies Nature Infliction, other operators in the team gain Arts DMG Dealt +14.0% for 15s. For every enemy suffering from Nature Infliction applied by the said battle skill, the team gains Arts DMG Dealt +5.6%, up to a max of 16.8%. Effects of the same name cannot stack.` }
        ]
    },
    {
        id: "wpn_detonation", 
        name: "Detonation Unit", 
        type: "Arts Unit", 
        img: "wpn_detonation.jpg", 
        base_atk: 50, 
        max_atk: 490, 
        effects_math: (e1, e2, e3) => ({}),
        effects_info: [
            { name: "Main Attribute Boost (L)", desc: (lv) => `Main Attribute +132` },
            { name: "Arts Intensity Boost (L)", desc: (lv) => `Arts Intensity +78` },
            { name: "Detonate: Imposing Champion", desc: (lv) => `Secondary Attribute +28.0%. When the wielder applies an Arts Burst, target enemy suffers Arts DMG Taken +25.2% for 15s. Effects of the same name cannot stack.` }
        ]
    },
    {
        id: "wpn_chivalric", 
        name: "Chivalric Virtues", 
        type: "Arts Unit", 
        img: "wpn_chivalric.jpg", 
        base_atk: 50, 
        max_atk: 485, 
        effects_math: (e1, e2, e3) => ({}),
        effects_info: [
            { name: "Will Boost (L)", desc: (lv) => `Will +156` },
            { name: "HP Boost (L)", desc: (lv) => `Max HP +78.0%` },
            { name: "Medicant: Blight Fervor", desc: (lv) => `Treatment Efficiency +28.0%. After the wielder gives HP treatment with their own skill, the entire team gains ATK +25.2% for 15s. Effects of the same name cannot stack.` }
        ]
    },
    {
        id: "wpn_wedge", 
        name: "Wedge", 
        type: "Handcannon", 
        img: "wpn_wedge.jpg", 
        base_atk: 50, 
        max_atk: 500, 
        effects_math: (e1, e2, e3) => ({}),
        effects_info: [
            { name: "Main Attribute Boost (L)", desc: (lv) => `Main Attribute +132` },
            { name: "Critical Rate Boost (L)", desc: (lv) => `Critical Rate +19.5%` },
            { name: "Infliction: Wedge of Civilization", desc: (lv) => `Arts DMG Dealt +33.6%. When the wielder casts a battle skill, the wielder gains Arts DMG Dealt +22.4% for 15s. When the wielder's battle skill applies an Arts Reaction, the wielder gains Arts DMG Dealt +44.8% for 15s. The two effects apply separately and do not stack with themselves.` }
        ]
    },
    {
        id: "wpn_valiant", 
        name: "Valiant", 
        type: "Polearm", 
        img: "wpn_valiant.jpg", 
        base_atk: 50, 
        max_atk: 495, 
        effects_math: (e1, e2, e3) => ({}),
        effects_info: [
            { name: "Agility Boost (L)", desc: (lv) => `Agility +156` },
            { name: "Physical DMG Boost (L)", desc: (lv) => `Physical DMG Dealt +43.3%` },
            { name: "Combative: Virtuous Gain", desc: (lv) => `ATK +28.0%. After the wielder applies a Physical Statuses, the wielder also deals another hit of Physical DMG equal to 336.0% of the wielder's ATK.` }
        ]
    },
    {
        id: "wpn_mountain", 
        name: "Mountain Bearer", 
        type: "Polearm", 
        img: "wpn_mountain.jpg", 
        base_atk: 50, 
        max_atk: 500, 
        effects_math: (e1, e2, e3) => ({}),
        effects_info: [
            { name: "Agility Boost (L)", desc: (lv) => `Agility +156` },
            { name: "Physical DMG Boost (L)", desc: (lv) => `Physical DMG Dealt +43.3%` },
            { name: "Efficacy: Weight of Mountain", desc: (lv) => `Against Vulnerable enemies, the wielder gains DMG Dealt +56.0%. When the wielder's battle skill applies Vulnerability, the wielder gains all attributes +22.4% for 15s. When the wielder's battle skill applies Physical Susceptibility, the wielder gains all attributes +22.4% for 15s. Max stacks of the same name: 2. Duration of each stack is counted separately. Effect only triggers once every 0.1s.` }
        ]
    },
    {
        id: "wpn_grand", 
        name: "Grand Vision", 
        type: "Sword", 
        img: "wpn_grand.jpg", 
        base_atk: 50, 
        max_atk: 500, 
        effects_math: (e1, e2, e3) => ({}),
        effects_info: [
            { name: "Agility Boost (L)", desc: (lv) => `Agility +156` },
            { name: "Attack Boost (L)", desc: (lv) => `Attack +39.0%` },
            { name: "Infliction: Long Time Wish", desc: (lv) => `Arts Intensity +84. When the wielder applies Originium Crystals or Solidification, during the next battle skill or ultimate cast within 20s, the wielder gains Physical DMG Dealt +100.8%. Effects of the same name cannot stack.` }
        ]
    },
    {
        id: "wpn_never", 
        name: "Never Rest", 
        type: "Sword", 
        img: "wpn_never.jpg", 
        base_atk: 50, 
        max_atk: 500, 
        effects_math: (e1, e2, e3) => ({}),
        effects_info: [
            { name: "Will Boost (L)", desc: (lv) => `Will +156` },
            { name: "Attack Boost (L)", desc: (lv) => `Attack +39.0%` },
            { name: "Flow: Reincarnation", desc: (lv) => `Physical DMG Dealt +44.8%. After the wielder's skill recovers SP, the wielder gains Physical DMG Dealt +14.0% while the other operators in the team gain Physical DMG Dealt +7.0% for 30s. Max stacks for effects of the same name: 5. Duration of each stack is counted separately. Effect only triggers once every 0.1s.` }
        ]
    },
    {
        id: "wpn_rapid", 
        name: "Rapid Ascent", 
        type: "Sword", 
        img: "wpn_rapid.jpg", 
        base_atk: 50, 
        max_atk: 495, 
        effects_math: (e1, e2, e3) => ({}),
        effects_info: [
            { name: "Main Attribute Boost (L)", desc: (lv) => `Main Attribute +132` },
            { name: "Critical Rate Boost (L)", desc: (lv) => `Critical Rate +19.5%` },
            { name: "Twilight: Azure Clouds", desc: (lv) => `Battle skills and ultimates gain Physical DMG Dealt +42.0%. Against Staggered enemies, battle skills and ultimates also gain DMG Dealt +98.0%.` }
        ]
    },
    {
        id: "wpn_eminent", 
        name: "Eminent Repute", 
        type: "Sword", 
        img: "wpn_eminent.jpg", 
        base_atk: 50, 
        max_atk: 490, 
        effects_math: (e1, e2, e3) => ({}),
        effects_info: [
            { name: "Main Attribute Boost (L)", desc: (lv) => `Main Attribute +132` },
            { name: "Physical DMG Boost (L)", desc: (lv) => `Physical DMG Dealt +43.3%` },
            { name: "Brutality: Disciplinarian", desc: (lv) => `ATK +28.0%. After the wielder consumes Vulnerable stack(s), ATK +(14.0% + 7.0% x Stacks Consumed) while other operators in the team gain half of this buff for 20s. Effects of the same name cannot stack.` }
        ]
    },
    {
        id: "wpn_clannibal", 
        name: "Clannibal", 
        type: "Handcannon", 
        img: "wpn_clannibal.jpg", 
        base_atk: 50, 
        max_atk: 490, 
        effects_math: (e1, e2, e3) => ({}),
        effects_info: [
            { name: "Main Attribute Boost (L)", desc: (lv) => `Main Attribute +132` },
            { name: "Arts Boost (L)", desc: (lv) => `Arts DMG Dealt +43.3%` },
            { name: "Infliction: Vicious Purge", desc: (lv) => `Arts DMG +33.6%. After the wielder consumes an Arts Reaction, target enemy suffers Arts DMG Taken +28.0% (for the specified element) for 15s. Effect only triggers once every 25s.` }
        ]
    },
    {
        id: "wpn_thunder", 
        name: "Thunderberge", 
        type: "Greatsword", 
        img: "wpn_thunder.jpg", 
        base_atk: 50, 
        max_atk: 495, 
        effects_math: (e1, e2, e3) => ({}),
        effects_info: [
            { name: "Strength Boost (L)", desc: (lv) => `Strength +156` },
            { name: "HP Boost (L)", desc: (lv) => `Max HP +78.0%` },
            { name: "Medicant: Eye of Talos", desc: (lv) => `Shield applied +67.2%. After the wielder's combo skill provides HP treatment, the controlled operator gains an additional (19.6% x Wielder's Max HP) Shield for 15s. Effect only triggers once every 15s.` }
        ]
    },
    {
        id: "wpn_finery", 
        name: "Former Finery", 
        type: "Greatsword", 
        img: "wpn_finery.jpg", 
        base_atk: 50, 
        max_atk: 495, 
        effects_math: (e1, e2, e3) => ({}),
        effects_info: [
            { name: "Will Boost (L)", desc: (lv) => `Will +156` },
            { name: "HP Boost (L)", desc: (lv) => `Max HP +78.0%` },
            { name: "Efficacy: Mincing Therapy", desc: (lv) => `Treatment Efficiency +28.0%. After a Protected operator takes DMG, the wielder restores the said operator's HP by (235 + Will x 1.96). Effect only triggers once every 15s.` }
        ]
    },
    {
        id: "wpn_khravengger", 
        name: "Khravengger", 
        type: "Greatsword", 
        img: "wpn_khravengger.jpg", 
        base_atk: 50, 
        max_atk: 505, 
        effects_math: (e1, e2, e3) => ({}),
        effects_info: [
            { name: "Strength Boost (L)", desc: (lv) => `Strength +156` },
            { name: "Attack Boost (L)", desc: (lv) => `Attack +39.0%` },
            { name: "Detonate: Bonechilling", desc: (lv) => `Skill DMG Dealt +56.0% (for every skill). When the wielder's battle skill applies Cryo Infliction, the wielder gains Cryo DMG Dealt +28.0% for 15s. When the wielder deals combo skill DMG to an enemy with Cryo Infliction, the wielder gains Cryo DMG Dealt +56.0% for 15s.` }
        ]
    },
    {
        id: "wpn_exemplar", 
        name: "Exemplar", 
        type: "Greatsword", 
        img: "wpn_exemplar.jpg", 
        base_atk: 50, 
        max_atk: 500, 
        effects_math: (e1, e2, e3) => ({}),
        effects_info: [
            { name: "Main Attribute Boost (L)", desc: (lv) => `Main Attribute +132` },
            { name: "Attack Boost (L)", desc: (lv) => `Attack +39.0%` },
            { name: "Suppression: Stacked Hew", desc: (lv) => `Physical DMG Dealt +28.0%. When the wielder's battle skill hits an enemy, the wielder gains Physical DMG Dealt +28.0% for 30s. Max stacks for the same name: 3. Duration of each stack is counted separately. Effect only triggers once every 0.1s.` }
        ]
    },
    {
        id: "wpn_umbral", 
        name: "Umbral Torch", 
        type: "Sword", 
        img: "wpn_umbral.jpg", 
        base_atk: 50, 
        max_atk: 490, 
        effects_math: (e1, e2, e3) => ({}),
        effects_info: [
            { name: "Intellect Boost (L)", desc: (lv) => `Intellect +156` },
            { name: "Heat DMG Boost (L)", desc: (lv) => `Heat DMG Dealt +43.3%` },
            { name: "Infliction: Covetous Buildup", desc: (lv) => `ATK +19.6%. Whenever Combustion or Corrosion is applied to an enemy, the wielder gains Heat DMG Dealt and Nature DMG Dealt +22.4%. Max stacks for effects with the same name: 3.` }
        ]
    },
    {
        id: "wpn_jet", 
        name: "JET", 
        type: "Polearm", 
        img: "wpn_jet.jpg", 
        base_atk: 50, 
        max_atk: 500, 
        effects_math: (e1, e2, e3) => ({}),
        effects_info: [
            { name: "Main Attribute Boost (L)", desc: (lv) => `Main Attribute +132` },
            { name: "Attack Boost (L)", desc: (lv) => `Attack +39.0%` },
            { name: "Suppression: Astrophysics", desc: (lv) => `Arts DMG Dealt +33.6%. When the wielder casts a battle skill, the wielder gains Arts DMG Dealt +33.6% for 15s. When the wielder casts a combo skill, Arts DMG Dealt +33.6% for 15s. The two effects apply separately and do not stack with themselves.` }
        ]
    },
    {
        id: "wpn_thermite", 
        name: "Thermite Cutter", 
        type: "Sword", 
        img: "wpn_thermite.jpg", 
        base_atk: 50, 
        max_atk: 490, 
        effects_math: (e1, e2, e3) => ({}),
        effects_info: [
            { name: "Will Boost (L)", desc: (lv) => `Will +156` },
            { name: "Attack Boost (L)", desc: (lv) => `Attack +39.0%` },
            { name: "Flow: Thermal Release", desc: (lv) => `ATK+28.0%. After the wielder's skill recovers SP or grants a Link state, the entire team gains ATK +14.0% for 20s. Max stacks for effects of the same name: 2. Duration of each stack is counted separately.` }
        ]
    },
    {
        id: "wpn_oblivion", 
        name: "Oblivion", 
        type: "Arts Unit", 
        img: "wpn_oblivion.jpg", 
        base_atk: 50, 
        max_atk: 495, 
        effects_math: (e1, e2, e3) => ({}),
        effects_info: [
            { name: "Intellect Boost (L)", desc: (lv) => `Intellect +156` },
            { name: "Arts Boost (L)", desc: (lv) => `Arts DMG Dealt +43.3%` },
            { name: "Twilight: Humiliation", desc: (lv) => `Critical Rate +14.0%. When the wielder casts an ultimate, the wielder gains Arts DMG Dealt +67.2% for 15s. When the wielder casts a combo skill, the wielder gains Arts DMG Dealt +33.6% for 15s. The two effects apply separately and do not stack with themselves.` }
        ]
    },
    {
        id: "wpn_navigator", 
        name: "Navigator", 
        type: "Handcannon", 
        img: "wpn_navigator.jpg", 
        base_atk: 50, 
        max_atk: 490, 
        effects_math: (e1, e2, e3) => ({}),
        effects_info: [
            { name: "Intellect Boost (L)", desc: (lv) => `Intellect +156` },
            { name: "Cryo DMG Boost (L)", desc: (lv) => `Cryo DMG Dealt +43.3%` },
            { name: "Infliction: Lone and Distant Sail", desc: (lv) => `Critical Rate +9.8%. When Solidification or Corrosion is applied to enemies, the wielder gains Cryo DMG Dealt and Nature DMG Dealt +9.8%, and Critical Rate +5.6% for 15s. If this effect is triggered by the wielder, double the increase gained. Effects of the same name cannot stack. Effect only triggers once every 20s.` }
        ]
    }
];

// ---------------- EQUIPMENT DATABASE ---------------- //
const equipmentDB = [
    { id: "none", name: "No Equipment", type: "Any", set: "None", stats: {}, level: 1, img: "" },
    // KITS
    { id: "eq_mi_push_knife", name: "MI Security Push Knife", type: "Kit", set: "MI Security", rarity: "Gold", level: 70, stats: { defense: 21, intellect: 21, will: 32, heat_dmg_bonus: 0.23, nature_dmg_bonus: 0.23 }, img: "mi_kit.jpg" },
    { id: "eq_mi_push_knife_t1", name: "MI Security Push Knife T1", type: "Kit", set: "MI Security", rarity: "Gold", level: 70, stats: { defense: 21, agility: 21, will: 32, skill_dmg_bonus: 0.414 }, img: "mi_kit.jpg" },
    { id: "eq_mi_toolkit", name: "MI Security Toolkit", type: "Kit", set: "MI Security", rarity: "Gold", level: 70, stats: { defense: 21, agility: 21, intellect: 32, crit_rate: 0.104 }, img: "mi_kit.jpg" },
    { id: "eq_mi_scope_t1", name: "MI Security Scope T1", type: "Kit", set: "MI Security", rarity: "Gold", level: 70, stats: { defense: 21, agility: 32, intellect: 21, crit_rate: 0.104 }, img: "mi_kit.jpg" },
    { id: "eq_mi_scope", name: "MI Security Scope", type: "Kit", set: "MI Security", rarity: "Gold", level: 70, stats: { defense: 21, strength: 21, agility: 32, skill_dmg_bonus: 0.414 }, img: "mi_kit.jpg" },
    { id: "eq_mi_armband", name: "MI Security Armband", type: "Kit", set: "MI Security", rarity: "Gold", level: 70, stats: { defense: 21, strength: 32, will: 21, cryo_dmg_bonus: 0.23, elec_dmg_bonus: 0.23 }, img: "mi_kit.jpg" },
    // GLOVES
    { id: "eq_mi_hands_ppe_t1", name: "MI Security Hands PPE T1", type: "Gloves", set: "MI Security", rarity: "Gold", level: 70, stats: { defense: 42, intellect: 65, will: 43, crit_rate: 0.086 }, img: "mi_gloves.jpg" },
    { id: "eq_mi_hands_ppe", name: "MI Security Hands PPE", type: "Gloves", set: "MI Security", rarity: "Gold", level: 70, stats: { defense: 42, agility: 43, intellect: 65, basic_dmg_bonus: 0.23 }, img: "mi_gloves.jpg" },
    { id: "eq_mi_gloves_t1", name: "MI Security Gloves T1", type: "Gloves", set: "MI Security", rarity: "Gold", level: 70, stats: { defense: 42, agility: 65, intellect: 43, ult_dmg_bonus: 0.431 }, img: "mi_gloves.jpg" },
    { id: "eq_mi_gloves", name: "MI Security Gloves", type: "Gloves", set: "MI Security", rarity: "Gold", level: 70, stats: { defense: 42, strength: 43, agility: 65, skill_dmg_bonus: 0.345 }, img: "mi_gloves.jpg" },
    // ARMOR
    { id: "eq_mi_overalls_t1", name: "MI Security Overalls T1", type: "Armor", set: "MI Security", rarity: "Gold", level: 70, stats: { defense: 56, intellect: 87, will: 58, crit_rate: 0.052 }, img: "mi_armor.jpg" },
    { id: "eq_mi_overalls_t2", name: "MI Security Overalls T2", type: "Armor", set: "MI Security", rarity: "Gold", level: 70, stats: { defense: 56, agility: 58, will: 87, skill_dmg_bonus: 0.207 }, img: "mi_armor.jpg" },
    { id: "eq_mi_overalls", name: "MI Security Overalls", type: "Armor", set: "MI Security", rarity: "Gold", level: 70, stats: { defense: 56, agility: 58, intellect: 87, basic_dmg_bonus: 0.138 }, img: "mi_armor.jpg" },
    { id: "eq_mi_armor", name: "MI Security Armor", type: "Armor", set: "MI Security", rarity: "Gold", level: 70, stats: { defense: 56, strength: 58, agility: 87, arts_intensity: 20 }, img: "mi_armor.jpg" },
    { id: "eq_mi_armor_t1", name: "MI Security Armor T1", type: "Armor", set: "MI Security", rarity: "Gold", level: 70, stats: { defense: 56, agility: 87, intellect: 58, ult_gain_eff: 0.123 }, img: "mi_armor.jpg" }
];

const equipmentSetsDB = {
    "MI Security": {
        req: 3,
        desc: "Wearer's Critical Rate +5%. After the wearer scores a critical hit, the wearer gains ATK +5% for 5s. This effect can reach 5 stacks. At max stacks, grant an additional Critical Rate +5%. This effect cannot stack.",
        mult: { crit_rate: 0.10, atk_percent: 0.25 }
    }
};

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
    { key: "basic_dmg_bonus", name: "Basic Attack DMG Bonus" }, { key: "skill_dmg_bonus", name: "Skill DMG Bonus" },
    { key: "ult_dmg_bonus", name: "Ultimate DMG Bonus" }
];

const universalBaseStatsTemplate = {
    crit_rate: 0.05, crit_dmg: 0.50, arts_intensity: 0, phys_res: 0, arts_res: 0, heat_res: 0, elec_res: 0, 
    cryo_res: 0, nature_res: 0, aether_res: 0, treat_bonus: 0, treat_rec_bonus: 0, combo_cd_red: 0, 
    ult_gain_eff: 1.0, stagger_eff: 0, phys_dmg_bonus: 0, heat_dmg_bonus: 0, elec_dmg_bonus: 0, 
    cryo_dmg_bonus: 0, nature_dmg_bonus: 0, basic_dmg_bonus: 0, skill_dmg_bonus: 0, ult_dmg_bonus: 0
};

// ---------------- CHARACTER DATABASE ---------------- //
const characters = [
    { id: "022", name: "Rossi", class: "Guard", element: "Physical", img: "rossi.jpg", attr_prim: "agility", attr_sec: "intellect", audio: "rossi.mp3", breakpoints: { 1: { hp: 500, attack: 30, strength: 9, agility: 23, intellect: 14, will: 9 }, 70: { hp: 4372, attack: 258, strength: 78, agility: 142, intellect: 94, will: 71 }, 90: { hp: 5495, attack: 323, strength: 97, agility: 176, intellect: 118, will: 89 } }, initiates: "Armor Break", continues: "Airborne", skills: { basic: { name: "Seething Wolfblood", desc: "BASIC ATTACK: An attack with up to 5 sequences that deals Physical DMG. As the controlled operator, Final Strike also deals 1 Stagger. DIVE ATTACK: Basic attack performed in mid-air becomes a dive attack that deals Physical DMG to nearby enemies. FINISHER: Basic attack performed near a Staggered enemy becomes a finisher attack that deals massive Physical DMG and recovers some SP." }, active: { name: "Crimson Shadow", desc: "Cost: 100. Charges to the target to deal Physical DMG and apply Lift. If the target already has Vulnerability stack(s), the skill also unleashes a Wolven Ambrage that charges at the target to deal Heat DMG." }, ult: { name: "\"Razorclaw\" Ambuscade", desc: "Cost: 110, CD: 10s. Rossi flutters her cape and unleashes a flurry of stabs that quickly deals multiple sequences of Heat DMG to the target. She then performs a two-sequence slash attack with her dagger that deals massive Heat DMG and applies Heat Infliction. When this skill successfully scores a critical hit, it deals higher Critical DMG." }, combo: { name: "Moment of Blazing Shadow", desc: "COMBO TRIGGER: When an enemy has both Vulnerability and Arts Infliction stacks. Rossi's combo skill has 2 consecutive sequences. COMBO SEQUENCE 1 deals Physical DMG to the target. COMBO SEQUENCE 2 consumes all Arts Infliction stacks from the target, deals Physical DMG based on the number of Arts Infliction stacks consumed, applies 1 instance of Lift, and buffs Rossi's Critical Rate and Critical DMG Dealt at the same time. If COMBO SEQUENCE 2 is cast with perfect timing, it applies 1 more stack of Vulnerability." } }, talents_data: { t1: { name: "Nicks and Scratches", lv1: "Battle skill improved: After Wolven Ambrage deals DMG, Rossi applies Razor Clawmark to the target for 15s. This effect cannot stack. For the duration of Razor Clawmark, the target takes 25% ATK (Rossi's) of Physical DMG per second and suffers Physical DMG Taken and Heat DMG Taken +6%.", lv2: "Battle skill improved: After Wolven Ambrage deals DMG, Rossi applies Razor Clawmark to the target for 25s. This effect cannot stack. For the duration of Razor Clawmark, the target takes 30% ATK (Rossi's) of Physical DMG per second and suffers Physical DMG Taken and Heat DMG Taken +12%." }, t2: { name: "Seething Blood", lv1: "When Rossi's skill deals Critical DMG to a Razor Clawmarked enemy, trigger another hit that deals 12% ATK (Rossi's) of Heat DMG and restores [Intellect × 0.04] HP to Rossi. If the target is also Combusted, then the aforementioned DMG and HP Restoration effects are increased to 1.5 times.", lv2: "When Rossi's skill deals Critical DMG to a Razor Clawmarked enemy, trigger another hit that deals 24% ATK (Rossi's) of Heat DMG and restores [Intellect × 0.08] HP to Rossi. If the target is also Combusted, then the aforementioned DMG and HP Restoration effects are increased to 1.5 times." } }, affinity_bonus: [0, 10, 25, 40, 60], getPotentialStats: (potLevel) => { let b = { agility: 0, crit_rate: 0, crit_dmg: 0 }; if(potLevel >= 2) { b.agility += 20; b.crit_rate += 0.07; } if(potLevel >= 5) { b.crit_dmg += 0.30; } return b; }, pot_desc: ["Pot 1 (Origin of Admiration): Crimson Shadow & Moment of Blazing Shadow Multipliers x1.15. Wolven Ambrage returns 10 SP.", "Pot 2 (Gap to Perfection): Agility +20, Critical Rate +7%.", "Pot 3 (Tangible Duties): Talent Seething Blood improved: Base DMG Multiplier +8%, restores HP +[Intellect × 0.04].", "Pot 4 (Innocent Wish): Ultimate Energy cost -15%.", "Pot 5 (Legendary Destination): Ultimate DMG x1.1, Critical DMG Dealt +30%."] },
    { id: "012", name: "Endministrator", class: "Striker", element: "Physical", img: "endmin.jpg", audio: "endmin.mp3", attr_prim: "will", attr_sec: "strength", initiates: "Airborne", continues: "Armor Break", breakpoints: { 1: { hp: 0, attack: 0, strength: 0, agility: 0, intellect: 0, will: 0 }, 90: { hp: 0, attack: 0, strength: 0, agility: 0, intellect: 0, will: 0 } }, skills: { basic: { name: "Basic Attack", desc: "Generic Basic Attack sequence." }, active: { name: "Active Skill", desc: "Generic Active Skill." }, ult: { name: "Ultimate Skill", desc: "Generic Ultimate Skill." }, combo: { name: "Combo Skill", desc: "Generic Combo Skill." } }, talents_data: { t1: { name: "Talent 1", lv1: "Lv.1 Data missing", lv2: "Lv.2 Data missing" }, t2: { name: "Talent 2", lv1: "Lv.1 Data missing", lv2: "Lv.2 Data missing" } }, affinity_bonus: [0, 0, 0, 0, 0], getPotentialStats: () => ({}), pot_desc: [] },
    { id: "020", name: "Perlica", class: "Caster", element: "Arts", img: "perlica.jpg", audio: "perlica.mp3", attr_prim: "intellect", attr_sec: "will", initiates: "Arts Vulnerability", continues: "Slow", breakpoints: { 1: { hp: 0, attack: 0, strength: 0, agility: 0, intellect: 0, will: 0 }, 90: { hp: 0, attack: 0, strength: 0, agility: 0, intellect: 0, will: 0 } }, skills: { basic: { name: "Basic Attack", desc: "Generic Basic Attack sequence." }, active: { name: "Active Skill", desc: "Generic Active Skill." }, ult: { name: "Ultimate Skill", desc: "Generic Ultimate Skill." }, combo: { name: "Combo Skill", desc: "Generic Combo Skill." } }, talents_data: { t1: { name: "Talent 1", lv1: "Lv.1 Data missing", lv2: "Lv.2 Data missing" }, t2: { name: "Talent 2", lv1: "Lv.1 Data missing", lv2: "Lv.2 Data missing" } }, affinity_bonus: [0, 0, 0, 0, 0], getPotentialStats: () => ({}), pot_desc: [] },
    { id: "001", name: "Akekuri", class: "Vanguard", element: "Physical", img: "akekuri.jpg", audio: "akekuri.mp3", attr_prim: "agility", attr_sec: "will", initiates: "Stun", continues: "Armor Break", breakpoints: { 1: { hp: 0, attack: 0, strength: 0, agility: 0, intellect: 0, will: 0 }, 90: { hp: 0, attack: 0, strength: 0, agility: 0, intellect: 0, will: 0 } }, skills: { basic: { name: "Basic Attack", desc: "Generic Basic Attack sequence." }, active: { name: "Active Skill", desc: "Generic Active Skill." }, ult: { name: "Ultimate Skill", desc: "Generic Ultimate Skill." }, combo: { name: "Combo Skill", desc: "Generic Combo Skill." } }, talents_data: { t1: { name: "Talent 1", lv1: "Lv.1 Data missing", lv2: "Lv.2 Data missing" }, t2: { name: "Talent 2", lv1: "Lv.1 Data missing", lv2: "Lv.2 Data missing" } }, affinity_bonus: [0, 0, 0, 0, 0], getPotentialStats: () => ({}), pot_desc: [] },
    { id: "002", name: "Alesh", class: "Striker", element: "Physical", img: "alesh.jpg", audio: "alesh.mp3", attr_prim: "agility", attr_sec: "intellect", initiates: "Armor Break", continues: "Slow", breakpoints: { 1: { hp: 0, attack: 0, strength: 0, agility: 0, intellect: 0, will: 0 }, 90: { hp: 0, attack: 0, strength: 0, agility: 0, intellect: 0, will: 0 } }, skills: { basic: { name: "Basic Attack", desc: "Generic Basic Attack sequence." }, active: { name: "Active Skill", desc: "Generic Active Skill." }, ult: { name: "Ultimate Skill", desc: "Generic Ultimate Skill." }, combo: { name: "Combo Skill", desc: "Generic Combo Skill." } }, talents_data: { t1: { name: "Talent 1", lv1: "Lv.1 Data missing", lv2: "Lv.2 Data missing" }, t2: { name: "Talent 2", lv1: "Lv.1 Data missing", lv2: "Lv.2 Data missing" } }, affinity_bonus: [0, 0, 0, 0, 0], getPotentialStats: () => ({}), pot_desc: [] },
    { id: "003", name: "Antal", class: "Supporter", element: "Nature", img: "antal.jpg", audio: "antal.mp3", attr_prim: "will", attr_sec: "intellect", initiates: "Nature's Bind", continues: "Knockdown", breakpoints: { 1: { hp: 0, attack: 0, strength: 0, agility: 0, intellect: 0, will: 0 }, 90: { hp: 0, attack: 0, strength: 0, agility: 0, intellect: 0, will: 0 } }, skills: { basic: { name: "Basic Attack", desc: "Generic Basic Attack sequence." }, active: { name: "Active Skill", desc: "Generic Active Skill." }, ult: { name: "Ultimate Skill", desc: "Generic Ultimate Skill." }, combo: { name: "Combo Skill", desc: "Generic Combo Skill." } }, talents_data: { t1: { name: "Talent 1", lv1: "Lv.1 Data missing", lv2: "Lv.2 Data missing" }, t2: { name: "Talent 2", lv1: "Lv.1 Data missing", lv2: "Lv.2 Data missing" } }, affinity_bonus: [0, 0, 0, 0, 0], getPotentialStats: () => ({}), pot_desc: [] },
    { id: "004", name: "Arclight", class: "Caster", element: "Electric", img: "arclight.jpg", audio: "arclight.mp3", attr_prim: "intellect", attr_sec: "agility", initiates: "Paralysis", continues: "Stagger", breakpoints: { 1: { hp: 0, attack: 0, strength: 0, agility: 0, intellect: 0, will: 0 }, 90: { hp: 0, attack: 0, strength: 0, agility: 0, intellect: 0, will: 0 } }, skills: { basic: { name: "Basic Attack", desc: "Generic Basic Attack sequence." }, active: { name: "Active Skill", desc: "Generic Active Skill." }, ult: { name: "Ultimate Skill", desc: "Generic Ultimate Skill." }, combo: { name: "Combo Skill", desc: "Generic Combo Skill." } }, talents_data: { t1: { name: "Talent 1", lv1: "Lv.1 Data missing", lv2: "Lv.2 Data missing" }, t2: { name: "Talent 2", lv1: "Lv.1 Data missing", lv2: "Lv.2 Data missing" } }, affinity_bonus: [0, 0, 0, 0, 0], getPotentialStats: () => ({}), pot_desc: [] },
    { id: "005", name: "Ardelia", class: "Supporter", element: "Nature", img: "ardelia.jpg", audio: "ardelia.mp3", attr_prim: "will", attr_sec: "intellect", initiates: "Slow", continues: "Nature's Bind", breakpoints: { 1: { hp: 0, attack: 0, strength: 0, agility: 0, intellect: 0, will: 0 }, 90: { hp: 0, attack: 0, strength: 0, agility: 0, intellect: 0, will: 0 } }, skills: { basic: { name: "Basic Attack", desc: "Generic Basic Attack sequence." }, active: { name: "Active Skill", desc: "Generic Active Skill." }, ult: { name: "Ultimate Skill", desc: "Generic Ultimate Skill." }, combo: { name: "Combo Skill", desc: "Generic Combo Skill." } }, talents_data: { t1: { name: "Talent 1", lv1: "Lv.1 Data missing", lv2: "Lv.2 Data missing" }, t2: { name: "Talent 2", lv1: "Lv.1 Data missing", lv2: "Lv.2 Data missing" } }, affinity_bonus: [0, 0, 0, 0, 0], getPotentialStats: () => ({}), pot_desc: [] },
    { id: "006", name: "Avywenna", class: "Guard", element: "Physical", img: "avywenna.jpg", audio: "avywenna.mp3", attr_prim: "agility", attr_sec: "strength", initiates: "Armor Break", continues: "Stagger", breakpoints: { 1: { hp: 0, attack: 0, strength: 0, agility: 0, intellect: 0, will: 0 }, 90: { hp: 0, attack: 0, strength: 0, agility: 0, intellect: 0, will: 0 } }, skills: { basic: { name: "Basic Attack", desc: "Generic Basic Attack sequence." }, active: { name: "Active Skill", desc: "Generic Active Skill." }, ult: { name: "Ultimate Skill", desc: "Generic Ultimate Skill." }, combo: { name: "Combo Skill", desc: "Generic Combo Skill." } }, talents_data: { t1: { name: "Talent 1", lv1: "Lv.1 Data missing", lv2: "Lv.2 Data missing" }, t2: { name: "Talent 2", lv1: "Lv.1 Data missing", lv2: "Lv.2 Data missing" } }, affinity_bonus: [0, 0, 0, 0, 0], getPotentialStats: () => ({}), pot_desc: [] },
    { id: "007", name: "Camille", class: "Caster", element: "Heat", img: "camille.jpg", audio: "camille.mp3", attr_prim: "intellect", attr_sec: "will", initiates: "Burn", continues: "Stun", breakpoints: { 1: { hp: 0, attack: 0, strength: 0, agility: 0, intellect: 0, will: 0 }, 90: { hp: 0, attack: 0, strength: 0, agility: 0, intellect: 0, will: 0 } }, skills: { basic: { name: "Basic Attack", desc: "Generic Basic Attack sequence." }, active: { name: "Active Skill", desc: "Generic Active Skill." }, ult: { name: "Ultimate Skill", desc: "Generic Ultimate Skill." }, combo: { name: "Combo Skill", desc: "Generic Combo Skill." } }, talents_data: { t1: { name: "Talent 1", lv1: "Lv.1 Data missing", lv2: "Lv.2 Data missing" }, t2: { name: "Talent 2", lv1: "Lv.1 Data missing", lv2: "Lv.2 Data missing" } }, affinity_bonus: [0, 0, 0, 0, 0], getPotentialStats: () => ({}), pot_desc: [] },
    { id: "008", name: "Catcher", class: "Defender", element: "Physical", img: "catcher.jpg", audio: "catcher.mp3", attr_prim: "strength", attr_sec: "will", initiates: "Taunt", continues: "Paralysis", breakpoints: { 1: { hp: 0, attack: 0, strength: 0, agility: 0, intellect: 0, will: 0 }, 90: { hp: 0, attack: 0, strength: 0, agility: 0, intellect: 0, will: 0 } }, skills: { basic: { name: "Basic Attack", desc: "Generic Basic Attack sequence." }, active: { name: "Active Skill", desc: "Generic Active Skill." }, ult: { name: "Ultimate Skill", desc: "Generic Ultimate Skill." }, combo: { name: "Combo Skill", desc: "Generic Combo Skill." } }, talents_data: { t1: { name: "Talent 1", lv1: "Lv.1 Data missing", lv2: "Lv.2 Data missing" }, t2: { name: "Talent 2", lv1: "Lv.1 Data missing", lv2: "Lv.2 Data missing" } }, affinity_bonus: [0, 0, 0, 0, 0], getPotentialStats: () => ({}), pot_desc: [] },
    { id: "009", name: "Chen Qianyu", class: "Guard", element: "Physical", img: "chen.jpg", audio: "chen.mp3", attr_prim: "strength", attr_sec: "will", initiates: "Knockdown", continues: "Stagger", breakpoints: { 1: { hp: 0, attack: 0, strength: 0, agility: 0, intellect: 0, will: 0 }, 90: { hp: 0, attack: 0, strength: 0, agility: 0, intellect: 0, will: 0 } }, skills: { basic: { name: "Basic Attack", desc: "Generic Basic Attack sequence." }, active: { name: "Active Skill", desc: "Generic Active Skill." }, ult: { name: "Ultimate Skill", desc: "Generic Ultimate Skill." }, combo: { name: "Combo Skill", desc: "Generic Combo Skill." } }, talents_data: { t1: { name: "Talent 1", lv1: "Lv.1 Data missing", lv2: "Lv.2 Data missing" }, t2: { name: "Talent 2", lv1: "Lv.1 Data missing", lv2: "Lv.2 Data missing" } }, affinity_bonus: [0, 0, 0, 0, 0], getPotentialStats: () => ({}), pot_desc: [] },
    { id: "010", name: "Da Pan", class: "Defender", element: "Physical", img: "dapan.jpg", audio: "dapan.mp3", attr_prim: "strength", attr_sec: "will", initiates: "Knockdown", continues: "Airborne", breakpoints: { 1: { hp: 0, attack: 0, strength: 0, agility: 0, intellect: 0, will: 0 }, 90: { hp: 0, attack: 0, strength: 0, agility: 0, intellect: 0, will: 0 } }, skills: { basic: { name: "Basic Attack", desc: "Generic Basic Attack sequence." }, active: { name: "Active Skill", desc: "Generic Active Skill." }, ult: { name: "Ultimate Skill", desc: "Generic Ultimate Skill." }, combo: { name: "Combo Skill", desc: "Generic Combo Skill." } }, talents_data: { t1: { name: "Talent 1", lv1: "Lv.1 Data missing", lv2: "Lv.2 Data missing" }, t2: { name: "Talent 2", lv1: "Lv.1 Data missing", lv2: "Lv.2 Data missing" } }, affinity_bonus: [0, 0, 0, 0, 0], getPotentialStats: () => ({}), pot_desc: [] },
    { id: "011", name: "Ember", class: "Caster", element: "Heat", img: "ember.jpg", audio: "ember.mp3", attr_prim: "intellect", attr_sec: "agility", initiates: "Burn", continues: "Armor Break", breakpoints: { 1: { hp: 0, attack: 0, strength: 0, agility: 0, intellect: 0, will: 0 }, 90: { hp: 0, attack: 0, strength: 0, agility: 0, intellect: 0, will: 0 } }, skills: { basic: { name: "Basic Attack", desc: "Generic Basic Attack sequence." }, active: { name: "Active Skill", desc: "Generic Active Skill." }, ult: { name: "Ultimate Skill", desc: "Generic Ultimate Skill." }, combo: { name: "Combo Skill", desc: "Generic Combo Skill." } }, talents_data: { t1: { name: "Talent 1", lv1: "Lv.1 Data missing", lv2: "Lv.2 Data missing" }, t2: { name: "Talent 2", lv1: "Lv.1 Data missing", lv2: "Lv.2 Data missing" } }, affinity_bonus: [0, 0, 0, 0, 0], getPotentialStats: () => ({}), pot_desc: [] },
    { id: "013", name: "Estella", class: "Guard", element: "Physical", img: "estella.jpg", audio: "estella.mp3", attr_prim: "agility", attr_sec: "strength", initiates: "Stagger", continues: "Knockdown", breakpoints: { 1: { hp: 0, attack: 0, strength: 0, agility: 0, intellect: 0, will: 0 }, 90: { hp: 0, attack: 0, strength: 0, agility: 0, intellect: 0, will: 0 } }, skills: { basic: { name: "Basic Attack", desc: "Generic Basic Attack sequence." }, active: { name: "Active Skill", desc: "Generic Active Skill." }, ult: { name: "Ultimate Skill", desc: "Generic Ultimate Skill." }, combo: { name: "Combo Skill", desc: "Generic Combo Skill." } }, talents_data: { t1: { name: "Talent 1", lv1: "Lv.1 Data missing", lv2: "Lv.2 Data missing" }, t2: { name: "Talent 2", lv1: "Lv.1 Data missing", lv2: "Lv.2 Data missing" } }, affinity_bonus: [0, 0, 0, 0, 0], getPotentialStats: () => ({}), pot_desc: [] },
    { id: "014", name: "Fluorite", class: "Supporter", element: "Arts", img: "fluorite.jpg", audio: "fluorite.mp3", attr_prim: "will", attr_sec: "intellect", initiates: "Crystalize", continues: "Arts Vulnerability", breakpoints: { 1: { hp: 0, attack: 0, strength: 0, agility: 0, intellect: 0, will: 0 }, 90: { hp: 0, attack: 0, strength: 0, agility: 0, intellect: 0, will: 0 } }, skills: { basic: { name: "Basic Attack", desc: "Generic Basic Attack sequence." }, active: { name: "Active Skill", desc: "Generic Active Skill." }, ult: { name: "Ultimate Skill", desc: "Generic Ultimate Skill." }, combo: { name: "Combo Skill", desc: "Generic Combo Skill." } }, talents_data: { t1: { name: "Talent 1", lv1: "Lv.1 Data missing", lv2: "Lv.2 Data missing" }, t2: { name: "Talent 2", lv1: "Lv.1 Data missing", lv2: "Lv.2 Data missing" } }, affinity_bonus: [0, 0, 0, 0, 0], getPotentialStats: () => ({}), pot_desc: [] },
    { id: "015", name: "Gilberta", class: "Supporter", element: "Nature", img: "gilberta.jpg", audio: "gilberta.mp3", attr_prim: "intellect", attr_sec: "will", initiates: "Slow", continues: "Airborne", breakpoints: { 1: { hp: 0, attack: 0, strength: 0, agility: 0, intellect: 0, will: 0 }, 90: { hp: 0, attack: 0, strength: 0, agility: 0, intellect: 0, will: 0 } }, skills: { basic: { name: "Basic Attack", desc: "Generic Basic Attack sequence." }, active: { name: "Active Skill", desc: "Generic Active Skill." }, ult: { name: "Ultimate Skill", desc: "Generic Ultimate Skill." }, combo: { name: "Combo Skill", desc: "Generic Combo Skill." } }, talents_data: { t1: { name: "Talent 1", lv1: "Lv.1 Data missing", lv2: "Lv.2 Data missing" }, t2: { name: "Talent 2", lv1: "Lv.1 Data missing", lv2: "Lv.2 Data missing" } }, affinity_bonus: [0, 0, 0, 0, 0], getPotentialStats: () => ({}), pot_desc: [] },
    { id: "016", name: "Laevatain", class: "Guard", element: "Heat", img: "laevatain.jpg", audio: "laevatain.mp3", attr_prim: "strength", attr_sec: "intellect", initiates: "Arts Vulnerability", continues: "Burn", breakpoints: { 1: { hp: 0, attack: 0, strength: 0, agility: 0, intellect: 0, will: 0 }, 90: { hp: 0, attack: 0, strength: 0, agility: 0, intellect: 0, will: 0 } }, skills: { basic: { name: "Basic Attack", desc: "Generic Basic Attack sequence." }, active: { name: "Active Skill", desc: "Generic Active Skill." }, ult: { name: "Ultimate Skill", desc: "Generic Ultimate Skill." }, combo: { name: "Combo Skill", desc: "Generic Combo Skill." } }, talents_data: { t1: { name: "Talent 1", lv1: "Lv.1 Data missing", lv2: "Lv.2 Data missing" }, t2: { name: "Talent 2", lv1: "Lv.1 Data missing", lv2: "Lv.2 Data missing" } }, affinity_bonus: [0, 0, 0, 0, 0], getPotentialStats: () => ({}), pot_desc: [] },
    { id: "017", name: "Last Rite", class: "Caster", element: "Cryo", img: "lastrite.jpg", audio: "lastrite.mp3", attr_prim: "intellect", attr_sec: "will", initiates: "Freeze", continues: "Armor Break", breakpoints: { 1: { hp: 0, attack: 0, strength: 0, agility: 0, intellect: 0, will: 0 }, 90: { hp: 0, attack: 0, strength: 0, agility: 0, intellect: 0, will: 0 } }, skills: { basic: { name: "Basic Attack", desc: "Generic Basic Attack sequence." }, active: { name: "Active Skill", desc: "Generic Active Skill." }, ult: { name: "Ultimate Skill", desc: "Generic Ultimate Skill." }, combo: { name: "Combo Skill", desc: "Generic Combo Skill." } }, talents_data: { t1: { name: "Talent 1", lv1: "Lv.1 Data missing", lv2: "Lv.2 Data missing" }, t2: { name: "Talent 2", lv1: "Lv.1 Data missing", lv2: "Lv.2 Data missing" } }, affinity_bonus: [0, 0, 0, 0, 0], getPotentialStats: () => ({}), pot_desc: [] },
    { id: "018", name: "Lifeng", class: "Striker", element: "Physical", img: "lifeng.jpg", audio: "lifeng.mp3", attr_prim: "agility", attr_sec: "strength", initiates: "Knockback", continues: "Airborne", breakpoints: { 1: { hp: 0, attack: 0, strength: 0, agility: 0, intellect: 0, will: 0 }, 90: { hp: 0, attack: 0, strength: 0, agility: 0, intellect: 0, will: 0 } }, skills: { basic: { name: "Basic Attack", desc: "Generic Basic Attack sequence." }, active: { name: "Active Skill", desc: "Generic Active Skill." }, ult: { name: "Ultimate Skill", desc: "Generic Ultimate Skill." }, combo: { name: "Combo Skill", desc: "Generic Combo Skill." } }, talents_data: { t1: { name: "Talent 1", lv1: "Lv.1 Data missing", lv2: "Lv.2 Data missing" }, t2: { name: "Talent 2", lv1: "Lv.1 Data missing", lv2: "Lv.2 Data missing" } }, affinity_bonus: [0, 0, 0, 0, 0], getPotentialStats: () => ({}), pot_desc: [] },
    { id: "019", name: "Mi Fu", class: "Guard", element: "Physical", img: "mifu.jpg", audio: "mifu.mp3", attr_prim: "strength", attr_sec: "agility", initiates: "Armor Break", continues: "Knockdown", breakpoints: { 1: { hp: 0, attack: 0, strength: 0, agility: 0, intellect: 0, will: 0 }, 90: { hp: 0, attack: 0, strength: 0, agility: 0, intellect: 0, will: 0 } }, skills: { basic: { name: "Basic Attack", desc: "Generic Basic Attack sequence." }, active: { name: "Active Skill", desc: "Generic Active Skill." }, ult: { name: "Ultimate Skill", desc: "Generic Ultimate Skill." }, combo: { name: "Combo Skill", desc: "Generic Combo Skill." } }, talents_data: { t1: { name: "Talent 1", lv1: "Lv.1 Data missing", lv2: "Lv.2 Data missing" }, t2: { name: "Talent 2", lv1: "Lv.1 Data missing", lv2: "Lv.2 Data missing" } }, affinity_bonus: [0, 0, 0, 0, 0], getPotentialStats: () => ({}), pot_desc: [] },
    { id: "021", name: "Pogranichnik", class: "Defender", element: "Physical", img: "pogra.jpg", audio: "pogra.mp3", attr_prim: "will", attr_sec: "strength", initiates: "Stagger", continues: "Freeze", breakpoints: { 1: { hp: 0, attack: 0, strength: 0, agility: 0, intellect: 0, will: 0 }, 90: { hp: 0, attack: 0, strength: 0, agility: 0, intellect: 0, will: 0 } }, skills: { basic: { name: "Basic Attack", desc: "Generic Basic Attack sequence." }, active: { name: "Active Skill", desc: "Generic Active Skill." }, ult: { name: "Ultimate Skill", desc: "Generic Ultimate Skill." }, combo: { name: "Combo Skill", desc: "Generic Combo Skill." } }, talents_data: { t1: { name: "Talent 1", lv1: "Lv.1 Data missing", lv2: "Lv.2 Data missing" }, t2: { name: "Talent 2", lv1: "Lv.1 Data missing", lv2: "Lv.2 Data missing" } }, affinity_bonus: [0, 0, 0, 0, 0], getPotentialStats: () => ({}), pot_desc: [] },
    { id: "023", name: "Snowshine", class: "Defender", element: "Cryo", img: "snowshine.jpg", audio: "snowshine.mp3", attr_prim: "strength", attr_sec: "will", initiates: "Slow", continues: "Stagger", breakpoints: { 1: { hp: 0, attack: 0, strength: 0, agility: 0, intellect: 0, will: 0 }, 90: { hp: 0, attack: 0, strength: 0, agility: 0, intellect: 0, will: 0 } }, skills: { basic: { name: "Basic Attack", desc: "Generic Basic Attack sequence." }, active: { name: "Active Skill", desc: "Generic Active Skill." }, ult: { name: "Ultimate Skill", desc: "Generic Ultimate Skill." }, combo: { name: "Combo Skill", desc: "Generic Combo Skill." } }, talents_data: { t1: { name: "Talent 1", lv1: "Lv.1 Data missing", lv2: "Lv.2 Data missing" }, t2: { name: "Talent 2", lv1: "Lv.1 Data missing", lv2: "Lv.2 Data missing" } }, affinity_bonus: [0, 0, 0, 0, 0], getPotentialStats: () => ({}), pot_desc: [] },
    { id: "024", name: "Tangtang", class: "Vanguard", element: "Physical", img: "tangtang.jpg", audio: "tangtang.mp3", attr_prim: "strength", attr_sec: "agility", initiates: "Knockback", continues: "Armor Break", breakpoints: { 1: { hp: 0, attack: 0, strength: 0, agility: 0, intellect: 0, will: 0 }, 90: { hp: 0, attack: 0, strength: 0, agility: 0, intellect: 0, will: 0 } }, skills: { basic: { name: "Basic Attack", desc: "Generic Basic Attack sequence." }, active: { name: "Active Skill", desc: "Generic Active Skill." }, ult: { name: "Ultimate Skill", desc: "Generic Ultimate Skill." }, combo: { name: "Combo Skill", desc: "Generic Combo Skill." } }, talents_data: { t1: { name: "Talent 1", lv1: "Lv.1 Data missing", lv2: "Lv.2 Data missing" }, t2: { name: "Talent 2", lv1: "Lv.1 Data missing", lv2: "Lv.2 Data missing" } }, affinity_bonus: [0, 0, 0, 0, 0], getPotentialStats: () => ({}), pot_desc: [] },
    { id: "025", name: "Wulfgard", class: "Guard", element: "Physical", img: "wulfgard.jpg", audio: "wulfgard.mp3", attr_prim: "strength", attr_sec: "agility", initiates: "Stagger", continues: "Knockdown", breakpoints: { 1: { hp: 0, attack: 0, strength: 0, agility: 0, intellect: 0, will: 0 }, 90: { hp: 0, attack: 0, strength: 0, agility: 0, intellect: 0, will: 0 } }, skills: { basic: { name: "Basic Attack", desc: "Generic Basic Attack sequence." }, active: { name: "Active Skill", desc: "Generic Active Skill." }, ult: { name: "Ultimate Skill", desc: "Generic Ultimate Skill." }, combo: { name: "Combo Skill", desc: "Generic Combo Skill." } }, talents_data: { t1: { name: "Talent 1", lv1: "Lv.1 Data missing", lv2: "Lv.2 Data missing" }, t2: { name: "Talent 2", lv1: "Lv.1 Data missing", lv2: "Lv.2 Data missing" } }, affinity_bonus: [0, 0, 0, 0, 0], getPotentialStats: () => ({}), pot_desc: [] },
    { id: "026", name: "Xaihi", class: "Supporter", element: "Arts", img: "xaihi.jpg", audio: "xaihi.mp3", attr_prim: "will", attr_sec: "intellect", initiates: "Arts Vulnerability", continues: "Crystalize", breakpoints: { 1: { hp: 0, attack: 0, strength: 0, agility: 0, intellect: 0, will: 0 }, 90: { hp: 0, attack: 0, strength: 0, agility: 0, intellect: 0, will: 0 } }, skills: { basic: { name: "Basic Attack", desc: "Generic Basic Attack sequence." }, active: { name: "Active Skill", desc: "Generic Active Skill." }, ult: { name: "Ultimate Skill", desc: "Generic Ultimate Skill." }, combo: { name: "Combo Skill", desc: "Generic Combo Skill." } }, talents_data: { t1: { name: "Talent 1", lv1: "Lv.1 Data missing", lv2: "Lv.2 Data missing" }, t2: { name: "Talent 2", lv1: "Lv.1 Data missing", lv2: "Lv.2 Data missing" } }, affinity_bonus: [0, 0, 0, 0, 0], getPotentialStats: () => ({}), pot_desc: [] },
    { id: "027", name: "Yvonne", class: "Striker", element: "Cryo", img: "yvonne.jpg", audio: "yvonne.mp3", attr_prim: "agility", attr_sec: "intellect", initiates: "Freeze", continues: "Airborne", breakpoints: { 1: { hp: 0, attack: 0, strength: 0, agility: 0, intellect: 0, will: 0 }, 90: { hp: 0, attack: 0, strength: 0, agility: 0, intellect: 0, will: 0 } }, skills: { basic: { name: "Basic Attack", desc: "Generic Basic Attack sequence." }, active: { name: "Active Skill", desc: "Generic Active Skill." }, ult: { name: "Ultimate Skill", desc: "Generic Ultimate Skill." }, combo: { name: "Combo Skill", desc: "Generic Combo Skill." } }, talents_data: { t1: { name: "Talent 1", lv1: "Lv.1 Data missing", lv2: "Lv.2 Data missing" }, t2: { name: "Talent 2", lv1: "Lv.1 Data missing", lv2: "Lv.2 Data missing" } }, affinity_bonus: [0, 0, 0, 0, 0], getPotentialStats: () => ({}), pot_desc: [] },
    { id: "028", name: "Zhuang Fangyi", class: "Caster", element: "Electric", img: "zhuang.jpg", audio: "zhuang.mp3", attr_prim: "intellect", attr_sec: "agility", initiates: "Paralysis", continues: "Arts Vulnerability", breakpoints: { 1: { hp: 0, attack: 0, strength: 0, agility: 0, intellect: 0, will: 0 }, 90: { hp: 0, attack: 0, strength: 0, agility: 0, intellect: 0, will: 0 } }, skills: { basic: { name: "Basic Attack", desc: "Generic Basic Attack sequence." }, active: { name: "Active Skill", desc: "Generic Active Skill." }, ult: { name: "Ultimate Skill", desc: "Generic Ultimate Skill." }, combo: { name: "Combo Skill", desc: "Generic Combo Skill." } }, talents_data: { t1: { name: "Talent 1", lv1: "Lv.1 Data missing", lv2: "Lv.2 Data missing" }, t2: { name: "Talent 2", lv1: "Lv.1 Data missing", lv2: "Lv.2 Data missing" } }, affinity_bonus: [0, 0, 0, 0, 0], getPotentialStats: () => ({}), pot_desc: [] }
];

function initDatabase() {
    characters.forEach(p => {
        p.status = {
            level: 1, affinity: 0, potential: 0, 
            talent_1_brk: 1, talent_2_brk: 1, 
            skill_1: 1, skill_2: 1, skill_3: 1, skill_4: 1,
            weapon_id: "wpn_test_00", weapon_level: 1, weapon_e1: 1, weapon_e2: 1, weapon_e3: 1,
            equipment: { armor: "none", gloves: "none", kit1: "none", kit2: "none" },
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
    document.getElementById('tab-btn-gear').classList.toggle('active', tab === 'gear');
    document.getElementById('filter-element').style.display = tab === 'operators' ? 'inline-block' : 'none';
    renderRoster();
}

function initSelects() {
    const selWpn = document.getElementById("conf-weapon-id");
    selWpn.innerHTML = "";
    weaponsDB.forEach(w => selWpn.innerHTML += `<option value="${w.id}">${w.name} (${w.type})</option>`);
    
    const selArmor = document.getElementById("conf-equip-armor");
    const selGloves = document.getElementById("conf-equip-gloves");
    const selKit1 = document.getElementById("conf-equip-kit1");
    const selKit2 = document.getElementById("conf-equip-kit2");
    
    [selArmor, selGloves, selKit1, selKit2].forEach(sel => sel.innerHTML = "");

    equipmentDB.forEach(eq => {
        let opt = `<option value="${eq.id}">${eq.name}</option>`;
        if (eq.type === "Armor" || eq.type === "Any") selArmor.innerHTML += opt;
        if (eq.type === "Gloves" || eq.type === "Any") selGloves.innerHTML += opt;
        if (eq.type === "Kit" || eq.type === "Any") {
            selKit1.innerHTML += opt;
            selKit2.innerHTML += opt;
        }
    });
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
                        <div class="char-img" style="${p.img ? `background-image: url('imagens/Operators/${p.img}');` : ''}">
                            ${!p.img ? '<span style="color: var(--border-dim); font-size: 40px; font-weight: bold;">?</span>' : ''}
                            <div class="lvl-overlay">LV. ${p.status.level}</div>
                        </div>
                        <div class="char-info">
                            <strong>${p.name}</strong>
                            <span>${p.class} • ${p.element}</span>
                        </div>
                    </div>
                `;
            }
        });
    } else if (currentTab === 'weapons') {
        weaponsDB.forEach(w => {
            if (w.name.toLowerCase().includes(search)) {
                grid.innerHTML += `
                    <div class="char-card" onclick="openWeaponModal('${w.id}')">
                        <div class="wpn-img" style="${w.img ? `background-image: url('imagens/Weapons/${w.img}');` : ''}">
                            ${!w.img ? '<span style="color: var(--border-dim); font-size: 40px; font-weight: bold;">?</span>' : ''}
                            <div class="lvl-overlay">LV. 1</div>
                        </div>
                        <div class="char-info">
                            <strong>${w.name}</strong>
                            <span>${w.type}</span>
                        </div>
                    </div>
                `;
            }
        });
    } else if (currentTab === 'gear') {
        equipmentDB.forEach(g => {
            if (g.id !== 'none' && g.name.toLowerCase().includes(search)) {
                grid.innerHTML += `
                    <div class="char-card" onclick="openGearModal('${g.id}')">
                        <div class="wpn-img" style="${g.img ? `background-image: url('imagens/Gears/${g.img}');` : ''}">
                            ${!g.img ? '<span style="color: var(--border-dim); font-size: 40px; font-weight: bold;">?</span>' : ''}
                            <div class="lvl-overlay">LV. ${g.level || 1}</div>
                        </div>
                        <div class="char-info">
                            <strong>${g.name}</strong>
                            <span>${g.set} • ${g.type}</span>
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
                <div class="slot slot-filled" draggable="true" ondragstart="drag(event, 'squad', '${i}')" ondrop="drop(event, ${i})" ondragover="allowDrop(event)" ondragleave="leaveDrop(event)" style="${c.img ? `background-image: linear-gradient(to top, rgba(0,0,0,0.9), transparent), url('imagens/Operators/${c.img}');` : `background: var(--bg-dark);`}" onclick="openSettings('squad', ${i})">
                    <button class="btn-remove" onclick="event.stopPropagation(); removeFromSquad(${i})">X</button>
                    ${!c.img ? '<span style="color: var(--border-dim); font-size: 40px; font-weight: bold; position: absolute; top: 30%;">?</span>' : ''}
                    <div class="lvl-overlay">LV. ${c.status.level}</div>
                    <div style="flex:1;"></div>
                    <strong>${c.name}</strong>
                    <span>${c.class}</span>
                </div>
            `;
        } else {
            slots.innerHTML += `<div class="slot" ondrop="drop(event, ${i})" ondragover="allowDrop(event)" ondragleave="leaveDrop(event)">STANDBY</div>`;
        }
    }
    calcCombo();
    updateSquadPower();
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
        preview.style.backgroundImage = `url('imagens/Weapons/${wpn.img}')`;
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
    saveConfig(true); 
};

window.setSkillLvl = function(skillNum, val) {
    if (activeId === null) return;
    let c = activeOrigin === 'list' ? characters.find(p => p.id === activeId) : squad[activeId];
    if (!c) return;
    c.status[`skill_${skillNum}`] = parseInt(val);
    updateDescriptions();
    saveConfig(true); 
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
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                <span class="intel-title" style="margin-bottom: 0;">Basic Attack</span>
                <select class="tech-input skill-select-inline" onchange="setSkillLvl(1, this.value)">
                    ${generateSkillOptions(c.status.skill_1)}
                </select>
            </div>
            <span class="intel-subtitle">${c.skills.basic.name}</span>
            <p class="intel-desc">${c.skills.basic.desc}</p>
        </div>
        <div class="intel-item">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                <span class="intel-title" style="margin-bottom: 0;">Normal Skill</span>
                <select class="tech-input skill-select-inline" onchange="setSkillLvl(2, this.value)">
                    ${generateSkillOptions(c.status.skill_2)}
                </select>
            </div>
            <span class="intel-subtitle">${c.skills.active.name}</span>
            <p class="intel-desc">${c.skills.active.desc}</p>
        </div>
        <div class="intel-item">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                <span class="intel-title" style="margin-bottom: 0;">Ultimate Skill</span>
                <select class="tech-input skill-select-inline" onchange="setSkillLvl(3, this.value)">
                    ${generateSkillOptions(c.status.skill_3)}
                </select>
            </div>
            <span class="intel-subtitle">${c.skills.ult.name}</span>
            <p class="intel-desc">${c.skills.ult.desc}</p>
        </div>
        <div class="intel-item">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                <span class="intel-title" style="margin-bottom: 0;">Combo Skill</span>
                <select class="tech-input skill-select-inline" onchange="setSkillLvl(4, this.value)">
                    ${generateSkillOptions(c.status.skill_4)}
                </select>
            </div>
            <span class="intel-subtitle">${c.skills.combo.name}</span>
            <p class="intel-desc">${c.skills.combo.desc}</p>
        </div>
        <div class="intel-item">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                <span class="intel-title" style="margin-bottom: 0;">Talent 1 Breakthrough</span>
                <select class="tech-input skill-select-inline" onchange="setTalentBrk(1, this.value)">
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
                <select class="tech-input skill-select-inline" onchange="setTalentBrk(2, this.value)">
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

// ---------------- SQUAD COMBAT POWER CALCULATION ---------------- //
function getCalculatedStats(c) {
    if (!c || !c.status) return { ...universalBaseStatsTemplate, attack: 0, hp: 0, defense: 0 };

    let lvl = c.status.level || 1;
    let affinity = c.status.affinity || 0;
    let potential = c.status.potential || 0;

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

    let eqSetCount = {};
    if (c.status.equipment) {
        Object.values(c.status.equipment).forEach(eqId => {
            let eq = equipmentDB.find(x => x.id === eqId);
            if (eq && eq.id !== 'none' && lvl >= eq.level) {
                for (let sKey in eq.stats) {
                    if (['strength', 'agility', 'intellect', 'will'].includes(sKey)) {
                        attr[sKey] += eq.stats[sKey];
                    } else if (stats[sKey] !== undefined) {
                        stats[sKey] += eq.stats[sKey];
                    } else {
                        stats[sKey] = eq.stats[sKey];
                    }
                }
                eqSetCount[eq.set] = (eqSetCount[eq.set] || 0) + 1;
            }
        });
    }

    let wpn = weaponsDB.find(w => w.id === c.status.weapon_id);
    let wpnTotalAtk = 0;
    let wpnBonus = null;

    if (wpn && wpn.max_atk > 0) {
        let wpnGrowth = (wpn.max_atk - wpn.base_atk) / 89;
        wpnTotalAtk = wpn.base_atk + ((c.status.weapon_level || 1) - 1) * wpnGrowth;
        if (wpn.effects_math) {
            wpnBonus = wpn.effects_math(c.status.weapon_e1 || 1, c.status.weapon_e2 || 1, c.status.weapon_e3 || 1);
        }
    }

    if (wpnBonus && wpnBonus.agility) attr.agility += wpnBonus.agility;

    stats.hp = Math.floor(base_hp + attr.strength * 5); 
    
    let mainBonus = attr[c.attr_prim] * 0.005;
    let subBonus = attr[c.attr_sec] * 0.002;
    let attrAtkMultiplier = mainBonus + subBonus;

    if (wpnBonus && wpnBonus.atk_percent) attrAtkMultiplier += wpnBonus.atk_percent;

    for (let setName in eqSetCount) {
        let setDef = equipmentSetsDB[setName];
        if (setDef && eqSetCount[setName] >= setDef.req) {
            if (setDef.mult.crit_rate) stats.crit_rate += setDef.mult.crit_rate;
            if (setDef.mult.atk_percent) attrAtkMultiplier += setDef.mult.atk_percent;
        }
    }

    stats.attack = Math.floor((base_atk + wpnTotalAtk) * (1 + attrAtkMultiplier));
    stats.phys_res = attr.agility * 0.001;
    stats.arts_res = attr.intellect * 0.001;
    stats.treat_rec_bonus = attr.will * 0.001;

    if (wpnBonus && wpnBonus.crit_rate) stats.crit_rate += wpnBonus.crit_rate;
    if (wpnBonus && wpnBonus.ult_dmg_bonus) stats.ult_dmg_bonus += wpnBonus.ult_dmg_bonus;

    return stats;
}

function updateSquadPower() {
    const powerDisplay = document.getElementById("squad-total-power");
    if (!powerDisplay) return;

    let totalPotential = 0;
    
    squad.forEach(c => {
        if (c !== null) {
            let cStats = getCalculatedStats(c);
            let dmgBonusSum = cStats.phys_dmg_bonus + cStats.heat_dmg_bonus + cStats.arts_intensity * 0.001 + cStats.cryo_dmg_bonus + cStats.elec_dmg_bonus + cStats.nature_dmg_bonus + cStats.basic_dmg_bonus + cStats.skill_dmg_bonus + cStats.ult_dmg_bonus;
            
            let effectiveAtk = cStats.attack * (1 + dmgBonusSum);
            let critMultiplier = 1 + (cStats.crit_rate * cStats.crit_dmg);
            
            totalPotential += Math.floor(effectiveAtk * critMultiplier * 1.5); 
        }
    });

    powerDisplay.innerText = totalPotential.toLocaleString();
}

function updateLiveStatsAndDOM() {
    if (activeId === null) return;
    let c = activeOrigin === 'list' ? characters.find(p => p.id === activeId) : squad[activeId];
    if (!c) return;

    let lvl = clamp(document.getElementById("conf-level").value, 1, 90) || 1;
    
    let equips = [
        { id: document.getElementById("conf-equip-armor").value, el: document.getElementById("conf-equip-armor") },
        { id: document.getElementById("conf-equip-gloves").value, el: document.getElementById("conf-equip-gloves") },
        { id: document.getElementById("conf-equip-kit1").value, el: document.getElementById("conf-equip-kit1") },
        { id: document.getElementById("conf-equip-kit2").value, el: document.getElementById("conf-equip-kit2") }
    ];

    equips.forEach(eqObj => {
        let eq = equipmentDB.find(x => x.id === eqObj.id);
        if (eq && eq.id !== 'none' && lvl < eq.level) {
            eqObj.el.value = 'none';
            eqObj.el.classList.add('shake-error');
            setTimeout(() => eqObj.el.classList.remove('shake-error'), 400);
            showToast(`Cannot equip ${eq.name}. Requires Operator Level ${eq.level}.`);
        }
    });

    c.status.level = lvl;
    c.status.affinity = clamp(document.getElementById("conf-char-affinity").value, 0, 4) || 0;
    c.status.potential = clamp(document.getElementById("conf-char-potential").value, 0, 5) || 0;
    c.status.weapon_id = document.getElementById("conf-weapon-id").value;
    c.status.weapon_level = clamp(document.getElementById("conf-weapon-level").value, 1, 90) || 1;
    c.status.weapon_e1 = clamp(document.getElementById("conf-weapon-e1").value, 1, 9) || 1;
    c.status.weapon_e2 = clamp(document.getElementById("conf-weapon-e2").value, 1, 9) || 1;
    c.status.weapon_e3 = clamp(document.getElementById("conf-weapon-e3").value, 1, 9) || 1;
    
    c.status.equipment.armor = document.getElementById("conf-equip-armor").value;
    c.status.equipment.gloves = document.getElementById("conf-equip-gloves").value;
    c.status.equipment.kit1 = document.getElementById("conf-equip-kit1").value;
    c.status.equipment.kit2 = document.getElementById("conf-equip-kit2").value;

    let newStats = getCalculatedStats(c);
    c.status.stats = newStats;
    
    renderAdvancedStats(newStats);
    updateDescriptions();
    updateSquadPower(); 
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
                <select class="tech-input skill-select-inline" style="margin-top:0;" id="wpn-modal-e${i+1}" onchange="updateWeaponModalStats()">
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
        imgDiv.style.backgroundImage = `url('imagens/Weapons/${w.img}')`;
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
        closeWeaponModal();
    }, 800);
}

function openGearModal(gearId) {
    const g = equipmentDB.find(x => x.id === gearId);
    if (!g) return;

    const imgDiv = document.getElementById("gear-modal-img");
    if(g.img) {
        imgDiv.style.backgroundImage = `url('imagens/Gears/${g.img}')`;
        imgDiv.innerHTML = "";
    } else {
        imgDiv.style.backgroundImage = "none";
        imgDiv.innerHTML = '<span style="color: var(--border-dim); font-size: 30px; font-weight: bold;">?</span>';
    }

    document.getElementById("gear-modal-name").innerText = g.name;
    document.getElementById("gear-modal-type").innerText = g.type;
    document.getElementById("gear-modal-set").innerText = g.set;
    
    const cont = document.getElementById("gear-modal-stats-container");
    let html = `<h3>Base Stats & Set Bonus</h3>`;
    
    if (Object.keys(g.stats).length > 0) {
        for (let key in g.stats) {
            let formatted = formatStat(key, g.stats[key]);
            html += `<div class="stat-row"><span class="stat-name">${key.replace(/_/g, ' ').toUpperCase()}</span><span class="stat-val" style="color: var(--primary-yellow);">${formatted}</span></div>`;
        }
    } else {
        html += `<p class="sub-text">No stats available for this equipment template.</p>`;
    }

    if (g.set !== "None" && equipmentSetsDB[g.set]) {
        html += `<div class="intel-item mt-20" style="border:none;"><span class="intel-title">${g.set} Set (${equipmentSetsDB[g.set].req}-piece)</span><p class="intel-desc">${equipmentSetsDB[g.set].desc}</p></div>`;
    }

    cont.innerHTML = html;
    document.getElementById("modal-gear").style.display = "flex";
}

function closeGearModal() { document.getElementById("modal-gear").style.display = "none"; }

function openSettings(origin, idVal) {
    activeOrigin = origin; activeId = idVal;
    let target = origin === 'list' ? characters.find(p => p.id === idVal) : squad[idVal];
    if (!target) return;

    playVoiceLine(target.audio);

    const avatarDiv = document.getElementById("config-avatar");
    if(target.img) {
        avatarDiv.style.backgroundImage = `url('imagens/Operators/${target.img}')`;
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
    
    document.getElementById("conf-weapon-id").value = target.status.weapon_id;
    document.getElementById("conf-weapon-level").value = target.status.weapon_level;
    document.getElementById("conf-weapon-e1").value = target.status.weapon_e1 || 1;
    document.getElementById("conf-weapon-e2").value = target.status.weapon_e2 || 1;
    document.getElementById("conf-weapon-e3").value = target.status.weapon_e3 || 1;
    
    updateWeaponPreview();
    
    const parts = ["armor", "gloves", "kit1", "kit2"];
    parts.forEach(part => {
        document.getElementById(`conf-equip-${part}`).value = target.status.equipment[part];
    });

    document.getElementById("modal-config").style.display = "flex";
    updateLiveStatsAndDOM();
}

function saveConfig(silent = false) {
    let target = activeOrigin === 'list' ? characters.find(p => p.id === activeId) : squad[activeId];
    
    target.status.level = clamp(document.getElementById("conf-level").value, 1, 90);
    target.status.affinity = clamp(document.getElementById("conf-char-affinity").value, 0, 4);
    target.status.potential = clamp(document.getElementById("conf-char-potential").value, 0, 5);
    
    target.status.weapon_id = document.getElementById("conf-weapon-id").value;
    target.status.weapon_level = clamp(document.getElementById("conf-weapon-level").value, 1, 90);
    target.status.weapon_e1 = clamp(document.getElementById("conf-weapon-e1").value, 1, 9);
    target.status.weapon_e2 = clamp(document.getElementById("conf-weapon-e2").value, 1, 9);
    target.status.weapon_e3 = clamp(document.getElementById("conf-weapon-e3").value, 1, 9);
    
    const parts = ["armor", "gloves", "kit1", "kit2"];
    parts.forEach(part => {
        target.status.equipment[part] = document.getElementById(`conf-equip-${part}`).value;
    });

    if (!silent) {
        const btn = document.getElementById("btn-save-config");
        const originalText = btn.innerText;
        btn.innerText = "SAVED ✓";
        btn.style.backgroundColor = "#2ECC71";
        btn.style.color = "#000";
        setTimeout(() => {
            btn.innerText = originalText;
            btn.style.backgroundColor = "";
            btn.style.color = "";
            closeConfigModal();
        }, 800);
    }

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
            c.status.skill_1 = 1;
            c.status.skill_2 = 1;
            c.status.skill_3 = 1;
            c.status.skill_4 = 1;
        }
    }

    document.getElementById("conf-weapon-id").value = "wpn_test_00";
    document.getElementById("conf-weapon-level").value = 1;
    document.getElementById("conf-weapon-e1").value = 1;
    document.getElementById("conf-weapon-e2").value = 1;
    document.getElementById("conf-weapon-e3").value = 1;
    
    const parts = ["armor", "gloves", "kit1", "kit2"];
    parts.forEach(part => {
        document.getElementById(`conf-equip-${part}`).value = "none";
    });

    updateWeaponPreview(); 
    updateLiveStatsAndDOM();
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
    t1.forEach(c => html += `<div class="mini-slot" style="${c.img ? `background-image: linear-gradient(to top, rgba(0,0,0,0.9), transparent), url('imagens/Operators/${c.img}');` : `background: var(--bg-dark);`}">${c.name}</div>`);
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