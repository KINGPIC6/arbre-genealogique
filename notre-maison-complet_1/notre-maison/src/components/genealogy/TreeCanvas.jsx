import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { computeTreeLayout } from '../../lib/treeLayout';
import MemberPhoto from './MemberPhoto';

const NODE_W = 132;
const NODE_H = 168;
const SPACING_X = 168;
const SPACING_Y = 210;
const MIN_SCALE = 0.25;
const MAX_SCALE = 2.2;

function formatYears(member) {
  const b = member.birth_date ? member.birth_date.slice(0, 4) : '?';
  if (member.death_date) return `${b} – ${member.death_date.slice(0, 4)}`;
  return `${b}`;
}

function pixelPos(node) {
  return { left: node.x * SPACING_X, top: node.generation * SPACING_Y };
}

export default function TreeCanvas({
  members,
  relationships,
  selectedId,
  highlightIds,
  onSelect,
  focusSignal, // { id, nonce } — demande de recentrage sur une personne
}) {
  const { nodes, edges } = useMemo(() => computeTreeLayout(members, relationships), [members, relationships]);
  const nodesById = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);

  const viewportRef = useRef(null);
  const [transform, setTransform] = useState({ x: 60, y: 60, scale: 0.9 });
  const dragState = useRef(null);
  const pinchState = useRef(null);

  const contentSize = useMemo(() => {
    if (nodes.length === 0) return { width: 800, height: 500 };
    const maxX = Math.max(...nodes.map((n) => n.x));
    const maxGen = Math.max(...nodes.map((n) => n.generation));
    return {
      width: (maxX + 1.5) * SPACING_X + NODE_W,
      height: (maxGen + 1.5) * SPACING_Y + NODE_H,
    };
  }, [nodes]);

  const clampScale = (s) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, s));

  const zoomBy = useCallback((factor, center) => {
    setTransform((t) => {
      const newScale = clampScale(t.scale * factor);
      if (!center) return { ...t, scale: newScale };
      // Zoom centré sur un point du viewport (souris ou centre de l'écran).
      const ratio = newScale / t.scale;
      return {
        scale: newScale,
        x: center.x - (center.x - t.x) * ratio,
        y: center.y - (center.y - t.y) * ratio,
      };
    });
  }, []);

  const fitToView = useCallback(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    const rect = vp.getBoundingClientRect();
    const scale = clampScale(
      Math.min((rect.width - 40) / contentSize.width, (rect.height - 40) / contentSize.height, 1)
    );
    setTransform({ x: 40, y: 30, scale: Math.max(scale, MIN_SCALE) });
  }, [contentSize]);

  useEffect(() => {
    fitToView();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [members.length]);

  useEffect(() => {
    if (!focusSignal?.id) return;
    const node = nodesById.get(focusSignal.id);
    const vp = viewportRef.current;
    if (!node || !vp) return;
    const rect = vp.getBoundingClientRect();
    const pos = pixelPos(node);
    const scale = 1;
    setTransform({
      scale,
      x: rect.width / 2 - (pos.left + NODE_W / 2) * scale,
      y: rect.height / 2 - (pos.top + NODE_H / 2) * scale,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusSignal?.nonce]);

  // ---------- Pan (souris) ----------
  const onPointerDown = (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    dragState.current = { startX: e.clientX, startY: e.clientY, origin: { ...transform } };
  };
  const onPointerMove = (e) => {
    if (!dragState.current) return;
    const dx = e.clientX - dragState.current.startX;
    const dy = e.clientY - dragState.current.startY;
    setTransform({ ...dragState.current.origin, x: dragState.current.origin.x + dx, y: dragState.current.origin.y + dy });
  };
  const onPointerUp = () => {
    dragState.current = null;
  };

  // ---------- Zoom molette ----------
  const onWheel = (e) => {
    e.preventDefault();
    const vp = viewportRef.current;
    const rect = vp.getBoundingClientRect();
    const center = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    zoomBy(e.deltaY < 0 ? 1.1 : 0.9, center);
  };

  // ---------- Tactile : déplacement + pincement ----------
  const touchDist = (touches) => {
    const [a, b] = touches;
    return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
  };
  const onTouchStart = (e) => {
    if (e.touches.length === 1) {
      dragState.current = { startX: e.touches[0].clientX, startY: e.touches[0].clientY, origin: { ...transform } };
    } else if (e.touches.length === 2) {
      pinchState.current = { dist: touchDist(e.touches), origin: { ...transform } };
    }
  };
  const onTouchMove = (e) => {
    if (e.touches.length === 1 && dragState.current) {
      const dx = e.touches[0].clientX - dragState.current.startX;
      const dy = e.touches[0].clientY - dragState.current.startY;
      setTransform({ ...dragState.current.origin, x: dragState.current.origin.x + dx, y: dragState.current.origin.y + dy });
    } else if (e.touches.length === 2 && pinchState.current) {
      const newDist = touchDist(e.touches);
      const factor = newDist / pinchState.current.dist;
      setTransform((t) => ({ ...t, scale: clampScale(pinchState.current.origin.scale * factor) }));
    }
  };
  const onTouchEnd = (e) => {
    if (e.touches.length === 0) {
      dragState.current = null;
      pinchState.current = null;
    }
  };

  // Mémoïsé : ce calcul ne dépend que des nœuds/liens, pas de la vue
  // (transform) — évite de le refaire à chaque frame de pan/zoom.
  const { parentLinkPaths, spouseLinkPaths } = useMemo(() => {
    const parentPaths = [];
    const spousePaths = [];
    for (const edge of edges) {
      if (edge.type === 'spouse') {
        const a = nodesById.get(edge.a);
        const b = nodesById.get(edge.b);
        if (!a || !b) continue;
        const pa = pixelPos(a);
        const pb = pixelPos(b);
        const y = pa.top + NODE_H / 2;
        spousePaths.push({
          key: `sp-${edge.a}-${edge.b}`,
          x1: pa.left + NODE_W,
          y1: y,
          x2: pb.left,
          y2: y,
        });
      } else {
        const child = nodesById.get(edge.child);
        if (!child) continue;
        const parents = edge.parents.map((p) => nodesById.get(p)).filter(Boolean);
        if (parents.length === 0) continue;
        const childPos = pixelPos(child);
        const childTopX = childPos.left + NODE_W / 2;
        const childTopY = childPos.top;
        const parentPts = parents.map((p) => {
          const pp = pixelPos(p);
          return { x: pp.left + NODE_W / 2, y: pp.top + NODE_H };
        });
        const jointX = parentPts.reduce((s, p) => s + p.x, 0) / parentPts.length;
        const jointY = Math.max(...parentPts.map((p) => p.y)) + (SPACING_Y - NODE_H) / 2;

        for (const p of parentPts) {
          parentPaths.push({
            key: `pl-${edge.child}-${p.x}-${p.y}`,
            d: `M ${p.x} ${p.y} C ${p.x} ${jointY}, ${jointX} ${jointY}, ${jointX} ${jointY}`,
          });
        }
        parentPaths.push({
          key: `pl-${edge.child}-drop`,
          d: `M ${jointX} ${jointY} C ${jointX} ${(jointY + childTopY) / 2}, ${childTopX} ${(jointY + childTopY) / 2}, ${childTopX} ${childTopY}`,
        });
      }
    }
    return { parentLinkPaths: parentPaths, spouseLinkPaths: spousePaths };
  }, [edges, nodesById]);

  return (
    <div className="tree-canvas">
      <div className="tree-canvas__controls">
        <button type="button" onClick={() => zoomBy(1.2)} aria-label="Zoomer">＋</button>
        <button type="button" onClick={() => zoomBy(0.8)} aria-label="Dézoomer">－</button>
        <button type="button" onClick={fitToView} aria-label="Vue complète">⤢ Vue complète</button>
      </div>

      <div
        ref={viewportRef}
        className="tree-canvas__viewport"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        onWheel={onWheel}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {nodes.length === 0 ? (
          <p className="tree-canvas__empty">
            L'arbre est vide pour l'instant. Ajoutez le premier membre de votre famille pour commencer.
          </p>
        ) : (
          <div
            className="tree-canvas__content"
            style={{
              transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
              width: contentSize.width,
              height: contentSize.height,
            }}
          >
            <svg className="tree-canvas__trunk" width={contentSize.width} height={contentSize.height} aria-hidden="true">
              <defs>
                <linearGradient id="trunkGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3c5c4c" />
                  <stop offset="100%" stopColor="#26433A" />
                </linearGradient>
              </defs>
              <path
                d={`M ${contentSize.width / 2 - 22} 0 C ${contentSize.width / 2 - 60} ${contentSize.height * 0.4}, ${contentSize.width / 2 - 10} ${contentSize.height * 0.7}, ${contentSize.width / 2} ${contentSize.height}
                    L ${contentSize.width / 2 + 0} ${contentSize.height}
                    C ${contentSize.width / 2 + 10} ${contentSize.height * 0.7}, ${contentSize.width / 2 + 60} ${contentSize.height * 0.4}, ${contentSize.width / 2 + 22} 0 Z`}
                fill="url(#trunkGradient)"
                opacity="0.06"
              />
            </svg>

            <svg className="tree-canvas__links" width={contentSize.width} height={contentSize.height}>
              {parentLinkPaths.map((p) => (
                <path key={p.key} d={p.d} className="tree-link tree-link--parent" />
              ))}
              {spouseLinkPaths.map((p) => (
                <line key={p.key} x1={p.x1} y1={p.y1} x2={p.x2} y2={p.y2} className="tree-link tree-link--spouse" />
              ))}
            </svg>

            {nodes.map((node) => {
              const pos = pixelPos(node);
              const isSelected = node.id === selectedId;
              const isHighlighted = highlightIds?.has(node.id);
              const deceased = !!node.member.death_date;
              return (
                <button
                  type="button"
                  key={node.id}
                  className={`tree-node ${isSelected ? 'tree-node--selected' : ''} ${
                    isHighlighted ? 'tree-node--highlighted' : ''
                  } ${deceased ? 'tree-node--deceased' : ''}`}
                  style={{ left: pos.left, top: pos.top, width: NODE_W }}
                  onClick={() => onSelect(node.id)}
                >
                  <MemberPhoto member={node.member} size={72} />
                  <span className="tree-node__name">
                    {node.member.first_name} {node.member.last_name || ''}
                  </span>
                  <span className="tree-node__years">{formatYears(node.member)}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
