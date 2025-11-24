
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { EntityType, WorldContextState, NpcData, FactionData, LocationData, RelationshipMapData, AdjustmentResult } from "../types";

const MODEL_NAME = "gemini-2.5-flash";
const IMAGE_MODEL_NAME = "gemini-2.5-flash-image";

// --- V20 Reference Data ---
const V20_ARCHETYPES_TEXT = `
ARQUITETO: Busca construir algo de valor duradouro.
AUTOCRATA: Busca poder e controle por si só.
BOBO DA CORTE: Vê o mundo como tolices e usa o humor para iluminar ou ridicularizar.
BON VIVANT: Vive intensamente, aproveitando cada segundo.
CAÇADOR DE EMOÇÕES: Vive pela adrenalina do perigo.
CAMALEÃO: Cauteloso, passa-se por outros para sobreviver.
CELEBRANTE: Encontra alegria em sua paixão ou causa.
COMPETIDOR: Encara tudo como um desafio a ser vencido.
CONFORMISTA: Um seguidor que busca segurança no grupo.
CRIANÇA: Imatura, prefere que outros cuidem dela.
CUIDADOR: Encontra consolo em proteger e confortar os outros.
DEFENSOR: Luta para proteger uma causa ou inovação frágil.
DESVIANTE: Marginalizado por gostos ou crenças não convencionais.
DILETANTE: Interessa-se por tudo, mas não se aprofunda em nada.
ENIGMA: Ações bizarras e desconcertantes.
FANÁTICO: Consumido por uma causa única.
FERA: Respeita apenas a força e a conquista pessoal.
FILÓSOFO: Examina tudo logicamente em busca de padrões.
GALANTE: Busca atenção e admiração.
GURU: Inspira os outros espiritualmente ou ideologicamente.
IDEALISTA: Acredita em um propósito maior ou moral superior.
JUIZ: Busca justiça e a resolução de disputas.
MALANDRO: Egoísta, coloca seus interesses sempre em primeiro lugar.
MÁRTIR: Sofre por sua causa ou pelos outros.
MASOQUISTA: Testa seus limites através da dor e provação.
MERCENÁRIO: Tudo tem um preço; tudo é negócio.
MONSTRO: Aceita sua natureza de predador e ferramenta das trevas.
OLHO DA TEMPESTADE: O caos o segue, mas ele permanece calmo.
PEDAGOGO: Quer ensinar e garantir que sua mensagem seja ouvida.
PENITENTE: Busca expiar o pecado de sua existência.
PERFECCIONISTA: Exige execução impecável de si e dos outros.
RANZINZA: Amargo, cínico e pessimista.
REBELDE: Descontente com o status quo, mina as autoridades.
SÁDICO: Vive para causar dor e sofrimento por prazer.
SHOW DE HORRORES: Deleita-se em chocar e amedrontar.
SOBREVIVENTE: Nunca desiste, resiste a qualquer custo.
SOLDADO: Cumpre ordens, mas com independência tática.
SOLITÁRIO: Prefere sua própria companhia.
TRADICIONALISTA: Prefere métodos consagrados e resiste à mudança.
TRAPACEIRO: Usa mentiras e manipulação para atalhar o sucesso.
TIRANO: Quer liderar para impor ordem ao caos.
VALENTÃO: Acredita que o poder (físico ou social) dita o que é certo.
VISIONÁRIO: Persegue o que poucos têm coragem de imaginar.
`;

const validArchetypes = [
  "Arquiteto", "Autocrata", "Bobo da Corte", "Bon Vivant", "Caçador de Emoções", "Camaleão", 
  "Celebrante", "Competidor", "Conformista", "Criança", "Cuidador", "Defensor", "Desviante", 
  "Diletante", "Enigma", "Fanático", "Fera", "Filósofo", "Galante", "Guru", "Idealista", 
  "Juiz", "Malandro", "Mártir", "Masoquista", "Mercenário", "Monstro", "Olho da Tempestade", 
  "Pedagogo", "Penitente", "Perfeccionista", "Ranzinza", "Rebelde", "Sádico", "Show de Horrores", 
  "Sobrevivente", "Soldado", "Solitário", "Tradicionalista", "Trapaceiro", "Tirano", "Valentão", "Visionário"
];

