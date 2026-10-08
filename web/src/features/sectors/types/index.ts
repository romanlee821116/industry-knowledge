export type Verdict = 'confirmed' | 'corrected' | 'removed' | 'added' | 'unverified';

/** 族群對應到哪個場景；目前只建模 package（CoWoS 封裝堆疊） */
export type SceneId = 'package' | 'fab' | 'test' | 'rack' | 'design';

export interface Company {
  ticker: string;
  name: string;
  verdict: Verdict;
  role: string;
  core: 1 | 2 | 3;
  sources: string[];
  note: string;
}

export interface GlobalPlayer {
  groupId: string;
  name: string;
  country: string;
  role: string;
  sources: string[];
}

export interface SectorGroupDef {
  id: string;
  name: string;
  scene: SceneId;
  /** 對應到 3D 模型的層或材料 id（LayerId | MaterialId） */
  anchors: string[];
  /** 與其他分類下的同名族群共用查證資料（例如「測試」與「設備」都有探針卡） */
  source?: string;
}

export interface SectorCategoryDef {
  id: string;
  name: string;
  groups: SectorGroupDef[];
}

export type SectorStatus = 'modeled' | 'verified-unmodeled' | 'pending';

export interface SectorGroup extends SectorGroupDef {
  categoryId: string;
  summary?: string;
  engineeringNotes?: string;
  companies: Company[];
  globalPlayers: GlobalPlayer[];
  status: SectorStatus;
}

export interface SectorCategory {
  id: string;
  name: string;
  groups: SectorGroup[];
}

export interface VerifiedBatch {
  generatedAt: string;
  groups: {
    id: string;
    name: string;
    category: string;
    summary: string;
    engineeringNotes?: string;
    companies: Company[];
  }[];
  globalPlayers: GlobalPlayer[];
}

export interface CompanyIndexEntry {
  ticker: string;
  name: string;
  memberships: { groupId: string; groupName: string; role: string; core: number; verdict: Verdict }[];
}
