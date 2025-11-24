
import { NpcData, V20Stats } from "../types";

// --- Constants ---
export const ATTRIBUTES_LIST = {
    physical: ['strength', 'dexterity', 'stamina'],
    social: ['charisma', 'manipulation', 'appearance'],
    mental: ['perception', 'intelligence', 'wits']
};

export const ABILITIES_LIST = {
    talents: ['alertness', 'athletics', 'brawl', 'dodge', 'empathy', 'expression', 'intimidation', 'leadership', 'streetwise', 'subterfuge'],
    skills: ['animalken', 'craft', 'drive', 'etiquette', 'firearms', 'larceny', 'melee', 'performance', 'stealth', 'survival'],
    knowledges: ['academics', 'computer', 'finance', 'investigation', 'law', 'medicine', 'occult', 'politics', 'science', 'technology']
};

const COSTS = {
    ATTRIBUTE: 5,
    ABILITY: 2,
    DISCIPLINE: 7,
    BACKGROUND: 1,
    VIRTUE: 2,
    WILLPOWER: 1,
    PATH: 2
};

class CharacterSheet {
    attributes: Record<string, number> = {};
    abilities: Record<string, number> = {};
    virtues = { conscience: 1, selfcontrol: 1, courage: 1 };
    willpower = 1;
    humanity = 1;
    backgrounds: Record<string, number> = {};

    constructor() {
        // Initialize Base Stats (1 dot for attributes)
        [...ATTRIBUTES_LIST.physical, ...ATTRIBUTES_LIST.social, ...ATTRIBUTES_LIST.mental].forEach(k => this.attributes[k] = 1);
        // Initialize Abilities (0 dots)
        [...ABILITIES_LIST.talents, ...ABILITIES_LIST.skills, ...ABILITIES_LIST.knowledges].forEach(k => this.abilities[k] = 0);
    }

    distributePoints(targetKeys: string[], points: number, maxPerItem: number = 5) {
        if (!targetKeys || targetKeys.length === 0) return;
        
        let remaining = points;
        let attempts = 0;
        
        while (remaining > 0 && attempts < 100) {
            // Weighted random to simulate focus
            const index = Math.random() > 0.4 
                ? Math.floor(Math.random() * (targetKeys.length / 2)) // Bias towards first half
                : Math.floor(Math.random() * targetKeys.length);
            
            const key = targetKeys[index];
            const isAttribute = this.attributes[key] !== undefined;
            const current = isAttribute ? this.attributes[key] : this.abilities[key];
            
            if (current < maxPerItem) {
                if (isAttribute) this.attributes[key]++;
                else this.abilities[key]++;
                remaining--;
            }
            attempts++;
        }
    }

    addBackground(name: string, dots: number = 1) {
        if (this.backgrounds[name]) this.backgrounds[name] += dots;
        else this.backgrounds[name] = dots;
        if (this.backgrounds[name] > 5) this.backgrounds[name] = 5;
    }
}

const getAbilityPriorities = (concept: string): string[] => {
    const c = concept.toLowerCase();
    if (c.includes('soldado') || c.includes('guarda') || c.includes('capanga') || c.includes('assassino') || c.includes('atleta') || c.includes('valentão')) {
        return ['skills', 'talents', 'knowledges'];
    }
    if (c.includes('intelectual') || c.includes('hacker') || c.includes('medico') || c.includes('investigador') || c.includes('professor') || c.includes('filosofo')) {
        return ['knowledges', 'skills', 'talents'];
    }
    if (c.includes('politico') || c.includes('socialite') || c.includes('lider') || c.includes('artista') || c.includes('galante')) {
        return ['talents', 'knowledges', 'skills'];
    }
    return ['talents', 'skills', 'knowledges']; 
}

