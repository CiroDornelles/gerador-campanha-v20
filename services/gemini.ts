import { GoogleGenAI, Type, Schema } from "@google/genai";
import { EntityType, WorldContextState, NpcData, FactionData, LocationData, RelationshipMapData, AdjustmentResult } from "../types";

const MODEL_NAME = "gemini-2.5-flash";
const IMAGE_MODEL_NAME = "gemini-2.5-flash-image";

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
    nature: { type: Type.STRING },
    demeanor: { type: Type.STRING },
    history: { 
      type: Type.STRING, 
      description: "Uma narrativa estruturada em 5 parágrafos: 1. Vida Mortal (Quem era), 2. O Abraço (O trauma), 3. Primeiras Noites (Adaptação), 4. Ponto de Virada (Evento definidor), 5. Ambição Atual e Conflito." 
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
  required: ["id", "name", "clan", "history", "influence", "birthDate", "embraceDate", "parents", "likes", "dislikes", "rumors"],
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
    likes: { type: Type.ARRAY, items: { type: Type.STRING }, description: "5 itens" },
    dislikes: { type: Type.ARRAY, items: { type: Type.STRING }, description: "5 itens" },
    rumors: { type: Type.ARRAY, items: rumorSchema }
  },
  required: ["birthDate", "embraceDate", "parents", "likes", "dislikes", "rumors"]
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

// --- Helper to serialize world state SAFELY (No Images) ---

