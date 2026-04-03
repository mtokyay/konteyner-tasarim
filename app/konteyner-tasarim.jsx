import { useState, useRef, useCallback, useMemo, useEffect } from "react";

// ==================== CONSTANTS ====================
const SCALE = 1.8, GRID_SIZE = 10, SNAP_SIZE = 5;

const ROOF_TYPES = [
  { id: "duz", name: "Duz Tavan", desc: "Ayni panelden duz cati" },
  { id: "besik", name: "Besik Cati", desc: "Cift yonlu egimli cati" },
  { id: "tek_egim", name: "Tek Egim", desc: "Tek yonlu egimli cati" },
];
const PANEL_TYPES = [
  { id: "ahsap_pu", name: "Ahsap Desen PU", color: "#D4A574" },
  { id: "beyaz_pu", name: "Beyaz PU", color: "#F0F0F0" },
  { id: "tas_pu", name: "Tas Desen PU", color: "#B8B0A0" },
];
const ROOF_COLORS = [
  { id: "beyaz", name: "Beyaz", color: "#F5F5F5" },
  { id: "antrasit", name: "Antrasit", color: "#404040" },
  { id: "bordo", name: "Bordo", color: "#800020" },
];
const DOOR_TYPES = [
  { id: "dis_sac", name: "Dis Kapi (Sac)", width: 88, height: 196, type: "dis" },
  { id: "dis_pvc", name: "Dis Kapi (PVC Camli)", width: 88, height: 196, type: "dis" },
  { id: "ic_pvc", name: "Ic Kapi (PVC)", width: 80, height: 190, type: "ic" },
  { id: "ic_ahsap", name: "Ic Kapi (Ahsap)", width: 80, height: 190, type: "ic" },
  { id: "wc", name: "WC Kapi", width: 75, height: 190, type: "wc" },
];
const WINDOW_TYPES = [
  { id: "w100x120", name: "100x120", width: 100, height: 120, defaultElevation: 90 },
  { id: "w100x180", name: "100x180", width: 100, height: 180, defaultElevation: 40 },
  { id: "w150x180", name: "150x180", width: 150, height: 180, defaultElevation: 40 },
  { id: "w50x100", name: "50x100 Vasistas", width: 50, height: 100, defaultElevation: 120 },
];
const MARKER_TYPES = [
  { id: "baca", name: "Baca Deligi", icon: "B", color: "#EF4444" },
  { id: "havalandirma", name: "Havalandirma", icon: "H", color: "#8B5CF6" },
  { id: "klima", name: "Klima Yeri", icon: "K", color: "#06B6D4" },
  { id: "elektrik", name: "Elektrik Panosu", icon: "E", color: "#F59E0B" },
  { id: "aydinlatma", name: "Aydinlatma", icon: "A", color: "#10B981" },
  { id: "ozel", name: "Ozel Not", icon: "?", color: "#6B7280" },
];
const DEFAULT_CONTAINER = { width: 300, length: 700, height: 230, roofType: "duz", roofColor: "beyaz", panelType: "beyaz_pu", roofLayers: 1, hasVeranda: false };
const snapTo = (v) => Math.round(v / SNAP_SIZE) * SNAP_SIZE;
const c2s = (cm) => cm * SCALE;
const s2c = (px) => px / SCALE;
const uid = () => Math.random().toString(36).substr(2, 9);

// ==================== WALL SEGMENT CALCULATOR ====================
function calcWallSegments(items, wallLength, wallAxis, containerWidth) {
  const wallItems = items.filter(i => {
    if (i.type !== "door" && i.type !== "window" && i.type !== "outlet") return false;
    if (wallAxis === "top") return i.y < 20;
    if (wallAxis === "bottom") return i.y > containerWidth - 20;
    if (wallAxis === "left") return i.x < 20;
    if (wallAxis === "right") return i.x > wallLength - 20;
    return false;
  });
  const sorted = wallItems.map(i => {
    const pos = (wallAxis === "left" || wallAxis === "right") ? i.y : i.x;
    const w = i.type === "outlet" ? 10 : i.width || 80;
    return { pos, width: w, item: i };
  }).sort((a, b) => a.pos - b.pos);
  const segs = [];
  let cursor = 0;
  sorted.forEach(s => {
    if (s.pos > cursor + 1) segs.push({ start: cursor, end: s.pos, len: Math.round(s.pos - cursor), type: "wall" });
    segs.push({ start: s.pos, end: s.pos + s.width, len: s.width, type: "item", item: s.item });
    cursor = s.pos + s.width;
  });
  if (cursor < wallLength - 1) segs.push({ start: cursor, end: wallLength, len: Math.round(wallLength - cursor), type: "wall" });
  return segs;
}