// --- Schemas ---

const rumorSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    content: { type: Type.STRING, description: "O rumor que circula nas ruas." },
    status: { type: Type.STRING, enum: ['VERDADEIRO', 'EXAGERO', 'FALSO'] },
    context: { type: Type.STRING, description: "Explicação: Por que é exagerado? Qual a verdade por trás do falso?" }
  },
  required: ["content", "status", "context"]
};

const npcSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.STRING },
    name: { type: Type.STRING },
    clan: { type: Type.STRING },
    generation: { type: Type.STRING },
    sire: { type: Type.STRING, description: "Nome do senhor ou 'Desconhecido'" },
    nature: { type: Type.STRING, enum: validArchetypes, description: "O verdadeiro 'Eu' do personagem." },
    demeanor: { type: Type.STRING, enum: validArchetypes, description: "A máscara social que ele usa." },
    concept: { type: Type.STRING, description: "Conceito resumido (Ex: Hacker Anarquista, Socialite Decadente)." },
    attributeProfile: { 
      type: Type.STRING, 
      enum: ["Physical/Social/Mental", "Physical/Mental/Social", "Social/Physical/Mental", "Social/Mental/Physical", "Mental/Physical/Social", "Mental/Social/Physical"],
      description: "A ordem de prioridade dos Atributos (Primário/Secundário/Terciário)."
    },
    history: { 
      type: Type.STRING, 
      description: "Uma narrativa estruturada em 5 parágrafos: 1. Vida Mortal (A Máscara), 2. O Abraço (O Catalisador), 3. Primeiras Noites (O Aprendizado), 4. Ponto de Virada (O Conflito), 5. Ambição Atual e o Futuro." 
    },
    appearance: { type: Type.STRING },
    influence: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Áreas de influência (ex: Polícia, Finanças)" },
    relationships: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Conexões com facções ou NPCs existentes." },
    quote: { type: Type.STRING },
    // V2 Fields
    birthDate: { type: Type.STRING, description: "Data Completa de Nascimento (Dia, Mês, Ano, Hora se relevante). Ex: '12 de Outubro de 1985, às 03:00'" },
    embraceDate: { type: Type.STRING, description: "Data Completa do Abraço (Dia, Mês, Ano). Ex: '04 de Fevereiro de 2010'" },
    parents: { type: Type.STRING, description: "Nomes dos pais biológicos mortais. Ex: 'João e Maria Silva'" },
    likes: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Exatamente 5 coisas que o NPC gosta (hobbies, manias, prazeres)" },
    dislikes: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Exatamente 5 coisas que o NPC odeia" },
    rumors: { type: Type.ARRAY, items: rumorSchema, description: "Lista de rumores sobre o NPC (Verdadeiros, Falsos, Exageros)" }
  },
  required: ["id", "name", "clan", "nature", "demeanor", "concept", "attributeProfile", "history", "influence", "birthDate", "embraceDate", "parents", "likes", "dislikes", "rumors"],
};

const factionSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.STRING },
    name: { type: Type.STRING },
    type: { type: Type.STRING, description: "ex: Coterie, Gangue Anarquista, Conselho da Camarilla" },
    leader: { type: Type.STRING, description: "Nome do líder" },
    territory: { type: Type.STRING },
    goals: { type: Type.STRING },
    resources: { type: Type.ARRAY, items: { type: Type.STRING } },
    enemies: { type: Type.ARRAY, items: { type: Type.STRING } }
  },
  required: ["id", "name", "type", "leader", "goals"],
};

const locationSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.STRING },
    name: { type: Type.STRING },
    type: { type: Type.STRING, description: "ex: Elysium, Boate, Refúgio" },
    controlledBy: { type: Type.STRING, description: "Facção ou NPC" },
    atmosphere: { type: Type.STRING },
    security: { type: Type.STRING },
    description: { type: Type.STRING }
  },
  required: ["id", "name", "type", "controlledBy", "description"],
};

const mapSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    nodes: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          label: { type: Type.STRING },
          type: { type: Type.STRING, enum: ['LEADER', 'MEMBER', 'ALLY', 'ENEMY', 'RESOURCE'] }
        },
        required: ["id", "label", "type"]
      }
    },
    edges: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          source: { type: Type.STRING, description: "Must match a node id" },
          target: { type: Type.STRING, description: "Must match a node id" },
          label: { type: Type.STRING, description: "Relationship description" }
        },
        required: ["source", "target", "label"]
      }
    }
  },
  required: ["nodes", "edges"]
};

const upgradeNpcSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    history: { type: Type.STRING, description: "História expandida e reestruturada em 5 parágrafos se a original for curta." },
    birthDate: { type: Type.STRING, description: "DD/MM/AAAA HH:MM" },
    embraceDate: { type: Type.STRING, description: "DD/MM/AAAA" },
    parents: { type: Type.STRING },
    concept: { type: Type.STRING },
    attributeProfile: { type: Type.STRING, enum: ["Physical/Social/Mental", "Physical/Mental/Social", "Social/Physical/Mental", "Social/Mental/Physical", "Mental/Physical/Social", "Mental/Social/Physical"] },
    likes: { type: Type.ARRAY, items: { type: Type.STRING }, description: "5 itens" },
    dislikes: { type: Type.ARRAY, items: { type: Type.STRING }, description: "5 itens" },
    rumors: { type: Type.ARRAY, items: rumorSchema }
  },
  required: ["birthDate", "embraceDate", "parents", "concept", "attributeProfile", "likes", "dislikes", "rumors"]
};

const multiNpcSchema: Schema = {
  type: Type.ARRAY,
  items: npcSchema
};

const multiLocationSchema: Schema = {
  type: Type.ARRAY,
  items: locationSchema
};

const resourcesSchema: Schema = {
  type: Type.ARRAY,
  items: { type: Type.STRING }
};

const adjustmentSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    updatedNpcs: { type: Type.ARRAY, items: npcSchema, description: "Lista de NPCs que sofreram alterações." },
    updatedFactions: { type: Type.ARRAY, items: factionSchema, description: "Lista de Facções que sofreram alterações." },
    updatedLocations: { type: Type.ARRAY, items: locationSchema, description: "Lista de Lugares que sofreram alterações." },
    summary: { type: Type.STRING, description: "Resumo curto das mudanças realizadas." }
  },
  required: ["updatedNpcs", "updatedFactions", "updatedLocations", "summary"]
};

const frequenterSuggestionSchema: Schema = {
    type: Type.OBJECT,
    properties: {
        suggestedNpcNames: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING }, 
            description: "Lista com os NOMES exatos dos NPCs existentes que deveriam frequentar este local." 
        },
        reasoning: { type: Type.STRING, description: "Breve explicação do porquê." }
    },
    required: ["suggestedNpcNames"]
};

// --- Helper to serialize world state SAFELY (No Images) ---

const serializeWorldState = (state: WorldContextState): string => {
  const sanitizedState = {
    npcs: state.npcs.map(({ imageUrl, ...rest }) => rest),
    factions: state.factions.map(({ imageUrl, relationshipMap, ...rest }) => rest),
    locations: state.locations.map(({ imageUrl, ...rest }) => rest),
  };
  return JSON.stringify(sanitizedState, null, 2);
};

// --- API Helper ---
const getClient = (apiKey: string) => {
    if (!apiKey) throw new Error("Chave de API não fornecida.");
    return new GoogleGenAI({ apiKey });
}

