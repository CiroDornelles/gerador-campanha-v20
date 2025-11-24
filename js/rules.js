
const COSTS = { ATTRIBUTE: 5, ABILITY: 2, DISCIPLINE: 7, BACKGROUND: 1, VIRTUE: 2, WILLPOWER: 1 };
const ATTRIBUTES_LIST = {
    physical: ['strength', 'dexterity', 'stamina'],
    social: ['charisma', 'manipulation', 'appearance'],
    mental: ['perception', 'intelligence', 'wits']
};
const ABILITIES_LIST = {
    talents: ['alertness', 'athletics', 'brawl', 'dodge', 'empathy', 'expression', 'intimidation', 'leadership', 'streetwise', 'subterfuge'],
    skills: ['animalken', 'craft', 'drive', 'etiquette', 'firearms', 'larceny', 'melee', 'performance', 'stealth', 'survival'],
    knowledges: ['academics', 'computer', 'finance', 'investigation', 'law', 'medicine', 'occult', 'politics', 'science', 'technology']
};

export const generateV20Stats = (npc) => {
    // Initialize
    const stats = {
        attributes: {},
        abilities: {},
        virtues: { conscience: 1, selfcontrol: 1, courage: 1 },
        humanity: 1, willpower: 1, bloodpool: 10
    };

    Object.values(ATTRIBUTES_LIST).flat().forEach(k => stats.attributes[k] = 1);
    Object.values(ABILITIES_LIST).flat().forEach(k => stats.abilities[k] = 0);

    // 1. Attributes (7/5/3)
    let profile = ["physical", "social", "mental"];
    if (npc.attributeProfile) {
        const parts = npc.attributeProfile.toLowerCase().split('/');
        if(parts.length === 3) profile = parts.map(p => p.trim());
    }
    const priorities = [7, 5, 3];
    
    profile.forEach((cat, idx) => {
        const keys = ATTRIBUTES_LIST[cat] || ATTRIBUTES_LIST.physical;
        distribute(stats.attributes, keys, priorities[idx]);
    });

    // 2. Abilities (13/9/5) - Simplified logic
    // ... (Implement ability distribution logic similar to TS version)
    
    // 3. Virtues
    // ... (Implement logic)
    stats.virtues.conscience = 3; stats.virtues.selfcontrol = 3; stats.virtues.courage = 4;

    // 4. Derivations
    stats.willpower = stats.virtues.courage;
    stats.humanity = stats.virtues.conscience + stats.virtues.selfcontrol;

    return stats;
};

function distribute(targetObj, keys, points) {
    let remaining = points;
    while(remaining > 0) {
        const k = keys[Math.floor(Math.random() * keys.length)];
        if(targetObj[k] < 5) { targetObj[k]++; remaining--; }
    }
}
