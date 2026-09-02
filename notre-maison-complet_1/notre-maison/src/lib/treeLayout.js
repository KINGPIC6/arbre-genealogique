// Calcule la structure visuelle de l'arbre à partir des données réelles
// (family_members + family_relationships). Les coordonnées ne sont
// JAMAIS stockées : elles sont toujours recalculées ici. Voir §10 du cahier
// des charges : "position graphique ↓ données" est interdit, seul
// "données ↓ position graphique" est autorisé.

const MAX_PASSES = 200;

function buildIndexes(members, relationships) {
  const byId = new Map(members.map((m) => [m.id, m]));
  const parentsOf = new Map(); // childId -> [parentId, ...]
  const childrenOf = new Map(); // parentId -> [childId, ...]
  const spousesOf = new Map(); // id -> Set(spouseId)

  const ensure = (map, key) => {
    if (!map.has(key)) map.set(key, []);
    return map.get(key);
  };
  const ensureSet = (map, key) => {
    if (!map.has(key)) map.set(key, new Set());
    return map.get(key);
  };

  for (const rel of relationships) {
    if (!byId.has(rel.person_id) || !byId.has(rel.related_person_id)) continue;
    if (rel.relationship_type === 'PARENT_OF') {
      ensure(parentsOf, rel.related_person_id).push(rel.person_id);
      ensure(childrenOf, rel.person_id).push(rel.related_person_id);
    } else if (rel.relationship_type === 'SPOUSE_OF') {
      ensureSet(spousesOf, rel.person_id).add(rel.related_person_id);
      ensureSet(spousesOf, rel.related_person_id).add(rel.person_id);
    }
  }

  return { byId, parentsOf, childrenOf, spousesOf };
}

function computeGenerations(members, parentsOf, spousesOf) {
  const gen = new Map();
  const ids = members.map((m) => m.id);

  // 1) Racines : personnes sans parent enregistré.
  for (const id of ids) {
    if (!parentsOf.has(id) || parentsOf.get(id).length === 0) {
      gen.set(id, 0);
    }
  }

  // 2) Propager : génération(enfant) = max(génération(parents)) + 1.
  let changed = true;
  let pass = 0;
  while (changed && pass < MAX_PASSES) {
    changed = false;
    pass += 1;
    for (const id of ids) {
      const parents = parentsOf.get(id);
      if (!parents || parents.length === 0) continue;
      if (!parents.every((p) => gen.has(p))) continue;
      const target = Math.max(...parents.map((p) => gen.get(p))) + 1;
      if (gen.get(id) !== target) {
        gen.set(id, target);
        changed = true;
      }
    }
    // 3) Harmoniser les conjoints sur la même génération.
    for (const id of ids) {
      if (!gen.has(id)) continue;
      const spouses = spousesOf.get(id);
      if (!spouses) continue;
      for (const s of spouses) {
        if (!gen.has(s) || gen.get(s) < gen.get(id)) {
          gen.set(s, gen.get(id));
          changed = true;
        }
      }
    }
  }

  // 4) Cas isolés (aucune relation) : génération 0 par défaut.
  for (const id of ids) {
    if (!gen.has(id)) gen.set(id, 0);
  }

  return gen;
}

/**
 * Calcule les positions (génération, x) de chaque membre ainsi que la liste
 * des arêtes à dessiner (couples, filiations).
 */
export function computeTreeLayout(members, relationships) {
  if (members.length === 0) return { nodes: [], edges: [], generations: 0 };

  const { byId, parentsOf, childrenOf, spousesOf } = buildIndexes(members, relationships);
  const gen = computeGenerations(members, parentsOf, spousesOf);

  const maxGen = Math.max(...Array.from(gen.values()));
  const byGeneration = Array.from({ length: maxGen + 1 }, () => []);
  for (const m of members) byGeneration[gen.get(m.id)].push(m.id);

  const xOf = new Map();
  const createdIndex = new Map(members.map((m, i) => [m.id, i]));

  for (let g = 0; g <= maxGen; g += 1) {
    const idsInGen = byGeneration[g];

    // Regrouper chaque personne avec son/ses conjoint(s) du même niveau
    // pour qu'ils restent visuellement côte à côte.
    const seen = new Set();
    const clusters = [];
    for (const id of idsInGen) {
      if (seen.has(id)) continue;
      const cluster = [id];
      seen.add(id);
      const spouses = spousesOf.get(id) || new Set();
      for (const s of spouses) {
        if (gen.get(s) === g && !seen.has(s)) {
          cluster.push(s);
          seen.add(s);
        }
      }
      clusters.push(cluster);
    }

    // Clé de tri : moyenne des positions x des parents déjà placés,
    // sinon ordre de création (stable et déterministe).
    const clusterKey = (cluster) => {
      const parentXs = [];
      for (const id of cluster) {
        const parents = parentsOf.get(id) || [];
        for (const p of parents) {
          if (xOf.has(p)) parentXs.push(xOf.get(p));
        }
      }
      if (parentXs.length > 0) {
        return parentXs.reduce((a, b) => a + b, 0) / parentXs.length;
      }
      return Math.min(...cluster.map((id) => createdIndex.get(id))) / members.length;
    };

    clusters.sort((a, b) => clusterKey(a) - clusterKey(b));

    let cursor = 0;
    for (const cluster of clusters) {
      for (const id of cluster) {
        xOf.set(id, cursor);
        cursor += 1;
      }
      cursor += 0.4; // petit espace entre chaque cellule familiale
    }
  }

  const nodes = members.map((m) => ({
    id: m.id,
    member: m,
    generation: gen.get(m.id),
    x: xOf.get(m.id) ?? 0,
  }));

  const edges = [];
  for (const [id, spouses] of spousesOf.entries()) {
    for (const s of spouses) {
      if (id < s) edges.push({ type: 'spouse', a: id, b: s });
    }
  }
  for (const [childId, parents] of parentsOf.entries()) {
    if (!byId.has(childId)) continue;
    edges.push({ type: 'parent', child: childId, parents: parents.filter((p) => byId.has(p)) });
  }

  return { nodes, edges, generations: maxGen + 1 };
}

/** Retourne les ids des ascendants (parents, grands-parents, ...) d'une personne. */
export function getAncestorIds(personId, relationships) {
  const parentsOf = new Map();
  for (const rel of relationships) {
    if (rel.relationship_type !== 'PARENT_OF') continue;
    if (!parentsOf.has(rel.related_person_id)) parentsOf.set(rel.related_person_id, []);
    parentsOf.get(rel.related_person_id).push(rel.person_id);
  }
  const result = new Set();
  const stack = [personId];
  while (stack.length) {
    const cur = stack.pop();
    const parents = parentsOf.get(cur) || [];
    for (const p of parents) {
      if (!result.has(p)) {
        result.add(p);
        stack.push(p);
      }
    }
  }
  return result;
}

/** Retourne les ids des descendants (enfants, petits-enfants, ...) d'une personne. */
export function getDescendantIds(personId, relationships) {
  const childrenOf = new Map();
  for (const rel of relationships) {
    if (rel.relationship_type !== 'PARENT_OF') continue;
    if (!childrenOf.has(rel.person_id)) childrenOf.set(rel.person_id, []);
    childrenOf.get(rel.person_id).push(rel.related_person_id);
  }
  const result = new Set();
  const stack = [personId];
  while (stack.length) {
    const cur = stack.pop();
    const children = childrenOf.get(cur) || [];
    for (const c of children) {
      if (!result.has(c)) {
        result.add(c);
        stack.push(c);
      }
    }
  }
  return result;
}