// ==================== INTERACTIVE 3D VIEW ====================
function View3D({ container, items, partitions, wcZones }) {
  const [rotY, setRotY] = useState(30);
  const [rotX, setRotX] = useState(25);
  const [zoom, setZoom] = useState(1);
  const [dragging, setDragging] = useState(false);
  const [lastPt, setLastPt] = useState({ x: 0, y: 0 });
  const w = container.width, l = container.length, h = container.height;
  const sc = 0.22 * zoom;
  const cx = 320, cy = 300;
  const rYr = rotY * Math.PI / 180, rXr = rotX * Math.PI / 180;
  const iso = (x, y, z) => {
    const x1 = x * Math.cos(rYr) - y * Math.sin(rYr);
    const y1 = x * Math.sin(rYr) + y * Math.cos(rYr);
    const z1 = z;
    const sx = x1 * sc + cx;
    const sy = (y1 * Math.sin(rXr) - z1 * Math.cos(rXr)) * sc + cy;
    return { x: sx, y: sy };
  };
  const face = (pts, fill, stroke = "#555", sw = 0.8, op = 1) => {
    const d = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";
    return <path d={d} fill={fill} stroke={stroke} strokeWidth={sw} opacity={op} />;
  };
  const pi = PANEL_TYPES.find((p) => p.id === container.panelType);
  const pc = pi?.color || "#F0F0F0";
  const rc = ROOF_COLORS.find((r) => r.id === container.roofColor)?.color || "#F5F5F5";

  const f0 = iso(0, 0, 0), f1 = iso(l, 0, 0), f2 = iso(l, w, 0), f3 = iso(0, w, 0);
  const t0 = iso(0, 0, h), t1 = iso(l, 0, h), t2 = iso(l, w, h), t3 = iso(0, w, h);

  // Roof
  let roofEl = null;
  if (container.roofType === "besik") {
    const rh = h + 45, mid = w / 2;
    const r0 = iso(-10, mid, rh), r1 = iso(l + 10, mid, rh);
    const e0 = iso(0, 0, h), e1 = iso(0, w, h), e2 = iso(l, 0, h), e3 = iso(l, w, h);
    roofEl = (<g>
      {face([e0, e2, r1, r0], rc, "#333", 1, 0.9)}
      {face([e1, e0, r0, r1], rc, "#333", 1, 0.75)}
      {face([e1, r1, e3], rc, "#333", 0.8, 0.6)}
      {face([e0, r0, e1], rc, "#333", 0.8, 0.55)}
      <line x1={r0.x} y1={r0.y} x2={r1.x} y2={r1.y} stroke="#222" strokeWidth="2" />
    </g>);
  } else if (container.roofType === "tek_egim") {
    const rh = h + 35;
    const rt0 = iso(-5, 0, rh), rt1 = iso(l + 5, 0, rh);
    roofEl = (<g>
      {face([t3, t2, rt1, rt0], rc, "#333", 1, 0.85)}
      {face([t0, rt0, rt1, t1], rc, "#333", 1, 0.9)}
      {face([t0, t3, rt0], rc, "#333", 0.8, 0.6)}
      {face([t1, rt1, t2], rc, "#333", 0.8, 0.55)}
    </g>);
  } else {
    const ro = 8;
    const rf0 = iso(-ro, -ro, h + 5), rf1 = iso(l + ro, -ro, h + 5), rf2 = iso(l + ro, w + ro, h + 5), rf3 = iso(-ro, w + ro, h + 5);
    roofEl = (<g>
      {face([rf0, rf1, rf2, rf3], rc, "#333", 1.2, 0.85)}
      {face([rf0, rf1, t1, t0], rc, "#444", 0.5, 0.5)}
    </g>);
  }

  // Partition walls (3D)
  const partEls = partitions.map((part, idx) => {
    const px = part.position;
    const pw0 = iso(px, 0, 0), pw1 = iso(px, w, 0), pw2 = iso(px, w, h * 0.92), pw3 = iso(px, 0, h * 0.92);
    return <g key={`3dp-${idx}`}>{face([pw0, pw1, pw2, pw3], "#E0E0E0", "#999", 0.8, 0.45)}</g>;
  });

  // WC zones (3D)
  const wcEls = wcZones.map((wc, idx) => {
    const wh = h * 0.92;
    // Two walls for the WC corner
    const isLeft = wc.x === 0;
    const isTop = wc.y === 0;
    // Vertical wall (along length)
    const vx = isLeft ? wc.w : wc.x;
    const v0 = iso(vx, wc.y, 0), v1 = iso(vx, wc.y + wc.h, 0), v2 = iso(vx, wc.y + wc.h, wh), v3 = iso(vx, wc.y, wh);
    // Horizontal wall (along width)
    const hy = isTop ? wc.h : wc.y;
    const h0 = iso(wc.x, hy, 0), h1 = iso(wc.x + wc.w, hy, 0), h2 = iso(wc.x + wc.w, hy, wh), h3 = iso(wc.x, hy, wh);
    // Floor
    const ff0 = iso(wc.x, wc.y, 1), ff1 = iso(wc.x + wc.w, wc.y, 1), ff2 = iso(wc.x + wc.w, wc.y + wc.h, 1), ff3 = iso(wc.x, wc.y + wc.h, 1);
    return (<g key={`3dwc-${idx}`}>
      {face([ff0, ff1, ff2, ff3], "#B2EBF2", "#80DEEA", 0.5, 0.4)}
      {face([v0, v1, v2, v3], "#E0E0E0", "#999", 0.8, 0.5)}
      {face([h0, h1, h2, h3], "#E0E0E0", "#999", 0.8, 0.45)}
    </g>);
  });

  // Windows
  const winEls = items.filter((i) => i.type === "window").map((win, idx) => {
    const wx = win.x, ww = win.width, wh = win.windowHeight, el = win.elevation || 90;
    // Front face (y=0) windows
    const onFront = win.y < w / 2;
    const wallY = onFront ? 0 : w;
    const p0 = iso(wx, wallY, el), p1 = iso(wx + ww, wallY, el), p2 = iso(wx + ww, wallY, el + wh), p3 = iso(wx, wallY, el + wh);
    return (<g key={`3dw-${idx}`}>
      {face([p0, p1, p2, p3], "#B3E5FC", "#0D47A1", 1.2, 0.8)}
      <line x1={(p0.x + p1.x) / 2} y1={(p0.y + p1.y) / 2} x2={(p2.x + p3.x) / 2} y2={(p2.y + p3.y) / 2} stroke="#0D47A1" strokeWidth="0.6" />
      <line x1={(p0.x + p3.x) / 2} y1={(p0.y + p3.y) / 2} x2={(p1.x + p2.x) / 2} y2={(p1.y + p2.y) / 2} stroke="#0D47A1" strokeWidth="0.6" />
    </g>);
  });

  // Doors
  const doorEls = items.filter((i) => i.type === "door").map((door, idx) => {
    const dx = door.x, dw = door.width, dh = door.doorHeight || 196;
    const onFront = door.y < w / 2;
    const wallY = onFront ? 0 : w;
    const p0 = iso(dx, wallY, 0), p1 = iso(dx + dw, wallY, 0), p2 = iso(dx + dw, wallY, dh), p3 = iso(dx, wallY, dh);
    return (<g key={`3dd-${idx}`}>
      {face([p0, p1, p2, p3], "#795548", "#4E342E", 1.2, 0.85)}
      <circle cx={(p1.x + p2.x) / 2 - 3} cy={(p1.y + p2.y) / 2} r={2} fill="#FFD54F" stroke="#F9A825" strokeWidth="0.5" />
    </g>);
  });

  // Outlets (small dots on walls)
  const outletEls = items.filter((i) => i.type === "outlet").map((out, idx) => {
    const el = out.elevation || 40;
    const onFront = out.y < w / 2;
    const wallY = onFront ? 0 : w;
    const p = iso(out.x, wallY, el);
    return (<g key={`3do-${idx}`}>
      <circle cx={p.x} cy={p.y} r={4} fill="#FFF8E1" stroke="#FF9800" strokeWidth="1.5" />
      <text x={p.x} y={p.y + 3} textAnchor="middle" fontSize="5" fill="#E65100" fontWeight="bold">P</text>
    </g>);
  });

  // Markers
  const markerEls = items.filter((i) => i.type === "marker").map((m, idx) => {
    const mi = MARKER_TYPES.find((mt) => mt.id === m.markerType) || MARKER_TYPES[5];
    const p = iso(m.x, m.y, h + 15);
    return (<g key={`3dm-${idx}`}>
      <line x1={p.x} y1={p.y} x2={p.x} y2={p.y + 20} stroke={mi.color} strokeWidth="1" strokeDasharray="2,2" />
      <circle cx={p.x} cy={p.y} r={6} fill={mi.color} opacity="0.9" />
      <text x={p.x} y={p.y + 3} textAnchor="middle" fontSize="7" fill="white" fontWeight="bold">{mi.icon}</text>
    </g>);
  });

  const onMouseDown = e => { setDragging(true); setLastPt({ x: e.clientX, y: e.clientY }); };
  const onMouseMove = e => { if (!dragging) return; const dx = e.clientX - lastPt.x, dy = e.clientY - lastPt.y; setRotY(r => r + dx * 0.5); setRotX(r => Math.max(5, Math.min(80, r + dy * 0.5))); setLastPt({ x: e.clientX, y: e.clientY }); };
  const onMouseUp = () => setDragging(false);
  const onWheel = e => { e.preventDefault(); setZoom(z => Math.max(0.3, Math.min(3, z - (e.deltaY * 0.001)))); };

  return (
    <div style={{ width: "100%", height: "100%", position: "relative", cursor: dragging ? "grabbing" : "grab" }} onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp} onWheel={onWheel}>
      <svg viewBox="0 0 640 420" style={{ width: "100%", height: "100%" }}>
        <rect width="640" height="420" fill="#f8fafc" />
        <text x="320" y="18" textAnchor="middle" fontSize="13" fill="#64748b" fontWeight="600">3D Gorunum - {container.width}x{container.length}x{container.height}cm</text>
        {face([iso(-20, -20, -2), iso(l + 20, -20, -2), iso(l + 20, w + 20, -2), iso(-20, w + 20, -2)], "#E8E5E0", "#ccc", 0.3, 0.4)}
        {face([f0, f1, f2, f3], "#D7CCC8", "#999", 0.5, 0.7)}
        {face([f3, f2, t2, t3], pc, "#666", 1, 0.5)}
        {face([f3, f0, t0, t3], pc, "#666", 1, 0.65)}
        {wcEls}{partEls}
        {face([f1, f2, t2, t1], pc, "#666", 1, 0.6)}
        {face([f0, f1, t1, t0], pc, "#666", 1, 0.8)}
        {winEls}{doorEls}{outletEls}{roofEl}{markerEls}
        <text x="580" y="395" textAnchor="end" fontSize="10" fill="#94a3b8">{PANEL_TYPES.find((p) => p.id === container.panelType)?.name}</text>
        <text x="580" y="410" textAnchor="end" fontSize="9" fill="#94a3b8">{(w * l / 10000).toFixed(1)} m2 | {ROOF_TYPES.find((r) => r.id === container.roofType)?.name}</text>
      </svg>
      <div style={{ position: "absolute", bottom: "8px", left: "8px", display: "flex", gap: "4px" }}>
        <button onClick={() => setZoom(z => Math.min(3, z + 0.2))} className="w-7 h-7 bg-white/90 border border-gray-300 rounded text-sm font-bold text-gray-600 hover:bg-gray-100">+</button>
        <button onClick={() => setZoom(z => Math.max(0.3, z - 0.2))} className="w-7 h-7 bg-white/90 border border-gray-300 rounded text-sm font-bold text-gray-600 hover:bg-gray-100">-</button>
        <button onClick={() => { setRotY(30); setRotX(25); setZoom(1); }} className="px-2 h-7 bg-white/90 border border-gray-300 rounded text-xs text-gray-600 hover:bg-gray-100">Sifirla</button>
      </div>
      <div style={{ position: "absolute", top: "8px", right: "8px" }} className="bg-white/80 rounded px-2 py-1 text-xs text-gray-500">
        Surukle: Dondur | Scroll: Zoom
      </div>
    </div>
  );
}

// ==================== ROOF PREVIEW ====================
function RoofPreview({ roofType, roofColor, roofLayers, panelColor }) {
  const rc = ROOF_COLORS.find((r) => r.id === roofColor)?.color || "#F5F5F5";
  return (
    <svg viewBox="0 0 280 140" className="w-full rounded border border-gray-200 bg-gray-50" style={{ height: "110px" }}>
      <rect x="50" y="65" width="180" height="55" fill={panelColor} stroke="#555" strokeWidth="1.5" opacity="0.7" rx="1" />
      {/* Windows on body */}
      <rect x="75" y="80" width="25" height="20" fill="#B3E5FC" stroke="#0D47A1" strokeWidth="0.8" />
      <rect x="180" y="80" width="25" height="20" fill="#B3E5FC" stroke="#0D47A1" strokeWidth="0.8" />
      {/* Door */}
      <rect x="125" y="78" width="22" height="42" fill="#795548" stroke="#4E342E" strokeWidth="0.8" rx="1" />
      <circle cx="143" cy="100" r="1.5" fill="#FFD54F" />
      {roofType === "duz" && <g><rect x="45" y="58" width="190" height="8" fill={rc} stroke="#444" strokeWidth="1" rx="1" /><text x="140" y="52" textAnchor="middle" fontSize="10" fill="#555" fontWeight="500">Duz Tavan</text></g>}
      {roofType === "besik" && <g>
        <polygon points="40,65 140,22 240,65" fill={rc} stroke="#444" strokeWidth="1.2" />
        {roofLayers === 2 && <><line x1="40" y1="65" x2="240" y2="65" stroke="#888" strokeWidth="2" /><text x="140" y="74" textAnchor="middle" fontSize="7" fill="#888">Cift kat panel</text></>}
        <line x1="140" y1="22" x2="140" y2="14" stroke="#666" strokeWidth="1" />
        <text x="140" y="18" textAnchor="middle" fontSize="10" fill="#555" fontWeight="500">Besik Cati</text>
      </g>}
      {roofType === "tek_egim" && <g>
        <polygon points="40,65 40,35 240,52 240,65" fill={rc} stroke="#444" strokeWidth="1.2" />
        <text x="140" y="30" textAnchor="middle" fontSize="10" fill="#555" fontWeight="500">Tek Egim</text>
      </g>}
      <line x1="30" y1="120" x2="250" y2="120" stroke="#aaa" strokeWidth="0.5" />
      <rect x="65" y="120" width="10" height="7" fill="#888" rx="2" />
      <rect x="200" y="120" width="10" height="7" fill="#888" rx="2" />
      <text x="140" y="135" textAnchor="middle" fontSize="8" fill="#999">On Cephe Gorunumu</text>
    </svg>
  );
}

