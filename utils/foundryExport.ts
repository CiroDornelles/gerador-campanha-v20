
import { NpcData, WorldContextState, V20Stats } from "../types";
import { generateV20Stats } from "./v20Rules";

// Helper to sanitize filename
const sanitizeFilename = (name: string) => name.replace(/[^a-z0-9]/gi, '_').toLowerCase();

// Helper to map clan names to WoD System keys
const mapClanToSystemKey = (clanName: string): string => {
    const clean = clanName.toLowerCase().trim();
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
    
    if (map[clean]) return map[clean];
    for (const key in map) {
        if (clean.includes(key)) return map[key];
    }
    return "wod.bio.vampire.caitiff";
};

const detectCreatureType = (clan: string): 'VAMPIRE' | 'GHOUL' | 'MORTAL' => {
    if (!clan) return 'MORTAL';
    const c = clan.toLowerCase();
    if (c.includes('ghoul') || c.includes('carnical') || c.includes('servo')) return 'GHOUL';
    if (c.includes('mortal') || c.includes('humano') || c.includes('lacaio') || c.includes('retainer') || c.includes('segurança') || c.includes('policial')) return 'MORTAL';
    return 'VAMPIRE';
};

export const generateFoundryActorData = (npc: NpcData) => {
    const creatureType = detectCreatureType(npc.clan);
    
    // USE EXISTING STATS OR GENERATE NEW ON FLY (but don't save to state unless user clicked generate in UI)
    const stats: V20Stats = npc.stats ? npc.stats : generateV20Stats(npc);

    // --- Construct Foundry JSON ---

    let bioHtml = ``;
    if (npc.quote) bioHtml += `<p><i>"${npc.quote}"</i></p><hr>`;
    bioHtml += `<h2>História</h2><p>${npc.history.replace(/\n\n/g, '</p><p>')}</p>`;
    if (npc.concept) bioHtml += `<p><b>Conceito:</b> ${npc.concept}</p>`;
    if (npc.parents) bioHtml += `<p><b>Pais Mortais:</b> ${npc.parents}</p>`;
    if (npc.birthDate) bioHtml += `<p><b>Nascimento:</b> ${npc.birthDate}</p>`;
    if (npc.embraceDate && creatureType === 'VAMPIRE') bioHtml += `<p><b>Abraço:</b> ${npc.embraceDate}</p>`;
    
    bioHtml += `<h2>Psicologia</h2>`;
    if (npc.likes?.length) bioHtml += `<p><b>Gosta:</b> ${npc.likes.join(', ')}</p>`;
    if (npc.dislikes?.length) bioHtml += `<p><b>Não Gosta:</b> ${npc.dislikes.join(', ')}</p>`;
    
    if (npc.rumors?.length) {
        bioHtml += `<h2>Rumores</h2><ul>`;
        npc.rumors.forEach(r => {
            const color = r.status === 'VERDADEIRO' ? '#4ade80' : r.status === 'FALSO' ? '#f87171' : '#facc15';
            bioHtml += `<li><b>${r.content}</b> <span style="color:${color}; font-size: 0.8em;">[${r.status}]</span><br><i>${r.context}</i></li>`;
        });
        bioHtml += `</ul>`;
    }
    if (npc.relationships?.length) {
        bioHtml += `<h2>Conexões</h2><ul><li>${npc.relationships.join('</li><li>')}</li></ul>`;
    }

    // Build Items (Backgrounds)
    const items: any[] = [];
    if (npc.influence) {
        npc.influence.forEach(inf => {
            items.push({
                name: inf,
                type: "Feature",
                img: "systems/worldofdarkness/assets/img/items/feature.svg",
                system: {
                    type: "wod.types.background",
                    value: 1,
                    max: 5,
                    iscreated: true,
                    isvisible: true,
                    isrollable: false
                }
            });
        });
    }
    // Add Generation Background if needed
    const genMatch = npc.generation.match(/\d+/);
    const generation = genMatch ? parseInt(genMatch[0]) : 13;
    if (creatureType === 'VAMPIRE' && generation < 13) {
        items.push({
            name: "Geração",
            type: "Feature",
            img: "systems/worldofdarkness/assets/img/items/feature.svg",
            system: { type: "wod.types.background", value: 13 - generation, max: 5 }
        });
    }

    const baseSystem = {
        background: bioHtml,
        appearance: npc.appearance || "",
        notes: "",
        attributes: {
            strength: { value: stats.attributes.strength, max: 5, type: "physical", label: "wod.attributes.strength", isvisible: true },
            dexterity: { value: stats.attributes.dexterity, max: 5, type: "physical", label: "wod.attributes.dexterity", isvisible: true },
            stamina: { value: stats.attributes.stamina, max: 5, type: "physical", label: "wod.attributes.stamina", isvisible: true },
            charisma: { value: stats.attributes.charisma, max: 5, type: "social", label: "wod.attributes.charisma", isvisible: true },
            manipulation: { value: stats.attributes.manipulation, max: 5, type: "social", label: "wod.attributes.manipulation", isvisible: true },
            appearance: { value: stats.attributes.appearance, max: 5, type: "social", label: "wod.attributes.appearance", isvisible: true },
            perception: { value: stats.attributes.perception, max: 5, type: "mental", label: "wod.attributes.perception", isvisible: true },
            intelligence: { value: stats.attributes.intelligence, max: 5, type: "mental", label: "wod.attributes.intelligence", isvisible: true },
            wits: { value: stats.attributes.wits, max: 5, type: "mental", label: "wod.attributes.wits", isvisible: true },
        },
        abilities: {
            ...Object.entries(stats.abilities).reduce((acc, [key, val]) => {
                // @ts-ignore
                acc[key] = { value: val, max: 5, label: `wod.abilities.${key}`, isvisible: val > 0 };
                return acc;
            }, {})
        },
        advantages: {
            willpower: { permanent: stats.willpower, temporary: stats.willpower, max: 10, roll: stats.willpower, label: "wod.advantages.willpower" },
            bloodpool: { max: stats.bloodpool, temporary: Math.floor(stats.bloodpool / 2), perturn: 1 },
            virtues: {
                conscience: { permanent: stats.virtues.conscience, max: 5, roll: stats.virtues.conscience, label: "wod.advantages.virtue.conscience" },
                selfcontrol: { permanent: stats.virtues.selfcontrol, max: 5, roll: stats.virtues.selfcontrol, label: "wod.advantages.virtue.selfcontrol" },
                courage: { permanent: stats.virtues.courage, max: 5, roll: stats.virtues.courage, label: "wod.advantages.virtue.courage" }
            },
            path: { permanent: stats.humanity, label: "wod.advantages.path.humanity" }
        },
    };

    let actorData: any = {
        name: npc.name,
        img: npc.imageUrl || "icons/svg/mystery-man.svg",
        flags: { exportSource: "V20 Storyteller Assistant" },
        items: items
    };

    if (creatureType === 'VAMPIRE') {
        actorData.type = "Vampire";
        actorData.system = {
            ...baseSystem,
            name: npc.name,
            nature: npc.nature,
            demeanor: npc.demeanor,
            concept: npc.concept || "",
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
        };
    } else {
        actorData.type = "Mortal";
        actorData.system = {
            ...baseSystem,
            name: npc.name,
            nature: npc.nature,
            demeanor: npc.demeanor,
            concept: npc.concept || npc.clan,
            settings: {
                iscreated: true,
                version: "5.0.12",
                era: "wod.era.modern",
                variant: creatureType === 'GHOUL' ? "ghoul" : "general",
                variantsheet: creatureType === 'GHOUL' ? "Vampire" : "",
                hasbloodpool: creatureType === 'GHOUL',
                hasdisciplines: creatureType === 'GHOUL',
                haswillpower: true,
                hasvirtue: true
            }
        };
    }

    return actorData;
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
        const actorData = generateFoundryActorData(npc);
        downloadJson(`${sanitizeFilename(npc.name)}.json`, actorData);
    } catch (e) {
        console.error("Foundry Export Error", e);
        alert("Erro ao exportar para Foundry VTT.");
    }
};

