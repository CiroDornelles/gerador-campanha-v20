
export enum EntityType {
  NPC = 'NPC',
  FACTION = 'FACTION',
  LOCATION = 'LOCATION'
}

export interface RelationshipNode {
  id: string;
  label: string;
  type: 'LEADER' | 'MEMBER' | 'ALLY' | 'ENEMY' | 'RESOURCE';
}

export interface RelationshipEdge {
  source: string;
  target: string;
  label: string; // e.g., "Hates", "Controls", "Funding"
}

export interface RelationshipMapData {
  nodes: RelationshipNode[];
  edges: RelationshipEdge[];
}

export interface Rumor {
  content: string;
  status: 'VERDADEIRO' | 'EXAGERO' | 'FALSO';
  context: string; // Explanation of why it's an exaggeration or the truth behind the lie
}

export interface NpcData {
  id: string;
  name: string;
  clan: string;
  generation: string;
  sire: string;
  nature: string;
  demeanor: string;
  history: string;
  appearance: string;
  influence: string[];
  relationships: string[]; 
  quote: string;
  imageUrl?: string;
  // V2 Fields
  birthDate?: string;
  embraceDate?: string;
  parents?: string; // New field
  likes?: string[]; // 5 items
  dislikes?: string[]; // 5 items
  rumors?: Rumor[];
}

export interface FactionData {
  id: string;
  name: string;
  type: string;
  leader: string;
  territory: string;
  goals: string;
  resources: string[];
  enemies: string[];
  imageUrl?: string;
  relationshipMap?: RelationshipMapData; // New field for the map
}

export interface LocationData {
  id: string;
  name: string;
  type: string;
  controlledBy: string;
  atmosphere: string;
  security: string;
  description: string;
  imageUrl?: string;
}

export type GeneratedEntity = 
  | { type: EntityType.NPC; data: NpcData }
  | { type: EntityType.FACTION; data: FactionData }
  | { type: EntityType.LOCATION; data: LocationData };

export interface WorldContextState {
  npcs: NpcData[];
  factions: FactionData[];
  locations: LocationData[];
}

export interface AdjustmentResult {
  updatedNpcs: NpcData[];
  updatedFactions: FactionData[];
  updatedLocations: LocationData[];
  summary: string;
}