// ==================== FLOOR PLAN DIMENSIONS SVG ====================
function FloorPlanDimensions({ container, items, partitions, wcZones }) {
  const pad = 40, cw = c2s(container.width), cl = c2s(container.length), vW = cl + pad * 2 + 40, vH = cw + pad * 2 + 50;
  const panelInfo = PANEL_TYPES.find(p => p.id === container.panelType);
  const topSegs = calcWallSegments(items, container.length, "top", container.width);
  const botSegs = calcWallSegments(items, container.length, "bottom", container.width);

  const dimLine = (x1, y1, x2, y2, label, above, fontSize) => {
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    const off = above ? -8 : 8;
    return (<g>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#E53935" strokeWidth="0.6" />
      <line x1={x1} y1={y1 - 3} x2={x1} y2={y1 + 3} stroke="#E53935" strokeWidth="0.6" />
      <line x1={x2} y1={y2 - 3} x2={x2} y2={y2 + 3} stroke="#E53935" strokeWidth="0.6" />
      <text x={mx} y={my + off} textAnchor="middle" fontSize={fontSize || "6.5"} fill="#C62828" fontWeight="500">{label}</text>
    </g>);
  };

  return (
    <svg viewBox={`0 0 ${vW} ${vH}`} style={{ width: "100%", maxHeight: "260px", border: "1px solid #e5e7eb", borderRadius: "6px", background: "white" }}>
      <rect x={pad} y={pad} width={cl} height={cw} fill={panelInfo?.color || "#F0F0F0"} opacity="0.08" />
      <rect x={pad} y={pad} width={cl} height={cw} fill="none" stroke="#37474F" strokeWidth="3.5" rx="1" />
      {topSegs.map((seg, i) => {
        const sx = c2s(seg.start) + pad, ex = c2s(seg.end) + pad;
        if (seg.type === "wall" && seg.len > 5) return <g key={"ts-" + i}>{dimLine(sx, pad - 12, ex, pad - 12, seg.len + "cm", true)}</g>;
        if (seg.type === "item") return <g key={"ts-" + i}><rect x={sx} y={pad - 2} width={c2s(seg.len)} height="4" fill={seg.item.type === "door" ? "#795548" : seg.item.type === "window" ? "#1565C0" : "#FF9800"} opacity="0.7" rx="1" /><text x={(sx + ex) / 2} y={pad - 15} textAnchor="middle" fontSize="5.5" fill="#555">{seg.item.type === "door" ? "K" : seg.item.type === "window" ? "P" : "Pr"} {seg.len}</text></g>;
        return null;
      })}
      {botSegs.map((seg, i) => {
        const sx = c2s(seg.start) + pad, ex = c2s(seg.end) + pad;
        if (seg.type === "wall" && seg.len > 5) return <g key={"bs-" + i}>{dimLine(sx, pad + cw + 12, ex, pad + cw + 12, seg.len + "cm", false)}</g>;
        if (seg.type === "item") return <g key={"bs-" + i}><rect x={sx} y={pad + cw - 2} width={c2s(seg.len)} height="4" fill={seg.item.type === "door" ? "#795548" : seg.item.type === "window" ? "#1565C0" : "#FF9800"} opacity="0.7" rx="1" /></g>;
        return null;
      })}
      {wcZones.map((wc, i) => {
        const x = c2s(wc.x) + pad, y = c2s(wc.y) + pad, w = c2s(wc.w), h = c2s(wc.h);
        return (<g key={"dwc-" + i}><rect x={x} y={y} width={w} height={h} fill="#E0F7FA" opacity="0.4" stroke="#00838F" strokeWidth="1" strokeDasharray="4,2" /><text x={x + w / 2} y={y + h / 2 + 3} textAnchor="middle" fontSize="8" fill="#00695C" fontWeight="600">WC</text><text x={x + w / 2} y={y + h / 2 + 12} textAnchor="middle" fontSize="6" fill="#00897B">{wc.w}x{wc.h}</text></g>);
      })}
      {partitions.map((p, i) => {
        const px = c2s(p.position) + pad;
        return (<g key={"dp-" + i}><line x1={px} y1={pad} x2={px} y2={pad + cw} stroke="#78909C" strokeWidth="2.5" /><line x1={px} y1={pad} x2={px} y2={pad + cw} stroke="white" strokeWidth="1.5" /><text x={px} y={pad - 3} textAnchor="middle" fontSize="6" fill="#546E7A">{p.position}cm</text></g>);
      })}
      <text x={pad + cl / 2} y={pad + cw + 30} textAnchor="middle" fontSize="9" fill="#37474F" fontWeight="600">{container.length} cm</text>
      <text x={pad + cl + 20} y={pad + cw / 2 + 3} textAnchor="middle" fontSize="9" fill="#37474F" fontWeight="600" transform={`rotate(90,${pad + cl + 20},${pad + cw / 2 + 3})`}>{container.width} cm</text>
      <text x={pad + cl / 2} y={pad + cw / 2} textAnchor="middle" fontSize="10" fill="#37474F" opacity="0.12" fontWeight="600">{(container.width * container.length / 10000).toFixed(1)} m2</text>
      <text x={pad} y={vH - 4} fontSize="7" fill="#999">Duvar Olculeri Krokisi</text>
    </svg>
  );
}

// ==================== FLOOR PLAN DETAIL SVG ====================
function FloorPlanDetail({ container, items, partitions, wcZones }) {
  const pad = 35, cw = c2s(container.width), cl = c2s(container.length), vW = cl + pad * 2 + 20, vH = cw + pad * 2 + 30;
  const panelInfo = PANEL_TYPES.find(p => p.id === container.panelType);
  return (
    <svg viewBox={`0 0 ${vW} ${vH}`} style={{ width: "100%", maxHeight: "260px", border: "1px solid #e5e7eb", borderRadius: "6px", background: "white" }}>
      <defs>
        <pattern id="pptile2" width="14" height="14" patternUnits="userSpaceOnUse"><rect width="14" height="14" fill="#E0F2F1" /><rect x="0" y="0" width="6" height="6" fill="#B2DFDB" stroke="#80CBC4" strokeWidth="0.3" /><rect x="7" y="7" width="6" height="6" fill="#B2DFDB" stroke="#80CBC4" strokeWidth="0.3" /></pattern>
      </defs>
      <rect x={pad} y={pad} width={cl} height={cw} fill={panelInfo?.color || "#F0F0F0"} opacity="0.08" />
      <rect x={pad} y={pad} width={cl} height={cw} fill="none" stroke="#37474F" strokeWidth="3" rx="1" />
      {wcZones.map((wc, i) => {
        const x = c2s(wc.x) + pad, y = c2s(wc.y) + pad, w = c2s(wc.w), h = c2s(wc.h);
        return (<g key={"pwc2-" + i}><rect x={x} y={y} width={w} height={h} fill="#E0F7FA" opacity="0.5" stroke="#00838F" strokeWidth="1.5" strokeDasharray="4,2" /><rect x={x} y={y} width={w} height={h} fill="url(#pptile2)" opacity="0.3" /><text x={x + w / 2} y={y + h / 2 + 3} textAnchor="middle" fontSize="8" fill="#00695C" fontWeight="600">WC</text></g>);
      })}
      {partitions.map((p, i) => {
        const px = c2s(p.position) + pad;
        return (<g key={"pp2-" + i}><line x1={px} y1={pad} x2={px} y2={pad + cw} stroke="#78909C" strokeWidth="3" /><line x1={px} y1={pad} x2={px} y2={pad + cw} stroke="white" strokeWidth="1.5" /><text x={px} y={pad - 3} textAnchor="middle" fontSize="6" fill="#546E7A">{p.label}</text></g>);
      })}
      {items.map(item => {
        const x = c2s(item.x) + pad, y = c2s(item.y) + pad;
        if (item.type === "door") {
          const dw = c2s(item.rotation === 90 ? 15 : item.width), dh = c2s(item.rotation === 90 ? item.width : 15);
          const di = DOOR_TYPES.find(d => d.id === item.doorType);
          const od = item.openDir || "sol";
          const inout = item.openInOut || "ic";
          const arcR = c2s(item.width) * 0.5;
          let arcPath;
          if (item.rotation === 0) {
            arcPath = od === "sol" ? `M ${x} ${y} A ${arcR} ${arcR} 0 0 1 ${x + arcR} ${y - arcR * 0.3}` : `M ${x + dw} ${y} A ${arcR} ${arcR} 0 0 0 ${x + dw - arcR} ${y - arcR * 0.3}`;
          } else {
            arcPath = od === "sol" ? `M ${x} ${y} A ${arcR} ${arcR} 0 0 0 ${x - arcR * 0.3} ${y + arcR}` : `M ${x} ${y + dh} A ${arcR} ${arcR} 0 0 1 ${x - arcR * 0.3} ${y + dh - arcR}`;
          }
          return (<g key={item.id}><rect x={x} y={y} width={dw} height={dh} fill="white" stroke="#555" strokeWidth="1" /><path d={arcPath} fill="none" stroke="#aaa" strokeWidth="0.7" strokeDasharray="3,2" /><text x={x + dw / 2} y={y + dh + 8} textAnchor="middle" fontSize="5" fill="#555">{di?.name}</text><text x={x + dw / 2} y={y + dh + 14} textAnchor="middle" fontSize="4.5" fill="#888">{od === "sol" ? "Sola" : "Saga"} | {inout === "dis" ? "Disa" : "Ice"}</text></g>);
        }
        if (item.type === "window") {
          const ww = c2s(item.rotation === 90 ? 10 : item.width), wh = c2s(item.rotation === 90 ? item.width : 10);
          const od = item.openDir || "ic";
          return (<g key={item.id}><rect x={x} y={y} width={ww} height={wh} fill="#E3F2FD" stroke="#1565C0" strokeWidth="1" /><line x1={x + ww / 2} y1={y} x2={x + ww / 2} y2={y + wh} stroke="#1565C0" strokeWidth="0.6" /><text x={x + ww / 2} y={y + wh + 8} textAnchor="middle" fontSize="5" fill="#555">{item.width}x{item.windowHeight}</text><text x={x + ww / 2} y={y + wh + 14} textAnchor="middle" fontSize="4.5" fill="#888">h:{item.elevation || 90} | {od === "dis" ? "Disa" : "Ice"}</text></g>);
        }
        if (item.type === "outlet") {
          const wallPos = item.y < 20 ? "Ust duvar " + item.x + "cm" : item.y > container.width - 20 ? "Alt duvar " + item.x + "cm" : item.x < 20 ? "Sol duvar " + item.y + "cm" : "Sag duvar " + item.y + "cm";
          return (<g key={item.id}><circle cx={x + 5} cy={y + 5} r={5} fill="#FFF8E1" stroke="#FF9800" strokeWidth="0.8" /><text x={x + 5} y={y + 8} textAnchor="middle" fontSize="5" fill="#E65100" fontWeight="bold">P</text><text x={x + 5} y={y + 17} textAnchor="middle" fontSize="4.5" fill="#F57C00">h:{item.elevation || 40}</text></g>);
        }
        if (item.type === "marker") {
          const mi = MARKER_TYPES.find(m => m.id === item.markerType) || MARKER_TYPES[5];
          return (<g key={item.id}><circle cx={x + 7} cy={y + 7} r={6} fill={mi.color} opacity="0.85" /><text x={x + 7} y={y + 10} textAnchor="middle" fontSize="6" fill="white" fontWeight="bold">{mi.icon}</text><text x={x + 7} y={y + 19} textAnchor="middle" fontSize="4.5" fill="#555">{item.note || mi.name}</text></g>);
        }
        return null;
      })}
      <text x={pad + cl / 2} y={vH - 4} textAnchor="middle" fontSize="7" fill="#999">Detay Krokisi - Elemanlar ve Olculer</text>
    </svg>
  );
}