export const generateEntity = async (
  type: EntityType,
  userInput: string,
  worldState: WorldContextState,
  apiKey: string
): Promise<any> => {
  
  const ai = getClient(apiKey);
  const worldContext = serializeWorldState(worldState);
  
  let systemInstruction = `Você é um Narrador de Vampiro: A Máscara Edição de 20 Anos (V20). 
  Sua tarefa é gerar lore criativa, profunda e interconectada em PORTUGUÊS DO BRASIL (PT-BR).
  NÃO use regras mecânicas detalhadas (fichas completas com bolinhas) a menos que solicitado no schema (como AttributeProfile).
  Foque na narrativa, relacionamentos, atmosfera e intriga.
  
  LISTA OFICIAL DE ARQUÉTIPOS V20 (Use APENAS estes para Natureza e Comportamento):
  ${V20_ARCHETYPES_TEXT}
  
  ESTADO ATUAL DO MUNDO (JSON):
  ${worldContext}`;

  let responseSchema: Schema;
  let prompt = "";

  switch (type) {
    case EntityType.NPC:
      responseSchema = npcSchema;
      prompt = `Crie um NPC detalhado. ${userInput ? `Diretriz do Usuário: "${userInput}"` : "Crie um Membro único e interessante."}
      
      OBRIGATÓRIO - ESTRUTURA DA HISTÓRIA (Mínimo 5 Parágrafos):
      1. Vida Mortal (A Máscara): Quem ele era? Conceito e paixões humanas.
      2. O Abraço (O Catalisador): Trauma e transformação.
      3. As Primeiras Noites (O Aprendizado): Adaptação à não-vida.
      4. O Ponto de Virada (O Conflito): Evento que definiu sua Natureza.
      5. Ambição Atual e o Futuro (A Trama): Planos atuais.

      DADOS EXTRAS OBRIGATÓRIOS:
      - Natureza e Comportamento (Escolha da lista oficial).
      - Conceito (Resumo da identidade).
      - Attribute Profile (Prioridade de atributos Físico/Social/Mental para fins de regra).
      - Datas Completas e Pais Mortais.
      - Rumores e Gostos.`;
      break;
    case EntityType.FACTION:
      responseSchema = factionSchema;
      prompt = `Crie uma Facção ou Coterie. ${userInput ? `Diretriz do Usuário: "${userInput}"` : "Crie um grupo disputando poder."}`;
      break;
    case EntityType.LOCATION:
      responseSchema = locationSchema;
      prompt = `Crie um Lugar de interesse. ${userInput ? `Diretriz do Usuário: "${userInput}"` : "Crie um local significativo na cidade."}`;
      break;
    default:
      throw new Error("Tipo de Entidade Inválido");
  }

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.85,
      },
    });

    const text = response.text;
    if (!text) throw new Error("Sem resposta da IA");
    
    return JSON.parse(text);

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const upgradeNpcData = async (npc: NpcData, apiKey: string): Promise<Partial<NpcData>> => {
    const ai = getClient(apiKey);
    const systemInstruction = `Você é um Narrador de V20. Sua tarefa é atualizar um NPC antigo para o novo formato de ficha detalhada e compatível com o sistema V20 (Foundry).
    
    LISTA DE ARQUÉTIPOS VÁLIDOS:
    ${V20_ARCHETYPES_TEXT}
    
    Use Português do Brasil.`;

    const prompt = `NPC Existente:
    Nome: ${npc.name}
    Clã: ${npc.clan}
    História: ${npc.history}
    Natureza/Comportamento Atual: ${npc.nature}/${npc.demeanor}

    Tarefa:
    1. Defina 'Concept' e 'AttributeProfile' (Físico/Social/Mental) baseados na história.
    2. Gere os campos novos se faltarem (Datas, Pais, Rumores).
    3. Reescreva a história se for muito curta.`;

    try {
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: prompt,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
                responseSchema: upgradeNpcSchema,
                temperature: 0.8,
            }
        });
        
        const text = response.text;
        if (!text) throw new Error("Sem resposta da IA");
        return JSON.parse(text);

    } catch (e) {
        console.error("Upgrade NPC Error", e);
        throw e;
    }
}