export const exportBundleToFoundry = (master: NpcData, worldState: WorldContextState) => {
    try {
        const mainData = generateFoundryActorData(master);
        const minionsData: { name: string, data: any }[] = [];

        if (master.minions && master.minions.length > 0) {
            master.minions.forEach(minionName => {
                const minionNpc = worldState.npcs.find(n => n.name === minionName);
                if (minionNpc) {
                    minionsData.push({
                        name: minionNpc.name,
                        data: generateFoundryActorData(minionNpc)
                    });
                }
            });
        }

        const bundle = {
            rootName: master.name,
            mainActor: mainData,
            minions: minionsData
        };
        
        downloadJson(`bundle_${sanitizeFilename(master.name)}.json`, bundle);
    } catch (e) {
        console.error("Bundle Export Error", e);
        alert("Erro ao exportar pacote.");
    }
};

export const FOUNDRY_IMPORT_MACRO = `/**
 * V20 Storyteller Assistant - Import Macro
 * Imports "bundle_*.json" files, creating folders and actors automatically.
 */
(async () => {
    const content = await new Promise((resolve) => {
        new Dialog({
            title: "Importar Pacote V20",
            content: \`<p>Selecione o arquivo JSON (bundle_*.json).</p><div class="form-group"><input type="file" name="data" accept=".json"/></div>\`,
            buttons: {
                import: {
                    icon: '<i class="fas fa-file-import"></i>',
                    label: "Importar",
                    callback: async (html) => {
                        const file = html.find('[name="data"]')[0].files[0];
                        if (!file) return resolve(null);
                        const text = await file.text();
                        resolve(JSON.parse(text));
                    }
                }
            },
            default: "import"
        }).render(true);
    });

    if (!content || !content.rootName) return;

    ui.notifications.info(\`Iniciando importação de \${content.rootName}...\`);

    // 1. Create Root Folder
    let rootFolder = game.folders.find(f => f.name === content.rootName && f.type === "Actor");
    if (!rootFolder) {
        rootFolder = await Folder.create({ name: content.rootName, type: "Actor", parent: null });
    }

    // 2. Create Main Actor
    const mainData = content.mainActor;
    mainData.folder = rootFolder.id;
    
    const existingMain = game.actors.find(a => a.name === mainData.name);
    if(existingMain) await existingMain.delete();
    
    await Actor.create(mainData);

    // 3. Create Minions
    if (content.minions && content.minions.length > 0) {
        let minionFolder = game.folders.find(f => f.name === "Lacaios" && f.folder?.id === rootFolder.id);
        if (!minionFolder) {
            minionFolder = await Folder.create({ name: "Lacaios", type: "Actor", parent: rootFolder.id });
        }

        for (const minion of content.minions) {
            const mData = minion.data;
            mData.folder = minionFolder.id;
            
            const existingMinion = game.actors.find(a => a.name === mData.name);
            if(existingMinion) await existingMinion.delete();

            await Actor.create(mData);
        }
    }

    ui.notifications.info(\`Importação concluída com sucesso!\`);
})();`;