// ==================== PDF / PRINT VIEW ====================
function PrintView({ container, items, partitions, wcZones, onClose }) {
  const pi = PANEL_TYPES.find((p) => p.id === container.panelType);
  const ri = ROOF_TYPES.find((r) => r.id === container.roofType);
  const rc = ROOF_COLORS.find((r) => r.id === container.roofColor);
  const doors = items.filter((i) => i.type === "door");
  const windows = items.filter((i) => i.type === "window");
  const outlets = items.filter((i) => i.type === "outlet");
  const markers = items.filter((i) => i.type === "marker");
  const tarih = new Date().toLocaleDateString("tr-TR");

  const handlePrint = () => window.print();
  const handleWhatsApp = () => {
    let msg = "*TOKYAY KERESTE - KONTEYNER TASARIM*%0A";
    msg += "Tarih: " + tarih + "%0A%0A";
    msg += "*OLCULER:* " + container.width + "x" + container.length + "x" + container.height + "cm%0A";
    msg += "*Alan:* " + (container.width * container.length / 10000).toFixed(1) + " m2%0A";
    msg += "*Panel:* " + (pi?.name) + "%0A";
    msg += "*Cati:* " + (ri?.name) + " (" + (rc?.name) + ")" + (((container.roofLayers || 1) === 2) ? " Cift kat" : "") + "%0A%0A";
    if (wcZones.length > 0) { msg += "*WC:* "; wcZones.forEach(wc => { msg += wc.w + "x" + wc.h + "cm "; }); msg += "%0A"; }
    if (doors.length > 0) { msg += "*Kapilar:* "; doors.forEach(d => { const info = DOOR_TYPES.find(dt => dt.id === d.doorType); msg += (info?.name) + " (" + (d.openDir === "sag" ? "Saga" : "Sola") + "," + (d.openInOut === "dis" ? "Disa" : "Ice") + ") "; }); msg += "%0A"; }
    if (windows.length > 0) { msg += "*Pencereler:* "; windows.forEach(w => { msg += w.width + "x" + w.windowHeight + "(h:" + (w.elevation || 90) + "," + (w.openDir === "dis" ? "Disa" : "Ice") + ") "; }); msg += "%0A"; }
    if (outlets.length > 0) msg += "*Priz:* " + outlets.length + " adet%0A";
    if (markers.length > 0) { msg += "*Isaretler:* "; markers.forEach(m => { const mi = MARKER_TYPES.find(mt => mt.id === m.markerType); msg += (mi?.name) + (m.note ? "(" + m.note + ")" : "") + " "; }); msg += "%0A"; }
    window.open("https://wa.me/?text=" + msg, "_blank");
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center overflow-auto" onClick={onClose}>
      <div className="bg-white w-[700px] max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl m-4" onClick={(e) => e.stopPropagation()}>
        {/* Action bar (hidden on print) */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 print:hidden">
          <div className="text-base font-bold text-gray-800">Tasarim Dokumani</div>
          <div className="flex gap-2">
            <button onClick={handleWhatsApp} className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 flex items-center gap-1">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
              WhatsApp
            </button>
            <button onClick={handlePrint} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700">Yazdir / PDF</button>
            <button onClick={onClose} className="px-3 py-1.5 bg-gray-200 rounded-lg text-xs font-medium hover:bg-gray-300">Kapat</button>
          </div>
        </div>

        {/* Print content */}
        <div className="p-6 space-y-5 text-sm" id="printArea">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-300 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-700 rounded-lg flex items-center justify-center text-white font-bold text-sm">TK</div>
              <div><div className="font-bold text-gray-800 text-base">TOKYAY KERESTE</div><div className="text-gray-500 text-xs">Konteyner Tasarim Dokumani</div></div>
            </div>
            <div className="text-right text-xs text-gray-500"><div>Tarih: {tarih}</div><div>Ref: TK-{Date.now().toString(36).toUpperCase()}</div></div>
          </div>

          {/* Specs table */}
          <div>
            <div className="font-bold text-gray-700 mb-2 text-sm">KONTEYNER BILGILERI</div>
            <table className="w-full text-xs border-collapse">
              <tbody>
                <tr className="border-b border-gray-200"><td className="py-1.5 text-gray-500 w-36">Dis Olculer</td><td className="py-1.5 font-medium">{container.width} x {container.length} x {container.height} cm</td></tr>
                <tr className="border-b border-gray-200"><td className="py-1.5 text-gray-500">Toplam Alan</td><td className="py-1.5 font-medium">{(container.width * container.length / 10000).toFixed(1)} m2</td></tr>
                <tr className="border-b border-gray-200"><td className="py-1.5 text-gray-500">Dis Duvar Paneli</td><td className="py-1.5 font-medium">{pi?.name}</td></tr>
                <tr className="border-b border-gray-200"><td className="py-1.5 text-gray-500">Cati Tipi</td><td className="py-1.5 font-medium">{ri?.name} {(container.roofLayers || 1) === 2 ? "(Cift kat panel)" : "(Tek kat)"}</td></tr>
                <tr className="border-b border-gray-200"><td className="py-1.5 text-gray-500">Cati Rengi</td><td className="py-1.5 font-medium">{rc?.name}</td></tr>
                {container.hasVeranda && <tr className="border-b border-gray-200"><td className="py-1.5 text-gray-500">Ekstra</td><td className="py-1.5 font-medium">Veranda</td></tr>}
              </tbody>
            </table>
          </div>

          {/* WC Zones */}
          {wcZones.length > 0 && (
            <div>
              <div className="font-bold text-gray-700 mb-2 text-sm">WC / BANYO BOLGELERI</div>
              <table className="w-full text-xs border-collapse">
                <thead><tr className="bg-gray-100"><th className="py-1.5 px-2 text-left">Konum</th><th className="py-1.5 px-2 text-left">Olculer</th></tr></thead>
                <tbody>{wcZones.map((wc, i) => (<tr key={i} className="border-b border-gray-200"><td className="py-1.5 px-2">{wc.corner === "tl" ? "Sol Ust" : wc.corner === "tr" ? "Sag Ust" : wc.corner === "bl" ? "Sol Alt" : "Sag Alt"} Kose</td><td className="py-1.5 px-2">{wc.w} x {wc.h} cm</td></tr>))}</tbody>
              </table>
            </div>
          )}

          {/* Partitions */}
          {partitions.length > 0 && (
            <div>
              <div className="font-bold text-gray-700 mb-2 text-sm">ODA BOLUNTULERI</div>
              <table className="w-full text-xs border-collapse">
                <thead><tr className="bg-gray-100"><th className="py-1.5 px-2 text-left">Tip</th><th className="py-1.5 px-2 text-left">Konum</th></tr></thead>
                <tbody>{partitions.map((p, i) => (<tr key={i} className="border-b border-gray-200"><td className="py-1.5 px-2">{p.label} (Beyaz Panel)</td><td className="py-1.5 px-2">{p.position} cm</td></tr>))}</tbody>
              </table>
            </div>
          )}

          {/* Floor Plan Dimensions */}
          <div><div className="font-bold text-gray-700 mb-2 text-sm">DUVAR OLCULERI KROKISI</div>
            <FloorPlanDimensions container={container} items={items} partitions={partitions} wcZones={wcZones} />
          </div>

          {/* Floor Plan Detail */}
          <div><div className="font-bold text-gray-700 mb-2 text-sm">DETAY KROKISI</div>
            <FloorPlanDetail container={container} items={items} partitions={partitions} wcZones={wcZones} />
          </div>

          {/* Doors */}
          {doors.length > 0 && (
            <div>
              <div className="font-bold text-gray-700 mb-2 text-sm">KAPILAR</div>
              <table className="w-full text-xs border-collapse">
                <thead><tr className="bg-gray-100"><th className="py-1.5 px-2 text-left">Tip</th><th className="py-1.5 px-2 text-left">Olcu</th><th className="py-1.5 px-2 text-left">Acilim</th><th className="py-1.5 px-2 text-left">Konum</th></tr></thead>
                <tbody>{doors.map((d, i) => { const info = DOOR_TYPES.find((dt) => dt.id === d.doorType); return (<tr key={i} className="border-b border-gray-200"><td className="py-1.5 px-2">{info?.name}</td><td className="py-1.5 px-2">{info?.width}x{info?.height}cm</td><td className="py-1.5 px-2">{d.openDir === "sag" ? "Saga" : "Sola"}, {d.openInOut === "dis" ? "Disa" : "Ice"}</td><td className="py-1.5 px-2">{d.x},{d.y}cm</td></tr>); })}</tbody>
              </table>
            </div>
          )}

          {/* Windows */}
          {windows.length > 0 && (
            <div>
              <div className="font-bold text-gray-700 mb-2 text-sm">PENCERELER</div>
              <table className="w-full text-xs border-collapse">
                <thead><tr className="bg-gray-100"><th className="py-1.5 px-2 text-left">Olcu</th><th className="py-1.5 px-2 text-left">Yerden</th><th className="py-1.5 px-2 text-left">Acilim</th><th className="py-1.5 px-2 text-left">Konum</th></tr></thead>
                <tbody>{windows.map((w, i) => (<tr key={i} className="border-b border-gray-200"><td className="py-1.5 px-2">{w.width}x{w.windowHeight}</td><td className="py-1.5 px-2">{w.elevation || 90}cm</td><td className="py-1.5 px-2">{w.openDir === "dis" ? "Disa" : "Ice"}</td><td className="py-1.5 px-2">{w.x},{w.y}cm</td></tr>))}</tbody>
              </table>
            </div>
          )}

          {/* Outlets */}
          {outlets.length > 0 && (
            <div>
              <div className="font-bold text-gray-700 mb-2 text-sm">PRIZLER</div>
              <table className="w-full text-xs border-collapse">
                <thead><tr className="bg-gray-100"><th className="py-1.5 px-2 text-left">Yerden</th><th className="py-1.5 px-2 text-left">Duvar Konumu</th><th className="py-1.5 px-2 text-left">Konum</th></tr></thead>
                <tbody>{outlets.map((o, i) => { const wallPos = o.y < 20 ? "Ust duvar" : o.y > container.width - 20 ? "Alt duvar" : o.x < 20 ? "Sol duvar" : "Sag duvar"; return (<tr key={i} className="border-b border-gray-200"><td className="py-1.5 px-2">{o.elevation || 40}cm</td><td className="py-1.5 px-2">{wallPos}</td><td className="py-1.5 px-2">{o.x},{o.y}cm</td></tr>); })}</tbody>
              </table>
            </div>
          )}

          {/* Markers */}
          {markers.length > 0 && (
            <div>
              <div className="font-bold text-gray-700 mb-2 text-sm">OZEL ISARETLER / NOTLAR</div>
              <table className="w-full text-xs border-collapse">
                <thead><tr className="bg-gray-100"><th className="py-1.5 px-2 text-left">Isaret</th><th className="py-1.5 px-2 text-left">Aciklama</th><th className="py-1.5 px-2 text-left">Konum</th></tr></thead>
                <tbody>{markers.map((m, i) => { const mi = MARKER_TYPES.find((mt) => mt.id === m.markerType); return (<tr key={i} className="border-b border-gray-200"><td className="py-1.5 px-2 font-medium" style={{ color: mi?.color }}>{mi?.name}</td><td className="py-1.5 px-2">{m.note || "-"}</td><td className="py-1.5 px-2">{m.x}, {m.y} cm</td></tr>); })}</tbody>
              </table>
            </div>
          )}

          {/* Footer */}
          <div className="border-t border-gray-300 pt-3 flex justify-between text-xs text-gray-400 mt-4">
            <span>Tokyay Kereste - Konteyner Tasarim Portali</span>
            <span>{tarih}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== MAIN APP ====================
export default function App() {
  const [container, setContainer] = useState(DEFAULT_CONTAINER);
  const [items, setItems] = useState([]);
  const [partitions, setPartitions] = useState([]);
  const [wcZones, setWcZones] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [mode, setMode] = useState("select");
  const [placingItem, setPlacingItem] = useState(null);
  const [activeTab, setActiveTab] = useState("container");
  const [showExport, setShowExport] = useState(false);
  const [showPrint, setShowPrint] = useState(false);
  const [viewMode, setViewMode] = useState("2d");
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [partPos, setPartPos] = useState(350);
  const [editingItem, setEditingItem] = useState(null);
  const [markerNote, setMarkerNote] = useState("");
  const [wcW, setWcW] = useState(100);
  const [wcH, setWcH] = useState(150);
  const svgRef = useRef(null);

  const padding = 60, cw = c2s(container.width), cl = c2s(container.length), viewW = cl + padding * 2, viewH = cw + padding * 2;
  const panelInfo = PANEL_TYPES.find((p) => p.id === container.panelType);

  const getSvgPt = useCallback((e) => { const svg = svgRef.current; if (!svg) return { x: 0, y: 0 }; const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY; const ctm = svg.getScreenCTM(); if (!ctm) return { x: 0, y: 0 }; const svgPt = pt.matrixTransform(ctm.inverse()); return { x: svgPt.x, y: svgPt.y }; }, []);
  const handlePlaceItem = useCallback((x, y) => { if (!placingItem) return; setItems((p) => [...p, { ...placingItem, id: uid(), x, y, rotation: 0 }]); }, [placingItem]);
  const handleMoveItem = useCallback((id, x, y) => { setItems((p) => p.map((i) => i.id === id ? { ...i, x: Math.max(0, x), y: Math.max(0, y) } : i)); }, []);
  const handleDeleteItem = useCallback((id) => { setItems((p) => p.filter((i) => i.id !== id)); setSelectedItem(null); setEditingItem(null); }, []);
  const handleRotateItem = useCallback((id) => { setItems((p) => p.map((i) => i.id === id ? { ...i, rotation: (i.rotation || 0) === 0 ? 90 : 0 } : i)); }, []);
  const updateItemProp = useCallback((id, prop, val) => { setItems((p) => p.map((i) => i.id === id ? { ...i, [prop]: val } : i)); }, []);

  const handleMouseMove = useCallback((e) => { const pt = getSvgPt(e); const cx = snapTo(s2c(pt.x - padding)), cy = snapTo(s2c(pt.y - padding)); setMousePos({ x: cx, y: cy }); if (isDragging && selectedItem) { handleMoveItem(selectedItem, snapTo(s2c(pt.x - padding) - dragOffset.x), snapTo(s2c(pt.y - padding) - dragOffset.y)); } }, [isDragging, selectedItem, dragOffset, getSvgPt, handleMoveItem]);
  const handleMouseDown = useCallback((e, id) => { e.stopPropagation(); const pt = getSvgPt(e); const item = items.find((i) => i.id === id); if (item) { setDragOffset({ x: s2c(pt.x - padding) - item.x, y: s2c(pt.y - padding) - item.y }); setIsDragging(true); setSelectedItem(id); } }, [items, getSvgPt]);
  const handleSvgClick = useCallback((e) => { if (mode === "place" && placingItem) { const pt = getSvgPt(e); const cx = snapTo(s2c(pt.x - padding)), cy = snapTo(s2c(pt.y - padding)); if (cx >= 0 && cx <= container.length && cy >= 0 && cy <= container.width) handlePlaceItem(cx, cy); } else if (!isDragging) { setSelectedItem(null); setEditingItem(null); } }, [mode, placingItem, getSvgPt, container, handlePlaceItem, isDragging]);

  useEffect(() => { const fn = (e) => { if (e.key === "Escape") { setMode("select"); setPlacingItem(null); setSelectedItem(null); setEditingItem(null); } if (e.key === "Delete" && selectedItem) handleDeleteItem(selectedItem); if (e.key === "r" && selectedItem && !editingItem) handleRotateItem(selectedItem); }; window.addEventListener("keydown", fn); return () => window.removeEventListener("keydown", fn); }, [selectedItem, editingItem, handleDeleteItem, handleRotateItem]);

  const startPlacing = (item) => { setMode("place"); setPlacingItem(item); };
  const addWcZone = (corner) => { let x = 0, y = 0; if (corner === "tl") { x = 0; y = 0; } else if (corner === "tr") { x = container.length - wcW; y = 0; } else if (corner === "bl") { x = 0; y = container.width - wcH; } else { x = container.length - wcW; y = container.width - wcH; } setWcZones((p) => [...p, { id: uid(), x, y, w: wcW, h: wcH, corner }]); };

  const selectedItemData = items.find((i) => i.id === selectedItem);

  // ===== RENDER ITEMS on 2D =====
  const renderItem = (item) => {
    const x = c2s(item.x) + padding, y = c2s(item.y) + padding, isSel = selectedItem === item.id;
    if (item.type === "door") {
      const dw = c2s(item.rotation === 90 ? 15 : item.width), dh = c2s(item.rotation === 90 ? item.width : 15), arcR = c2s(item.width) * 0.65;
      const di = DOOR_TYPES.find((d) => d.id === item.doorType);
      const od = item.openDir || "sol";
      let arcPath;
      if (item.rotation === 0) { arcPath = od === "sol" ? `M ${x} ${y} A ${arcR} ${arcR} 0 0 1 ${x + arcR} ${y - arcR * 0.3}` : `M ${x + dw} ${y} A ${arcR} ${arcR} 0 0 0 ${x + dw - arcR} ${y - arcR * 0.3}`; }
      else { arcPath = od === "sol" ? `M ${x} ${y} A ${arcR} ${arcR} 0 0 0 ${x - arcR * 0.3} ${y + arcR}` : `M ${x} ${y + dh} A ${arcR} ${arcR} 0 0 1 ${x - arcR * 0.3} ${y + dh - arcR}`; }
      return (<g key={item.id} onMouseDown={(e) => handleMouseDown(e, item.id)} onClick={(e) => { e.stopPropagation(); setSelectedItem(item.id); setEditingItem(item.id); }} style={{ cursor: "move" }}>
        <rect x={x} y={y} width={dw} height={dh} fill="white" stroke={isSel ? "#3b82f6" : "#555"} strokeWidth={isSel ? 2.5 : 1.5} />
        <path d={arcPath} fill="none" stroke={isSel ? "#3b82f6" : "#aaa"} strokeWidth="1" strokeDasharray="4,2" />
        <text x={x + dw / 2} y={y + dh + 11} textAnchor="middle" fontSize="7" fill={isSel ? "#3b82f6" : "#777"}>{di?.name}</text>
        <text x={x + dw / 2} y={y + dh + 20} textAnchor="middle" fontSize="6.5" fill="#999">{item.width}x{item.doorHeight}cm | {od === "sol" ? "Sola" : "Saga"}</text>
        {isSel && <rect x={x - 3} y={y - 3} width={dw + 6} height={dh + 6} fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="4,4" rx="2" />}
      </g>);
    }
    if (item.type === "window") {
      const ww = c2s(item.rotation === 90 ? 10 : item.width), wh = c2s(item.rotation === 90 ? item.width : 10);
      const od = item.openDir || "ic";
      return (<g key={item.id} onMouseDown={(e) => handleMouseDown(e, item.id)} onClick={(e) => { e.stopPropagation(); setSelectedItem(item.id); setEditingItem(item.id); }} style={{ cursor: "move" }}>
        <rect x={x} y={y} width={ww} height={wh} fill="#E3F2FD" stroke={isSel ? "#3b82f6" : "#1565C0"} strokeWidth={isSel ? 2.5 : 1.5} />
        <line x1={x} y1={y} x2={x + ww} y2={y + wh} stroke="#90CAF9" strokeWidth="0.5" /><line x1={x + ww} y1={y} x2={x} y2={y + wh} stroke="#90CAF9" strokeWidth="0.5" />
        <line x1={x + ww / 2} y1={y} x2={x + ww / 2} y2={y + wh} stroke="#1565C0" strokeWidth="0.8" />
        {od === "dis" && <line x1={x + ww / 2} y1={item.rotation === 90 ? (y - 2) : (y + wh + 2)} x2={x + ww / 2} y2={item.rotation === 90 ? (y - 10) : (y + wh + 10)} stroke="#E65100" strokeWidth="1.5" opacity="0.6" />}
        {od === "dis" && <polygon points={item.rotation === 90 ? `${x + ww / 2 - 3},${y - 7} ${x + ww / 2 + 3},${y - 7} ${x + ww / 2},${y - 12}` : `${x + ww / 2 - 3},${y + wh + 7} ${x + ww / 2 + 3},${y + wh + 7} ${x + ww / 2},${y + wh + 12}`} fill="#E65100" opacity="0.6" />}
        <text x={x + ww / 2} y={y + wh + 10} textAnchor="middle" fontSize="7" fill={isSel ? "#3b82f6" : "#777"}>{item.width}x{item.windowHeight}cm</text>
        <text x={x + ww / 2} y={y + wh + 19} textAnchor="middle" fontSize="6.5" fill="#F57C00" fontWeight="500">h:{item.elevation || 90}cm | {od === "dis" ? "Disa" : "Ice"}</text>
        {isSel && <rect x={x - 3} y={y - 3} width={ww + 6} height={wh + 6} fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="4,4" rx="2" />}
      </g>);
    }
    if (item.type === "outlet") {
      return (<g key={item.id} onMouseDown={(e) => handleMouseDown(e, item.id)} onClick={(e) => { e.stopPropagation(); setSelectedItem(item.id); setEditingItem(item.id); }} style={{ cursor: "move" }}>
        <circle cx={x + 7} cy={y + 7} r={7} fill={isSel ? "#FFF3E0" : "#FFF8E1"} stroke={isSel ? "#E65100" : "#FF9800"} strokeWidth={isSel ? 2.5 : 1.5} />
        <text x={x + 7} y={y + 10} textAnchor="middle" fontSize="7" fill="#E65100" fontWeight="bold">P</text>
        <text x={x + 7} y={y + 22} textAnchor="middle" fontSize="6.5" fill="#F57C00">h:{item.elevation || 40}cm</text>
        {isSel && <circle cx={x + 7} cy={y + 7} r={11} fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="4,4" />}
      </g>);
    }
    if (item.type === "marker") {
      const mi = MARKER_TYPES.find((m) => m.id === item.markerType) || MARKER_TYPES[5];
      const labelText = item.note || mi.name;
      return (<g key={item.id} onMouseDown={(e) => handleMouseDown(e, item.id)} onClick={(e) => { e.stopPropagation(); setSelectedItem(item.id); setEditingItem(item.id); }} style={{ cursor: "move" }}>
        <circle cx={x + 10} cy={y + 10} r={10} fill={mi.color} opacity={isSel ? 1 : 0.85} stroke={isSel ? "#3b82f6" : "white"} strokeWidth={isSel ? 2 : 1.5} />
        <text x={x + 10} y={y + 14} textAnchor="middle" fontSize="10" fill="white" fontWeight="bold">{mi.icon}</text>
        <rect x={x - 5} y={y + 23} width={Math.max(50, labelText.length * 4.8 + 8)} height="13" fill="white" stroke={mi.color} strokeWidth="0.8" rx="3" opacity="0.95" />
        <text x={x - 1} y={y + 32.5} fontSize="7" fill="#333" fontWeight="500">{labelText}</text>
        {isSel && <circle cx={x + 10} cy={y + 10} r={14} fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="4,4" />}
      </g>);
    }
    if (item.type === "watertank") {
      return (<g key={item.id} onMouseDown={(e) => handleMouseDown(e, item.id)} style={{ cursor: "move" }}>
        <rect x={x} y={y} width={c2s(60)} height={c2s(40)} fill="#E3F2FD" stroke={isSel ? "#3b82f6" : "#1976D2"} strokeWidth={isSel ? 2.5 : 1.5} rx="4" />
        <text x={x + c2s(30)} y={y + c2s(22)} textAnchor="middle" fontSize="9" fill="#1565C0">Su Deposu</text>
      </g>);
    }
    return null;
  };

  const renderWcZone = (wc, i) => {
    const x = c2s(wc.x) + padding, y = c2s(wc.y) + padding, w = c2s(wc.w), h = c2s(wc.h);
    return (<g key={`wc-${i}`}>
      <rect x={x} y={y} width={w} height={h} fill="#E0F7FA" opacity="0.5" stroke="#00838F" strokeWidth="2" strokeDasharray="6,3" rx="2" />
      <rect x={x} y={y} width={w} height={h} fill="url(#ptile)" opacity="0.3" />
      <text x={x + w / 2} y={y + h / 2 + 4} textAnchor="middle" fontSize="11" fill="#00695C" fontWeight="600">WC</text>
      <text x={x + w / 2} y={y + h / 2 + 16} textAnchor="middle" fontSize="7" fill="#00897B">{wc.w}x{wc.h}cm</text>
      <line x1={x} y1={y - 4} x2={x + w} y2={y - 4} stroke="#00838F" strokeWidth="0.6" /><text x={x + w / 2} y={y - 7} textAnchor="middle" fontSize="7" fill="#00838F">{wc.w}</text>
      <line x1={x - 4} y1={y} x2={x - 4} y2={y + h} stroke="#00838F" strokeWidth="0.6" /><text x={x - 12} y={y + h / 2 + 3} textAnchor="middle" fontSize="7" fill="#00838F">{wc.h}</text>
    </g>);
  };

  const renderPartition = (p, i) => {
    const px = c2s(p.position) + padding;
    return (<g key={`p-${i}`}>
      <line x1={px} y1={padding} x2={px} y2={padding + cw} stroke="#78909C" strokeWidth="5" strokeLinecap="round" />
      <line x1={px} y1={padding} x2={px} y2={padding + cw} stroke="white" strokeWidth="3" />
      <line x1={px} y1={padding} x2={px} y2={padding + cw} stroke="#B0BEC5" strokeWidth="1.5" strokeDasharray="6,3" />
      <text x={px} y={padding - 6} textAnchor="middle" fontSize="8" fill="#546E7A" fontWeight="500">{p.label} ({p.position}cm)</text>
    </g>);
  };

  const tabs = [
    { id: "container", label: "Konteyner" }, { id: "walls", label: "Boluntu/WC" },
    { id: "doors", label: "Kapilar" }, { id: "windows", label: "Pencereler" },
    { id: "extras", label: "Ekstra" }, { id: "markers", label: "Isaretler" },
  ];

  return (
    <div className="flex flex-col h-screen bg-gray-50 text-gray-800 text-sm select-none">
      {/* HEADER */}
      <div className="h-12 bg-white border-b border-gray-200 flex items-center justify-between px-4 shadow-sm flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-amber-700 rounded flex items-center justify-center text-white text-xs font-bold">TK</div>
          <span className="font-bold text-gray-800">Konteyner Tasarim</span>
          <span className="text-gray-400 text-xs ml-2">{container.width}x{container.length}x{container.height}cm | {(container.width * container.length / 10000).toFixed(1)}m2</span>
        </div>
        <div className="flex gap-1.5 items-center">
          <div className="flex bg-gray-100 rounded-lg p-0.5 mr-2">
            {[{ id: "2d", label: "2D Plan" }, { id: "3d", label: "3D" }, { id: "roof", label: "Cati" }].map((v) => (
              <button key={v.id} onClick={() => setViewMode(v.id)} className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${viewMode === v.id ? "bg-white text-blue-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>{v.label}</button>
            ))}
          </div>
          <button onClick={() => setShowPrint(true)} className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700">PDF / Yazdir</button>
          <button onClick={() => setShowExport(true)} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700">Ozet</button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* CANVAS */}
        <div className="flex-1 relative overflow-auto bg-gray-100 p-2">
          {viewMode === "2d" && (
            <svg ref={svgRef} viewBox={`0 0 ${viewW} ${viewH}`} className="w-full h-full bg-white rounded-lg shadow-inner" style={{ cursor: mode === "place" ? "crosshair" : "default", minHeight: "400px", aspectRatio: `${viewW}/${viewH}` }} onMouseMove={handleMouseMove} onMouseUp={() => setIsDragging(false)} onClick={handleSvgClick} onMouseLeave={() => setIsDragging(false)}>
              <defs>
                <pattern id="grid" width={GRID_SIZE * SCALE} height={GRID_SIZE * SCALE} patternUnits="userSpaceOnUse"><path d={`M ${GRID_SIZE * SCALE} 0 L 0 0 0 ${GRID_SIZE * SCALE}`} fill="none" stroke="#e8e8e8" strokeWidth="0.3" /></pattern>
                <pattern id="ptile" width="14" height="14" patternUnits="userSpaceOnUse"><rect width="14" height="14" fill="#E0F2F1" /><rect x="0" y="0" width="6" height="6" fill="#B2DFDB" stroke="#80CBC4" strokeWidth="0.3" /><rect x="7" y="7" width="6" height="6" fill="#B2DFDB" stroke="#80CBC4" strokeWidth="0.3" /></pattern>
                <marker id="ah" markerWidth="8" markerHeight="5" refX="8" refY="2.5" orient="auto"><polygon points="0 0,8 2.5,0 5" fill="#94a3b8" /></marker>
                <marker id="ahr" markerWidth="8" markerHeight="5" refX="0" refY="2.5" orient="auto"><polygon points="8 0,0 2.5,8 5" fill="#94a3b8" /></marker>
              </defs>
              <rect x={padding} y={padding} width={cl} height={cw} fill="url(#grid)" />
              <rect x={padding} y={padding} width={cl} height={cw} fill={panelInfo?.color || "#F0F0F0"} opacity="0.1" rx="2" />
              <rect x={padding} y={padding} width={cl} height={cw} fill="none" stroke="#37474F" strokeWidth="5" rx="2" />
              <rect x={padding + 2.5} y={padding + 2.5} width={cl - 5} height={cw - 5} fill="none" stroke={panelInfo?.color || "#E0E0E0"} strokeWidth="1.5" />
              {container.roofType === "besik" && <g opacity="0.2"><line x1={padding} y1={padding + cw / 2} x2={padding + cl} y2={padding + cw / 2} stroke="#455A64" strokeWidth="1" strokeDasharray="8,4" /><text x={padding + cl / 2} y={padding + cw / 2 - 4} textAnchor="middle" fontSize="8" fill="#455A64">Mahya</text></g>}
              {wcZones.map(renderWcZone)}
              {partitions.map(renderPartition)}
              {items.map(renderItem)}
              {mode === "place" && placingItem && (placingItem.type === "outlet" || placingItem.type === "marker" ? <circle cx={c2s(mousePos.x) + padding} cy={c2s(mousePos.y) + padding} r={placingItem.type === "marker" ? 10 : 7} fill="rgba(59,130,246,0.2)" stroke="#3b82f6" strokeWidth="1" strokeDasharray="3,3" /> : <rect x={c2s(mousePos.x) + padding} y={c2s(mousePos.y) + padding} width={c2s(placingItem.width || 20)} height={c2s(placingItem.height || 10)} fill="rgba(59,130,246,0.15)" stroke="#3b82f6" strokeWidth="1" strokeDasharray="3,3" rx="2" />)}
              {/* Dims */}
              <line x1={padding} y1={padding + cw + 25} x2={padding + cl} y2={padding + cw + 25} stroke="#64748b" strokeWidth="0.8" markerStart="url(#ahr)" markerEnd="url(#ah)" />
              <rect x={padding + cl / 2 - 28} y={padding + cw + 16} width="56" height="16" fill="white" rx="3" stroke="#cbd5e1" strokeWidth="0.5" />
              <text x={padding + cl / 2} y={padding + cw + 28} textAnchor="middle" fontSize="10" fill="#475569" fontWeight="500">{container.length} cm</text>
              <line x1={padding + cl + 25} y1={padding} x2={padding + cl + 25} y2={padding + cw} stroke="#64748b" strokeWidth="0.8" markerStart="url(#ahr)" markerEnd="url(#ah)" />
              <rect x={padding + cl + 14} y={padding + cw / 2 - 8} width="56" height="16" fill="white" rx="3" stroke="#cbd5e1" strokeWidth="0.5" />
              <text x={padding + cl + 42} y={padding + cw / 2 + 4} textAnchor="middle" fontSize="10" fill="#475569" fontWeight="500">{container.width} cm</text>
              <text x={padding + cl / 2} y={padding + cw / 2 + (wcZones.length > 0 ? 40 : 0)} textAnchor="middle" fontSize="13" fill="#37474F" opacity="0.2" fontWeight="600">{(container.width * container.length / 10000).toFixed(1)} m2</text>
              <text x={padding} y={padding - 10} fontSize="9" fill="#64748b">{container.height}cm | {ROOF_TYPES.find((r) => r.id === container.roofType)?.name} | {panelInfo?.name}</text>
              {mode === "place" && <text x={padding + cl - 5} y={padding - 6} textAnchor="end" fontSize="9" fill="#3b82f6">{mousePos.x}, {mousePos.y} cm</text>}
            </svg>
          )}
          {viewMode === "3d" && <div className="w-full h-full bg-white rounded-lg shadow-inner" style={{ minHeight: "400px" }}><View3D container={container} items={items} partitions={partitions} wcZones={wcZones} /></div>}
          {viewMode === "roof" && (
            <div className="w-full h-full bg-white rounded-lg shadow-inner p-6 flex flex-col items-center justify-center gap-4" style={{ minHeight: "400px" }}>
              <div className="text-base font-bold text-gray-700">Cati Gorunumu</div>
              <div className="w-full max-w-md"><RoofPreview roofType={container.roofType} roofColor={container.roofColor} roofLayers={container.roofLayers || 1} panelColor={panelInfo?.color || "#F0F0F0"} /></div>
              <div className="bg-gray-50 rounded-lg p-4 max-w-md w-full space-y-3 text-xs">
                <div className="flex justify-between"><span className="text-gray-500">Cati Tipi:</span><span className="font-medium">{ROOF_TYPES.find((r) => r.id === container.roofType)?.name}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Renk:</span><span className="font-medium flex items-center gap-1"><span className="w-3 h-3 rounded-full inline-block border border-gray-300" style={{ backgroundColor: ROOF_COLORS.find((r) => r.id === container.roofColor)?.color }}></span>{ROOF_COLORS.find((r) => r.id === container.roofColor)?.name}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Panel Kat:</span><div className="flex gap-1">{[1, 2].map((n) => <button key={n} onClick={() => setContainer({ ...container, roofLayers: n })} className={`px-2 py-0.5 rounded text-xs ${(container.roofLayers || 1) === n ? "bg-blue-100 text-blue-700 font-medium" : "bg-gray-200 text-gray-600"}`}>{n === 1 ? "Tek" : "Cift"}</button>)}</div></div>
                {(container.roofLayers || 1) === 2 && <div className="bg-amber-50 border border-amber-200 rounded p-2 text-gray-500">Beyaz panel uzerine {container.roofColor === "antrasit" ? "Antrasit" : container.roofColor === "bordo" ? "Bordo" : "Beyaz"} panel kaplanir.</div>}
              </div>
            </div>
          )}
          {viewMode === "2d" && <>
            <div className="absolute top-4 left-4 bg-white rounded-lg shadow border border-gray-200 p-1 flex gap-1">
              <button onClick={() => { setMode("select"); setPlacingItem(null); }} className={`px-2 py-1 rounded text-xs ${mode === "select" ? "bg-blue-100 text-blue-700 font-medium" : "text-gray-500 hover:bg-gray-100"}`}>Sec</button>
            </div>
            <div className="absolute bottom-3 right-3 bg-white/90 rounded-lg shadow border border-gray-200 px-3 py-1.5 text-xs text-gray-500 flex gap-3"><span>ESC: Iptal</span><span>DEL: Sil</span><span>R: Dondur</span></div>
          </>}
        </div>

        {/* RIGHT PANEL */}
        <div className="w-72 bg-white border-l border-gray-200 flex flex-col overflow-hidden flex-shrink-0">
          <div className="flex border-b border-gray-200 bg-gray-50 overflow-x-auto flex-shrink-0">
            {tabs.map((tab) => (<button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 py-2 px-1 text-xs font-medium whitespace-nowrap ${activeTab === tab.id ? "text-blue-600 border-b-2 border-blue-600 bg-white" : "text-gray-500 hover:text-gray-700"}`}>{tab.label}</button>))}
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {activeTab === "container" && <>
              <div><div className="text-xs font-semibold text-gray-600 mb-2">Dis Olculer</div>
                <div className="grid grid-cols-3 gap-1.5">
                  <div><label className="text-xs text-gray-400">Gen</label><input type="number" value={container.width} onChange={(e) => setContainer({ ...container, width: +e.target.value })} className="w-full border border-gray-300 rounded px-1.5 py-1 text-xs" step="10" /></div>
                  <div><label className="text-xs text-gray-400">Uz</label><input type="number" value={container.length} onChange={(e) => setContainer({ ...container, length: +e.target.value })} className="w-full border border-gray-300 rounded px-1.5 py-1 text-xs" step="10" /></div>
                  <div><label className="text-xs text-gray-400">Yuk</label><select value={container.height} onChange={(e) => setContainer({ ...container, height: +e.target.value })} className="w-full border border-gray-300 rounded px-1.5 py-1 text-xs"><option value={230}>230</option><option value={250}>250</option></select></div>
                </div>
                <div className="flex gap-1 mt-2 flex-wrap">{[{ w: 300, l: 600, lb: "3x6" }, { w: 300, l: 700, lb: "3x7" }, { w: 300, l: 800, lb: "3x8" }, { w: 300, l: 1200, lb: "3x12" }].map((p) => <button key={p.lb} onClick={() => setContainer({ ...container, width: p.w, length: p.l })} className="px-2 py-0.5 bg-gray-100 border border-gray-200 rounded text-xs text-gray-600 hover:bg-blue-50">{p.lb}m</button>)}</div>
              </div>
              <div><div className="text-xs font-semibold text-gray-600 mb-2">Cati Tipi</div><div className="space-y-1.5">{ROOF_TYPES.map((r) => <button key={r.id} onClick={() => setContainer({ ...container, roofType: r.id })} className={`w-full p-2 rounded border-2 text-left text-xs ${container.roofType === r.id ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 hover:border-gray-300"}`}><div className="font-medium">{r.name}</div><div className="text-gray-400">{r.desc}</div></button>)}</div></div>
              <div><div className="text-xs font-semibold text-gray-600 mb-2">Cati Rengi</div><div className="flex gap-1.5">{ROOF_COLORS.map((rc) => <button key={rc.id} onClick={() => setContainer({ ...container, roofColor: rc.id })} className={`flex-1 p-1.5 rounded border-2 flex items-center gap-1.5 text-xs ${container.roofColor === rc.id ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}><span className="w-4 h-4 rounded-full border border-gray-300" style={{ backgroundColor: rc.color }}></span>{rc.name}</button>)}</div><div className="flex gap-1 mt-2"><span className="text-xs text-gray-400">Kat:</span>{[1, 2].map((n) => <button key={n} onClick={() => setContainer({ ...container, roofLayers: n })} className={`px-2 py-0.5 rounded text-xs ${(container.roofLayers || 1) === n ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"}`}>{n === 1 ? "Tek" : "Cift"}</button>)}</div></div>
              <div><div className="text-xs font-semibold text-gray-600 mb-2">Dis Duvar</div><div className="space-y-1.5">{PANEL_TYPES.map((p) => <button key={p.id} onClick={() => setContainer({ ...container, panelType: p.id })} className={`w-full p-2 rounded border-2 flex items-center gap-2 text-xs ${container.panelType === p.id ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}><span className="w-6 h-6 rounded border border-gray-300" style={{ backgroundColor: p.color }}></span>{p.name}</button>)}</div></div>
            </>}

            {activeTab === "walls" && <>
              <div><div className="text-xs font-semibold text-gray-600 mb-2">WC Bolgesi</div>
                <div className="grid grid-cols-2 gap-1.5 mb-2">
                  <div><label className="text-xs text-gray-400">Genislik (cm)</label><input type="number" value={wcW} onChange={(e) => setWcW(+e.target.value)} className="w-full border border-gray-300 rounded px-1.5 py-1 text-xs" step="5" min="60" max={container.length - 50} /></div>
                  <div><label className="text-xs text-gray-400">Derinlik (cm)</label><input type="number" value={wcH} onChange={(e) => setWcH(+e.target.value)} className="w-full border border-gray-300 rounded px-1.5 py-1 text-xs" step="5" min="60" max={container.width - 50} /></div>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <button onClick={() => addWcZone("tl")} className="p-2 bg-teal-50 border-2 border-teal-200 rounded text-xs text-teal-700 hover:bg-teal-100">Sol Ust</button>
                  <button onClick={() => addWcZone("tr")} className="p-2 bg-teal-50 border-2 border-teal-200 rounded text-xs text-teal-700 hover:bg-teal-100">Sag Ust</button>
                  <button onClick={() => addWcZone("bl")} className="p-2 bg-teal-50 border-2 border-teal-200 rounded text-xs text-teal-700 hover:bg-teal-100">Sol Alt</button>
                  <button onClick={() => addWcZone("br")} className="p-2 bg-teal-50 border-2 border-teal-200 rounded text-xs text-teal-700 hover:bg-teal-100">Sag Alt</button>
                </div>
                {wcZones.length > 0 && <div className="mt-2 space-y-1">{wcZones.map((wc, i) => <div key={i} className="flex justify-between items-center p-1.5 bg-teal-50 rounded text-xs"><span>WC {wc.w}x{wc.h} ({wc.corner})</span><button onClick={() => setWcZones((p) => p.filter((_, idx) => idx !== i))} className="text-red-500 px-1">x</button></div>)}</div>}
              </div>
              <div><div className="text-xs font-semibold text-gray-600 mb-2">Oda Boluntusu</div>
                <div className="flex gap-1.5 items-end"><div className="flex-1"><label className="text-xs text-gray-400">Konum (cm)</label><input type="number" value={partPos} onChange={(e) => setPartPos(+e.target.value)} className="w-full border border-gray-300 rounded px-1.5 py-1 text-xs" step="5" /></div>
                  <button onClick={() => setPartitions((p) => [...p, { id: uid(), orientation: "vertical", position: partPos, label: "Oda" }])} className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700">Ekle</button></div>
              </div>
              {partitions.length > 0 && <div><div className="text-xs font-semibold text-gray-600 mb-1">Mevcut</div>{partitions.map((p, i) => <div key={i} className="flex justify-between items-center p-1.5 bg-gray-50 rounded text-xs mb-1"><span>{p.label} - {p.position}cm</span><button onClick={() => setPartitions((ps) => ps.filter((_, idx) => idx !== i))} className="text-red-500 px-1">x</button></div>)}</div>}
            </>}

            {activeTab === "doors" && <><div className="text-xs text-gray-400 mb-1">Secip krokiye yerlestirin.</div>{DOOR_TYPES.map((d) => <button key={d.id} onClick={() => startPlacing({ type: "door", doorType: d.id, width: d.width, height: 15, doorHeight: d.height, openDir: "sol", openInOut: "ic" })} className={`w-full p-2 rounded border-2 text-left flex justify-between items-center text-xs mb-1.5 ${mode === "place" && placingItem?.doorType === d.id ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}><div><div className="font-medium">{d.name}</div><div className="text-gray-400">{d.width}x{d.height}</div></div><span className="bg-gray-100 px-1.5 py-0.5 rounded">{d.type === "dis" ? "Dis" : d.type === "wc" ? "WC" : "Ic"}</span></button>)}{mode === "place" && placingItem?.type === "door" && <div className="bg-blue-50 border border-blue-200 rounded p-2 text-xs text-blue-700">Tiklayarak yerlestirin. <button onClick={() => { setMode("select"); setPlacingItem(null); }} className="ml-2 px-2 py-0.5 bg-white border border-blue-300 rounded">Iptal</button></div>}</>}

            {activeTab === "windows" && <><div className="text-xs text-gray-400 mb-1">Secip yerlestirin. Yukseklik sonra degistirilir.</div>{WINDOW_TYPES.map((w) => <button key={w.id} onClick={() => startPlacing({ type: "window", windowType: w.id, width: w.width, height: 10, windowHeight: w.height, elevation: w.defaultElevation, openDir: "ic" })} className={`w-full p-2 rounded border-2 text-left flex justify-between items-center text-xs mb-1.5 ${mode === "place" && placingItem?.windowType === w.id ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}><div><div className="font-medium">{w.name}</div><div className="text-gray-400">{w.width}x{w.height} | Yerden: {w.defaultElevation}cm</div></div>{w.id === "w50x100" && <span className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded text-xs">Vasistas</span>}</button>)}{mode === "place" && placingItem?.type === "window" && <div className="bg-blue-50 border border-blue-200 rounded p-2 text-xs text-blue-700">Tiklayarak yerlestirin. <button onClick={() => { setMode("select"); setPlacingItem(null); }} className="ml-2 px-2 py-0.5 bg-white border border-blue-300 rounded">Iptal</button></div>}</>}

            {activeTab === "extras" && <>
              <button onClick={() => startPlacing({ type: "outlet", width: 10, height: 10, elevation: 40 })} className={`w-full p-2 rounded border-2 text-left text-xs ${mode === "place" && placingItem?.type === "outlet" ? "border-orange-500 bg-orange-50" : "border-gray-200 hover:border-gray-300"}`}><div className="font-medium">Priz Ekle</div><div className="text-gray-400">Varsayilan yerden: 40cm</div></button>
              <button onClick={() => startPlacing({ type: "watertank", width: 60, height: 40 })} className="w-full p-2 rounded border-2 border-gray-200 hover:border-gray-300 text-left text-xs"><div className="font-medium">Su Deposu</div></button>
              <label className="flex items-center gap-2 p-2 bg-gray-50 rounded cursor-pointer text-xs"><input type="checkbox" checked={container.hasVeranda} onChange={(e) => setContainer({ ...container, hasVeranda: e.target.checked })} className="w-3.5 h-3.5 text-blue-600 rounded" /><span className="font-medium">Veranda</span></label>
              {mode === "place" && (placingItem?.type === "outlet" || placingItem?.type === "watertank") && <div className="bg-orange-50 border border-orange-200 rounded p-2 text-xs text-orange-700">Tiklayarak yerlestirin. <button onClick={() => { setMode("select"); setPlacingItem(null); }} className="ml-2 px-2 py-0.5 bg-white border border-orange-300 rounded">Iptal</button></div>}
            </>}

            {activeTab === "markers" && <>
              <div className="text-xs text-gray-400 mb-2">Isaret koyun, aciklama yazin.</div>
              {MARKER_TYPES.map((m) => <button key={m.id} onClick={() => startPlacing({ type: "marker", markerType: m.id, width: 20, height: 20, note: m.id === "ozel" ? "" : m.name })} className={`w-full p-2 rounded border-2 text-left flex items-center gap-2 text-xs mb-1.5 ${mode === "place" && placingItem?.markerType === m.id ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}><span className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: m.color }}>{m.icon}</span><span className="font-medium">{m.name}</span></button>)}
              {mode === "place" && placingItem?.type === "marker" && <div className="bg-blue-50 border border-blue-200 rounded p-2 text-xs text-blue-700 space-y-2"><div>Tiklayarak yerlestirin.</div>{placingItem.markerType === "ozel" && <input type="text" value={markerNote} onChange={(e) => { setMarkerNote(e.target.value); setPlacingItem({ ...placingItem, note: e.target.value }); }} className="w-full border border-blue-300 rounded px-2 py-1 text-xs" placeholder="Not yazin..." />}<button onClick={() => { setMode("select"); setPlacingItem(null); setMarkerNote(""); }} className="px-2 py-0.5 bg-white border border-blue-300 rounded">Iptal</button></div>}
            </>}
          </div>

          {/* Selected item detail */}
          {selectedItemData && (
            <div className="border-t border-gray-200 p-3 bg-gray-50 flex-shrink-0 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-700">{selectedItemData.type === "door" ? "Kapi" : selectedItemData.type === "window" ? "Pencere" : selectedItemData.type === "outlet" ? "Priz" : selectedItemData.type === "marker" ? "Isaret" : "Su Dep."}</span>
                <div className="flex gap-1"><button onClick={() => handleRotateItem(selectedItem)} className="px-1.5 py-0.5 bg-white border border-gray-300 rounded text-xs">Dondur</button><button onClick={() => handleDeleteItem(selectedItem)} className="px-1.5 py-0.5 bg-red-50 border border-red-200 rounded text-xs text-red-600">Sil</button></div>
              </div>
              <div className="text-xs text-gray-500">Konum: {selectedItemData.x}, {selectedItemData.y} cm</div>
              {selectedItemData.type === "door" && <>
                <div className="flex items-center gap-2"><label className="text-xs text-gray-500 whitespace-nowrap">Sol/Sag:</label><div className="flex gap-1">{["sol", "sag"].map((d) => <button key={d} onClick={() => updateItemProp(selectedItem, "openDir", d)} className={`px-2 py-0.5 rounded text-xs ${(selectedItemData.openDir || "sol") === d ? "bg-blue-100 text-blue-700 font-medium" : "bg-gray-100 text-gray-500"}`}>{d === "sol" ? "Sola" : "Saga"}</button>)}</div></div>
                <div className="flex items-center gap-2"><label className="text-xs text-gray-500 whitespace-nowrap">Ic/Dis:</label><div className="flex gap-1">{["ic", "dis"].map((d) => <button key={d} onClick={() => updateItemProp(selectedItem, "openInOut", d)} className={`px-2 py-0.5 rounded text-xs ${(selectedItemData.openInOut || "ic") === d ? "bg-blue-100 text-blue-700 font-medium" : "bg-gray-100 text-gray-500"}`}>{d === "ic" ? "Ice" : "Disa"}</button>)}</div></div>
              </>}
              {selectedItemData.type === "window" && <><div className="flex items-center gap-2"><label className="text-xs text-gray-500 whitespace-nowrap">Yerden:</label><input type="number" value={selectedItemData.elevation || 90} onChange={(e) => updateItemProp(selectedItem, "elevation", +e.target.value)} className="w-16 border border-gray-300 rounded px-1.5 py-0.5 text-xs" step="5" /><span className="text-xs text-gray-400">cm</span></div><div className="flex items-center gap-2"><label className="text-xs text-gray-500 whitespace-nowrap">Acilim:</label><div className="flex gap-1">{["ic","dis"].map((d) => <button key={d} onClick={() => updateItemProp(selectedItem, "openDir", d)} className={`px-2 py-0.5 rounded text-xs ${(selectedItemData.openDir || "ic") === d ? "bg-blue-100 text-blue-700 font-medium" : "bg-gray-100 text-gray-500"}`}>{d === "ic" ? "Ice" : "Disa"}</button>)}</div></div></>}
              {selectedItemData.type === "outlet" && <div className="flex items-center gap-2"><label className="text-xs text-gray-500 whitespace-nowrap">Yerden:</label><input type="number" value={selectedItemData.elevation || 40} onChange={(e) => updateItemProp(selectedItem, "elevation", +e.target.value)} className="w-16 border border-gray-300 rounded px-1.5 py-0.5 text-xs" step="5" /><span className="text-xs text-gray-400">cm</span></div>}
              {selectedItemData.type === "marker" && <div><label className="text-xs text-gray-500 block mb-1">Not:</label><input type="text" value={selectedItemData.note || ""} onChange={(e) => updateItemProp(selectedItem, "note", e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1 text-xs" /></div>}
            </div>
          )}
        </div>
      </div>

      {/* Export summary modal */}
      {showExport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowExport(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-[520px] max-h-[75vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-200"><div className="text-base font-bold">Tasarim Ozeti</div></div>
            <div className="p-4 overflow-y-auto max-h-[45vh]"><pre className="bg-gray-50 p-3 rounded text-xs text-gray-700 whitespace-pre-wrap font-mono">{(() => {
              const pi2 = PANEL_TYPES.find((p) => p.id === container.panelType), ri2 = ROOF_TYPES.find((r) => r.id === container.roofType), rc2 = ROOF_COLORS.find((r) => r.id === container.roofColor);
              let t = `KONTEYNER: ${container.width}x${container.length}x${container.height}cm (${(container.width * container.length / 10000).toFixed(1)}m2)\nPanel: ${pi2?.name} | Cati: ${ri2?.name} (${rc2?.name})\n\n`;
              if (wcZones.length) { t += "WC: "; wcZones.forEach((w) => t += `${w.w}x${w.h}cm(${w.corner}) `); t += "\n"; }
              if (partitions.length) { t += "Boluntu: "; partitions.forEach((p) => t += `${p.label}@${p.position}cm `); t += "\n"; }
              items.forEach((i) => {
                if (i.type === "door") { const d = DOOR_TYPES.find((dt) => dt.id === i.doorType); t += `Kapi: ${d?.name} (${i.openDir === "sag" ? "Saga" : "Sola"}, ${i.openInOut === "dis" ? "Disa" : "Ice"}) @${i.x},${i.y}\n`; }
                if (i.type === "window") t += `Pencere: ${i.width}x${i.windowHeight} h:${i.elevation || 90} (${i.openDir === "dis" ? "Disa" : "Ice"}) @${i.x},${i.y}\n`;
                if (i.type === "outlet") t += `Priz: h:${i.elevation || 40}cm @${i.x},${i.y}\n`;
                if (i.type === "marker") { const mi = MARKER_TYPES.find((m) => m.id === i.markerType); t += `${mi?.name}: ${i.note || "-"} @${i.x},${i.y}\n`; }
              });
              return t;
            })()}</pre></div>
            <div className="p-3 border-t flex justify-end gap-2"><button onClick={() => setShowExport(false)} className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs">Kapat</button></div>
          </div>
        </div>
      )}

      {/* Print/PDF modal */}
      {showPrint && <PrintView container={container} items={items} partitions={partitions} wcZones={wcZones} onClose={() => setShowPrint(false)} />}
    </div>
  );
}

export default App;