export const harmonizeNpcProfile = async (npc: NpcData, apiKey: string): Promise<NpcData> => {
    const ai = getClient(apiKey);
    
    const systemInstruction = `Você é um Narrador de V20.
    O usuário alterou manualmente a História do NPC.
    Reescreva a ficha completa para harmonizar com a nova história.
    
    LISTA DE ARQUÉTIPOS VÁLIDOS:
    ${V20_ARCHETYPES_TEXT}
    
    Garanta que Natureza, Comportamento e AttributeProfile (Atributos Prioritários) façam sentido com a nova narrativa.`;

    const prompt = `
    FICHA DO NPC (Com edições manuais):
    Nome: ${npc.name}
    Clã: ${npc.clan}
    História Atual (VERDADE): ${npc.history}
    
    TAREFA:
    Reescreva todos os campos para combinar com a história.
    Retorne o JSON completo do NPC.`;

    try {
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: prompt,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
                responseSchema: npcSchema,
                temperature: 0.85,
            }
        });

        const text = response.text;
        if (!text) throw new Error("Sem resposta da IA");
        return JSON.parse(text) as NpcData;
    } catch(e) {
        console.error("Harmonize NPC Error", e);
        throw e;
    }
}

export const generateFactionMembers = async (
  faction: FactionData, 
  userInput: string, 
  worldState: WorldContextState,
  apiKey: string
): Promise<NpcData[]> => {
  const ai = getClient(apiKey);
  const worldContext = serializeWorldState(worldState);
  const isNumber = !isNaN(parseInt(userInput));
  const count = isNumber ? parseInt(userInput) : "varios";

  const systemInstruction = `Você é um Narrador de V20.
  Preencha a hierarquia da facção com NPCs detalhados.
  Use os ARQUÉTIPOS OFICIAIS para Natureza/Comportamento.
  Defina Concept e AttributeProfile para cada um.
  
  ${V20_ARCHETYPES_TEXT}
  
  ESTADO DO MUNDO: ${worldContext}`;

  const prompt = `Gere ${isNumber ? count : 'membros'} para a facção "${faction.name}" (${faction.type}).
  ${!isNumber ? `Funções desejadas: ${userInput}` : ''}
  Gere fichas completas (História 5 parágrafos, Concept, Atributos, etc).`;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: multiNpcSchema,
        temperature: 0.85,
      },
    });

    const text = response.text;
    if (!text) throw new Error("Sem resposta da IA");
    
    return JSON.parse(text) as NpcData[];

  } catch (error) {
    console.error("Batch NPC Generation Error:", error);
    throw error;
  }
};

// ... (Rest of the file: generateFactionLocations, generateFactionResources, suggestFrequenters, generateLocationFrequenters, generateNpcMinion, applyWorldAdjustment, generateFactionMap, refineText, generateEntityImage - unchanged logic but ensure imports are correct if needed)

export const generateFactionLocations = async (
  faction: FactionData,
  userInput: string,
  worldState: WorldContextState,
  apiKey: string
): Promise<LocationData[]> => {
  const ai = getClient(apiKey);
  const worldContext = serializeWorldState(worldState);

  const systemInstruction = `Você é um Narrador de V20.
  Sua tarefa é criar domínios, refúgios e áreas de influência para uma facção específica.
  Crie locais que façam sentido temático com a facção (Ex: Anarquistas em galpões, Ventrue em arranha-céus, Nosferatu em esgotos).
  Use Português do Brasil.
  
  ESTADO DO MUNDO (JSON):
  ${worldContext}`;

  const prompt = `Crie lugares controlados pela facção: "${faction.name}" (${faction.type}).
  Diretrizes do usuário: "${userInput || "Crie refúgios, locais de encontro e áreas de caça pertinentes."}".
  O campo 'controlledBy' deve ser o nome desta facção.`;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: multiLocationSchema,
        temperature: 0.85,
      },
    });

    const text = response.text;
    if (!text) throw new Error("Sem resposta da IA");

    return JSON.parse(text) as LocationData[];
  } catch (error) {
    console.error("Batch Location Generation Error", error);
    throw error;
  }
};

