import { CATALOG, COMPANY_ANCHORS, MODELED_SCENES } from '../data/catalog';
import batch1 from '../data/verified/batch-1.json';
import batch2 from '../data/verified/batch-2.json';
import batch3 from '../data/verified/batch-3.json';
import batch4 from '../data/verified/batch-4.json';
import batch5 from '../data/verified/batch-5.json';
import batch6 from '../data/verified/batch-6.json';
import batch7 from '../data/verified/batch-7.json';
import batch8 from '../data/verified/batch-8.json';
import type { CompanyIndexEntry, SectorCategory, SectorGroup, SectorStatus, VerifiedBatch } from '../types';

const BATCHES: VerifiedBatch[] = [batch1, batch2, batch3, batch4, batch5, batch6, batch7, batch8] as VerifiedBatch[];

const VERIFIED = new Map(BATCHES.flatMap((b) => b.groups.map((g) => [g.id, g])));
const GLOBAL_PLAYERS = BATCHES.flatMap((b) => b.globalPlayers);

/** 只呈現查證後成立的個股；移除與查無佐證的不進畫面（原始查證紀錄保留在 verified/*.json） */
const SHOWN = new Set(['confirmed', 'added', 'corrected']);

function statusOf(verified: boolean, scene: string, anchors: string[]): SectorStatus {
  if (!verified) return 'pending';
  return MODELED_SCENES.includes(scene) && anchors.length > 0 ? 'modeled' : 'verified-unmodeled';
}

const CATEGORIES: SectorCategory[] = CATALOG.map((cat) => ({
  id: cat.id,
  name: cat.name,
  groups: cat.groups.map<SectorGroup>((def) => {
    const v = VERIFIED.get(def.source ?? def.id);
    return {
      ...def,
      categoryId: cat.id,
      summary: v?.summary,
      engineeringNotes: v?.engineeringNotes,
      companies: (v?.companies ?? []).filter((c) => SHOWN.has(c.verdict)).sort((a, b) => b.core - a.core),
      globalPlayers: GLOBAL_PLAYERS.filter((p) => p.groupId === (def.source ?? def.id)),
      status: statusOf(Boolean(v), def.scene, def.anchors),
    };
  }),
}));

const GROUPS = new Map(CATEGORIES.flatMap((c) => c.groups.map((g) => [g.id, g])));

/** 個股反查 */
const COMPANIES: CompanyIndexEntry[] = (() => {
  const map = new Map<string, CompanyIndexEntry>();
  for (const group of GROUPS.values()) {
    if (group.source) continue; // 共用資料的族群只計一次
    for (const c of group.companies) {
      const entry = map.get(c.ticker) ?? { ticker: c.ticker, name: c.name, memberships: [] };
      entry.memberships.push({
        groupId: group.id,
        groupName: group.name,
        role: c.role,
        core: c.core,
        verdict: c.verdict,
      });
      map.set(c.ticker, entry);
    }
  }
  return [...map.values()];
})();

/** 靜態資料，模組層級建立一次，讓呼叫端可安全放進 useMemo 依賴 */
const CATALOG_API = {
  categories: CATEGORIES,
  companies: COMPANIES,
  getGroup: (id: string) => GROUPS.get(id),
  getCompany: (ticker: string) => COMPANIES.find((c) => c.ticker === ticker),
  /** 個股在 3D 中的錨點：有覆寫用覆寫，否則取所屬族群錨點的聯集 */
  companyAnchors: (ticker: string) =>
    COMPANY_ANCHORS[ticker] ??
    (COMPANIES.find((c) => c.ticker === ticker)?.memberships ?? []).flatMap(
      (m) => GROUPS.get(m.groupId)?.anchors ?? [],
    ),
  /** 某個 3D 層／材料關聯到哪些族群 */
  groupsForTarget: (targetId: string) =>
    [...GROUPS.values()].filter((g) => !g.source && g.anchors.includes(targetId) && g.status !== 'pending'),
};

export type SectorCatalog = typeof CATALOG_API;

export function useSectorCatalog(): SectorCatalog {
  return CATALOG_API;
}
