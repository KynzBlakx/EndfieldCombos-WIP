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

// ---------------- WEAPONS DATABASE ---------------- //
const weaponsDB = [
    { 
        id: "wpn_test_00", 
        name: "Empty Training Weapon (Any)", 
        type: "Any", 
        img: "wpn_empty.png", 
        base_atk: 0, 
        max_atk: 0, 
        effects_math: () => ({}), 
        effects_info: []
    },
    { 
        id: "wpn_glorious_memory", 
        name: "Glorious Memory", 
        type: "Sword", 
        img: "wpn_glorious.png", 
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
            { 
                name: "Agility Boost [G]", 
                desc: (lv) => `Agility <span style="color:var(--primary-yellow)">+${[20, 36, 52, 68, 84, 100, 116, 132, 156][lv-1]}</span>` 
            },
            { 
                name: "Critical Rate Boost [L]", 
                desc: (lv) => `Critical Rate <span style="color:var(--primary-yellow)">+${([0.025, 0.045, 0.065, 0.085, 0.105, 0.125, 0.145, 0.165, 0.195][lv-1]*100).toFixed(1)}%</span>` 
            },
            { 
                name: "Twilight: Lingering Glow", 
                desc: (lv) => `ATK <span style="color:var(--primary-yellow)">+${([0.07, 0.084, 0.098, 0.112, 0.126, 0.14, 0.154, 0.168, 0.196][lv-1]*100).toFixed(1)}%</span>. When the wielder's skill applies Vulnerability, during the next ultimate cast within 30s, the wielder gains DMG Dealt <span style="color:var(--primary-yellow)">+${([0.12, 0.144, 0.168, 0.192, 0.216, 0.24, 0.264, 0.288, 0.336][lv-1]*100).toFixed(1)}%</span>. Max stacks for effects of the same name: 3. Duration of each stack is counted separately. Effect only triggers once every 0.5s.` 
            }
        ]
    },
    {
        id: "wpn_flickers", 
        name: "Flickers in the Mist", 
        type: "Arts Unit", 
        img: "wpn_flickers.png", 
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
        img: "wpn_delivery.png", 
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
        img: "wpn_artzy.png", 
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
        img: "wpn_dreams.png", 
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
        img: "wpn_sundered.png", 
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
        img: "wpn_brigand.png", 
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
        img: "wpn_lupine.png", 
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
        img: "wpn_home.png", 
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
        img: "wpn_lone_barge.png", 
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
        img: "wpn_forgeborn.png", 
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
        img: "wpn_amaranthine.png", 
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
        img: "wpn_blessing.png", 
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
        img: "wpn_phantom.png", 
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
        img: "wpn_beacon.png", 
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
        img: "wpn_white_night.png", 
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
        img: "wpn_opus.png", 
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
        img: "wpn_detonation.png", 
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
        img: "wpn_chivalric.png", 
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
        img: "wpn_wedge.png", 
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
        img: "wpn_valiant.png", 
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
        img: "wpn_mountain.png", 
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
        img: "wpn_grand.png", 
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
        img: "wpn_never.png", 
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
        img: "wpn_rapid.png", 
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
        img: "wpn_eminent.png", 
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
        img: "wpn_clannibal.png", 
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
        img: "wpn_thunder.png", 
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
        img: "wpn_finery.png", 
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
        img: "wpn_khravengger.png", 
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
        img: "wpn_exemplar.png", 
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
        img: "wpn_umbral.png", 
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
        img: "wpn_jet.png", 
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
        img: "wpn_thermite.png", 
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
        img: "wpn_oblivion.png", 
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
        img: "wpn_navigator.png", 
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

// ---------------- EQUIPMENT DATABASE (Expanded Format) ---------------- //
const equipmentDB = [
    { 
        id: "none", 
        name: "No Equipment", 
        type: "Any", 
        set: "None", 
        stats: {}, 
        level: 1, 
        img: "" 
    },
    
    // KITS
    { 
        id: "eq_mi_push_knife", 
        name: "MI Security Push Knife", 
        type: "Kit", 
        set: "MI Security", 
        rarity: "Gold", 
        level: 70, 
        stats: { defense: 21, intellect: 21, will: 32, heat_dmg_bonus: 0.23, nature_dmg_bonus: 0.23 }, 
        img: "mi_kit.png" 
    },
    { 
        id: "eq_mi_push_knife_t1", 
        name: "MI Security Push Knife T1", 
        type: "Kit", 
        set: "MI Security", 
        rarity: "Gold", 
        level: 70, 
        stats: { defense: 21, agility: 21, will: 32, skill_dmg_bonus: 0.414 }, 
        img: "mi_kit.png" 
    },
    { 
        id: "eq_mi_toolkit", 
        name: "MI Security Toolkit", 
        type: "Kit", 
        set: "MI Security", 
        rarity: "Gold", 
        level: 70, 
        stats: { defense: 21, agility: 21, intellect: 32, crit_rate: 0.104 }, 
        img: "mi_kit.png" 
    },
    { 
        id: "eq_mi_scope_t1", 
        name: "MI Security Scope T1", 
        type: "Kit", 
        set: "MI Security", 
        rarity: "Gold", 
        level: 70, 
        stats: { defense: 21, agility: 32, intellect: 21, crit_rate: 0.104 }, 
        img: "mi_kit.png" 
    },
    { 
        id: "eq_mi_scope", 
        name: "MI Security Scope", 
        type: "Kit", 
        set: "MI Security", 
        rarity: "Gold", 
        level: 70, 
        stats: { defense: 21, strength: 21, agility: 32, skill_dmg_bonus: 0.414 }, 
        img: "mi_kit.png" 
    },
    { 
        id: "eq_mi_armband", 
        name: "MI Security Armband", 
        type: "Kit", 
        set: "MI Security", 
        rarity: "Gold", 
        level: 70, 
        stats: { defense: 21, strength: 32, will: 21, cryo_dmg_bonus: 0.23, elec_dmg_bonus: 0.23 }, 
        img: "mi_kit.png" 
    },

    // GLOVES
    { 
        id: "eq_mi_hands_ppe_t1", 
        name: "MI Security Hands PPE T1", 
        type: "Gloves", 
        set: "MI Security", 
        rarity: "Gold", 
        level: 70, 
        stats: { defense: 42, intellect: 65, will: 43, crit_rate: 0.086 }, 
        img: "mi_gloves.png" 
    },
    { 
        id: "eq_mi_hands_ppe", 
        name: "MI Security Hands PPE", 
        type: "Gloves", 
        set: "MI Security", 
        rarity: "Gold", 
        level: 70, 
        stats: { defense: 42, agility: 43, intellect: 65, basic_dmg_bonus: 0.23 }, 
        img: "mi_gloves.png" 
    },
    { 
        id: "eq_mi_gloves_t1", 
        name: "MI Security Gloves T1", 
        type: "Gloves", 
        set: "MI Security", 
        rarity: "Gold", 
        level: 70, 
        stats: { defense: 42, agility: 65, intellect: 43, ult_dmg_bonus: 0.431 }, 
        img: "mi_gloves.png" 
    },
    { 
        id: "eq_mi_gloves", 
        name: "MI Security Gloves", 
        type: "Gloves", 
        set: "MI Security", 
        rarity: "Gold", 
        level: 70, 
        stats: { defense: 42, strength: 43, agility: 65, skill_dmg_bonus: 0.345 }, 
        img: "mi_gloves.png" 
    },

    // ARMOR
    { 
        id: "eq_mi_overalls_t1", 
        name: "MI Security Overalls T1", 
        type: "Armor", 
        set: "MI Security", 
        rarity: "Gold", 
        level: 70, 
        stats: { defense: 56, intellect: 87, will: 58, crit_rate: 0.052 }, 
        img: "mi_armor.png" 
    },
    { 
        id: "eq_mi_overalls_t2", 
        name: "MI Security Overalls T2", 
        type: "Armor", 
        set: "MI Security", 
        rarity: "Gold", 
        level: 70, 
        stats: { defense: 56, agility: 58, will: 87, skill_dmg_bonus: 0.207 }, 
        img: "mi_armor.png" 
    },
    { 
        id: "eq_mi_overalls", 
        name: "MI Security Overalls", 
        type: "Armor", 
        set: "MI Security", 
        rarity: "Gold", 
        level: 70, 
        stats: { defense: 56, agility: 58, intellect: 87, basic_dmg_bonus: 0.138 }, 
        img: "mi_armor.png" 
    },
    { 
        id: "eq_mi_armor", 
        name: "MI Security Armor", 
        type: "Armor", 
        set: "MI Security", 
        rarity: "Gold", 
        level: 70, 
        stats: { defense: 56, strength: 58, agility: 87, arts_intensity: 20 }, 
        img: "mi_armor.png" 
    },
    { 
        id: "eq_mi_armor_t1", 
        name: "MI Security Armor T1", 
        type: "Armor", 
        set: "MI Security", 
        rarity: "Gold", 
        level: 70, 
        stats: { defense: 56, agility: 87, intellect: 58, ult_gain_eff: 0.123 }, 
        img: "mi_armor.png" 
    }
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

// ---------------- CHARACTER DATABASE (Expanded Layout) ---------------- //
const characters = [
    {
        id: "001",
        name: "Rossi",
        english_name: "Rossi",
        class: "Guard",
        element: "Physical",
        rarity: 6,
        weapon_type: "Sword",
        img: "rossi.png",
        audio: "rossi.mp3",
        description: "Rossi is a Sword-wielding guard who deals Physical DMG.",
        trait: "Guards are skilled at making enemies Vulnerable and applying Physical Statuses. They are also good damage dealers.",
        attr_prim: "agility",
        attr_sec: "intellect",
        initiates: "None",
        continues: "None",
        breakpoints: {
            1: { hp: 500, attack: 30, strength: 9, agility: 23, intellect: 14, will: 9 },
            70: { hp: 4372, attack: 258, strength: 78, agility: 142, intellect: 94, will: 71 },
            90: { hp: 5495, attack: 323, strength: 97, agility: 176, intellect: 118, will: 89 }
        },
        skills: {
            basic: { name: "Seething Wolfblood", desc: "BASIC ATTACK: An attack with up to 5 sequences that deals Physical DMG. As the controlled operator, Final Strike also deals 18 Stagger.  DIVE ATTACK: Basic attack performed in mid-air becomes a dive attack that deals Physical DMG to nearby enemies.  FINISHER: Basic attack performed near a Staggered enemy becomes a finisher attack that deals massive Physical DMG and recovers some SP." },
            active: { name: "Crimson Shadow", desc: "Charges to the target to deal Physical DMG and apply Lift. If the target already has Vulnerability stack(s), the skill also unleashes a Wolven Ambrage that charges at the target to deal Heat DMG." },
            ult: { name: "\"Razorclaw\" Ambuscade", desc: "Rossi flutters her cape and unleashes a flurry of stabs that quickly deals multiple sequences of Heat DMG to the target. She then performs a two-sequence slash attack with her dagger that deals massive Heat DMG and applies Heat Infliction. When this skill successfully scores a critical hit, it deals higher Critical DMG." },
            combo: { name: "Moment of Blazing Shadow", desc: "COMBO TRIGGER: When an enemy has both Vulnerability and Arts Infliction stacks. Rossi's combo skill has 2 consecutive sequences. COMBO SEQUENCE 1 deals Physical DMG to the target. COMBO SEQUENCE 2 consumes all Arts Infliction stacks from the target, deals Physical DMG based on the number of Arts Infliction stacks consumed, applies 1 instance of Lift, and buffs Rossi's Critical Rate and Critical DMG Dealt at the same time. If COMBO SEQUENCE 2 is cast with perfect timing, it applies 1 more stack of Vulnerability." }
        },
        talents_data: {
            t1: { name: "Nicks and Scratches", lv1: "Battle skill improved: After Wolven Ambrage deals DMG, Rossi applies Razor Clawmark to the target for 15s. This effect cannot stack.", lv2: "Nicks and Scratches" },
            t2: { name: "Promote to E2 to activate the upgraded effect", lv1: "For the duration of Razor Clawmark, the target takes 30% ATK (Rossi's) of Physical DMG per second and suffers Physical DMG Taken and Heat DMG Taken +12%.", lv2: "Promote to E2 to unlock" }
        },
        affinity_bonus: [0, 0, 0, 0, 0],
        getPotentialStats: () => ({}),
        pot_desc: ["Pot 1 (Origin of Admiration): Battle skill Crimson Shadow and combo skill Moment of Blazing Shadow improved: The DMG Multipliers of these skills are increased to 1.15 times of the original.", "Pot 2 (Gap to Perfection): Agility +20, Critical Rate +7%.", "Pot 3 (Tangible Duties): Talent Seething Blood improved: When triggered, it grants Base DMG Multiplier +8% and restores HP +[Intellect × 0.04].", "Pot 4 (Innocent Wish): Ultimate \"Razorclaw\" Ambuscade improved: Ultimate Energy cost -15%.", "Pot 5 (Legendary Destination): Ultimate \"Razorclaw\" Ambuscade improved: DMG Multiplier is increased to 1.1 times of the original; Critical DMG Dealt is increased by +30%."],
        artworks: [],
        intel: {"faction": "Endfield", "race": "Unknown", "expertise": [], "hobbies": []},
        files: "Rossi's combat records."
    },
    {
        id: "002",
        name: "Lifeng",
        english_name: "Lifeng",
        class: "Guard",
        element: "Physical",
        rarity: 6,
        weapon_type: "Polearm",
        img: "lifeng.png",
        audio: "lifeng.mp3",
        description: "Lifeng is a Polearm-wielding guard who deals Physical DMG.",
        trait: "Guards are skilled at making enemies Vulnerable and applying Physical Statuses. They are also good damage dealers.",
        attr_prim: "agility",
        attr_sec: "strength",
        initiates: "None",
        continues: "None",
        breakpoints: {
            1: { hp: 500, attack: 30, strength: 14, agility: 20, intellect: 13, will: 12 },
            70: { hp: 4372, attack: 248, strength: 99, agility: 107, intellect: 92, will: 93 },
            90: { hp: 5495, attack: 312, strength: 123, agility: 132, intellect: 115, will: 117 }
        },
        skills: {
            basic: { name: "Ruination", desc: "BASIC ATTACK: An attack with up to 4 sequences that deals Physical DMG. As the controlled operator, Final Strike also deals 19 Stagger.  DIVE ATTACK: Basic attack performed in mid-air becomes a dive attack that deals Physical DMG to nearby enemies.  FINISHER: Basic attack performed near a Staggered enemy becomes a finisher that deals massive Physical DMG and recovers some SP." },
            active: { name: "Turbid Avatar", desc: "Swings the polearm multiple times to deal 2 hits of Physical DMG, then slams the ground to deal Physical DMG and Knock Down to all enemies in the area of effect. If the enemy struck by the last hit of this skill has no Vulnerability stacks, apply Physical Susceptibility to the said enemy instead." },
            ult: { name: "Heart of the Unmoving", desc: "Unleashes an aspect that performs an Immovable Vajra Slam. The Slam deals Physical DMG and applies Knock Down to all enemies in a large area of effect (AOE), and pulls enemies towards the center of the AOE. After a while, the Slam unleashes one more hit that deals massive Physical DMG and applies another Knock Down to enemies still within its AOE. If the skill consumes a Link, then it deals an additional hit of massive Physical DMG." },
            combo: { name: "Aspect of Wrath", desc: "COMBO TRIGGER: When the controlled operator performs a Final Strike on an enemy with Physical Susceptibility or Breach. Unleashes an aspect that performs a spear thrust to deal Physical DMG and grants Link." }
        },
        talents_data: {
            t1: { name: "Illumination", lv1: "Every point of Intellect and Will further grants ATK +0.10%.", lv2: "Promote to E2 to activate the upgraded effect" },
            t2: { name: "Every point of Intellect and Will further grants ATK +0.15%.", lv1: "Promote to E2 to unlock", lv2: "Subduer of Evil" }
        },
        affinity_bonus: [0, 0, 0, 0, 0],
        getPotentialStats: () => ({}),
        pot_desc: ["Pot 1 (1): Breaking the Obsession", "Pot 2 (Battle skill Turbid Avatar improved: Physical Susceptibility +5%; also triggers this additional effect to enemies with no more than 2 Vulnerability stacks.): 2", "Pot 3 (Self Refinement): All attributes +15.", "Pot 4 (3): Spiritual Cultivation", "Pot 5 (Talent Illumination improved: Every point in the attributes of Intellect and Will grants Lifeng an additional ATK +0.05%.): 4"],
        artworks: [],
        intel: {"faction": "Endfield", "race": "Unknown", "expertise": [], "hobbies": []},
        files: "Lifeng's combat records."
    },
    {
        id: "003",
        name: "Ember",
        english_name: "Ember",
        class: "Defender",
        element: "Heat",
        rarity: 6,
        weapon_type: "Greatsword",
        img: "ember.png",
        audio: "ember.mp3",
        description: "Ember is a Greatsword-wielding defender who deals Heat DMG.",
        trait: "Defenders are extremely tough. They are skilled in protecting and treating their teammates, as well as counterattacking the enemy.",
        attr_prim: "strength",
        attr_sec: "will",
        initiates: "None",
        continues: "None",
        breakpoints: {
            1: { hp: 500, attack: 30, strength: 21, agility: 10, intellect: 9, will: 14 },
            70: { hp: 4372, attack: 251, strength: 132, agility: 74, intellect: 72, will: 95 },
            90: { hp: 5495, attack: 315, strength: 176, agility: 92, intellect: 90, will: 119 }
        },
        skills: {
            basic: { name: "Basic Attack", desc: "Basic attack sequence." },
            active: { name: "Active Skill", desc: "Active combat skill." },
            ult: { name: "Ultimate", desc: "Ultimate ability." },
            combo: { name: "Combo Skill", desc: "Combo execution." }
        },
        talents_data: {
            t1: { name: "Data missing", lv1: "Data missing", lv2: "Data missing" },
            t2: { name: "Data missing", lv1: "Data missing", lv2: "Data missing" }
        },
        affinity_bonus: [0, 0, 0, 0, 0],
        getPotentialStats: () => ({}),
        pot_desc: [],
        artworks: [],
        intel: {"faction": "Endfield", "race": "Unknown", "expertise": [], "hobbies": []},
        files: "Ember's combat records."
    },
    {
        id: "004",
        name: "Gilberta",
        english_name: "Gilberta",
        class: "Supporter",
        element: "Nature",
        rarity: 6,
        weapon_type: "Arts Unit",
        img: "gilberta.png",
        audio: "gilberta.mp3",
        description: "Gilberta is an Arts Unit-wielding supporter who deals Nature DMG.",
        trait: "Supporters are skilled in applying various control effects that weaken the enemy. They can also buff and support their teammates.",
        attr_prim: "will",
        attr_sec: "intellect",
        initiates: "None",
        continues: "None",
        breakpoints: {
            1: { hp: 500, attack: 30, strength: 9, agility: 12, intellect: 16, will: 17 },
            70: { hp: 4372, attack: 258, strength: 71, agility: 82, intellect: 112, will: 123 },
            90: { hp: 5495, attack: 323, strength: 89, agility: 104, intellect: 140, will: 154 }
        },
        skills: {
            basic: { name: "Basic Attack", desc: "Basic attack sequence." },
            active: { name: "Active Skill", desc: "Active combat skill." },
            ult: { name: "Ultimate", desc: "Ultimate ability." },
            combo: { name: "Combo Skill", desc: "Combo execution." }
        },
        talents_data: {
            t1: { name: "Data missing", lv1: "Data missing", lv2: "Data missing" },
            t2: { name: "Data missing", lv1: "Data missing", lv2: "Data missing" }
        },
        affinity_bonus: [0, 0, 0, 0, 0],
        getPotentialStats: () => ({}),
        pot_desc: [],
        artworks: [],
        intel: {"faction": "Endfield", "race": "Unknown", "expertise": [], "hobbies": []},
        files: "Gilberta's combat records."
    },
    {
        id: "005",
        name: "Ardelia",
        english_name: "Ardelia",
        class: "Supporter",
        element: "Nature",
        rarity: 6,
        weapon_type: "Arts Unit",
        img: "ardelia.png",
        audio: "ardelia.mp3",
        description: "Ardelia is an Arts Unit-wielding supporter who deals Nature DMG.",
        trait: "Supporters are skilled in applying various control effects that weaken the enemy. They can also buff and support their teammates.",
        attr_prim: "intellect",
        attr_sec: "will",
        initiates: "None",
        continues: "None",
        breakpoints: {
            1: { hp: 500, attack: 30, strength: 9, agility: 11, intellect: 17, will: 16 },
            70: { hp: 4372, attack: 258, strength: 71, agility: 75, intellect: 123, will: 112 },
            90: { hp: 5495, attack: 323, strength: 89, agility: 95, intellect: 154, will: 140 }
        },
        skills: {
            basic: { name: "Basic Attack", desc: "Basic attack sequence." },
            active: { name: "Active Skill", desc: "Active combat skill." },
            ult: { name: "Ultimate", desc: "Ultimate ability." },
            combo: { name: "Combo Skill", desc: "Combo execution." }
        },
        talents_data: {
            t1: { name: "Data missing", lv1: "Data missing", lv2: "Data missing" },
            t2: { name: "Data missing", lv1: "Data missing", lv2: "Data missing" }
        },
        affinity_bonus: [0, 0, 0, 0, 0],
        getPotentialStats: () => ({}),
        pot_desc: [],
        artworks: [],
        intel: {"faction": "Endfield", "race": "Unknown", "expertise": [], "hobbies": []},
        files: "Ardelia's combat records."
    },
    {
        id: "006",
        name: "Tangtang",
        english_name: "Tangtang",
        class: "Caster",
        element: "Cryo",
        rarity: 6,
        weapon_type: "Handcannons",
        img: "tangtang.png",
        audio: "tangtang.mp3",
        description: "Tangtang is a Handcannon-wielding caster who deals Cryo DMG.",
        trait: "Casters are skilled at applying Arts Inflictions and Arts Reactions. They are also good damage dealers.",
        attr_prim: "agility",
        attr_sec: "strength",
        initiates: "None",
        continues: "None",
        breakpoints: {
            1: { hp: 500, attack: 30, strength: 13, agility: 23, intellect: 8, will: 10 },
            70: { hp: 4372, attack: 255, strength: 98, agility: 144, intellect: 68, will: 81 },
            90: { hp: 5495, attack: 321, strength: 123, agility: 179, intellect: 85, will: 102 }
        },
        skills: {
            basic: { name: "Basic Attack", desc: "Basic attack sequence." },
            active: { name: "Active Skill", desc: "Active combat skill." },
            ult: { name: "Ultimate", desc: "Ultimate ability." },
            combo: { name: "Combo Skill", desc: "Combo execution." }
        },
        talents_data: {
            t1: { name: "Fam of Honor", lv1: "When within a 5-meter radius of a Whirlpool, allied operators gain 10% Haste while enemies suffer 20% Slow. These effects persist for 3s after leaving the area of effect.", lv2: "Promote to E2 to activate the upgraded effect" },
            t2: { name: "When within a 5-meter radius of a Whirlpool, allied operators gain 20% Haste while enemies suffer 40% Slow. These effects persist for 3s after leaving the area of effect.", lv1: "Promote to E2 to unlock", lv2: "Waterspouts created this way have the same effects as those created by the battle skill IMA WAVERIDAAH! and gain DMG Dealt +40%." }
        },
        affinity_bonus: [0, 0, 0, 0, 0],
        getPotentialStats: () => ({}),
        pot_desc: ["Pot 1 (Reserve Hoard): Combo skill RIVER, TO ME! improved: DMG Multiplier is increased to 1.2 times of the original. Length of cooldown -2s.", "Pot 2 (River's Daughter): Agility +20, Cryo DMG Dealt +10%", "Pot 3 (Chiefly Vibe): Battle skill IMA WAVERIDAAH! improved: DMG Multiplier is increased to 1.1 times the original. When forming multiple Waterspouts, the resulting Arts Susceptibility effect is increased by +5%.", "Pot 4 (Qingbo Meditation): Ultimate DA CHIEF SEES YOU! improved: Ultimate Energy cost -15%.", "Pot 5 (Chief's All-Eldritch Gaze): Ultimate DA CHIEF SEES YOU! improved: DMG Multiplier is increased to 1.15 times the original."],
        artworks: [],
        intel: {"faction": "Endfield", "race": "Unknown", "expertise": [], "hobbies": []},
        files: "Tangtang's combat records."
    },
    {
        id: "007",
        name: "Pogranichnik",
        english_name: "Pogranichnik",
        class: "Vanguard",
        element: "Physical",
        rarity: 6,
        weapon_type: "Sword",
        img: "pogranichnik.png",
        audio: "pogranichnik.mp3",
        description: "Pogranichnik is a Sword-wielding vanguard who deals Physical DMG.",
        trait: "Great at recovering Skill Points (SP) to help their teammates' skill casting.",
        attr_prim: "will",
        attr_sec: "agility",
        initiates: "None",
        continues: "None",
        breakpoints: {
            1: { hp: 500, attack: 30, strength: 12, agility: 13, intellect: 10, will: 20 },
            70: { hp: 4372, attack: 255, strength: 81, agility: 88, intellect: 77, will: 138 },
            90: { hp: 5495, attack: 321, strength: 101, agility: 110, intellect: 97, will: 173 }
        },
        skills: {
            basic: { name: "Basic Attack", desc: "Basic attack sequence." },
            active: { name: "Active Skill", desc: "Active combat skill." },
            ult: { name: "Ultimate", desc: "Ultimate ability." },
            combo: { name: "Combo Skill", desc: "Combo execution." }
        },
        talents_data: {
            t1: { name: "The Living Banner", lv1: "During battle, recovering 80 SP with his own skills grants Fervent Morale for 20s.", lv2: "This effect can reach 3 stacks. Duration of each stack is counted separately." },
            t2: { name: "The Living Banner", lv1: "During battle, recovering 80 SP with his own skills grants Fervent Morale for 20s.", lv2: "This effect can reach 3 stacks. Duration of each stack is counted separately." }
        },
        affinity_bonus: [0, 0, 0, 0, 0],
        getPotentialStats: () => ({}),
        pot_desc: ["Pot 1 (Frontline Sweep): Battle skill The Pulverizing Front improved: When hitting at least 2 enemies, 15 SP is returned.", "Pot 2 (\"Advance\"): Will +20, Physical DMG Dealt +10%.", "Pot 3 (When the Banner Flutters): Talent The Living Banner improved: Amount of SP recovery needed to gain Fervent Morale is reduced to 60. Max Fervent Morale stacks on self +2.", "Pot 4 (Shield of Talos-II): Ultimate Shieldguard Banner, Forward improved: Ultimate Energy cost -15%.", "Pot 5 (Newly Forged Blade): Combo skill Full Moon Slash improved: Length of cooldown -2s; SP recovery is increased to 1.2 times the original."],
        artworks: [],
        intel: {"faction": "Endfield", "race": "Unknown", "expertise": [], "hobbies": []},
        files: "Pogranichnik's combat records."
    },
    {
        id: "008",
        name: "Laevatain",
        english_name: "Laevatain",
        class: "Striker",
        element: "Heat",
        rarity: 6,
        weapon_type: "Sword",
        img: "laevatain.png",
        audio: "laevatain.mp3",
        description: "Laevatain is a Sword-wielding striker who deals Heat DMG.",
        trait: "Strikers exploit Physical or Arts effects inflicted by other operators to deal decisive damage.",
        attr_prim: "intellect",
        attr_sec: "strength",
        initiates: "None",
        continues: "None",
        breakpoints: {
            1: { hp: 500, attack: 30, strength: 13, agility: 9, intellect: 22, will: 9 },
            70: { hp: 4372, attack: 253, strength: 97, agility: 79, intellect: 142, will: 71 },
            90: { hp: 5495, attack: 318, strength: 121, agility: 99, intellect: 177, will: 89 }
        },
        skills: {
            basic: { name: "Basic Attack", desc: "Basic attack sequence." },
            active: { name: "Active Skill", desc: "Active combat skill." },
            ult: { name: "Ultimate", desc: "Ultimate ability." },
            combo: { name: "Combo Skill", desc: "Combo execution." }
        },
        talents_data: {
            t1: { name: "Scorching Heart", lv1: "After the controlled operator's Final Strike or Finisher hits the enemy, Laevatain absorbs Heat Infliction from nearby enemies.", lv2: "After reaching 4 stacks, DMG dealt by Laevatain ignores 10 Heat Resistance of the enemy for 20s." },
            t2: { name: "Laevatain also absorbs Heat Infliction from enemies defeated nearby.", lv1: "Promote to E1 to activate the upgraded effect", lv2: "Every stack of Heat Infliction absorbed gives Laevatain 1 stack of Melting Flame (max stacks: 4)." }
        },
        affinity_bonus: [0, 0, 0, 0, 0],
        getPotentialStats: () => ({}),
        pot_desc: ["Pot 1 (Heart of Melting Flame): Battle skill Smouldering Fire improved: Additional attack multiplier is increased to 1.2 times the original, and scoring a hit returns 20 SP.", "Pot 2 (Pursuit of Memories): Intellect +20, Basic Attack DMG Dealt +15%.", "Pot 3 (Fragments from the Past): Battle skill Smouldering Fire improved: Duration of the Combustion applied by the skill is increased by 50%. DMG of the Combustion applied by the skills is increased to 1.5 times the original.", "Pot 4 (Ice Cream Furnace): Ultimate Twilight improved: Ultimate Energy cost -15%.", "Pot 5 (Proof of Existence): Ultimate Twilight improved: Enhanced basic attack DMG multiplier is increased to 1.2 times the original; during the ultimate, every enemy defeated by Laevatain extends ultimate duration by +1s (max: +7s)."],
        artworks: [],
        intel: {"faction": "Endfield", "race": "Unknown", "expertise": [], "hobbies": []},
        files: "Laevatain's combat records."
    },
    {
        id: "009",
        name: "Last Rite",
        english_name: "Last Rite",
        class: "Striker",
        element: "Cryo",
        rarity: 6,
        weapon_type: "Greatsword",
        img: "lastrite.png",
        audio: "lastrite.mp3",
        description: "Last Rite is a Greatsword-wielding striker who deals Cryo DMG.",
        trait: "Strikers exploit Physical or Arts effects inflicted by other operators to deal decisive damage.",
        attr_prim: "strength",
        attr_sec: "will",
        initiates: "None",
        continues: "None",
        breakpoints: {
            1: { hp: 500, attack: 30, strength: 21, agility: 8, intellect: 9, will: 15 },
            70: { hp: 4372, attack: 264, strength: 125, agility: 82, intellect: 74, will: 88 },
            90: { hp: 5495, attack: 332, strength: 155, agility: 104, intellect: 93, will: 109 }
        },
        skills: {
            basic: { name: "Basic Attack", desc: "Basic attack sequence." },
            active: { name: "Active Skill", desc: "Active combat skill." },
            ult: { name: "Ultimate", desc: "Ultimate ability." },
            combo: { name: "Combo Skill", desc: "Combo execution." }
        },
        talents_data: {
            t1: { name: "Hypothermia", lv1: "After Last Rite consumes any Arts Infliction, she applies Cryo Susceptibility to the target with the effect of [Number of Arts Infliction stacks consumed × 2%] for 15s. This effect cannot stack.", lv2: "Promote to E2 to activate the upgraded effect" },
            t2: { name: "After Last Rite consumes any Arts Infliction, she applies Cryo Susceptibility to the target with the effect of [Number of Arts Infliction stacks consumed × 4%] for 15s. This effect cannot stack.", lv1: "Promote to E2 to unlock", lv2: "Cryogenic Embrittlement" }
        },
        affinity_bonus: [0, 0, 0, 0, 0],
        getPotentialStats: () => ({}),
        pot_desc: ["Pot 1 (Undertaker's Gift): When the controlled operator with Hypothermic Perfusion performs a Final Strike that hits the enemy, it deals another 20% DMG and 5 Stagger.", "Pot 2 (Absolute Zero Armament): Strength +20, Cryo DMG Dealt +10%.", "Pot 3 (Overlord of Winter): Combo skill Winter's Devourer and ultimate Vigil Services improved: DMG multiplier increased to 1.15 times the original.", "Pot 4 (Sincere Wake): Ultimate Vigil Services improved: Ultimate Energy cost -15%.", "Pot 5 (Winter is Returning): Battle skill Esoteric Legacy of Seš'qa improved: Amount of SP returned is increased by another 5; Mirage Additional ATK Multiplier is increased to 1.2 times the original."],
        artworks: [],
        intel: {"faction": "Endfield", "race": "Unknown", "expertise": [], "hobbies": []},
        files: "Last Rite's combat records."
    },
    {
        id: "010",
        name: "Yvonne",
        english_name: "Yvonne",
        class: "Striker",
        element: "Cryo",
        rarity: 6,
        weapon_type: "Handcannons",
        img: "yvonne.png",
        audio: "yvonne.mp3",
        description: "Yvonne is a Handcannon-wielding caster who deals Cryo DMG.",
        trait: "Strikers exploit Physical or Arts effects inflicted by other operators to deal decisive damage.",
        attr_prim: "intellect",
        attr_sec: "agility",
        initiates: "None",
        continues: "None",
        breakpoints: {
            1: { hp: 500, attack: 30, strength: 8, agility: 14, intellect: 24, will: 10 },
            70: { hp: 4372, attack: 255, strength: 65, agility: 102, intellect: 142, will: 83 },
            90: { hp: 5495, attack: 321, strength: 82, agility: 128, intellect: 176, will: 105 }
        },
        skills: {
            basic: { name: "Basic Attack", desc: "Basic attack sequence." },
            active: { name: "Active Skill", desc: "Active combat skill." },
            ult: { name: "Ultimate", desc: "Ultimate ability." },
            combo: { name: "Combo Skill", desc: "Combo execution." }
        },
        talents_data: {
            t1: { name: "Barrage of Technology", lv1: "Battle skill Brr-Brr-Bomb β improved: After applying Solidification, the next basic attack performed becomes a Final Strike.", lv2: "Promote to E2 to activate the upgraded effect" },
            t2: { name: "Battle skill Brr-Brr-Bomb β improved: After applying Solidification, the next basic attack directly becomes a Final Strike with DMG Dealt +50%.", lv1: "Promote to E2 to unlock", lv2: "Freezing Point" }
        },
        affinity_bonus: [0, 0, 0, 0, 0],
        getPotentialStats: () => ({}),
        pot_desc: ["Pot 1 (Flash Freezer): Combo skill Flashfreezer υ37 improved: Effect radius +20%; releases energy 2 more times; and gains an additional 15 Ultimate Energy after dealing DMG.", "Pot 2 (Flawless Creation): Intellect +20, Critical Rate +7%.", "Pot 3 (Tink-a-Power): Talent Freezing Point improved: Against enemies with Cryo Infliction, Critical DMG Dealt +10%; this effect is also doubled against enemies with Solidification.", "Pot 4 (Rebellious Mood): Battle skill Brr-Brr-Bomb β improved: If the explosion hits only one enemy, return 10 SP.", "Pot 5 (Expert Mechcrafter): Ultimate Cryoblasting Pistolier improved: During the ultimate, ATK +10% and Critical DMG Dealt +30%."],
        artworks: [],
        intel: {"faction": "Endfield", "race": "Unknown", "expertise": [], "hobbies": []},
        files: "Yvonne's combat records."
    },
    {
        id: "011",
        name: "Zhuang Fangyi",
        english_name: "Zhuang Fangyi",
        class: "Striker",
        element: "Electric",
        rarity: 6,
        weapon_type: "Arts Unit",
        img: "zhuangfangyi.png",
        audio: "zhuangfangyi.mp3",
        description: "Zhuang Fangyi is a striker who wields Arts Units and deals Electric DMG.",
        trait: "Strikers exploit Physical or Arts effects inflicted by other operators to deal decisive damage.",
        attr_prim: "will",
        attr_sec: "intellect",
        initiates: "None",
        continues: "None",
        breakpoints: {
            1: { hp: 500, attack: 30, strength: 10, agility: 10, intellect: 17, will: 24 },
            70: { hp: 4372, attack: 260, strength: 79, agility: 79, intellect: 99, will: 148 },
            90: { hp: 5495, attack: 326, strength: 99, agility: 99, intellect: 123, will: 184 }
        },
        skills: {
            basic: { name: "Jolting Arts", desc: "BASIC ATTACK: An attack with up to 5 sequences that deals Electric DMG. As the controlled operator, Final Strike also deals 18 Stagger.  DIVE ATTACK: Basic attack performed in mid-air becomes a dive attack that deals Electric DMG to nearby enemies.  FINISHER: Basic attack performed near a Staggered enemy becomes a finisher that deals massive Electric DMG and recovers some SP." },
            active: { name: "Mantra of Sundering", desc: "Consumes the target's Electrification to increase the DMG multiplier of this battle skill and create [Status Level of Electrification consumed +1] Sunderblades. If the battlefield has fewer than 3 Sunderblades, Mantra of Sundering can still create 1 Sunderblade, even if it does not consume any target's Electrification. Zhuang Fangyi then channels all Sunderblades nearby to successively unleash Thunder Strikes on the target, dealing Electric DMG and giving bonus Ultimate Energy, with the final Thunder Strike dealing 6 times the DMG. A single battle skill casting can only create a max of 3 Sunderblades." },
            ult: { name: "Smiting Tempest", desc: "Transforms into the Empyrean of Truth that grants these enhancements: Zhuang Fangyi's basic attacks are enhanced and her actions are harder to interrupt; Battle skill Mantra of Sundering gains a higher DMG multiplier and an increased effect range, and the final Thunder Strike also applies Electric Infliction to the target hit. Combo skill Breath of Transformation gains a higher DMG multiplier, cooldown becomes 4 times faster, and effects are applied to enemies within a small area. The first casting of the battle skill Mantra of Sundering does not consume SP nor Electrification, and if a target is available, the battle skill is guaranteed to create 3 Sunderblades even if the target has no Electrification." },
            combo: { name: "Breath of Transformation", desc: "COMBO TRIGGER: When the controlled operator's Final Strike or Finisher hits an enemy with Electric Infliction. Zhuang Fangyi creates a Xiranblitz Array that attacks the enemy and deals Electric DMG. If the Array hits an enemy that has Electric Infliction stack(s), then it will consume the said Electric Infliction stack(s), forcibly apply Electrification, and give Ultimate Energy based on the number of stacks consumed. If Electrification is forcibly applied to an enemy that already has Electrification, then apply Status Level +1 to the enemy's Electrification." }
        },
        talents_data: {
            t1: { name: "Force of Nature", lv1: "Battle skill Mantra of Sundering improved: Casting the battle skill grants Zhuang Fangyi 9% Electric Amp for 5s.", lv2: "Every casting of the battle skill Mantra of Sundering again resets this Electric Amp effect." },
            t2: { name: "Force of Nature", lv1: "Battle skill Mantra of Sundering improved: Casting the battle skill grants Zhuang Fangyi 18% Electric Amp for 5s.", lv2: "Every casting of the battle skill Mantra of Sundering again resets this Electric Amp effect." }
        },
        affinity_bonus: [0, 0, 0, 0, 0],
        getPotentialStats: () => ({}),
        pot_desc: ["Pot 1 (Four Symbols of Harmony): Battle skill Mantra of Sundering improved: DMG multiplier is increased to 1.15 times the original. After entering battle, Zhuang Fangyi's first battle skill casting also creates 1 more Sunderblade.", "Pot 2 (Acuity of Fine Details): Will +20, Battle Skill DMG Dealt +15%.", "Pot 3 (Sense and Response): Battle skill Mantra of Sundering improved: After consuming Electrification, the battle skill returns 10 SP. Sunderblade duration +10s.", "Pot 4 (Absolute Composure): Ultimate Smiting Tempest improved: Ultimate Energy cost -15%.", "Pot 5 (Storm of Transformation): During the Empyrean of Truth transformation, DMG Dealt by Zhuang Fangyi ignores 15 of the enemy's Electric Resistance."],
        artworks: [],
        intel: {"faction": "Endfield", "race": "Unknown", "expertise": [], "hobbies": []},
        files: "Zhuang Fangyi's combat records."
    },
    {
        id: "012",
        name: "Mi Fu",
        english_name: "Mi Fu",
        class: "Guard",
        element: "Physical",
        rarity: 6,
        weapon_type: "Greatsword",
        img: "mifu.png",
        audio: "mifu.mp3",
        description: "Mi Fu is a Greatsword-wielding guard. She deals Physical DMG.",
        trait: "Guards are skilled at making enemies Vulnerable and applying Physical Statuses. They are also good damage dealers.",
        attr_prim: "strength",
        attr_sec: "will",
        initiates: "None",
        continues: "None",
        breakpoints: {
            1: { hp: 500, attack: 30, strength: 22, agility: 10, intellect: 9, will: 14 },
            70: { hp: 4372, attack: 251, strength: 139, agility: 74, intellect: 72, will: 95 },
            90: { hp: 5495, attack: 315, strength: 173, agility: 92, intellect: 90, will: 119 }
        },
        skills: {
            basic: { name: "Fistmancer of Blades", desc: "BASIC ATTACK: An attack with up to 4 sequences that deals Physical DMG. As the controlled operator, Final Strike also deals 25 Stagger.  DIVE ATTACK: Basic attack performed in mid-air becomes a dive attack that deals Physical DMG to nearby enemies.  FINISHER: Basic attack performed near a Staggered enemy becomes a finisher that deals massive Physical DMG and recovers some SP." },
            active: { name: "Keep casting Mi Fu's battle skill to unleash 3 different moves. The first battle skill cast is Cloudtrapper.", desc: "" },
            ult: { name: "Pile of No Mercy", desc: "After a short power up, Mi Fu dashes forward to forcibly Lift a target into mid-air, then slams the said target to deal Physical DMG. After casting this skill, the next battle skill is temporarily replaced with Trail and Mangle." },
            combo: { name: "Fists of No Regrets", desc: "COMBO TRIGGER: When an enemy has 3 or more Vulnerability stacks. Mi Fu unleashes a devastating uppercut at the enemy, dealing Physical DMG and applying temporary Physical Susceptibility. After casting this skill, the next battle skill is temporarily replaced with Trail and Mangle." }
        },
        talents_data: {
            t1: { name: "", lv1: "Promote to E1 to unlock", lv2: "Stern Crackdown" },
            t2: { name: "Promote to E2 to activate the upgraded effect", lv1: "Vigilant Fury", lv2: "Combo skill improved: Casting the combo creates a shield with 15% Max HP and a duration of 10s. While the shield is active, Mi Fu becomes harder to interrupt." }
        },
        affinity_bonus: [0, 0, 0, 0, 0],
        getPotentialStats: () => ({}),
        pot_desc: ["Pot 1 (Restless Watch): Combo skill Fists of No Regrets improved: Length of cooldown -2s. Physical Susceptibility effect applied by the skill is further increased by +5% and has +4s duration.", "Pot 2 (Kinesthesia of Harmony): Strength +20, Arts Intensity +16.", "Pot 3 (Complete Warmup): Talent Vigilant Fury improved: Shield duration +5s. Shield trigger cooldown -15s. Each time the shield is triggered, Mi Fu gains ATK +6% for 20s.", "Pot 4 (Qi Thrice-Refined): Ultimate Pile of No Mercy improved: Ultimate Energy cost -15%.", "Pot 5 (Pugilist of the Stockade): Battle skill improved: DMG Multipliers of the moves Cloudtrapper, Trail and Mangle, and World Splitter are increased to 1.1 times the original. Ultimate Pile of No Mercy improved: Stagger Dealt +5."],
        artworks: [],
        intel: {"faction": "Endfield", "race": "Unknown", "expertise": [], "hobbies": []},
        files: "Mi Fu's combat records."
    },
    {
        id: "013",
        name: "Camille",
        english_name: "Camille",
        class: "Vanguard",
        element: "Heat",
        rarity: 6,
        weapon_type: "Polearm",
        img: "camille.png",
        audio: "camille.mp3",
        description: "Camille is a polearm-wielding vanguard who deals Heat DMG.",
        trait: "Great at recovering Skill Points (SP) to help their teammates' skill casting.",
        attr_prim: "agility",
        attr_sec: "intellect",
        initiates: "None",
        continues: "None",
        breakpoints: {
            1: { hp: 500, attack: 30, strength: 13, agility: 17, intellect: 14, will: 11 },
            70: { hp: 4372, attack: 251, strength: 82, agility: 128, intellect: 103, will: 73 },
            90: { hp: 5495, attack: 315, strength: 102, agility: 160, intellect: 129, will: 92 }
        },
        skills: {
            basic: { name: "Sanguine Absolution", desc: "BASIC ATTACK: An attack with up to 5 sequences that deals Heat DMG. As the controlled operator, Final Strike also deals 18 Stagger.  DIVE ATTACK: Basic attack performed in mid-air becomes a dive attack that deals Heat DMG to nearby enemies.  FINISHER: Basic attack performed near a Staggered enemy becomes a finisher that deals massive Heat DMG and recovers some SP." },
            active: { name: "Blazing Exorcism", desc: "Camille summons Firefang Vesperwings that fly towards the enemy to deal Heat DMG and apply Heat Infliction on enemies in a small area of effect. The Firefang Vesperwings then temporarily hover around the target and apply Weakness and Heat Susceptibility to the said target for the duration of the hovering. When the target is defeated, the Firefang Vesperwings fly to another nearby enemy, deal Heat DMG, and apply Heat Infliction, Weakness, and Heat Susceptibility to the new target. Hitting an enemy with hovering Firefang Vesperwings with Camille's combo skill sets off an explosion after a short delay. This explosion deals additional Heat DMG." },
            ult: { name: "Sanguine Downpour", desc: "Camille flies to the sky, rains down a barrage of spears, and follows through with a sweep attack. This deals Heat DMG and applies Heat Infliction to target(s) hit while recovering some SP. After casting the ultimate, Camille's battle skill is temporarily transformed into Hunter Pursuit. Hunter Pursuit: Treated as a combo skill and costs no SP. It is a dash attack that deals Heat DMG and recovers some SP." },
            combo: { name: "Heartstake Thorn", desc: "COMBO TRIGGER: When an enemy's Heat Infliction is consumed or absorbed. Performs a returning dash that deals Heat DMG and recovers some SP." }
        },
        talents_data: {
            t1: { name: "", lv1: "Promote to E1 to unlock", lv2: "Hunter of Transgression" },
            t2: { name: "Promote to E2 to activate the upgraded effect", lv1: "Bloodfount Revival", lv2: "Whenever Camille restores HP via a skill, he gains Heat DMG Dealt +2% (max stacks: 5) for 40s while other operators in the team gain 25% of this effect. This effect can reach 5 stacks." }
        },
        affinity_bonus: [0, 0, 0, 0, 0],
        getPotentialStats: () => ({}),
        pot_desc: ["Pot 1 (Flame-Anointed Lance): Battle skill Blazing Exorcism improved: The skill applies Weakness +5% and Heat Susceptibility +5%. Firefang Vesperwings hover duration +15s.", "Pot 2 (Tracker of Witch Scent): Agility +20, Intellect +20.", "Pot 3 (Thorned Incapacitor): Combo skill Heartstake Thorn improved: Length of cooldown -2s. Heartstake Thorn and Hunter Pursuit improved: DMG Multipliers are increased to 1.3 times the original; SP Recoveries are increased to 1.15 times the original.", "Pot 4 (Agašlehem's Sigil): Ultimate Sanguine Downpour improved: Ultimate Energy cost -15%.", "Pot 5 (Sanguine Convention): Talent Bloodfount Revival improved: Heat DMG boost per stack +6%."],
        artworks: [],
        intel: {"faction": "Endfield", "race": "Unknown", "expertise": [], "hobbies": []},
        files: "Camille's combat records."
    },
    {
        id: "014",
        name: "Endministrator",
        english_name: "Endministrator",
        class: "Guard",
        element: "Physical",
        rarity: 6,
        weapon_type: "Sword",
        img: "endministrator.png",
        audio: "endministrator.mp3",
        description: "The Endministrator is a Sword-wielding guard who deals Physical DMG.",
        trait: "Guards are skilled at making enemies Vulnerable and applying Physical Statuses. They are also good damage dealers.",
        attr_prim: "agility",
        attr_sec: "strength",
        initiates: "None",
        continues: "None",
        breakpoints: {
            1: { hp: 500, attack: 30, strength: 14, agility: 14, intellect: 9, will: 10 },
            70: { hp: 4372, attack: 254, strength: 99, agility: 112, intellect: 77, will: 85 },
            90: { hp: 5495, attack: 319, strength: 123, agility: 140, intellect: 96, will: 107 }
        },
        skills: {
            basic: { name: "Destructive Sequence", desc: "BASIC ATTACK: An attack with up to 5 sequences that deals Physical DMG. As the controlled operator, Final Strike also deals 18 Stagger.  DIVE ATTACK: Basic attack performed in mid-air becomes a dive attack that deals Physical DMG to nearby enemies.  FINISHER: Basic attack performed near a Staggered enemy becomes a finisher attack that deals massive Physical DMG and recovers some SP." },
            active: { name: "Constructive Sequence", desc: "A forceful burst of Originium Arts that attacks enemies within the area of effect. Deals Physical DMG and applies Crush." },
            ult: { name: "Bombardment Sequence", desc: "Bombards the ground with Originium Arts, dealing massive Physical DMG to all enemies within a fan-shaped area. If the enemy has Originium Crystals on them, this skill consumes the Originium Crystals and deals one more hit of Physical DMG." },
            combo: { name: "Sealing Sequence", desc: "COMBO TRIGGER: When another operator in the team deals DMG with combo skills. Rushes to the enemy's side to deal Physical DMG and attach Originium Crystals that temporarily seal them. Applying Physical Status or Vulnerability to the sealed enemy consumes the Originium Crystals and deals additional Physical DMG." }
        },
        talents_data: {
            t1: { name: "", lv1: "Promote to E1 to unlock", lv2: "Essence Disintegration" },
            t2: { name: "Promote to E2 to activate the upgraded effect", lv1: "Realspace Stasis", lv2: "Enemies with attached Originium Crystals suffer Physical DMG Taken +10%." }
        },
        affinity_bonus: [0, 0, 0, 0, 0],
        getPotentialStats: () => ({}),
        pot_desc: ["Pot 1 (Final Awakening): Battle skill Constructive Sequence improved: Consuming Originium Crystals returns 50 SP.", "Pot 2 (Reflection of Authority): Talent Essence Disintegration improved: When the Endministrator gains the ATK buff, other allied operators gain half of this ATK buff.", "Pot 3 (The Guide): Ultimate Bombardment Sequence improved: After consuming Originium Crystals, the Endministrator gains 15 Ultimate Energy.", "Pot 4 (???): ???", "Pot 5 (???): ???"],
        artworks: [],
        intel: {"faction": "Endfield", "race": "Unknown", "expertise": [], "hobbies": []},
        files: "Endministrator's combat records."
    },
    {
        id: "015",
        name: "Chen Qianyu",
        english_name: "Chen Qianyu",
        class: "Guard",
        element: "Physical",
        rarity: 5,
        weapon_type: "Sword",
        img: "chenqianyu.png",
        audio: "chenqianyu.mp3",
        description: "Chen Qianyu is a Sword-wielding guard who deals Physical DMG.",
        trait: "Guards are skilled at making enemies Vulnerable and applying Physical Statuses. They are also good damage dealers.",
        attr_prim: "agility",
        attr_sec: "strength",
        initiates: "None",
        continues: "None",
        breakpoints: {
            1: { hp: 500, attack: 30, strength: 10, agility: 20, intellect: 8, will: 9 },
            70: { hp: 4372, attack: 237, strength: 85, agility: 137, intellect: 68, will: 74 },
            90: { hp: 5495, attack: 297, strength: 106, agility: 171, intellect: 85, will: 93 }
        },
        skills: {
            basic: { name: "Soaring Break", desc: "BASIC ATTACK: An attack with up to 5 sequences that deals Physical DMG. As the controlled operator, Final Strike also deals 16 Stagger.  DIVE ATTACK: Basic attack performed in mid-air becomes a dive attack that deals Physical DMG to nearby enemies.  FINISHER: Basic attack performed near a Staggered enemy becomes a finisher attack that deals massive Physical DMG and recovers some SP." },
            active: { name: "Ascending Strike", desc: "Performs an uppercut slash at the target enemy, dealing Physical DMG and Lift." },
            ult: { name: "Blade Gale", desc: "A 7-sequence slash attack that deals Physical DMG with each sequence to the target enemy. The final slash sequence deals even more DMG." },
            combo: { name: "Soar to the Stars", desc: "COMBO TRIGGER: When an enemy becomes Vulnerable. A slashing dash that passes through the target enemy and deals Physical DMG and Lift to all enemies along the way." }
        },
        talents_data: {
            t1: { name: "Slashing Edge", lv1: "After hitting an enemy with skills, Chen gains ATK +4% for 10s. This effect can reach 5 stacks.", lv2: "Promote to E2 to activate the upgraded effect" },
            t2: { name: "After hitting an enemy with skills, Chen gains ATK +8% for 10s. This effect can reach 5 stacks.", lv1: "Promote to E2 to unlock", lv2: "Momentum Breaker" }
        },
        affinity_bonus: [0, 0, 0, 0, 0],
        getPotentialStats: () => ({}),
        pot_desc: ["Pot 1 (\"Shadowless\"): DMG Dealt +20% to enemies below 50% HP.", "Pot 2 (Heirloom Martial Arts): Agility +15, Physical DMG Dealt +8%.", "Pot 3 (Dual-Wielding Swordmancer): Battle skill Ascending Strike, combo skill Soar to the Stars, and ultimate Blade Gale improved: DMG Multiplier is increased to 1.1 times the original.", "Pot 4 (Improvised Chi Xiao): Ultimate Blade Gale improved: Ultimate Energy cost -15%.", "Pot 5 (Bonded with the World): Combo skill Soar to the Stars improved: Length of cooldown -3s."],
        artworks: [],
        intel: {"faction": "Endfield", "race": "Unknown", "expertise": [], "hobbies": []},
        files: "Chen Qianyu's combat records."
    },
    {
        id: "016",
        name: "Snowshine",
        english_name: "Snowshine",
        class: "Defender",
        element: "Cryo",
        rarity: 5,
        weapon_type: "Greatsword",
        img: "snowshine.png",
        audio: "snowshine.mp3",
        description: "Snowshine is a Greatsword-wielding defender who deals Cryo DMG.",
        trait: "Defenders are extremely tough. They are skilled in protecting and treating their teammates, as well as counterattacking the enemy.",
        attr_prim: "strength",
        attr_sec: "will",
        initiates: "None",
        continues: "None",
        breakpoints: {
            1: { hp: 500, attack: 30, strength: 18, agility: 12, intellect: 9, will: 10 },
            70: { hp: 4372, attack: 237, strength: 124, agility: 83, intellect: 74, will: 86 },
            90: { hp: 5495, attack: 297, strength: 154, agility: 104, intellect: 93, will: 108 }
        },
        skills: {
            basic: { name: "Hypothermic Assault", desc: "BASIC ATTACK: An attack with up to 3 sequences that deals Physical DMG. As the controlled operator, Final Strike also deals 23 Stagger.  DIVE ATTACK: Basic attack performed in mid-air becomes a dive attack that deals Physical DMG to nearby enemies.  FINISHER: Basic attack performed near a Staggered enemy becomes a finisher attack that deals massive Physical DMG and recovers some SP." },
            active: { name: "Saturated Defense", desc: "Raises a shield that can block attacks, grants Protection to self and nearby operators, and immediately returns some SP. When attacked while the said shield is raised, perform a retaliation bash that deals Cryo DMG and applies Cryo Infliction on the attacker." },
            ult: { name: "Frigid Snowfield", desc: "Leaps into mid-air with a jetpack before slamming down with her shield to deal massive Cryo DMG to enemies in the area of effect. Also generates a Snow Zone (lasting several seconds) that deals Cryo DMG over time to enemies. The Snow Zone forcibly applies Solidification to enemies caught within it for a certain duration." },
            combo: { name: "Polar Rescue", desc: "COMBO TRIGGER: After controlled operator gets attacked and drops below 60% HP. Snowshine throws a Snowfield SAR Assistant at the controlled operator. Upon target contact, the Assistant gives massive instant HP Treatment to nearby operators as well as continuous HP Treatment to operators in the area of effect. The attribute of Will increases the amount of HP treatment." }
        },
        talents_data: {
            t1: { name: "Polar Survival", lv1: "Treatment Effect +15% for targets of 45% HP or below.", lv2: "Promote to E2 to activate the upgraded effect" },
            t2: { name: "Treatment Effect +25% for targets of 55% HP or below.", lv1: "Promote to E2 to unlock", lv2: "SAR Professional" }
        },
        affinity_bonus: [0, 0, 0, 0, 0],
        getPotentialStats: () => ({}),
        pot_desc: ["Pot 1 (Cold Shelter): Battle skill Saturated Defense improved: During the blocking effect, Arts Inflictions cannot be applied to allied operators with Protection.", "Pot 2 (Storm Region): Ultimate Frigid Snowfield improved: Effect radius +20%.", "Pot 3 (Polar Survival Guide): Ultimate Frigid Snowfield improved: Duration of the Solidification applied by the skill is increased by 2s.", "Pot 4 (Tundra Aegis): DEF +20, Will +20.", "Pot 5 (Cold Disaster Specialist): Battle skill Saturated Defense improved: Successfully retaliating an enemy attack returns 10 SP."],
        artworks: [],
        intel: {"faction": "Endfield", "race": "Unknown", "expertise": [], "hobbies": []},
        files: "Snowshine's combat records."
    },
    {
        id: "017",
        name: "Xaihi",
        english_name: "Xaihi",
        class: "Supporter",
        element: "Cryo",
        rarity: 5,
        weapon_type: "Arts Unit",
        img: "xaihi.png",
        audio: "xaihi.mp3",
        description: "Xaihi is an Arts Unit-wielding supporter who deals Cryo DMG.",
        trait: "Supporters are skilled in applying various control effects that weaken the enemy. They can also buff and support their teammates.",
        attr_prim: "will",
        attr_sec: "intellect",
        initiates: "None",
        continues: "None",
        breakpoints: {
            1: { hp: 500, attack: 30, strength: 9, agility: 9, intellect: 15, will: 15 },
            70: { hp: 4372, attack: 232, strength: 71, agility: 73, intellect: 102, will: 119 },
            90: { hp: 5495, attack: 291, strength: 89, agility: 91, intellect: 127, will: 150 }
        },
        skills: {
            basic: { name: "Cooldown", desc: "BASIC ATTACK: An attack with up to 5 sequences that deals Cryo DMG. As the controlled operator, Final Strike also deals 15 Stagger.  DIVE ATTACK: Basic attack performed in mid-air becomes a dive attack that deals Cryo DMG to nearby enemies.  FINISHER: Basic attack performed near a Staggered enemy becomes a finisher that deals massive Cryo DMG and recovers some SP." },
            active: { name: "Distributed DoS", desc: "Summons an Auxiliary Crystal that orbits the controlled operator for a while. After the controlled operator performs a Final Strike on the enemy, the Auxiliary Crystal will restore the said operator's HP. This effect can trigger 2 times. The attribute of Will increases the amount of HP treatment. When the controlled operator is already at Max HP when triggering the HP restoration, grant the said operator a temporary Arts Amp as well. This effect cannot stack." },
            ult: { name: "Stack Overflow", desc: "Applies temporary Cryo Amp and Nature Amp to the entire team. The attribute of Intellect increases the Amp effect." },
            combo: { name: "Stress Testing", desc: "COMBO TRIGGER: When the Auxiliary Crystal uses up its HP treatments. Quickly charges up the Auxiliary Crystal and launches it at the enemy to deal Cryo DMG and Cryo Infliction." }
        },
        talents_data: {
            t1: { name: "Execute Process", lv1: "Combo skill Stress Testing improved: Hitting an enemy with Cryo Infliction or Solidification also causes the enemy to suffer Cryo DMG Taken +7% for 5s. This effect cannot stack.", lv2: "Promote to E2 to activate the upgraded effect" },
            t2: { name: "Combo skill Stress Testing improved: Hitting an enemy with Cryo Infliction or Solidification also causes the enemy to suffer Cryo DMG Taken +10% for 5s. This effect cannot stack.", lv1: "Promote to E3 to unlock", lv2: "" }
        },
        affinity_bonus: [0, 0, 0, 0, 0],
        getPotentialStats: () => ({}),
        pot_desc: ["Pot 1 (Agile Execution): Arts Amp granted by the Auxiliary Crystal is increased by another 5%.", "Pot 2 (Link Aggregation): Ultimate Stack Overflow improved: Ultimate Energy cost -10%.", "Pot 3 (Mapping Node): Combo skill Stress Testing improved: When hitting the target, the hit chains 1 time to 1 additional target nearby.", "Pot 4 (Grayscale Release): Intellect +15, Treatment Efficiency +10%.", "Pot 5 (Controlled Recursion): Ultimate Stack Overflow improved: Amp effect is increased to 1.1 times the original."],
        artworks: [],
        intel: {"faction": "Endfield", "race": "Unknown", "expertise": [], "hobbies": []},
        files: "Xaihi's combat records."
    },
    {
        id: "018",
        name: "Perlica",
        english_name: "Perlica",
        class: "Caster",
        element: "Electric",
        rarity: 5,
        weapon_type: "Arts Unit",
        img: "perlica.png",
        audio: "perlica.mp3",
        description: "Perlica is an Arts Unit-wielding caster who deals Electric DMG.",
        trait: "Casters are skilled at applying Arts Inflictions and Arts Reactions. They are also good damage dealers.",
        attr_prim: "intellect",
        attr_sec: "will",
        initiates: "None",
        continues: "None",
        breakpoints: {
            1: { hp: 500, attack: 30, strength: 9, agility: 9, intellect: 21, will: 13 },
            70: { hp: 4372, attack: 242, strength: 73, agility: 74, intellect: 130, will: 91 },
            90: { hp: 5495, attack: 303, strength: 91, agility: 93, intellect: 161, will: 113 }
        },
        skills: {
            basic: { name: "Protocol α: Breach", desc: "BASIC ATTACK: An attack with up to 4 sequences that deals Electric DMG. As the controlled operator, Final Strike also deals 15 Stagger.  DIVE ATTACK: Basic attack performed in mid-air becomes a dive attack that deals Electric DMG to nearby enemies.  FINISHER: Basic attack performed near a Staggered enemy becomes a finisher that deals massive Electric DMG and recovers some SP." },
            active: { name: "Protocol ω: Strike", desc: "Unleashes a bolt of electro-magnetic energy that deals Electric DMG and Electric Infliction to enemies in a small area." },
            ult: { name: "Protocol ε: 70.41K", desc: "Tele-protocols a massive piece of orbital debris into the battlefield with devastating impact. All enemies in the area of effect suffer massive Electric DMG." },
            combo: { name: "Instant Protocol: Chain", desc: "COMBO TRIGGER: When controlled operator performs a Final Strike on any enemy. Unleashes stored electro-magnetic energy to bombard the target, dealing Electric DMG and forcibly inflicting temporary Electrification." }
        },
        talents_data: {
            t1: { name: "Obliteration Protocol", lv1: "DMG Dealt +20% to Staggered enemies.", lv2: "Promote to E2 to activate the upgraded effect" },
            t2: { name: "DMG Dealt +30% to Staggered enemies.", lv1: "Promote to E3 to unlock", lv2: "" }
        },
        affinity_bonus: [0, 0, 0, 0, 0],
        getPotentialStats: () => ({}),
        pot_desc: ["Pot 1 (Crisis Handling): Combo skill Instant Protocol: Chain improved: Electrification duration +75%.", "Pot 2 (Negotiation Tactics): Ultimate Protocol ε: 70.41K improved: Ultimate Energy cost -15%.", "Pot 3 (Supervisory Duties): After Perlica applies Electrification to the enemy, she gains ATK +20% for 5s. This effect can reach 2 stacks.", "Pot 4 (Constant Guidance): Combo skill Instant Protocol: Chain improved: The Arts DMG Taken debuff effects on the enemy applied by the skill's Electrification are increased to 1.33 times the original.", "Pot 5 (Reentry Control): Ultimate Protocol ε: 70.41K improved: Critical Rate +30%."],
        artworks: [],
        intel: {"faction": "Endfield", "race": "Unknown", "expertise": [], "hobbies": []},
        files: "Perlica's combat records."
    },
    {
        id: "019",
        name: "Wulfgard",
        english_name: "Wulfgard",
        class: "Caster",
        element: "Heat",
        rarity: 5,
        weapon_type: "Handcannons",
        img: "wulfgard.png",
        audio: "wulfgard.mp3",
        description: "Wulfgard is a Handcannon-wielding caster who deals Heat DMG.",
        trait: "Casters are skilled at applying Arts Inflictions and Arts Reactions. They are also good damage dealers.",
        attr_prim: "strength",
        attr_sec: "agility",
        initiates: "None",
        continues: "None",
        breakpoints: {
            1: { hp: 500, attack: 30, strength: 18, agility: 9, intellect: 9, will: 13 },
            70: { hp: 4372, attack: 235, strength: 129, agility: 76, intellect: 74, will: 89 },
            90: { hp: 5495, attack: 294, strength: 161, agility: 95, intellect: 92, will: 111 }
        },
        skills: {
            basic: { name: "Rapid Fire Akimbo", desc: "BASIC ATTACK: An attack with up to 4 sequences that deals Heat DMG. As the controlled operator, Final Strike also deals 18 Stagger.  DIVE ATTACK: Basic attack performed in mid-air becomes a dive attack that deals Heat DMG to nearby enemies.  FINISHER: Basic attack performed near a Staggered enemy becomes a finisher that deals massive Heat DMG and recovers some SP." },
            active: { name: "Thermite Tracers", desc: "Fires multiple shots at the target that deal some Heat DMG. The final shot also applies Heat Infliction. If the target has active Combustion or Electrification, do not apply Heat Infliction but instead consume the Arts Reaction to fire an additional shot that deals massive Heat DMG." },
            ult: { name: "Wolven Fury", desc: "Fire a rapid barrage of shots and unleashes the Wolven Fury to attack nearby enemies, dealing 5 hits of Heat DMG and forcibly applying Combustion." },
            combo: { name: "Frag Grenade·β", desc: "COMBO TRIGGER: When an Arts Infliction is applied to an enemy. Throws a frag grenade at the target's location that explodes upon hitting the ground, dealing Heat DMG and Heat Infliction to nearby enemies." }
        },
        talents_data: {
            t1: { name: "Scorching Fangs", lv1: "Whenever Wulfgard applies Combustion, he gains Scorching Fangs for 10s. This effect cannot stack. Scorching Fangs: While active, Wulfgard gains Heat DMG Dealt +20%.", lv2: "Promote to E2 to activate the upgraded effect" },
            t2: { name: "Whenever Wulfgard applies Combustion, he gains Scorching Fangs for 10s. This effect cannot stack. Scorching Fangs: While active, Wulfgard gains Heat DMG Dealt +30%.", lv1: "Promote to E2 to unlock", lv2: "Code of Restraint" }
        },
        affinity_bonus: [0, 0, 0, 0, 0],
        getPotentialStats: () => ({}),
        pot_desc: ["Pot 1 (Lone Wolf): Strength +15, Agility +15.", "Pot 2 (Firearm Mods): Talent Code of Restraint improved: Returns 10 additional SP.", "Pot 3 (Hunting Hour): While Scorching Fangs is active, triggering the battle skill's additional effects immediately resets the Scorching Fangs duration and grants other teammates Scorching Fangs with 50% of the base effects.", "Pot 4 (Will of the Pack): Ultimate Wolven Fury improved: Ultimate Energy cost -15%.", "Pot 5 (Natural Predator): Casting the ultimate Wolven Fury immediately resets the cooldown of the combo skill Frag Grenade·β."],
        artworks: [],
        intel: {"faction": "Endfield", "race": "Unknown", "expertise": [], "hobbies": []},
        files: "Wulfgard's combat records."
    },
    {
        id: "020",
        name: "Arclight",
        english_name: "Arclight",
        class: "Vanguard",
        element: "Electric",
        rarity: 5,
        weapon_type: "Sword",
        img: "arclight.png",
        audio: "arclight.mp3",
        description: "Arclight is a Sword-wielding vanguard who deals Electric DMG.",
        trait: "Great at recovering Skill Points (SP) to help their teammates' skill casting.",
        attr_prim: "agility",
        attr_sec: "intellect",
        initiates: "None",
        continues: "None",
        breakpoints: {
            1: { hp: 500, attack: 30, strength: 14, agility: 14, intellect: 12, will: 10 },
            70: { hp: 4372, attack: 244, strength: 86, agility: 116, intellect: 98, will: 79 },
            90: { hp: 5495, attack: 306, strength: 107, agility: 145, intellect: 123, will: 100 }
        },
        skills: {
            basic: { name: "Seek and Hunt", desc: "BASIC ATTACK: An attack with up to 5 sequences that deals Physical DMG. As the controlled operator, Final Strike also deals 16 Stagger.  DIVE ATTACK: Basic attack performed in mid-air becomes a dive attack that deals Physical DMG to nearby enemies.  FINISHER: Basic attack performed near a Staggered enemy becomes a finisher attack that deals massive Physical DMG and recovers some SP." },
            active: { name: "Tempestuous Arc", desc: "Instantly blinks to the enemy's side to deal 2 slashes that deal some Physical DMG. If the enemy has active Electrification, consume the Electrification to unleash an additional attack that deals Electric DMG and recovers some SP." },
            ult: { name: "Exploding Blitz", desc: "Performs a short forward dash while wreathed in arcs of electricity to deal Electric DMG and apply Electric Infliction to all enemies in the path. The lingering arcs explode after a short while, dealing another hit of Electric DMG. If the enemy has active Electric Infliction, consume the Electric Infliction and forcibly apply Electrification." },
            combo: { name: "Peal of Thunder", desc: "COMBO TRIGGER: When an enemy suffers Electrification or after an enemy's Electrification is consumed. Blinks to the enemy's side to unleash a flurry of slashes that deals Physical DMG and recovers some SP." }
        },
        talents_data: {
            t1: { name: "Wildland Trekker", lv1: "Battle skill Tempestuous Arc improved: Triggering the additional effect 3 time(s) grants the team Electric DMG Dealt +0.05% for every point of Arclight's Intellect. This effect has a 15s duration and cannot stack.", lv2: "Promote to E2 to activate the upgraded effect" },
            t2: { name: "Battle skill Tempestuous Arc improved: Triggering the additional effect 3 time(s) grants the team Electric DMG Dealt +0.08% for every point of Arclight's Intellect. This effect has a 15s duration and cannot stack.", lv1: "Promote to E2 to unlock", lv2: "Hannabit Wisdom" }
        },
        affinity_bonus: [0, 0, 0, 0, 0],
        getPotentialStats: () => ({}),
        pot_desc: ["Pot 1 (Child of the Storm): Battle skill Tempestuous Arc improved: After triggering additional effects, the skill recovers another 10 SP.", "Pot 2 (Speed Battler): Agility +15, Intellect +15.", "Pot 3 (\"Hanna\"): Talent Wildland Trekker improved: DMG Boost effect increased to 1.3 times the original.", "Pot 4 (Aldertone's Teachings): Ultimate Exploding Blitz improved: Ultimate Energy cost -15%.", "Pot 5 (Servant of the Wildlands): Talent Wildland Trekker improved: Trigger requirement is reduced to 2 time(s)."],
        artworks: [],
        intel: {"faction": "Endfield", "race": "Unknown", "expertise": [], "hobbies": []},
        files: "Arclight's combat records."
    },
    {
        id: "021",
        name: "Alesh",
        english_name: "Alesh",
        class: "Vanguard",
        element: "Cryo",
        rarity: 5,
        weapon_type: "Sword",
        img: "alesh.png",
        audio: "alesh.mp3",
        description: "Alesh is a Sword-wielding vanguard who deals Cryo DMG.",
        trait: "Great at recovering Skill Points (SP) to help their teammates' skill casting.",
        attr_prim: "strength",
        attr_sec: "intellect",
        initiates: "None",
        continues: "None",
        breakpoints: {
            1: { hp: 500, attack: 30, strength: 20, agility: 9, intellect: 13, will: 10 },
            70: { hp: 4372, attack: 246, strength: 127, agility: 76, intellect: 100, will: 72 },
            90: { hp: 5495, attack: 309, strength: 158, agility: 95, intellect: 125, will: 89 }
        },
        skills: {
            basic: { name: "Basic Rod Casting", desc: "BASIC ATTACK: An attack with up to 5 sequences that deals Physical DMG. As the controlled operator, Final Strike also deals 17 Stagger.  DIVE ATTACK: Basic attack performed in mid-air becomes a dive attack that deals Physical DMG to nearby enemies.  FINISHER: Basic attack performed near a Staggered enemy becomes a finisher attack that deals massive Physical DMG and recovers some SP." },
            active: { name: "Unconventional Lure", desc: "Hooks a block of ice and slams it to deal Physical DMG to the enemy target. When hitting a target with Cryo Infliction, Alesh consumes all of the target's Cryo Infliction stacks, forcibly applies Solidification to the target, and recovers some SP based on the number of stacks consumed. This SP recovery effect can only trigger 1 time, even if the skill hits multiple enemies." },
            ult: { name: "One Monster Catch!", desc: "Alesh hooks a fin of unbelievable size and slams it to deal Cryo DMG and apply Cryo Infliction to enemies in a large area of effect in front of him. He recovers some SP on hit, with additional SP gained for each target defeated." },
            combo: { name: "Auger Angling", desc: "COMBO TRIGGER: When the Arts Reaction or Originium Crystals of a nearby target is consumed. Opens an angling hole beneath the enemy that deals Physical DMG and recovers some SP. The skill has a chance to hook a Rare Fin that greatly increases the DMG dealt and recovers some more SP." }
        },
        talents_data: {
            t1: { name: "Flash-frozen for Freshness", lv1: "After Solidification or Originium Crystals are applied to a nearby enemy, Alesh gains 3 Ultimate Energy. If the said Solidification is applied by Alesh, he gains an additional 6 Ultimate Energy. This effect can only trigger once every 3s.", lv2: "Promote to E2 to activate the upgraded effect" },
            t2: { name: "After Solidification or Originium Crystals are applied to a nearby enemy, Alesh gains 4 Ultimate Energy. If the said Solidification is applied by Alesh, he gains an additional 8 Ultimate Energy. This effect can only trigger once every 3s.", lv1: "Promote to E2 to unlock", lv2: "Veteran Angler" }
        },
        affinity_bonus: [0, 0, 0, 0, 0],
        getPotentialStats: () => ({}),
        pot_desc: ["Pot 1 (Super Salty Comeback): Battle skill Unconventional Lure improved: SP Recovery grants an additional 10 SP.", "Pot 2 (Calm and Tranquil): Strength +15, Intellect +15.", "Pot 3 (May the Willing Bite): Combo skill Auger Angling improved: After catching a Rare Fin, the entire team gains ATK +15% for 10s. This effect cannot stack.", "Pot 4 (Insane Angling Set): Ultimate One Monster Catch! improved: Ultimate Energy cost -15%.", "Pot 5 (Mega Lunker Rumors): Ultimate One Monster Catch! improved: Hitting a target below 50% HP increases the DMG Multiplier to 1.5 times the original."],
        artworks: [],
        intel: {"faction": "Endfield", "race": "Unknown", "expertise": [], "hobbies": []},
        files: "Alesh's combat records."
    },
    {
        id: "022",
        name: "Avywenna",
        english_name: "Avywenna",
        class: "Striker",
        element: "Electric",
        rarity: 5,
        weapon_type: "Polearm",
        img: "avywenna.png",
        audio: "avywenna.mp3",
        description: "Avywenna is a Polearm-wielding striker who deals Electric DMG.",
        trait: "Strikers exploit Physical or Arts effects inflicted by other operators to deal decisive damage.",
        attr_prim: "will",
        attr_sec: "agility",
        initiates: "None",
        continues: "None",
        breakpoints: {
            1: { hp: 500, attack: 30, strength: 12, agility: 10, intellect: 14, will: 15 },
            70: { hp: 4372, attack: 248, strength: 86, agility: 85, intellect: 88, will: 118 },
            90: { hp: 5495, attack: 312, strength: 107, agility: 106, intellect: 110, will: 148 }
        },
        skills: {
            basic: { name: "Thunderlance: Blitz", desc: "BASIC ATTACK: An attack with up to 5 sequences that deals Physical DMG. As the controlled operator, Final Strike also deals 17 Stagger.  DIVE ATTACK: Basic attack performed in mid-air becomes a dive attack that deals Physical DMG to nearby enemies.  FINISHER: Basic attack performed near a Staggered enemy becomes a finisher attack that deals massive Physical DMG and recovers some SP." },
            active: { name: "Thunderlance: Interdiction", desc: "Leaps into mid-air to stir up a maelstrom with her lance, dealing some Electric DMG to nearby enemies while pulling back all Thunderlances and Thunderlance EX in the battlefield towards herself. The returning Thunderlances pierce through all enemies along their paths and deal Electric DMG, while returning Thunderlances EX deal more Electric DMG and also apply Electric Infliction." },
            ult: { name: "Thunderlance: Final Shock", desc: "Throws a Thunderlance EX at the target area that deals massive Electric DMG to enemies nearby." },
            combo: { name: "Thunderlance: Strike", desc: "COMBO TRIGGER: When controlled operator performs a Final Strike on a target with active Electric Infliction or Electrification. Leaps into mid-air and throws 3 Thunderlances at the target, then deals 1 hit of Electric DMG to enemies in the area of effect." }
        },
        talents_data: {
            t1: { name: "Expedited Delivery", lv1: "After a thrown or returning Thunderlance or Thunderlance EX hits the enemy, Avywenna gains 3 Ultimate Energy.", lv2: "Promote to E2 to activate the upgraded effect" },
            t2: { name: "After a thrown or returning Thunderlance or Thunderlance EX hits the enemy, Avywenna gains 4 Ultimate Energy.", lv1: "Promote to E2 to unlock", lv2: "Tactful Approach" }
        },
        affinity_bonus: [0, 0, 0, 0, 0],
        getPotentialStats: () => ({}),
        pot_desc: ["Pot 1 (Doubling Down): Talent Expedited Delivery improved: Ultimate Energy gain +2.", "Pot 2 (Pole of Menace): Thunderlance and Thunderlance EX duration +20s.", "Pot 3 (Hard Negotiator): Will +15, Electric DMG Dealt +8%.", "Pot 4 (Very Experienced): Ultimate Thunderlance: Final Shock improved: Ultimate Energy cost -15%.", "Pot 5 (Carrot and Sharp Stick): When returning Thunderlances or Thunderlances EX hit an Electric Susceptible enemy, the DMG multipliers are increased to 1.15 times the original."],
        artworks: [],
        intel: {"faction": "Endfield", "race": "Unknown", "expertise": [], "hobbies": []},
        files: "Avywenna's combat records."
    },
    {
        id: "023",
        name: "Da Pan",
        english_name: "Da Pan",
        class: "Striker",
        element: "Physical",
        rarity: 5,
        weapon_type: "Greatsword",
        img: "dapan.png",
        audio: "dapan.mp3",
        description: "Da Pan is a Greatsword-wielding striker who deals Physical DMG.",
        trait: "Strikers exploit Physical or Arts effects inflicted by other operators to deal decisive damage.",
        attr_prim: "strength",
        attr_sec: "will",
        initiates: "None",
        continues: "None",
        breakpoints: {
            1: { hp: 500, attack: 30, strength: 24, agility: 9, intellect: 10, will: 10 },
            70: { hp: 4372, attack: 242, strength: 141, agility: 77, intellect: 75, will: 81 },
            90: { hp: 5495, attack: 303, strength: 175, agility: 96, intellect: 94, will: 102 }
        },
        skills: {
            basic: { name: "ROLLING CUT!", desc: "BASIC ATTACK: An attack with up to 4 sequences that deals Physical DMG. As the controlled operator, Final Strike also deals 20 Stagger.  DIVE ATTACK: Basic attack performed in mid-air becomes a dive attack that deals Physical DMG to nearby enemies.  FINISHER: Basic attack performed near a Staggered enemy becomes a finisher that deals massive Physical DMG and recovers some SP." },
            active: { name: "FLIP DA WOK!", desc: "Takes out a wok, quickly charges it up, and performs a powerful wok flip that deals Physical DMG and Lift to the enemy." },
            ult: { name: "CHOP 'N DUNK!", desc: "Da Pan slams the chopping board to forcibly Lift all enemies in the area of effect in front of him. This is followed by a 6-sequence flurry of slashes that deals Physical DMG. The final step is to bash every enemy to the ground to forcibly Knock Down and deal massive Physical DMG to them." },
            combo: { name: "MORE SPICE!", desc: "COMBO TRIGGER: When an enemy reaches 4 stacks of Vulnerability. Swings the wok at the enemy to deal massive Physical DMG and Crush. This Crush also deals more DMG." }
        },
        talents_data: {
            t1: { name: "Reduce and Thicken", lv1: "After consuming 1 Vulnerability stack, Da Pan gains Physical DMG Dealt +4% for 10s. This effect can reach 4 stacks.", lv2: "Promote to E2 to activate the upgraded effect" },
            t2: { name: "After consuming 1 Vulnerability stack, Da Pan gains Physical DMG Dealt +6% for 10s. This effect can reach 4 stacks.", lv1: "Promote to E2 to unlock", lv2: "Salty or Mild" }
        },
        affinity_bonus: [0, 0, 0, 0, 0],
        getPotentialStats: () => ({}),
        pot_desc: ["Pot 1 (Fine Cooking): Ultimate CHOP 'N DUNK! improved: If the ultimate defeats at least one enemy, Da Pan deals +30% Physical DMG for 15s. This effect cannot stack.", "Pot 2 (Harmonized Flavors): Talent Salty or Mild improved: Prep Ingredients buff duration +10s, max stacks +1.", "Pot 3 (Model Employee): Strength +15, Physical DMG Dealt +8%.", "Pot 4 (Special Blend): Ultimate CHOP 'N DUNK! improved: Ultimate Energy cost -15%.", "Pot 5 (Fire it Up): Battle skill FLIP DA WOK! improved: If the skill hits only one enemy, apply 1 more stack of Vulnerability on the target. This effect can only trigger once every 45s."],
        artworks: [],
        intel: {"faction": "Endfield", "race": "Unknown", "expertise": [], "hobbies": []},
        files: "Da Pan's combat records."
    },
    {
        id: "024",
        name: "Estella",
        english_name: "Estella",
        class: "Guard",
        element: "Cryo",
        rarity: 4,
        weapon_type: "Polearm",
        img: "estella.png",
        audio: "estella.mp3",
        description: "Estella is a Polearm-wielding guard who deals Cryo DMG.",
        trait: "Guards are skilled at making enemies Vulnerable and applying Physical Statuses. They are also good damage dealers.",
        attr_prim: "will",
        attr_sec: "strength",
        initiates: "None",
        continues: "None",
        breakpoints: {
            1: { hp: 500, attack: 30, strength: 13, agility: 8, intellect: 14, will: 15 },
            70: { hp: 4372, attack: 248, strength: 84, agility: 77, intellect: 88, will: 120 },
            90: { hp: 5495, attack: 312, strength: 104, agility: 97, intellect: 110, will: 151 }
        },
        skills: {
            basic: { name: "Audio Noise", desc: "BASIC ATTACK: An attack with up to 4 sequences that deals Physical DMG. As the controlled operator, Final Strike also deals 17 Stagger.  DIVE ATTACK: Basic attack performed in mid-air becomes a dive attack that deals Physical DMG to nearby enemies.  FINISHER: Basic attack performed near a Staggered enemy becomes a finisher that deals massive Physical DMG and recovers some SP." },
            active: { name: "Onomatopoeia", desc: "A lance thrust that fires a stream of freezing sound waves that deal Cryo DMG and apply Cryo Infliction to all enemies along its straight path." },
            ult: { name: "Tremolo", desc: "Estella expends all her strength to unleash a powerful slam of the spear shaft, dealing Physical DMG to all enemies in a circular area around self. To enemies with Physical Susceptibility, the skill forcibly applies Lift to them." },
            combo: { name: "Distortion", desc: "COMBO TRIGGER: When an enemy suffers Solidification. Quickly moves to the enemy's side to deal Physical DMG and forcibly Lift enemies in a small area. If the skill hits a target with Solidification, the skill deals additional DMG and applies Physical Susceptibility." }
        },
        talents_data: {
            t1: { name: "Commiseration", lv1: "When triggering Shatter, the next battle skill Onomatopoeia cast returns 7.5 SP. This effect cannot stack.", lv2: "Promote to E2 to activate the upgraded effect" },
            t2: { name: "When triggering Shatter, the next battle skill Onomatopoeia cast returns 15 SP. This effect cannot stack.", lv1: "Promote to E2 to unlock", lv2: "Laziness Pays Off Now" }
        },
        affinity_bonus: [0, 0, 0, 0, 0],
        getPotentialStats: () => ({}),
        pot_desc: ["Pot 1 (Habitual Delay): Combo skill Distortion improved: Physical Susceptibility duration +3s.", "Pot 2 (Lowered Expectations): Ultimate Tremolo improved: Ultimate Energy cost -10%.", "Pot 3 (Delayed Work): Battle skill Onomatopoeia improved: Freezing sound wave range +50% and DMG Dealt +40% to the first enemy hit.", "Pot 4 (Life Over Mission): Will +10, Strength +10.", "Pot 5 (Survival is a Win): After applying Solidification to an enemy, Estella gains 5 Ultimate Energy. Effect can only trigger once every 1s."],
        artworks: [],
        intel: {"faction": "Endfield", "race": "Unknown", "expertise": [], "hobbies": []},
        files: "Estella's combat records."
    },
    {
        id: "025",
        name: "Catcher",
        english_name: "Catcher",
        class: "Defender",
        element: "Physical",
        rarity: 4,
        weapon_type: "Greatsword",
        img: "catcher.png",
        audio: "catcher.mp3",
        description: "Catcher is a Greatsword-wielding defender. He deals Physical DMG.",
        trait: "Defenders are extremely tough. They are skilled in protecting and treating their teammates, as well as counterattacking the enemy.",
        attr_prim: "strength",
        attr_sec: "will",
        initiates: "None",
        continues: "None",
        breakpoints: {
            1: { hp: 500, attack: 30, strength: 21, agility: 9, intellect: 8, will: 11 },
            70: { hp: 4372, attack: 239, strength: 141, agility: 77, intellect: 69, will: 85 },
            90: { hp: 5495, attack: 300, strength: 176, agility: 96, intellect: 86, will: 106 }
        },
        skills: {
            basic: { name: "Basic Tactics", desc: "BASIC ATTACK: An attack with up to 4 sequences that deals Physical DMG. As the controlled operator, Final Strike also deals 22 Stagger.  DIVE ATTACK: Basic attack performed in mid-air becomes a dive attack that deals Physical DMG to nearby enemies.  FINISHER: Basic attack performed near a Staggered enemy becomes a finisher that deals massive Physical DMG and recovers some SP." },
            active: { name: "Rigid Interdiction", desc: "Raises a shield that can block attacks, grants Protection to self and nearby operators, and immediately returns some SP. When attacked while the said shield is raised, perform a retaliation bash that deals Physical DMG and applies 1 stack of Vulnerability to the attacking enemy." },
            ult: { name: "Textbook Assault", desc: "Swings the greatsword to perform 2 consecutive slashes to deal Physical DMG and apply Weakness, followed by a powerful downward slam that deals massive Physical DMG and applies Knock Down to all enemies within the area of effect." },
            combo: { name: "Timely Suppression", desc: "COMBO TRIGGER: When an enemy starts charging up a skill, or when the controlled operator is attacked and falls below 40% HP. A powerful downward punch that deals Physical DMG to the enemy, while granting shields to self and another teammate (controlled operator prioritized). DEF can further increase Shield points." }
        },
        talents_data: {
            t1: { name: "Resilient Defense", lv1: "For every 10 Will, DEF +1.0.", lv2: "Promote to E2 to activate the upgraded effect" },
            t2: { name: "For every 10 Will, DEF +1.2.", lv1: "Promote to E2 to unlock", lv2: "Comprehensive Mindset" }
        },
        affinity_bonus: [0, 0, 0, 0, 0],
        getPotentialStats: () => ({}),
        pot_desc: ["Pot 1 (Multi-layered Readiness): Battle skill Rigid Interdiction and ultimate Textbook Assault improved: After hitting the enemy, deals another strike that deals [300 + DEF×5.0] of Physical DMG.", "Pot 2 (Bonus Spec Training): DEF +20, Will +10.", "Pot 3 (Unwavering Post): Combo skill Timely Suppression improved: Shield duration +5s.", "Pot 4 (Compensated Suffering): Ultimate Textbook Assault improved: Ultimate Energy cost -10%.", "Pot 5 (Choice Without Regrets): Battle skill Rigid Interdiction improved: Hitting an enemy while the shield is active returns 10 SP."],
        artworks: [],
        intel: {"faction": "Endfield", "race": "Unknown", "expertise": [], "hobbies": []},
        files: "Catcher's combat records."
    },
    {
        id: "026",
        name: "Antal",
        english_name: "Antal",
        class: "Supporter",
        element: "Electric",
        rarity: 4,
        weapon_type: "Arts Unit",
        img: "antal.png",
        audio: "antal.mp3",
        description: "Antal is an Arts Unit-wielding supporter who deals Electric DMG.",
        trait: "Supporters are skilled in applying various control effects that weaken the enemy. They can also buff and support their teammates.",
        attr_prim: "intellect",
        attr_sec: "strength",
        initiates: "None",
        continues: "None",
        breakpoints: {
            1: { hp: 500, attack: 30, strength: 15, agility: 9, intellect: 15, will: 9 },
            70: { hp: 4372, attack: 237, strength: 103, agility: 69, intellect: 131, will: 66 },
            90: { hp: 5495, attack: 297, strength: 129, agility: 86, intellect: 165, will: 82 }
        },
        skills: {
            basic: { name: "Exchange Current", desc: "BASIC ATTACK: An attack with up to 4 sequences that deals Electric DMG. As the controlled operator, Final Strike also deals 15 Stagger.  DIVE ATTACK: Basic attack performed in mid-air becomes a dive attack that deals Electric DMG to nearby enemies.  FINISHER: Basic attack performed near a Staggered enemy becomes a finisher that deals massive Electric DMG and recovers some SP." },
            active: { name: "Specified Research Subject", desc: "Applies Focus with a long duration on the enemy and deals Electric DMG. An enemy with an active Focus also suffers Electric Susceptibility and Heat Susceptibility. Focus can only be applied to 1 enemy at any given time." },
            ult: { name: "Overclocked Moment", desc: "Applies temporary Electric Amp and Heat Amp to the entire team." },
            combo: { name: "EMP Test Site", desc: "COMBO TRIGGER: When an enemy with active Focus suffers a Physical Status or Arts Infliction. Triggers 1 energy explosion on the enemy that deals Electric DMG and applies another stack of the same Physical Status or Arts Infliction." }
        },
        talents_data: {
            t1: { name: "Improviser", lv1: "After an Amped teammate's skill deals DMG, Antal restores the said teammate's HP by [72 + Strength×0.6]. This HP restoring effect triggers 1 time every 30s for each operator.", lv2: "Promote to E2 to activate the upgraded effect" },
            t2: { name: "After an Amped teammate's skill deals DMG, Antal restores the said teammate's HP by [108 + Strength×0.9]. This HP restoring effect triggers 1 time every 30s for each operator.", lv1: "Promote to E2 to unlock", lv2: "Subconscious Act" }
        },
        affinity_bonus: [0, 0, 0, 0, 0],
        getPotentialStats: () => ({}),
        pot_desc: ["Pot 1 (Arts Talent): Ultimate Overclocked Moment improved: Electric Amp and Heat Amp effects are increased to 1.1 times the original.", "Pot 2 (Improved Automation): Ultimate Overclocked Moment improved: Ultimate Energy cost -10%.", "Pot 3 (Applied Originium Theory): When an enemy with an active Focus debuff is defeated, return 15 SP.", "Pot 4 (Granny's Reminder): Intellect +10, Max HP +10%.", "Pot 5 (High Specs Tech Tester): Applying Focus on the same target for 20s increases Electric Susceptibility and Heat Susceptibility effects by 4%."],
        artworks: [],
        intel: {"faction": "Endfield", "race": "Unknown", "expertise": [], "hobbies": []},
        files: "Antal's combat records."
    },
    {
        id: "027",
        name: "Fluorite",
        english_name: "Fluorite",
        class: "Caster",
        element: "Nature",
        rarity: 4,
        weapon_type: "Handcannons",
        img: "fluorite.png",
        audio: "fluorite.mp3",
        description: "Fluorite is a Handcannon-wielding caster who deals Nature DMG.",
        trait: "Casters are skilled at applying Arts Inflictions and Arts Reactions. They are also good damage dealers.",
        attr_prim: "agility",
        attr_sec: "intellect",
        initiates: "None",
        continues: "None",
        breakpoints: {
            1: { hp: 500, attack: 30, strength: 14, agility: 14, intellect: 12, will: 10 },
            70: { hp: 4372, attack: 242, strength: 73, agility: 133, intellect: 91, will: 73 },
            90: { hp: 5495, attack: 303, strength: 90, agility: 168, intellect: 114, will: 91 }
        },
        skills: {
            basic: { name: "Signature Gun Kata", desc: "BASIC ATTACK: An attack with up to 4 sequences that deals Nature DMG. As the controlled operator, Final Strike also deals 15 Stagger.  DIVE ATTACK: Basic attack performed in mid-air becomes a dive attack that deals Nature DMG to nearby enemies.  FINISHER: Basic attack performed near a Staggered enemy becomes a finisher that deals massive Nature DMG and recovers some SP." },
            active: { name: "Tiny Surprise", desc: "Kicks an Improvised Explosive that sticks to the target, applying Slow and exploding after a short duration. The explosion deals Nature DMG and Nature Infliction to enemies in the area of effect. Defeating the target also sets off the Improvised Explosive immediately. Only 1 Improvised Explosive can be present in the battlefield." },
            ult: { name: "Apex Prankster", desc: "Fluorite quickly moves in an arc and rapidly fires at the target within the arc to deal 4 sequences of Nature DMG. If an Improvised Explosive has been stuck to the target, the skill detonates it immediately and increases the DMG and size of the explosion. If the final DMG sequence hits a target with at least 2 stacks of Cryo Infliction or Nature Infliction, then apply the same Arts Infliction again." },
            combo: { name: "Free Giveaway", desc: "COMBO TRIGGER: When an enemy has 2 or more stacks of Cryo Infliction or Nature Infliction. Shoots the target enemy to trigger a special explosion that deals Nature DMG and applies another Arts Infliction of the element already on the enemy." }
        },
        talents_data: {
            t1: { name: "Love the Stab and Twist", lv1: "Fluorite gains DMG Dealt +10% against Slowed targets.", lv2: "Promote to E2 to activate the upgraded effect" },
            t2: { name: "Fluorite gains DMG Dealt +20% against Slowed targets.", lv1: "Promote to E2 to unlock", lv2: "Unpredictable" }
        },
        affinity_bonus: [0, 0, 0, 0, 0],
        getPotentialStats: () => ({}),
        pot_desc: ["Pot 1 (Ten-Finger Smith): Agility +10, Intellect +10.", "Pot 2 (Mind Reading Technique): Talent Unpredictable improved: Chance to ignore Arts DMG +10%.", "Pot 3 (Triple Surprise): Battle skill Tiny Surprise improved: After Improvised Explosive explodes, the slow effect is applied to all enemies hit and lasts 6s.", "Pot 4 (Prank Master): Ultimate Apex Prankster improved: Ultimate Energy cost -10%.", "Pot 5 (Craver of Chaos): Combo skill Free Giveaway improved: Whenever Cryo Infliction or Nature Infliction is applied to the enemy, cooldown is shortened by 1s. Effect can only trigger once every 1s."],
        artworks: [],
        intel: {"faction": "Endfield", "race": "Unknown", "expertise": [], "hobbies": []},
        files: "Fluorite's combat records."
    },
    {
        id: "028",
        name: "Akekuri",
        english_name: "Akekuri",
        class: "Vanguard",
        element: "Heat",
        rarity: 4,
        weapon_type: "Sword",
        img: "akekuri.png",
        audio: "akekuri.mp3",
        description: "Akekuri is a Sword-wielding vanguard who deals Heat DMG.",
        trait: "Great at recovering Skill Points (SP) to help their teammates' skill casting.",
        attr_prim: "agility",
        attr_sec: "intellect",
        initiates: "None",
        continues: "None",
        breakpoints: {
            1: { hp: 500, attack: 30, strength: 13, agility: 15, intellect: 12, will: 9 },
            70: { hp: 4372, attack: 254, strength: 88, agility: 112, intellect: 85, will: 85 },
            90: { hp: 5495, attack: 319, strength: 110, agility: 140, intellect: 106, will: 108 }
        },
        skills: {
            basic: { name: "Sword of Aspiration", desc: "BASIC ATTACK: An attack with up to 4 sequences that deals Physical DMG. As the controlled operator, Final Strike also deals 17 Stagger.  DIVE ATTACK: Basic attack performed in mid-air becomes a dive attack that deals Physical DMG to nearby enemies.  FINISHER: Basic attack performed near a Staggered enemy becomes a finisher that deals massive Physical DMG and recovers some SP." },
            active: { name: "Burst of Passion", desc: "A frontal slash that deals Heat DMG and applies Heat Infliction." },
            ult: { name: "SQUAD! ON ME!", desc: "Enters a channeling state and fires 3 Rallying Flares. Each firing recovers some SP." },
            combo: { name: "Flash and Dash", desc: "COMBO TRIGGER: When an enemy becomes Staggered or hits a Stagger Node. Performs a returning dash with 2 thrust sequences, with each sequence dealing Physical DMG and recovering some SP." }
        },
        talents_data: {
            t1: { name: "Cheer of Victory", lv1: "Combo skill Flash and Dash improved: For every 10 points of Intellect, SP Recovery +1.0% (max: 50%).", lv2: "Promote to E2 to activate the upgraded effect" },
            t2: { name: "Combo skill Flash and Dash improved: For every 10 points of Intellect, SP Recovery +1.5% (max: 75%).", lv1: "Promote to E3 to unlock", lv2: "" }
        },
        affinity_bonus: [0, 0, 0, 0, 0],
        getPotentialStats: () => ({}),
        pot_desc: ["Pot 1 (Positive Feedback): After recovering SP with skills, Akekuri gains ATK +10% for 10s. This effect can reach 5 stacks.", "Pot 2 (Passionate Idealist): Agility +10, Intellect +10.", "Pot 3 (Committed Team Player): Ultimate SQUAD! ON ME! improved: While ultimate is active, entire team gains ATK +10%.", "Pot 4 (Super Perfect Status): Ultimate SQUAD! ON ME! improved: Ultimate Energy cost -10%.", "Pot 5 (Tempo of Awareness): Talent Staying in the Zone improved: Even when the ultimate SQUAD! ON ME! ends, the Link buff persists for 5s."],
        artworks: [],
        intel: {"faction": "Endfield", "race": "Unknown", "expertise": [], "hobbies": []},
        files: "Akekuri's combat records."
    }
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

    weaponsDB.forEach(w => {
        if(!w.status) w.status = { level: 1, e1: 1, e2: 1, e3: 1 };
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

function switchOpTab(tabName) {
    // Hide all contents
    document.querySelectorAll('.op-tab-content').forEach(el => el.classList.remove('active'));
    // Remove active state from all buttons
    document.querySelectorAll('#modal-config .tab-btn').forEach(el => el.classList.remove('active'));
    
    // Activate target
    document.getElementById(`content-op-${tabName}`).classList.add('active');
    document.getElementById(`tab-op-${tabName}`).classList.add('active');
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
                            <div class="lvl-overlay">LV. ${w.status.level}</div>
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
                <div class="slot slot-filled" draggable="true" ondragstart="drag(event, 'squad', '${i}')" ondrop="drop(event, ${i})" ondragover="allowDrop(event)" ondragleave="leaveDrop(event)" style="${c.img ? `background-image: linear-gradient(to top, rgba(0,0,0,0.9), transparent), url('imagens/Operators/${c.img}');` : `background: rgba(0,0,0,0.8);`}" onclick="openSettings('squad', ${i})">
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
    updateLiveStatsAndDOM(); 
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

            let sl1 = c.status.skill_1 || 1;
            let sl2 = c.status.skill_2 || 1;
            let sl3 = c.status.skill_3 || 1;
            let sl4 = c.status.skill_4 || 1;

            let skillPowerMult = 1 + (sl1*0.05) + (sl2*0.1) + (sl3*0.2) + (sl4*0.15);
            let potMult = 1 + ((c.status.potential || 0) * 0.05);
            let affMult = 1 + ((c.status.affinity || 0) * 0.02);
            let ultEff = cStats.ult_gain_eff || 1;
            
            let rawTheoreticalDmg = effectiveAtk * critMultiplier * skillPowerMult * potMult * affMult * ultEff;
            totalPotential += Math.floor(rawTheoreticalDmg * 2.5); 
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
        { id: document.getElementById("conf-equip-armor").value, el: document.getElementById("conf-equip-armor"), icon: document.getElementById("icon-equip-armor") },
        { id: document.getElementById("conf-equip-gloves").value, el: document.getElementById("conf-equip-gloves"), icon: document.getElementById("icon-equip-gloves") },
        { id: document.getElementById("conf-equip-kit1").value, el: document.getElementById("conf-equip-kit1"), icon: document.getElementById("icon-equip-kit1") },
        { id: document.getElementById("conf-equip-kit2").value, el: document.getElementById("conf-equip-kit2"), icon: document.getElementById("icon-equip-kit2") }
    ];

    equips.forEach(eqObj => {
        let eq = equipmentDB.find(x => x.id === eqObj.id);
        if (eq && eq.id !== 'none') {
            if (lvl < eq.level) {
                eqObj.el.value = 'none';
                eqObj.icon.style.backgroundImage = "none";
                eqObj.el.classList.add('shake-error');
                setTimeout(() => eqObj.el.classList.remove('shake-error'), 400);
                showToast(`Cannot equip ${eq.name}. Requires Operator Level ${eq.level}.`);
            } else {
                if (eq.img) {
                    eqObj.icon.style.backgroundImage = `url('imagens/Gears/${eq.img}')`;
                } else {
                    eqObj.icon.style.backgroundImage = "none";
                }
            }
        } else {
            eqObj.icon.style.backgroundImage = "none";
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
    
    document.getElementById("wpn-modal-level").value = w.status.level;
    
    document.getElementById("modal-weapon").style.display = "flex";
    
    updateWeaponModalStats();
    
    for (let i=1; i<=3; i++) {
        let nodeSelect = document.getElementById(`wpn-modal-e${i}`);
        if(nodeSelect) nodeSelect.value = w.status[`e${i}`];
    }
    
    updateWeaponModalStats(); 
}

function closeWeaponModal() {
    document.getElementById("modal-weapon").style.display = "none";
    currentWeaponModalId = null;
}

function saveWeaponModal() {
    if (!currentWeaponModalId) return;
    const w = weaponsDB.find(x => x.id === currentWeaponModalId);
    
    w.status.level = clamp(document.getElementById("wpn-modal-level").value, 1, 90);
    w.status.e1 = clamp(document.getElementById("wpn-modal-e1") ? document.getElementById("wpn-modal-e1").value : 1, 1, 9);
    w.status.e2 = clamp(document.getElementById("wpn-modal-e2") ? document.getElementById("wpn-modal-e2").value : 1, 1, 9);
    w.status.e3 = clamp(document.getElementById("wpn-modal-e3") ? document.getElementById("wpn-modal-e3").value : 1, 1, 9);
    
    renderRoster(); 

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

// ---------------- LOAD ARTWORKS TAB ---------------- //
window.changeMainArtwork = function(imgStr, titleStr, illustratorStr, descStr) {
    const mainFrame = document.getElementById("art-main-frame");
    mainFrame.style.backgroundImage = `url('imagens/Artworks/${imgStr}')`;
    document.getElementById("art-title").innerText = titleStr;
    document.getElementById("art-illustrator").innerText = `Illustrator: ${illustratorStr}`;
    document.getElementById("art-desc").innerText = descStr;
    
    document.querySelectorAll('.art-thumb').forEach(th => th.classList.remove('active'));
    event.currentTarget.classList.add('active');
}

function loadArtworksTab(c) {
    const thumbCont = document.getElementById("art-thumbnails-container");
    thumbCont.innerHTML = "";
    
    if (!c.artworks || c.artworks.length === 0) {
        document.getElementById("art-main-frame").style.backgroundImage = "none";
        document.getElementById("art-title").innerText = "No Artworks Available";
        document.getElementById("art-illustrator").innerText = "";
        document.getElementById("art-desc").innerText = "This operator currently has no artwork data registered.";
        return;
    }

    document.getElementById("art-main-frame").style.backgroundImage = `url('imagens/Artworks/${c.artworks[0].img}')`;
    document.getElementById("art-title").innerText = c.artworks[0].title;
    document.getElementById("art-illustrator").innerText = `Illustrator: ${c.artworks[0].illustrator}`;
    document.getElementById("art-desc").innerText = c.artworks[0].desc;

    c.artworks.forEach((art, index) => {
        let isActive = index === 0 ? "active" : "";
        thumbCont.innerHTML += `<div class="art-thumb ${isActive}" style="background-image: url('imagens/Artworks/${art.img}')" onclick="changeMainArtwork('${art.img}', '${art.title.replace(/'/g, "\\'")}', '${art.illustrator.replace(/'/g, "\\'")}', '${art.desc.replace(/'/g, "\\'")}')"></div>`;
    });
}

// ---------------- LOAD INTEL TAB ---------------- //
function loadIntelTab(c) {
    const intelCont = document.getElementById("intel-grid-container");
    intelCont.innerHTML = "";
    
    if (!c.intel) return;

    if (c.intel.faction) intelCont.innerHTML += `<div class="intel-card"><h4>Faction</h4><p>${c.intel.faction}</p></div>`;
    if (c.intel.race) intelCont.innerHTML += `<div class="intel-card"><h4>Race</h4><p>${c.intel.race}</p></div>`;
    
    if (c.intel.expertise && c.intel.expertise.length > 0) {
        c.intel.expertise.forEach(exp => {
            intelCont.innerHTML += `<div class="intel-card"><h4>Expertise</h4><p><strong style="color:var(--primary-yellow); display:block; margin-bottom:4px;">${exp.title}</strong>${exp.desc}</p></div>`;
        });
    }
    
    if (c.intel.hobbies && c.intel.hobbies.length > 0) {
        c.intel.hobbies.forEach(hob => {
            intelCont.innerHTML += `<div class="intel-card"><h4>Hobbies</h4><p><strong style="color:var(--primary-yellow); display:block; margin-bottom:4px;">${hob.title}</strong>${hob.desc}</p></div>`;
        });
    }
}

// ---------------- LOAD FILES TAB ---------------- //
function loadFilesTab(c) {
    const filesCont = document.getElementById("files-text-container");
    if (c.files) {
        let formattedText = c.files.split('\n').map(p => p.trim() !== '' ? `<p>${p}</p>` : '').join('');
        filesCont.innerHTML = formattedText;
    } else {
        filesCont.innerHTML = "<p>No files recorded for this operator.</p>";
    }
}

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
    document.getElementById("config-rarity-badge").innerText = target.rarity + "★";
    document.getElementById("attr-primary").innerText = target.attr_prim.toUpperCase();
    document.getElementById("attr-secondary").innerText = target.attr_sec.toUpperCase();

    document.getElementById("conf-level").value = target.status.level;
    document.getElementById("conf-char-affinity").value = target.status.affinity;
    document.getElementById("conf-char-potential").value = target.status.potential;
    
    const selWpn = document.getElementById("conf-weapon-id");
    selWpn.innerHTML = "";
    weaponsDB.forEach(w => {
        if (w.type === "Any" || w.type === target.weapon_type) {
            selWpn.innerHTML += `<option value="${w.id}">${w.name} (${w.type})</option>`;
        }
    });

    document.getElementById("conf-weapon-id").value = target.status.weapon_id;
    if (!document.getElementById("conf-weapon-id").value) {
        document.getElementById("conf-weapon-id").value = "wpn_test_00";
        target.status.weapon_id = "wpn_test_00";
    }

    document.getElementById("conf-weapon-level").value = target.status.weapon_level;
    document.getElementById("conf-weapon-e1").value = target.status.weapon_e1 || 1;
    document.getElementById("conf-weapon-e2").value = target.status.weapon_e2 || 1;
    document.getElementById("conf-weapon-e3").value = target.status.weapon_e3 || 1;
    
    updateWeaponPreview();
    
    const parts = ["armor", "gloves", "kit1", "kit2"];
    parts.forEach(part => {
        document.getElementById(`conf-equip-${part}`).value = target.status.equipment[part];
    });

    switchOpTab('loadout');
    loadArtworksTab(target);
    loadIntelTab(target);
    loadFilesTab(target);

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
    t1.forEach(c => html += `<div class="mini-slot" style="${c.img ? `background-image: linear-gradient(to top, rgba(0,0,0,0.9), transparent), url('imagens/Operators/${c.img}');` : `background: rgba(0,0,0,0.8);`}">${c.name}</div>`);
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