export const generateFactionResources = async (
  faction: FactionData,
  userInput: string,
  worldState: WorldContextState,
  apiKey: string
): Promise<string[]> => {
  const ai = getClient(apiKey);
  const worldContext = serializeWorldState(worldState);

  const systemInstruction = `Você é um Narrador de V20.
  Sua tarefa é gerar novos recursos (assets), contatos, relíquias ou fontes de renda para uma facção existente.
  Use Português do Brasil.
  
  ESTADO DO MUNDO (JSON):
  ${worldContext}`;

  const prompt = `Gere novos recursos para a facção: "${faction.name}" (${faction.type}).
  Objetivos: "${faction.goals}".
  Recursos Atuais: ${faction.resources.join(", ")}.
  
  Diretriz do usuário: "${userInput || "Gere recursos úteis para expandir a influência deles."}".
  
  Retorne uma lista de strings curtas e descritivas (ex: "Contatos na Polícia Federal", "Um refúgio de emergência no Porto").`;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: resourcesSchema,
        temperature: 0.85,
      },
    });

    const text = response.text;
    if (!text) throw new Error("Sem resposta da IA");

    return JSON.parse(text) as string[];
  } catch (error) {
    console.error("Resource Generation Error", error);
    throw error;
  }
}

export const suggestFrequenters = async (
    location: LocationData,
    worldState: WorldContextState,
    apiKey: string
): Promise<string[]> => {
    const ai = getClient(apiKey);
    const worldContext = serializeWorldState(worldState);

    const systemInstruction = `Você é um Narrador de V20.
    Sua tarefa é analisar os NPCs existentes na crônica e sugerir quais deles frequentariam este local.
    Baseie-se no Clã, Alianças, História e Personalidade.
    Se o local for dos Gangrel, sugira Gangrels. Se for um Elysium, sugira Anciões.
    Use Português do Brasil.
    
    ESTADO DO MUNDO (JSON):
    ${worldContext}`;

    const prompt = `Local: "${location.name}" (${location.type}).
    Descrição: ${location.description}.
    Controlado por: ${location.controlledBy}.
    
    Retorne uma lista contendo APENAS os nomes exatos dos NPCs existentes que fariam sentido frequentar este local.`;

    try {
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: prompt,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
                responseSchema: frequenterSuggestionSchema,
                temperature: 0.7, // Lower temp for more analytical matching
            }
        });

        const text = response.text;
        if (!text) throw new Error("Sem resposta da IA");
        const json = JSON.parse(text);
        return json.suggestedNpcNames || [];
    } catch (e) {
        console.error("Frequenter Suggestion Error", e);
        return []; // Fail graceful
    }
}

export const generateLocationFrequenters = async (
    location: LocationData,
    type: 'MORTAL' | 'VAMPIRE' | 'GHOUL',
    worldState: WorldContextState,
    apiKey: string
): Promise<NpcData[]> => {
    const ai = getClient(apiKey);
    const worldContext = serializeWorldState(worldState);

    const systemInstruction = `Você é um Narrador de V20.
    Sua tarefa é criar NPCs (fichas completas) que frequentam um local específico.
    Se forem Mortais, foque em seus papéis (Barman, Segurança, Cliente VIP).
    Se forem Vampiros, crie membros que usam o local para caça ou política.
    Se forem Ghouls, crie servos do dono do local.
    Use ARQUÉTIPOS VÁLIDOS para Natureza/Comportamento.
    
    ESTADO DO MUNDO (JSON):
    ${worldContext}`;

    const prompt = `Gere 3 NPCs do tipo ${type} que frequentam o local: "${location.name}" (${location.type}).
    Descrição do Local: ${location.description}.
    Controlado por: ${location.controlledBy}.
    
    Os NPCs devem ter conexões com este local em sua história.`;

    try {
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: prompt,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
                responseSchema: multiNpcSchema,
                temperature: 0.85,
            }
        });

        const text = response.text;
        if (!text) throw new Error("Sem resposta da IA");
        return JSON.parse(text) as NpcData[];
    } catch (e) {
        console.error("Location Frequenters Generation Error", e);
        throw e;
    }
}