const applyBonusPoints = (sheet: CharacterSheet, nature: string, points: number) => {
    let remaining = points;
    const n = nature.toLowerCase();

    const strategy: Array<'ATTR_PHYS'|'ATTR_SOC'|'ATTR_MEN'|'ABIL'|'WP'|'BG'> = [];

    if (n.includes('valentão') || n.includes('fera') || n.includes('sobrevivente') || n.includes('monstro')) {
        strategy.push('ATTR_PHYS', 'WP', 'ABIL');
    } else if (n.includes('autocrata') || n.includes('tirano') || n.includes('galante') || n.includes('lider')) {
        strategy.push('ATTR_SOC', 'BG', 'WP');
    } else if (n.includes('arquiteto') || n.includes('visionario') || n.includes('filosofo') || n.includes('enigma')) {
        strategy.push('ATTR_MEN', 'ABIL', 'WP');
    } else {
        strategy.push('WP', 'ATTR_SOC', 'ABIL');
    }

    let safety = 0;
    while (remaining > 0 && safety < 100) {
        safety++;
        const target = strategy[safety % strategy.length];

        if (target.startsWith('ATTR') && remaining >= COSTS.ATTRIBUTE) {
            let keys: string[] = [];
            if (target === 'ATTR_PHYS') keys = ATTRIBUTES_LIST.physical;
            if (target === 'ATTR_SOC') keys = ATTRIBUTES_LIST.social;
            if (target === 'ATTR_MEN') keys = ATTRIBUTES_LIST.mental;
            const attr = keys[Math.floor(Math.random() * keys.length)];
            if (sheet.attributes[attr] < 5) { sheet.attributes[attr]++; remaining -= COSTS.ATTRIBUTE; continue; }
        }
        
        if (target === 'WP' && remaining >= COSTS.WILLPOWER) {
            if (sheet.willpower < 10) { sheet.willpower++; remaining -= COSTS.WILLPOWER; continue; }
        }
        
        if (target === 'BG' && remaining >= COSTS.BACKGROUND) {
            // Generic BG for logic simplicity, real items managed elsewhere
            sheet.addBackground("Recursos", 1); 
            remaining -= COSTS.BACKGROUND; continue;
        }
        
        if (target === 'ABIL' && remaining >= COSTS.ABILITY) {
             const allAbils = [...ABILITIES_LIST.talents, ...ABILITIES_LIST.skills, ...ABILITIES_LIST.knowledges];
             const k = allAbils[Math.floor(Math.random() * allAbils.length)];
             if(sheet.abilities[k] < 5) { sheet.abilities[k]++; remaining -= COSTS.ABILITY; continue; }
        }
        
        if (remaining >= COSTS.WILLPOWER && sheet.willpower < 10) {
            sheet.willpower++; remaining -= COSTS.WILLPOWER;
        } else {
            break; 
        }
    }
}

export const generateV20Stats = (npc: NpcData): V20Stats => {
    const sheet = new CharacterSheet();

    // 1. Attributes (7/5/3)
    const defaultProfile = ["physical", "social", "mental"];
    let profile = defaultProfile;
    if (npc.attributeProfile) {
        const parts = npc.attributeProfile.toLowerCase().split('/');
        if (parts.length === 3) profile = parts.map(p => p.trim());
    }
    const attrPriorities = [7, 5, 3];
    profile.forEach((cat, idx) => {
        // @ts-ignore
        const keys = ATTRIBUTES_LIST[cat] || ATTRIBUTES_LIST['physical'];
        sheet.distributePoints(keys, attrPriorities[idx]);
    });

    // 2. Abilities (13/9/5)
    const abilityCats = getAbilityPriorities(npc.concept || "");
    const abilPriorities = [13, 9, 5];
    abilityCats.forEach((cat, idx) => {
        // @ts-ignore
        const keys = ABILITIES_LIST[cat];
        sheet.distributePoints(keys, abilPriorities[idx], 3); // Max 3 limit initial
    });

    // 3. Virtues (7 points)
    const n = npc.nature.toLowerCase();
    if (n.includes('monstro') || n.includes('valentão') || n.includes('sobrevivente') || n.includes('fera')) {
        sheet.distributePoints(['courage'], 3);
        sheet.distributePoints(['selfcontrol', 'conscience'], 4);
    } else if (n.includes('santo') || n.includes('cuidador') || n.includes('martir')) {
        sheet.distributePoints(['conscience'], 3);
        sheet.distributePoints(['selfcontrol', 'courage'], 4);
    } else {
        sheet.distributePoints(['conscience', 'selfcontrol', 'courage'], 7);
    }

    // 4. Initial Derivations
    sheet.willpower = sheet.virtues.courage;
    sheet.humanity = sheet.virtues.conscience + sheet.virtues.selfcontrol;

    // 5. Freebie Points (15)
    applyBonusPoints(sheet, npc.nature, 15);

    // 6. Max Blood
    let maxBlood = 10;
    const genMatch = npc.generation.match(/\d+/);
    if (genMatch) {
        const gen = parseInt(genMatch[0]);
        if (gen <= 13) maxBlood = 10 + (13 - gen);
    }

    return {
        attributes: sheet.attributes,
        abilities: sheet.abilities,
        virtues: sheet.virtues,
        willpower: sheet.willpower,
        humanity: sheet.humanity,
        bloodpool: maxBlood
    };
};
