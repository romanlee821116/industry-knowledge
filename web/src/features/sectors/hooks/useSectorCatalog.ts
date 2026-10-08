import { CATALOG, COMPANY_ANCHORS, MODELED_SCENES } from '../data/catalog';
import batch1 from '../data/verified/batch-1.json';
import batch2 from '../data/verified/batch-2.json';
import type { CompanyIndexEntry, SectorCategory, SectorGroup, SectorStatus, VerifiedBatch } from '../types';

const BATCHES: VerifiedBatch[] = [batch1 as VerifiedBatch, batch2 as VerifiedBatch];

const VERIFIED = new Map(BATCHES.flatMap((b) => b.groups.map((g) => [g.id, g])));
const GLOBAL_PLAYERS = BATCHES.flatMap((b) => b.globalPlayers);

const VERDICT_ORDER = { confirmed: 0, added: 1, corrected: 2, unverified: 3, removed: 4 };

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
      companies: [...(v?.companies ?? [])].sort(
        (a, b) => VERDICT_ORDER[a.verdict] - VERDICT_ORDER[b.verdict] || b.core - a.core,
      ),
      globalPlayers: GLOBAL_PLAYERS.filter((p) => p.groupId === (def.source ?? def.id)),
      status: statusOf(Boolean(v), def.scene, def.anchors),
    };
  }),
}));

const GROUPS = new Map(CATEGORIES.flatMap((c) => c.groups.map((g) => [g.id, g])));

/** 個股反查：只收錄查證後仍屬於該族群的紀錄（排除 removed） */
const COMPANIES: CompanyIndexEntry[] = (() => {
  const map = new Map<string, CompanyIndexEntry>();
  for (const group of GROUPS.values()) {
    if (group.source) continue; // 共用資料的族群只計一次
    for (const c of group.companies) {
      if (c.verdict === 'removed') continue;
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