export const generateNpcMinion = async (
    npc: NpcData,
    type: 'GHOUL' | 'RETAINER' | 'CHILD',
    worldState: WorldContextState,
    apiKey: string
): Promise<NpcData> => {
    const ai = getClient(apiKey);
    const worldContext = serializeWorldState(worldState);

    const systemInstruction = `Você é um Narrador de V20.
    Sua tarefa é criar um NPC subordinado (Lacaio, Ghoul ou Cria) para um NPC existente.
    Este novo NPC deve ser leal (ou secretamente ressentido) ao seu mestre.
    Use ARQUÉTIPOS VÁLIDOS.
    
    ESTADO DO MUNDO (JSON):
    ${worldContext}`;

    const typeDesc = type === 'CHILD' ? 'Cria (Vampiro recém abraçado por ele)' : type === 'GHOUL' ? 'Ghoul (Servo de Sangue)' : 'Lacaio Mortal';

    const prompt = `Gere um NPC do tipo ${typeDesc} para o mestre: "${npc.name}" (${npc.clan}).
    História do Mestre: ${npc.history}.
    
    O novo NPC deve ter sua história entrelaçada com a do mestre.`;

    try {
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: prompt,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
                responseSchema: npcSchema,
                temperature: 0.85,
            }
        });

        const text = response.text;
        if (!text) throw new Error("Sem resposta da IA");
        return JSON.parse(text) as NpcData;
    } catch (e) {
        console.error("Minion Generation Error", e);
        throw e;
    }
}


export const applyWorldAdjustment = async (
  instruction: string,
  worldState: WorldContextState,
  contextFaction: FactionData,
  apiKey: string
): Promise<AdjustmentResult> => {
  const ai = getClient(apiKey);
  const worldContext = serializeWorldState(worldState);

  const systemInstruction = `Você é o Narrador Supremo (Storyteller) de V20.
  Sua função é REESCREVER A REALIDADE da crônica baseada na instrução do usuário.
  
  Você receberá o JSON completo do estado do mundo.
  Você deve analisar a instrução e identificar quais NPCs, Facções e Lugares precisam ser alterados para que a instrução se torne verdade.
  
  IMPORTANTE:
  1. Mantenha os IDs originais das entidades. Isso é crucial para a atualização.
  2. Retorne APENAS as entidades que foram modificadas.
  3. Se a instrução diz "NPC X agora é líder da Facção Y", você deve atualizar a Facção Y (campo líder) E atualizar a história/ambição do NPC X.
  4. Garanta consistência narrativa. Se um líder mudou, o antigo líder talvez tenha morrido ou sido rebaixado? Atualize-o também.
  
  Use Português do Brasil.`;

  const prompt = `
  ESTADO ATUAL DO MUNDO (JSON):
  ${worldContext}

  CONTEXTO (Facção que originou o pedido): ${contextFaction.name}

  INSTRUÇÃO DE AJUSTE DE REALIDADE: "${instruction}"

  Analise o impacto dessa instrução e retorne os objetos atualizados.`;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: adjustmentSchema,
        temperature: 0.6, // Slightly lower temperature for consistency
      },
    });

    const text = response.text;
    if (!text) throw new Error("Sem resposta da IA");
    
    return JSON.parse(text) as AdjustmentResult;

  } catch (error) {
    console.error("Adjustment Error:", error);
    throw error;
  }
}