const serializeWorldState = (state: WorldContextState): string => {
  // IMPORTANT: Strip base64 images to prevent token overflow
  const sanitizedState = {
    npcs: state.npcs.map(({ imageUrl, ...rest }) => rest),
    factions: state.factions.map(({ imageUrl, relationshipMap, ...rest }) => rest), // relationships map is also bulky, but usually text. Images are the killer.
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
  
  // Use sanitized context to allow full narrative retention without images
  const worldContext = serializeWorldState(worldState);
  
  let systemInstruction = `Você é um Narrador de Vampiro: A Máscara Edição de 20 Anos (V20). 
  Sua tarefa é gerar lore criativa, profunda e interconectada em PORTUGUÊS DO BRASIL (PT-BR).
  NÃO use regras do sistema (pontos, dados). Foque na narrativa, relacionamentos, atmosfera e intriga.
  
  CRÍTICO: Você deve integrar a nova criação com o 'ESTADO ATUAL DO MUNDO' fornecido abaixo. 
  Se o usuário pedir um líder de uma facção existente, use o nome dessa facção. 
  Se o usuário criar uma facção, inclua NPCs existentes nela se fizer sentido.
  Se a entrada do usuário estiver vazia, seja criativo e crie algo que se encaixe na vibração atual.
  
  ESTADO ATUAL DO MUNDO (JSON):
  ${worldContext}`;

  let responseSchema: Schema;
  let prompt = "";

  switch (type) {
    case EntityType.NPC:
      responseSchema = npcSchema;
      prompt = `Crie um NPC detalhado. ${userInput ? `Diretriz do Usuário: "${userInput}"` : "Crie um Membro único e interessante."}
      
      OBRIGATÓRIO - ESTRUTURA DA HISTÓRIA (Mínimo 5 Parágrafos):
      1. Vida Mortal (A Máscara): Quem ele era antes? Suas paixões humanas.
      2. O Abraço (O Catalisador): Como ele morreu? Foi violento, sedutor ou acidental? O trauma inicial.
      3. As Primeiras Noites (O Aprendizado): Como foi sua adaptação à Seita e ao Clã?
      4. O Ponto de Virada (O Conflito): Um evento específico que mudou sua visão de mundo ou definiu sua personalidade atual.
      5. Ambição Atual e o Futuro (A Trama): O que ele quer AGORA? Que planos secretos ele move?

      DADOS EXTRAS:
      - Data de Nascimento (Dia, Mês, Ano, Hora).
      - Data do Abraço (Dia, Mês, Ano).
      - Nomes dos Pais Mortais.
      - Liste 5 Gostos e 5 Desgostos.
      - Crie rumores detalhados.`;
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
    const systemInstruction = `Você é um Narrador de V20. Sua tarefa é atualizar um NPC antigo para o novo formato de ficha detalhada.
    Analise a história e personalidade existente e deduza/crie os novos campos.
    Use Português do Brasil.`;

    const prompt = `NPC Existente:
    Nome: ${npc.name}
    Clã: ${npc.clan}
    História Original: ${npc.history}
    Natureza/Comportamento: ${npc.nature}/${npc.demeanor}

    Tarefa: Gere os novos campos obrigatórios e REESCREVA a história se ela for curta:
    
    1. História (Opcional, se a atual for fraca): Reescreva em 5 parágrafos.
    2. Data de Nascimento (Dia, Mês, Ano, Hora).
    3. Data do Abraço (Dia, Mês, Ano).
    4. Nomes dos Pais.
    5. 5 Gostos e 5 Desgostos.
    6. Rumores (Verdadeiros, Exageros, Falsos).`;

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
    O usuário alterou manualmente partes da ficha deste NPC (provavelmente a História).
    Sua tarefa é REESCREVER os campos derivados (Natureza, Comportamento, Aparencia, Rumores, Gostos, Desgostos) para que eles façam sentido com a NOVA História/Dados fornecidos.
    
    Mantenha o Nome, Clã, Geração e Senhor, a menos que a história contradiga isso explicitamente.
    Garanta que a Data de Nascimento e Abraço façam sentido cronológico com a história.
    Use Português do Brasil.`;

    const prompt = `
    FICHA DO NPC (Com edições manuais do usuário):
    Nome: ${npc.name}
    Clã: ${npc.clan}
    História Atual (FONTE DA VERDADE): ${npc.history}
    
    Outros dados atuais (podem estar desatualizados em relação à história):
    Natureza: ${npc.nature}
    Aparência: ${npc.appearance}
    Rumores: ${JSON.stringify(npc.rumors)}
    
    TAREFA:
    Reescreva a ficha completa (todos os campos do schema) para harmonizar com a nova História.
    Se a história diz que ele é um nobre, mas a aparência diz que é um mendigo, mude a aparência para nobre.
    Gere datas completas (Dia/Mês/Ano/Hora) e nomes dos pais se faltarem.`;

    try {
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: prompt,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
                responseSchema: npcSchema, // Return full valid NPC object
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

  const systemInstruction = `Você é um Narrador de Vampiro: A Máscara (V20).
  Sua tarefa é preencher a hierarquia de uma facção específica.
  
  REGRAS:
  1. DIVIDA O PODER: Distribua o território, os recursos e as áreas de influência da facção entre estes membros.
  2. HIERARQUIA: Crie papéis claros (Líder, Executor, Espião, Conselheiro, etc) baseados na solicitação.
  3. CONFLITO: Crie rivalidades internas ou segredos entre eles.
  4. Use Português do Brasil.
  5. GERE FICHAS COMPLETAS COM A ESTRUTURA DE HISTÓRIA DE 5 PARÁGRAFOS.
  
  ESTADO DO MUNDO (JSON):
  ${worldContext}`;

  let prompt = "";
  
  if (isNumber) {
     prompt = `Gere ${count} NPCs membros da facção "${faction.name}".
     Tipo da Facção: ${faction.type}.
     Objetivos: ${faction.goals}.
     Inclua para CADA UM: História Completa, Datas (Dia/Mês/Ano), Pais, Gostos, Desgostos, Rumores.`;
  } else {
     prompt = `Gere NPCs membros da facção "${faction.name}" preenchendo as seguintes funções: "${userInput}".
     Inclua para CADA UM: História Completa, Datas (Dia/Mês/Ano), Pais, Gostos, Desgostos, Rumores.`;
  }

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