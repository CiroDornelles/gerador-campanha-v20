
import { NpcData, WorldContextState } from "../types";

// Helper to sanitize filename
const sanitizeFilename = (name: string) => name.replace(/[^a-z0-9]/gi, '_').toLowerCase();

// Helper to map clan names to WoD System keys (best effort)
const mapClanToSystemKey = (clanName: string): string => {
    const clean = clanName.toLowerCase().trim();
    // Common mappings based on WoD system keys
    const map: Record<string, string> = {
        "assamite": "wod.bio.vampire.assamite",
        "assamita": "wod.bio.vampire.assamite",
        "brujah": "wod.bio.vampire.brujah",
        "caitiff": "wod.bio.vampire.caitiff",
        "gangrel": "wod.bio.vampire.gangrel",
        "giovanni": "wod.bio.vampire.giovanni",
        "lasombra": "wod.bio.vampire.lasombra",
        "malkavian": "wod.bio.vampire.malkavian",
        "malkaviano": "wod.bio.vampire.malkavian",
        "nosferatu": "wod.bio.vampire.nosferatu",
        "ravnos": "wod.bio.vampire.ravnos",
        "seguidores de set": "wod.bio.vampire.set",
        "followers of set": "wod.bio.vampire.set",
        "setitas": "wod.bio.vampire.set",
        "ministry": "wod.bio.vampire.set", 
        "toreador": "wod.bio.vampire.toreador",
        "tremere": "wod.bio.vampire.tremere",
        "tzimisce": "wod.bio.vampire.tzimisce",
        "ventrue": "wod.bio.vampire.ventrue"
    };
    
    // Attempt partial match if exact match fails
    if (map[clean]) return map[clean];
    
    for (const key in map) {
        if (clean.includes(key)) return map[key];
    }

    return "wod.bio.vampire.caitiff"; // Default fallback
};

const detectCreatureType = (clan: string): 'VAMPIRE' | 'GHOUL' | 'MORTAL' => {
    if (!clan) return 'MORTAL';
    const c = clan.toLowerCase();
    if (c.includes('ghoul') || c.includes('carnical') || c.includes('servo')) return 'GHOUL';
    if (c.includes('mortal') || c.includes('humano') || c.includes('lacaio') || c.includes('retainer') || c.includes('segurança') || c.includes('policial')) return 'MORTAL';
    return 'VAMPIRE';
};