export const generateFactionMap = async (factionData: FactionData, worldState: WorldContextState, apiKey: string): Promise<RelationshipMapData> => {
  const ai = getClient(apiKey);
  
  // Use sanitized context here too for consistency
  const worldContext = serializeWorldState(worldState);
  
  const systemInstruction = `Você é um especialista em política de Vampiro: A Máscara.
  Crie um mapa de relacionamentos para a facção fornecida.
  Identifique o líder, membros principais, aliados externos, inimigos e recursos vitais.
  Retorne apenas os nós (pessoas/grupos) e as arestas (conexões) em formato JSON.
  Use Português do Brasil.
  
  ESTADO DO MUNDO (JSON):
  ${worldContext}`;

  const prompt = `Gere um mapa relacional para a facção: ${factionData.name}.
  Líder: ${factionData.leader}.
  Inimigos: ${factionData.enemies.join(', ')}.
  Objetivos: ${factionData.goals}.
  
  Crie de 5 a 8 nós importantes (incluindo o líder) e suas conexões.`;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: mapSchema,
        temperature: 0.5,
      },
    });

    const text = response.text;
    if (!text) throw new Error("Sem resposta da IA para o mapa");
    return JSON.parse(text);

  } catch (error) {
    console.error("Map Generation Error:", error);
    throw error;
  }
}

export const refineText = async (currentText: string, instruction: string, fieldName: string, apiKey: string): Promise<string> => {
  const ai = getClient(apiKey);
  const systemInstruction = `Você é um Assistente de Narrador para Vampiro: A Máscara V20.
  Sua tarefa é reescrever, expandir ou corrigir textos descritivos de lore.
  Mantenha o tom gótico, sombrio e intrigante.
  Responda APENAS com o texto reescrito, sem aspas, sem "Aqui está", sem metadados.
  Use Português do Brasil.`;

  const prompt = `
  Texto Original (${fieldName}): "${currentText}"
  
  Instrução do Narrador para alteração: "${instruction}"
  
  Reescreva o texto seguindo a instrução:`;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "text/plain",
        temperature: 0.9,
      },
    });
    
    return response.text?.trim() || currentText;
  } catch (error) {
    console.error("Refine Text Error", error);
    throw error;
  }
};

export const generateEntityImage = async (type: EntityType, data: any, apiKey: string, userPrompt?: string): Promise<string> => {
  const ai = getClient(apiKey);
  let prompt = "";
  
  if (type === EntityType.NPC) {
    const npc = data as NpcData;
    if (userPrompt) {
        prompt = `A Vampire: The Masquerade character portrait. 
        Visual Description: ${userPrompt}.
        Context: ${npc.name}, ${npc.clan}. 
        Style: Photorealistic, dark, gothic, cinematic lighting.`;
    } else {
        prompt = `A hyper-realistic, dark, moody digital painting character portrait of a Vampire: The Masquerade NPC. 
        Name: ${npc.name}. Clan: ${npc.clan}. 
        Appearance: ${npc.appearance}. 
        Atmosphere: Gothic, noir, World of Darkness style, cinematic lighting, high detail.`;
    }
  } else if (type === EntityType.FACTION) {
    const faction = data as FactionData;
    if (userPrompt) {
        prompt = `A cinematic shot or emblem representing a vampire faction.
        Visual Description: ${userPrompt}.
        Context: ${faction.name} (${faction.type}).
        Style: Dark, gritty, urban fantasy.`;
    } else {
        prompt = `A symbolic emblem or group cinematic shot representing a Vampire: The Masquerade faction called "${faction.name}".
        Type: ${faction.type}. Theme: ${faction.goals}.
        Atmosphere: Gritty, mysterious, urban fantasy, dark colors, blood red accents.`;
    }
  } else if (type === EntityType.LOCATION) {
    const loc = data as LocationData;
    if (userPrompt) {
        prompt = `An environmental concept art shot of a location.
        Visual Description: ${userPrompt}.
        Context: ${loc.name} (${loc.type}).
        Style: Dark, moody, neo-noir, high contrast.`;
    } else {
        prompt = `A concept art environmental shot of a location in Vampire: The Masquerade.
        Place: ${loc.name}. Type: ${loc.type}.
        Description: ${loc.description}. Atmosphere: ${loc.atmosphere}.
        Style: Dark, moody, neo-noir, high contrast, cinematic.`;
    }
  }

  try {
    const response = await ai.models.generateContent({
      model: IMAGE_MODEL_NAME,
      contents: { parts: [{ text: prompt }] },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    
    throw new Error("No image data found in response");
  } catch (error) {
    console.error("Image Generation Error:", error);
    throw error;
  }
};