const generateActorData = (npc: NpcData): any => {
    const creatureType = detectCreatureType(npc.clan);

    // --- 1. Construct HTML Biography (for system.background) ---
    let bioHtml = ``;
    
    if (npc.quote) bioHtml += `<p><i>"${npc.quote}"</i></p><hr>`;
    
    bioHtml += `<h2>História</h2><p>${npc.history.replace(/\n\n/g, '</p><p>')}</p>`;

    if (npc.parents) bioHtml += `<p><b>Pais Mortais:</b> ${npc.parents}</p>`;
    if (npc.birthDate) bioHtml += `<p><b>Nascimento:</b> ${npc.birthDate}</p>`;
    if (npc.embraceDate && creatureType === 'VAMPIRE') bioHtml += `<p><b>Abraço:</b> ${npc.embraceDate}</p>`;

    // Psychology Section
    bioHtml += `<h2>Psicologia</h2>`;
    if (npc.likes && npc.likes.length > 0) {
        bioHtml += `<p><b>Gosta:</b> ${npc.likes.join(', ')}</p>`;
    }
    if (npc.dislikes && npc.dislikes.length > 0) {
        bioHtml += `<p><b>Não Gosta:</b> ${npc.dislikes.join(', ')}</p>`;
    }

    // Rumors Section
    if (npc.rumors && npc.rumors.length > 0) {
        bioHtml += `<h2>Rumores</h2><ul>`;
        npc.rumors.forEach(r => {
            const color = r.status === 'VERDADEIRO' ? '#4ade80' : r.status === 'FALSO' ? '#f87171' : '#facc15';
            bioHtml += `<li><b>${r.content}</b> <span style="color:${color}; font-size: 0.8em;">[${r.status}]</span><br><i>${r.context}</i></li>`;
        });
        bioHtml += `</ul>`;
    }

    // Connections
    if (npc.relationships && npc.relationships.length > 0) {
        bioHtml += `<h2>Conexões</h2><ul><li>${npc.relationships.join('</li><li>')}</li></ul>`;
    }

    // --- 2. Create Items (Influence as Backgrounds) ---
    const items: any[] = [];
    if (npc.influence) {
        npc.influence.forEach(inf => {
            items.push({
                name: inf,
                type: "Feature",
                img: "systems/worldofdarkness/assets/img/items/feature.svg",
                system: {
                    type: "wod.types.background",
                    value: 1, // Default dot
                    max: 5,
                    iscreated: true,
                    isvisible: true,
                    isrollable: false
                }
            });
        });
    }

    // Parse Generation (only relevant for Vampires)
    const genMatch = npc.generation.match(/\d+/);
    const generation = genMatch ? parseInt(genMatch[0]) : 13;
    
    // Calculate max blood pool
    // Vampires: Gen based. Ghouls: Usually 10 (limited by body size).
    let maxBlood = 10;
    if (creatureType === 'VAMPIRE') {
        maxBlood = generation > 13 ? 10 : (10 + (13 - generation));
    }

    // --- 3. Build the Actor JSON Structure ---
    
    const baseSystem = {
        // Narrative Fields
        background: bioHtml, // Main Bio
        appearance: npc.appearance || "", // Appearance field
        notes: "",

        // Default Attributes Structure (V20)
        attributes: {
            strength: { value: 2, max: 5, type: "physical", label: "wod.attributes.strength", isvisible: true },
            dexterity: { value: 2, max: 5, type: "physical", label: "wod.attributes.dexterity", isvisible: true },
            stamina: { value: 2, max: 5, type: "physical", label: "wod.attributes.stamina", isvisible: true },
            charisma: { value: 2, max: 5, type: "social", label: "wod.attributes.charisma", isvisible: true },
            manipulation: { value: 2, max: 5, type: "social", label: "wod.attributes.manipulation", isvisible: true },
            appearance: { value: 2, max: 5, type: "social", label: "wod.attributes.appearance", isvisible: true },
            perception: { value: 2, max: 5, type: "mental", label: "wod.attributes.perception", isvisible: true },
            intelligence: { value: 2, max: 5, type: "mental", label: "wod.attributes.intelligence", isvisible: true },
            wits: { value: 2, max: 5, type: "mental", label: "wod.attributes.wits", isvisible: true },
        },
        
        // Essential Advantages
        advantages: {
            willpower: { permanent: 5, temporary: 5, max: 10, roll: 5, label: "wod.advantages.willpower" },
            bloodpool: { max: maxBlood, temporary: Math.floor(maxBlood / 2), perturn: 1 },
            virtues: {
                conscience: { permanent: 2, max: 5, roll: 2, label: "wod.advantages.virtue.conscience" },
                selfcontrol: { permanent: 2, max: 5, roll: 2, label: "wod.advantages.virtue.selfcontrol" },
                courage: { permanent: 2, max: 5, roll: 2, label: "wod.advantages.virtue.courage" }
            },
            path: {
                permanent: 7, // Default Humanity
                label: "wod.advantages.path.humanity"
            }
        },
    };

    let foundryActor: any = {};

    if (creatureType === 'VAMPIRE') {
        // --- VAMPIRE STRUCTURE ---
        foundryActor = {
            name: npc.name,
            type: "Vampire",
            img: npc.imageUrl || "icons/svg/mystery-man.svg",
            system: {
                ...baseSystem,
                name: npc.name,
                nature: npc.nature,
                demeanor: npc.demeanor,
                generation: generation,
                sire: npc.sire,
                clan: mapClanToSystemKey(npc.clan),
                custom: { clan: npc.clan },
                settings: {
                    iscreated: true,
                    version: "5.0.12",
                    era: "wod.era.modern",
                    hasbloodpool: true,
                    haswillpower: true,
                    hasvirtue: true
                }
            }
        };
    } else {
        // --- GHOUL / MORTAL STRUCTURE ---
        foundryActor = {
            name: npc.name,
            type: "Mortal", // Ghouls are Mortals in this system with variant settings
            img: npc.imageUrl || "icons/svg/mystery-man.svg",
            system: {
                ...baseSystem,
                name: npc.name,
                nature: npc.nature,
                demeanor: npc.demeanor,
                concept: npc.clan, // Use clan field as Concept/Job for mortals
                settings: {
                    iscreated: true,
                    version: "5.0.12",
                    era: "wod.era.modern",
                    variant: creatureType === 'GHOUL' ? "ghoul" : "general",
                    variantsheet: creatureType === 'GHOUL' ? "Vampire" : "", // Ghouls use Vampire-like sheet
                    hasbloodpool: creatureType === 'GHOUL', // Only ghouls need blood
                    hasdisciplines: creatureType === 'GHOUL',
                    haswillpower: true,
                    hasvirtue: true
                }
            }
        };
    }

    // Attach Items and Flags
    foundryActor.items = items;
    foundryActor.flags = { exportSource: "V20 Storyteller Assistant" };

    return foundryActor;
};

const downloadJson = (filename: string, data: any) => {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

export const exportNpcToFoundry = (npc: NpcData) => {
    try {
        const actorData = generateActorData(npc);
        downloadJson(`${sanitizeFilename(npc.name)}.json`, actorData);
    } catch (e) {
        console.error("Foundry Export Error", e);
        alert("Erro ao exportar para Foundry VTT.");
    }
};

export const exportBundleToFoundry = (master: NpcData, worldState: WorldContextState) => {
    try {
        const actors = [generateActorData(master)];
        
        if (master.minions && master.minions.length > 0) {
            master.minions.forEach(minionName => {
                const minion = worldState.npcs.find(n => n.name === minionName);
                if (minion) {
                    actors.push(generateActorData(minion));
                }
            });
        }
        
        downloadJson(`bundle_${sanitizeFilename(master.name)}.json`, { actors });
    } catch (e) {
        console.error("Bundle Export Error", e);
        alert("Erro ao exportar pacote.");
    }
};

export const FOUNDRY_IMPORT_MACRO = `/**
 * Macro to import Bundle JSON from V20 Storyteller Assistant
 * Supports single Actor JSON or Bundle { actors: [] } JSON
 */
const content = await new Promise((resolve) => {
  new Dialog({
    title: "Importar do V20 Assistant",
    content: \`<form>
      <div class="form-group">
        <label>Selecione o arquivo JSON (Single ou Bundle)</label>
        <div class="form-fields">
          <input type="file" id="import-file" accept=".json">
        </div>
      </div>
    </form>\`,
    buttons: {
      import: {
        icon: '<i class="fas fa-file-import"></i>',
        label: "Importar",
        callback: async (html) => {
          const file = html.find("#import-file")[0].files[0];
          if (!file) return;
          const text = await file.text();
          resolve(JSON.parse(text));
        }
      }
    },
    default: "import"
  }).render(true);
});

if (content) {
  const actorsToCreate = content.actors ? content.actors : [content];
  let createdCount = 0;
  
  for (const actorData of actorsToCreate) {
    // Check if exists to avoid duplication (simple name check)
    const existing = game.actors.find(a => a.name === actorData.name);
    if (existing) {
        const update = await Dialog.confirm({
            title: "Actor Existente",
            content: \`<p>O ator <strong>\${actorData.name}</strong> já existe. Deseja atualizar/sobrescrever?</p>\`
        });
        if (update) {
           await existing.delete();
        } else {
           continue;
        }
    }
    
    await Actor.create(actorData);
    createdCount++;
  }
  
  ui.notifications.info(\`Importação concluída: \${createdCount} atores criados.\`);
}
`;
