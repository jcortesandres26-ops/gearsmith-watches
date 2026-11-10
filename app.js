/* Gearsmith Watches Mods - tienda de relojes (HTML, CSS y JavaScript puros) */
(() => {
  "use strict";

  // ================= Utilidades =================
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
  const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));
  const RATE = { EUR: 1, USD: 1.08 };
  let currency = load("gs_currency", "EUR");
  const money = (eur, cur = currency) => new Intl.NumberFormat("es-ES", { style: "currency", currency: cur }).format(eur * (RATE[cur] || 1));
  const toast = (msg) => { const t = $("#toast"); t.textContent = msg; t.classList.add("show"); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove("show"), 2400); };
  const pretty = (s) => s.toLowerCase().replace(/\bmod\b/g, "Mod").replace(/\bgmt\b/g, "GMT").replace(/\bnh(\d\d)\b/g, "NH$1");
  const PHOTOS = typeof IMAGES === "object" ? IMAGES : {};
  const WA = "https://wa.me/34623125970";

  // Color: aclarar (+) u oscurecer (-) un hex
  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    const f = (v) => Math.max(0, Math.min(255, Math.round(v + (amt > 0 ? (255 - v) * amt : v * amt))));
    return "#" + [n >> 16, (n >> 8) & 255, n & 255].map((v) => f(v).toString(16).padStart(2, "0")).join("");
  }
  const lum = (hex) => { const n = parseInt(hex.slice(1), 16); return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255; };
  const P = (r, deg, cx = 150, cy = 200) => [cx + r * Math.sin(deg * Math.PI / 180), cy - r * Math.cos(deg * Math.PI / 180)];

  // ================= Catálogo =================
  const COLLECTIONS = ["Datejust", "Day-Date", "GMT y Diver", "Prospex Turtle", "Royal Oak", "Skeleton", "Santos", "Nautilus", "Nautilus Open", "Omega x Swatch"].map((c) => [c, null]);
  const PART_COLS = [];
  const INTRO = {
    Datejust: "Bisel estriado, fecha y pulsera Jubilee.",
    "Day-Date": "Día y fecha a la vista con movimiento 8285.",
    "GMT y Diver": "GMT con biseles de color (Batman, Pepsi, Coke, Sprite) y Diver de buceo.",
    "Prospex Turtle": "Buceo robusto con NH35 o NH36.",
    "Royal Oak": "Bisel octogonal en acero, oro rosa o negro.",
    Skeleton: "Esfera calada con movimiento NH70 a la vista.",
    Santos: "Caja cuadrada de 38 mm y números romanos.",
    Nautilus: "Lujo deportivo con esfera de líneas horizontales.",
    "Nautilus Open": "Corazón abierto con movimiento NH38.",
    "Omega x Swatch": "Cronógrafo MoonSwatch a 200 €. Pídelo con el estilo de cualquier Omega x Swatch.",
  };
  const POPULAR = ["datejust-verde-menta", "daydate-azul-hielo", "gmt-pepsi-rojo-y-azul", "turtle-turquesa", "royaloak-oro-rosa-verde", "skeleton-oro-rosa", "santos-blanco-romano", "nautilus-tiffany", "nautilusopen-oro-rosa-caucho", "omega-swatch-tiffany"];

  const COLORS = [
    ["TIFFANY", "#5fcfc1"], ["TURQUOISE", "#2fb5aa"], ["SKY BLUE", "#86c3e6"], ["LIGHT BLUE", "#9fcbea"], ["OCEAN BLUE", "#1b4d8e"],
    ["BUBBLEGUM", "#9fd2ee"], ["PLATINUM", "#bcdcea"], ["SMURF", "#1d4cae"], ["HULK", "#1b7a3a"], ["SHREK", "#7cb43a"],
    ["EMERALD", "#0d6a44"], ["OLIVE", "#5d6b36"], ["KERMIT", "#121214"], ["CHOCOLATE", "#4b2b1b"], ["BROWN", "#5c3621"],
    ["CHAMPAGNE", "#e2cfa6"], ["WIMBLEDON", "#696d70"], ["METEORITE", "#7a7a7e"], ["PINK", "#eaa3be"], ["CHERRY", "#991a28"],
    ["RED", "#b21f2b"], ["ORANGE", "#e5732b"], ["YELLOW", "#f0cc35"], ["GREEN", "#1e6a3f"], ["BLUE", "#1c3e7a"],
    ["GREY", "#727578"], ["WHITE", "#f4f2ed"], ["SILVER", "#cdd0d3"], ["GOLD", "#d2ac55"], ["BLACK", "#141416"],
  ];
  const COLOR_GROUPS = { Negro: ["#141416", "#121214"], Azul: ["#1c3e7a", "#1b4d8e", "#1d4cae", "#86c3e6", "#9fcbea", "#9fd2ee", "#bcdcea"], Verde: ["#1e6a3f", "#1b7a3a", "#7cb43a", "#0d6a44", "#5d6b36"], Blanco: ["#f4f2ed", "#cdd0d3", "#e2cfa6"], Marrón: ["#4b2b1b", "#5c3621"], Turquesa: ["#5fcfc1", "#2fb5aa"], Gris: ["#696d70", "#727578", "#7a7a7e"], Color: ["#eaa3be", "#991a28", "#b21f2b", "#e5732b", "#f0cc35", "#d2ac55"] };

  function dialColor(T) {
    if (/PANDA/.test(T)) return /REVERSE|BLACK PANDA/.test(T) ? "#141416" : "#f4f2ed";
    if (/OYSTER WATCH MOD SILVER BLACK/.test(T)) return "#141416";
    const seg = T.includes("DIAL") ? T.slice(0, T.lastIndexOf("DIAL")) : T;
    let best = null, pos = -1;
    COLORS.forEach(([k, c]) => {
      const i = seg.lastIndexOf(k);
      // SILVER / GOLD seguidos de otro color describen la caja, no la esfera
      if (i > pos && !((k === "SILVER" || k === "GOLD") && seg.slice(i + k.length).trim().length > 2)) { pos = i; best = c; }
    });
    return best || "#141416";
  }
  function metalOf(T) {
    if (/ALL BLACK|BLACKED|BLACK OUT/.test(T) && !/OYSTER/.test(T)) return { name: "Negro PVD", hi: "#5a5a60", mid: "#2c2c30", lo: "#141416", pol: "#6e6e75" };
    if (/ROSE/.test(T) && !/TWO-TONE (SILVER|WHITE|DIAMOND|CHOCOLATE|NIGHT|OCEAN|BLACK)/.test(T)) return { name: "Oro rosa", hi: "#f6d5c6", mid: "#cf9479", lo: "#8f5c48", pol: "#ffe6da" };
    if (/(^|\s)GOLD(\s|-)/.test(T) && !/TWO-TONE|ROSE/.test(T)) return { name: "Oro", hi: "#fbe7a6", mid: "#cfa64c", lo: "#87692b", pol: "#fff2c7" };
    return { name: "Acero", hi: "#f7f8f9", mid: "#b5b9bd", lo: "#6a6e73", pol: "#ffffff" };
  }

  PRODUCTS.forEach((p, i) => {
    const T = p.t.toUpperCase();
    p.T = T; p.order = i;
    p.col = p.c || "Especiales";
    p.min = Math.min(...p.v.map((v) => v.p));
    p.ref = null;
    p.avail = p.v.some((v) => v.a);
    p.chrono = /CHRONO|DAYTONA|SPEEDMASTER|MOONWATCH/.test(T);
    p.open = /OPEN HEART|SKELETON/.test(T);
    p.movement = p.mv || (p.acc ? "—" : p.chrono ? "VK63" : p.col === "GMT" ? "NH34" : (p.open || ["Santos", "Oyster", "Explorer", "Air Queen"].includes(p.col)) ? "NH38" : "NH35");
    p.name = p.nm || pretty(p.t);
    p.dial = p.dc || (p.acc ? "#222" : dialColor(T));
    p.metal = p.mt ? ({ "Oro rosa": { name: "Oro rosa", mid: "#cf9479" }, Oro: { name: "Oro", mid: "#cfa64c" }, "Negro PVD": { name: "Negro PVD", mid: "#2c2c30" }, Bicolor: { name: "Acero y oro", mid: "#cfa64c" } }[p.mt] || { name: "Acero", mid: "#b5b9bd" }) : metalOf(T);
    p.group = p.g || Object.keys(COLOR_GROUPS).find((g) => COLOR_GROUPS[g].includes(p.dial)) || "Color";
    p.size = (p.o.find((o) => o.n === "SIZE") || { v: [] }).v;
  });
  const byId = Object.fromEntries(PRODUCTS.map((p) => [p.id, p]));
  // Opciones libres (f): no cambian la variante base; se guardan en la línea del pedido.
  function vget(p, k) {
    const ex = p.v.find((x) => x.k === k); if (ex) return ex;
    const parts = String(k).split(" / ");
    if (parts.length !== p.o.length) return null;
    const bk = parts.filter((_, i) => !p.o[i].f).join(" / ") || "Default Title";
    const b = p.v.find((x) => x.k === bk); if (!b) return null;
    const extra = parts.reduce((s, val, i) => s + (p.o[i].px ? (p.o[i].px[val] || 0) : 0), 0);
    return { k, p: b.p + extra, a: b.a };
  }
  function defaultSel(p) {
    if (!(p.o.length && p.o[0].n !== "Title")) return [];
    const first = p.v.find((v) => v.a) || p.v[0];
    const b = first.k.split(" / "); let j = 0;
    return p.o.map((o) => (o.f ? o.v[0] : b[j++]));
  }

  // ================= Dibujo de relojes (SVG) =================
  let uid = 0;
  const BEZ = { PEPSI: ["#c41f2c", "#1c3d99"], BATMAN: ["#1c3d99", "#121214"], BATGIRL: ["#1c3d99", "#121214"], "BRUCE WAYNE": ["#121214", "#6f7275"], JOKER: ["#6a2e9c", "#1b5e34"], COKE: ["#c41f2c", "#121214"], SPRITE: ["#1e8a3c", "#121214"], "ROOT BEER": ["#5c3621", "#121214"] };

  function watchSVG(p, o = {}) {
    if (p.acc) return boxSVG(p);
    const id = "w" + (uid++);
    const T = p.T, m = p.metal, dial = p.dial, light = lum(dial) > 0.55;
    const ink = light ? "#1d1d1f" : "#f2efe8";
    const two = /TWO-TONE/.test(T);
    const gold = { hi: "#fbe7a6", mid: "#cfa64c", lo: "#87692b", pol: "#fff2c7" };
    const shape = { "Royal Oak": "oct", Nautilus: "naut", Aquanaut: "aqua", Santos: "square" }[p.col] || "round";
    const lume = [];  // formas luminiscentes (para la vista nocturna)
    const logo = o.logo !== false;

    // ---- Brazalete / correa ----
    let strapType = "oyster";
    if (/RUBBER/.test(T) || p.col === "Aquanaut") strapType = "rubber";
    else if (/LEATHER/.test(T)) strapType = "leather";
    else if (/SEAHORSE/.test(T)) strapType = "mesh";
    else if (/DAYDATE/.test(T)) strapType = "president";
    else if (/JUBILEE/.test(T) || ["Datejust", "Sky-Dweller"].includes(p.col) || (p.col === "GMT" && /BRUCE|BATGIRL|JOKER|SPRITE DIAL JUBILEE/.test(T))) strapType = "jubilee";
    else if (["Royal Oak", "Nautilus"].includes(p.col)) strapType = "integrated";
    let rubberCol = "#1a1a1c";
    if (/ORANGE/.test(T)) rubberCol = "#d9672a"; else if (/RED/.test(T)) rubberCol = "#9e1c27"; else if (p.col === "Aquanaut" && /GREEN/.test(T)) rubberCol = "#2c5f45";
    else if (p.col === "Aquanaut" && /TURQUOISE/.test(T)) rubberCol = "#239c92"; else if (/BROWN|CHOCOLATE/.test(T)) rubberCol = "#4e3021"; else if (p.col === "Aquanaut" && /BLUE/.test(T)) rubberCol = "#1f3766";
    else if (/BLUE DIAL RUBBER/.test(T)) rubberCol = "#1f3766";
    const sw = shape === "square" ? 62 : shape === "round" ? 56 : 64; // media anchura en la caja
    const ew = sw - 10;
    const clip = `M${150 - ew} -10 L${150 + ew} -10 L${150 + sw} 130 L${150 - sw} 130Z`;
    const cols = (arr) => { let x = 150 - sw; return arr.map(([w, fill]) => { const r = `<rect x="${x}" y="-10" width="${w}" height="140" fill="${fill}"/>`; x += w; return r; }).join(""); };
    const rows = (step, col = "#000", op = 0.28, x1 = 150 - sw, x2 = 150 + sw) => Array.from({ length: Math.ceil(140 / step) }, (_, i) => `<line x1="${x1}" y1="${130 - i * step}" x2="${x2}" y2="${130 - i * step}" stroke="${col}" stroke-opacity="${op}" stroke-width="1.4"/>`).join("");
    const W = sw * 2, cMet = two ? `url(#${id}g)` : `url(#${id}p)`;
    let strapInner = "";
    if (strapType === "oyster") strapInner = cols([[W * .3, `url(#${id}b)`], [W * .4, cMet], [W * .3, `url(#${id}b)`]]) + rows(24);
    else if (strapType === "jubilee") {
      strapInner = cols([[W * .24, `url(#${id}b)`], [W * .13, cMet], [W * .26, `url(#${id}b)`], [W * .13, cMet], [W * .24, `url(#${id}b)`]]) + rows(16, "#000", .25);
      const xs = [150 - sw + W * .24, 150 - sw + W * .63];
      strapInner += xs.map((x) => Array.from({ length: 18 }, (_, i) => `<line x1="${x}" y1="${130 - i * 8 - 4}" x2="${x + W * .13}" y2="${130 - i * 8 - 4}" stroke="#000" stroke-opacity=".22"/>`).join("")).join("");
    } else if (strapType === "president") {
      strapInner = `<rect x="${150 - sw}" y="-10" width="${W}" height="140" fill="url(#${id}b)"/>` + Array.from({ length: 7 }, (_, i) => [0, 1, 2].map((c) => `<rect x="${150 - sw + c * W / 3 + 1}" y="${130 - (i + 1) * 20 + 1}" width="${W / 3 - 2}" height="18" rx="9" fill="${c === 1 ? cMet : `url(#${id}b)`}" stroke="#000" stroke-opacity=".2"/>`).join("")).join("");
    } else if (strapType === "integrated") {
      strapInner = `<rect x="${150 - sw}" y="-10" width="${W}" height="140" fill="url(#${id}b)"/>` + Array.from({ length: 8 }, (_, i) => {
        const y = 130 - (i + 1) * 20;
        return `<rect x="${150 - sw}" y="${y}" width="${W * .38}" height="19" rx="3" fill="url(#${id}b)" stroke="#000" stroke-opacity=".25"/><rect x="${150 + sw - W * .38}" y="${y}" width="${W * .38}" height="19" rx="3" fill="url(#${id}b)" stroke="#000" stroke-opacity=".25"/><rect x="${150 - W * .12}" y="${y + 2}" width="${W * .24}" height="16" rx="3" fill="${cMet}" stroke="#000" stroke-opacity=".2"/>`;
      }).join("");
    } else if (strapType === "rubber") {
      strapInner = `<rect x="${150 - sw}" y="-10" width="${W}" height="140" fill="${rubberCol}"/><rect x="${150 - sw}" y="-10" width="${W}" height="140" fill="url(#${id}sh)"/>` +
        (p.col === "Aquanaut" ? `<rect x="${150 - sw}" y="-10" width="${W}" height="140" fill="url(#${id}gr)" opacity=".5"/>` : rows(10, "#fff", .06) + `<rect x="${150 - 7}" y="-10" width="14" height="140" fill="#000" opacity=".18"/>`);
    } else if (strapType === "leather") {
      strapInner = `<rect x="${150 - sw}" y="-10" width="${W}" height="140" fill="#3b2316"/><rect x="${150 - sw}" y="-10" width="${W}" height="140" fill="url(#${id}sh)"/><path d="M${150 - ew + 6} -10 L${150 - sw + 6} 130 M${150 + ew - 6} -10 L${150 + sw - 6} 130" stroke="#c9a77d" stroke-dasharray="4 4" stroke-width="1.2"/>`;
    } else {
      strapInner = `<rect x="${150 - sw}" y="-10" width="${W}" height="140" fill="url(#${id}b)"/><rect x="${150 - sw}" y="-10" width="${W}" height="140" fill="url(#${id}mesh)"/>`;
    }
    if (p.strapMetal) strapInner = strapInner.split(`url(#${id}b)`).join(`url(#${id}sb)`).split(`url(#${id}p)`).join(`url(#${id}sb)`);
    const strapHalf = `<g clip-path="url(#${id}sc)">${strapInner}</g>`;
    const strap = `${strapHalf}<g transform="translate(0 400) scale(1 -1)">${strapHalf}</g>`;

    // ---- Caja ----
    let caseEl = "", bezel = "", dialEl = "", rehaut = "";
    const crown = (x, y, guard) => `${guard ? `<path d="M${x - 6} ${y - 20} Q${x + 12} ${y} ${x - 6} ${y + 20}Z" fill="url(#${id}b)"/>` : ""}<rect x="${x}" y="${y - 11}" width="16" height="22" rx="4" fill="url(#${id}cr)"/>${Array.from({ length: 6 }, (_, i) => `<line x1="${x + 3 + i * 2.2}" y1="${y - 10}" x2="${x + 3 + i * 2.2}" y2="${y + 10}" stroke="#000" stroke-opacity=".3"/>`).join("")}`;

    if (shape === "round") {
      const guard = ["GMT", "Submariner", "Yacht-Master", "Explorer", "Seamaster"].includes(p.col);
      caseEl = `<path d="M${150 - sw - 8} 92 Q150 82 ${150 + sw + 8} 92 L${150 + sw + 8} 308 Q150 318 ${150 - sw - 8} 308Z" fill="url(#${id}b)"/>${crown(238, 200, guard)}<circle cx="150" cy="200" r="94" fill="url(#${id}b)"/><circle cx="150" cy="200" r="94" fill="none" stroke="${m.lo}" stroke-width="1.5"/>`;
      // Bisel
      if (p.col === "GMT") {
        const bz = Object.keys(BEZ).find((k) => T.includes(k));
        const [c1, c2] = bz ? BEZ[bz] : /METEORITE/.test(T) ? ["#3a3a3e", "#3a3a3e"] : ["#141416", "#141416"];
        bezel = `<circle cx="150" cy="200" r="88" fill="${c2}"/><path d="M62 200 A88 88 0 0 1 238 200Z" fill="${c1}"/><circle cx="150" cy="200" r="88" fill="url(#${id}cer)"/>` +
          Array.from({ length: 24 }, (_, i) => { const [x, y] = P(80, i * 15); return i % 2 ? `<circle cx="${x}" cy="${y}" r="1.4" fill="#eee"/>` : i === 0 ? "" : `<text x="${x}" y="${y + 3}" font-size="8.5" font-weight="700" text-anchor="middle" fill="${two || /GOLD/.test(T) ? "#e8cf8a" : "#eceae4"}" transform="rotate(${i * 15} ${x} ${y})">${i}</text>`; }).join("") +
          `<polygon points="150,116 144,107 156,107" fill="#eee"/>`;
      } else if (["Submariner", "Seamaster", "Yacht-Master"].includes(p.col)) {
        let c = "#141416";
        if (/HULK|KERMIT/.test(T)) c = "#1b7a3a"; else if (/SMURF|BLUE BLACK|OCEAN|SEAMASTER WATCH MOD SILVER BLUE/.test(T)) c = "#1c3d99";
        const numCol = p.col === "Yacht-Master" ? `url(#${id}p)` : two ? "#e8cf8a" : "#eceae4";
        bezel = `<circle cx="150" cy="200" r="88" fill="${c}"/><circle cx="150" cy="200" r="88" fill="url(#${id}cer)"/>` +
          Array.from({ length: 60 }, (_, i) => { if (i % 10 === 0 && i) { const [x, y] = P(80, i * 6); return `<text x="${x}" y="${y + 4}" font-size="${p.col === "Yacht-Master" ? 12 : 11}" font-weight="700" text-anchor="middle" fill="${numCol}" transform="rotate(${i * 6} ${x} ${y})">${i}</text>`; }
            if (i % 5 === 0 && i) { const [x1, y1] = P(86, i * 6), [x2, y2] = P(74, i * 6); return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#eceae4" stroke-width="3"/>`; }
            if (i < 15 && i) { const [x1, y1] = P(86, i * 6), [x2, y2] = P(79, i * 6); return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#eceae4" stroke-width="1"/>`; } return ""; }).join("") +
          `<polygon points="150,118 141,105 159,105" fill="#eceae4"/><circle cx="150" cy="110" r="2.6" fill="#d9f5d0"/>`;
        lume.push(`<circle cx="150" cy="110" r="2.6"/>`);
      } else if (["Datejust", "Day-Date", "Sky-Dweller"].includes(p.col)) {
        const f = two || p.col === "Day-Date" && m.name === "Acero" ? gold : m;
        bezel = `<circle cx="150" cy="200" r="88" fill="${f.mid}"/>` + Array.from({ length: 60 }, (_, i) => { const a = i * 6; const [x1, y1] = P(88, a), [x2, y2] = P(72, a), [x3, y3] = P(88, a + 3), [x4, y4] = P(72, a + 3); return `<polygon points="${x1},${y1} ${x3},${y3} ${x4},${y4} ${x2},${y2}" fill="${i % 2 ? f.hi : f.lo}" opacity=".85"/>`; }).join("") + `<circle cx="150" cy="200" r="88" fill="url(#${id}hl)"/>`;
      } else if (p.chrono) {
        const bc = /PLATINUM/.test(T) ? "#6b3a24" : /SPEEDMASTER|MOONWATCH|BLACK DIAL RUBBER|BLUE DIAL RUBBER/.test(T) ? "#121214" : null;
        const txt = bc ? "#eceae4" : ink === "#f2efe8" ? "#2a2a2c" : "#2a2a2c";
        bezel = `<circle cx="150" cy="200" r="88" fill="${bc || `url(#${id}p)`}"/>` + [60, 70, 80, 90, 100, 120, 150, 200, 300, 500].map((n, i) => { const a = 360 * (1 - 60 / (n * 1.0)) * 1.05 + 10; const [x, y] = P(80, a % 360); return `<text x="${x}" y="${y + 3}" font-size="7.5" font-weight="700" text-anchor="middle" fill="${txt}" transform="rotate(${a % 360} ${x} ${y})">${n}</text>`; }).join("") +
          `<text font-size="7" font-weight="700" letter-spacing="2" fill="${txt}"><textPath href="#${id}arc" startOffset="50%" text-anchor="middle">TACHYMETRE</textPath></text>`;
      } else {
        bezel = `<circle cx="150" cy="200" r="88" fill="url(#${id}p)"/><circle cx="150" cy="200" r="80" fill="none" stroke="${m.lo}" stroke-opacity=".35"/>`;
      }
      rehaut = `<circle cx="150" cy="200" r="72" fill="${shade(dial, light ? -0.12 : 0.12)}"/>` + Array.from({ length: 60 }, (_, i) => { const [x1, y1] = P(72, i * 6), [x2, y2] = P(i % 5 ? 69 : 67, i * 6); return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${ink}" stroke-opacity=".7" stroke-width="${i % 5 ? .7 : 1.3}"/>`; }).join("");
      dialEl = `<circle cx="150" cy="200" r="68" fill="url(#${id}d)"/>`;
    } else if (shape === "oct") {
      caseEl = `<path d="M70 122 L230 122 L250 160 L250 240 L230 278 L70 278 L50 240 L50 160Z" fill="url(#${id}b)" stroke="${m.lo}"/>${crown(250, 200, false)}`;
      const oct = (r) => { const pts = Array.from({ length: 8 }, (_, i) => P(r, 22.5 + i * 45)); return pts.map((q) => q.join(",")).join(" "); };
      bezel = `<polygon points="${oct(92)}" fill="url(#${id}p)" stroke="${m.lo}" stroke-width="1.2"/><polygon points="${oct(86)}" fill="none" stroke="${m.lo}" stroke-opacity=".3"/>` +
        Array.from({ length: 8 }, (_, i) => { const [x, y] = P(80, 22.5 + i * 45); const hx = Array.from({ length: 6 }, (_, k) => P(4.2, k * 60 + 30, x, y).join(",")).join(" "); return `<polygon points="${hx}" fill="url(#${id}b)" stroke="${m.lo}" stroke-width=".8"/><line x1="${x - 2.5}" y1="${y}" x2="${x + 2.5}" y2="${y}" stroke="${m.lo}" stroke-width="1"/>`; }).join("");
      rehaut = `<rect x="88" y="138" width="124" height="124" rx="16" fill="${shade(dial, light ? -0.12 : 0.15)}"/>`;
      dialEl = `<rect x="92" y="142" width="116" height="116" rx="14" fill="url(#${id}d)"/><rect x="92" y="142" width="116" height="116" rx="14" fill="url(#${id}tap)"/>`;
    } else if (shape === "naut" || shape === "aqua") {
      const r1 = shape === "naut" ? 46 : 62;
      caseEl = `<rect x="50" y="118" width="200" height="164" rx="${r1 + 6}" fill="url(#${id}b)" stroke="${m.lo}"/>${shape === "naut" ? `<rect x="36" y="168" width="26" height="64" rx="12" fill="url(#${id}b)" stroke="${m.lo}"/><rect x="238" y="168" width="26" height="64" rx="12" fill="url(#${id}b)" stroke="${m.lo}"/>` : ""}${crown(shape === "naut" ? 258 : 248, 200, false)}`;
      bezel = `<rect x="62" y="128" width="176" height="144" rx="${r1}" fill="url(#${id}p)" stroke="${m.lo}" stroke-width="1.2"/>`;
      rehaut = `<rect x="80" y="142" width="140" height="116" rx="${r1 - 12}" fill="${shade(dial, light ? -0.12 : 0.15)}"/>`;
      dialEl = `<rect x="84" y="146" width="132" height="108" rx="${r1 - 14}" fill="url(#${id}d)"/><rect x="84" y="146" width="132" height="108" rx="${r1 - 14}" fill="url(#${shape === "naut" ? id + "str" : id + "gr"})"/>`;
    } else {
      caseEl = `<rect x="58" y="104" width="184" height="192" rx="34" fill="url(#${id}b)" stroke="${m.lo}"/>${crown(240, 200, false).replace(/<rect x="240"/, `<rect x="240"`)}<polygon points="252,193 262,196 262,204 252,207" fill="#2a4aa8"/>`;
      bezel = `<rect x="70" y="116" width="160" height="168" rx="26" fill="${two ? gold.mid : `url(#${id}p)`}" stroke="${m.lo}" stroke-width="1.2"/>` +
        [[84, 130], [216, 130], [84, 270], [216, 270], [150, 122], [150, 278], [76, 200], [224, 200]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.6" fill="url(#${id}b)" stroke="${m.lo}" stroke-width=".8"/><line x1="${x - 2.4}" y1="${y}" x2="${x + 2.4}" y2="${y}" stroke="${m.lo}"/>`).join("");
      rehaut = "";
      dialEl = `<rect x="88" y="136" width="124" height="128" rx="10" fill="url(#${id}d)"/><rect x="100" y="148" width="100" height="104" rx="4" fill="none" stroke="${ink}" stroke-opacity=".55" stroke-width=".8"/><rect x="104" y="152" width="92" height="96" rx="3" fill="none" stroke="${ink}" stroke-opacity=".55" stroke-width=".8"/>`;
    }

    // ---- Textura de esfera (rayos de sol) ----
    let texture = "";
    if (shape === "round" && !/METEORITE/.test(T)) texture = `<circle cx="150" cy="200" r="68" fill="url(#${id}sun)" opacity="${light ? .35 : .5}"/>`;
    if (/METEORITE/.test(T)) texture = `<circle cx="150" cy="200" r="68" fill="url(#${id}met)"/>`;
    if (p.col === "Seamaster") texture += Array.from({ length: 9 }, (_, i) => `<path d="M82 ${150 + i * 13} q17 -8 34 0 t34 0 t34 0 t34 0" fill="none" stroke="#000" stroke-opacity=".22" stroke-width="2"/>`).join("");

    // ---- Índices ----
    const R = shape === "round" ? 56 : shape === "oct" ? 46 : shape === "square" ? 0 : 44;
    const idxMetal = (m.name === "Acero" && !two) ? `url(#${id}p)` : `url(#${id}g)`;
    let idx = "";
    const dateAt3 = !p.open && !p.chrono && p.movement !== "NH38";
    if (shape === "square") {
      const roman = ["XII", "I", "II", "III", "IIII", "V", "VI", "VII", "VIII", "IX", "X", "XI"];
      idx = roman.map((r, i) => { const [x, y] = P(40, i * 30); return `<text x="${x}" y="${y + 4}" font-size="${i % 3 ? 9 : 11}" font-family="Georgia,serif" text-anchor="middle" fill="${ink}" transform="rotate(${i * 30} ${x} ${y})">${r}</text>`; }).join("");
      if (/9-5/.test(T)) idx += `<text x="150" y="232" font-size="6" letter-spacing="1" text-anchor="middle" fill="#b21f2b" font-weight="700">9 — 5</text>`;
    } else if (/ROMAN|WIMBLEDON/.test(T)) {
      const roman = ["XII", "I", "II", "III", "IIII", "V", "VI", "VII", "VIII", "IX", "X", "XI"];
      const rc = /WIMBLEDON/.test(T) ? "#3a9a5b" : `url(#${id}g)`;
      idx = roman.map((r, i) => { if (i === 3 && dateAt3) return ""; const [x, y] = P(R - 2, i * 30); return `<text x="${x}" y="${y + 4.5}" font-size="12" font-family="Georgia,serif" font-weight="700" text-anchor="middle" fill="${rc}" stroke="${m.lo}" stroke-width=".3" transform="rotate(${i * 30} ${x} ${y})">${r}</text>`; }).join("");
    } else if (/ARABIC|EXPLORER|OYSTER WATCH MOD WHITE|OYSTER WATCH MOD SILVER BLACK/.test(T)) {
      idx = Array.from({ length: 12 }, (_, i) => {
        const [x, y] = P(R - 2, i * 30);
        if (/ARABIC/.test(T)) return i === 3 && dateAt3 ? "" : `<text x="${x}" y="${y + 5}" font-size="13" font-weight="800" text-anchor="middle" fill="${idxMetal}" stroke="${m.lo}" stroke-width=".3">${i || 12}</text>`;
        if (i % 3 === 0) { lume.push(`<text x="${x}" y="${y + 6}" font-size="17" font-weight="800" text-anchor="middle">${i || 12}</text>`); return `<text x="${x}" y="${y + 6}" font-size="17" font-weight="800" text-anchor="middle" fill="${light ? "#1d1d1f" : "#f0ede6"}" stroke="${idxMetal}" stroke-width=".8">${i || 12}</text>`; }
        const [a, b] = P(R, i * 30); return `<rect x="${a - 2.5}" y="${b - 8}" width="5" height="16" rx="1" fill="${idxMetal}" transform="rotate(${i * 30} ${a} ${b})"/>`;
      }).join("");
    } else if (/BUBBLEGUM/.test(T)) {
      const cs = ["#f28c28", "#e94f6f", "#f1cf3b", "#4caf50", "#7e57c2", "#29b6f6"];
      idx = Array.from({ length: 12 }, (_, i) => { const [x, y] = P(R - 4, i * 30); return `<circle cx="${x}" cy="${y}" r="7" fill="${cs[i % 6]}" stroke="#fff" stroke-width="1.2"/>`; }).join("");
    } else {
      const dive = ["Submariner", "GMT", "Seamaster", "Yacht-Master"].includes(p.col);
      const gem = /DIAMOND/.test(T);
      idx = Array.from({ length: 12 }, (_, i) => {
        if (i === 3 && dateAt3) return "";
        if (p.chrono && [3, 6, 9].includes(i) && shape === "round") return "";
        if (p.open && i === 6 && !/SKELETON/.test(T) && shape !== "oct") return "";
        const [x, y] = P(R, i * 30);
        if (gem) return `<circle cx="${x}" cy="${y}" r="4" fill="url(#${id}gem)" stroke="${idxMetal}" stroke-width="1.4"/>`;
        if (dive) {
          if (i === 0) { const pts = `${x - 7},${y - 7} ${x + 7},${y - 7} ${x},${y + 6}`; lume.push(`<polygon points="${pts}"/>`); return `<polygon points="${pts}" fill="#f2f0e6" stroke="${idxMetal}" stroke-width="1.6"/>`; }
          if (i % 3 === 0) { lume.push(`<rect x="${x - 3.5}" y="${y - 9}" width="7" height="18" transform="rotate(${i * 30} ${x} ${y})"/>`); return `<rect x="${x - 3.5}" y="${y - 9}" width="7" height="18" fill="#f2f0e6" stroke="${idxMetal}" stroke-width="1.6" transform="rotate(${i * 30} ${x} ${y})"/>`; }
          lume.push(`<circle cx="${x}" cy="${y}" r="4.6"/>`); return `<circle cx="${x}" cy="${y}" r="4.6" fill="#f2f0e6" stroke="${idxMetal}" stroke-width="1.6"/>`;
        }
        const big = i === 0;
        const w = big ? 9 : 5, h = shape === "round" ? 15 : 13;
        lume.push(`<rect x="${x - 1.2}" y="${y - h / 2 + 2}" width="2.4" height="${h - 4}" transform="rotate(${i * 30} ${x} ${y})"/>`);
        return `<g transform="rotate(${i * 30} ${x} ${y})"><rect x="${x - w / 2}" y="${y - h / 2}" width="${w}" height="${h}" rx="1" fill="${idxMetal}" stroke="${m.lo}" stroke-width=".5"/>${big ? `<line x1="${x}" y1="${y - h / 2}" x2="${x}" y2="${y + h / 2}" stroke="${m.lo}" stroke-width=".8"/>` : `<rect x="${x - 1.2}" y="${y - h / 2 + 2}" width="2.4" height="${h - 4}" fill="#f2f0e6" opacity=".9"/>`}</g>`;
      }).join("");
    }

    // ---- Detalles: cronógrafo, corazón abierto, fecha ----
    let extra = "";
    if (p.chrono) {
      const panda = /PANDA/.test(T) && !/REVERSE|BLACK PANDA/.test(T), rev = /REVERSE|BLACK PANDA/.test(T);
      const sub = panda ? "#161618" : rev || /WHITE SUBDIALS/.test(T) ? "#f4f2ed" : light ? shade(dial, -0.15) : shade(dial, 0.12);
      const subInk = lum(sub) > .5 ? "#222" : "#eee";
      const pos = shape === "round" ? [[118, 200], [182, 200], [150, 234]] : [[120, 200], [180, 200], [150, 230]];
      const sr = shape === "round" ? 16 : 14;
      extra += pos.map(([x, y], k) => `<circle cx="${x}" cy="${y}" r="${sr + 1.5}" fill="${panda || rev ? `url(#${id}p)` : m.lo}" opacity=".9"/><circle cx="${x}" cy="${y}" r="${sr}" fill="${sub}"/><circle cx="${x}" cy="${y}" r="${sr}" fill="url(#${id}sun)" opacity=".4"/>` +
        Array.from({ length: 12 }, (_, i) => { const [a, b] = P(sr - 1, i * 30, x, y), [c, d] = P(sr - 4, i * 30, x, y); return `<line x1="${a}" y1="${b}" x2="${c}" y2="${d}" stroke="${subInk}" stroke-width=".8"/>`; }).join("") +
        `<line x1="${x}" y1="${y}" x2="${P(sr - 3, [40, 200, 300][k], x, y)[0]}" y2="${P(sr - 3, [40, 200, 300][k], x, y)[1]}" stroke="${subInk}" stroke-width="1.4"/><circle cx="${x}" cy="${y}" r="1.6" fill="${subInk}"/>`).join("");
    }
    if (p.open) {
      if (/SKELETON/.test(T)) {
        const gear = (x, y, r, c, sp) => `<g ${sp ? `class="spin-slow" style="transform-origin:${x}px ${y}px"` : ""}><circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${c}" stroke-width="4" stroke-dasharray="2.5 2.5"/><circle cx="${x}" cy="${y}" r="${r - 3}" fill="none" stroke="${c}" stroke-width="1.5"/><path d="M${x - r + 3} ${y} H${x + r - 3} M${x} ${y - r + 3} V${y + r - 3}" stroke="${c}" stroke-width="1.5"/><circle cx="${x}" cy="${y}" r="2" fill="#b21f2b"/></g>`;
        extra += `<g opacity=".95"><rect x="96" y="150" width="108" height="100" rx="12" fill="#1a1a1c" opacity=".55"/>${gear(126, 176, 15, "#d6b46a", true)}${gear(172, 186, 11, m.hi)}${gear(140, 222, 18, m.hi)}${gear(182, 226, 9, "#d6b46a")}<path d="M104 200 Q150 150 196 205" stroke="${m.mid}" stroke-width="5" fill="none" opacity=".8"/></g>`;
      } else {
        const [hx, hy] = shape === "round" ? [150, 236] : shape === "oct" ? [130, 222] : [150, 230];
        extra += `<circle cx="${hx}" cy="${hy}" r="15" fill="${idxMetal}"/><circle cx="${hx}" cy="${hy}" r="13" fill="#0e0e0f"/><g class="spin-slow" style="transform-origin:${hx}px ${hy}px"><circle cx="${hx}" cy="${hy}" r="9" fill="none" stroke="#d6b46a" stroke-width="1.6"/><path d="M${hx - 9} ${hy} H${hx + 9} M${hx} ${hy - 9} V${hy + 9}" stroke="#d6b46a" stroke-width="1"/></g><circle cx="${hx + 5}" cy="${hy - 6}" r="1.5" fill="#b21f2b"/><path d="M${hx - 12} ${hy + 6} Q${hx} ${hy + 14} ${hx + 12} ${hy + 6}" stroke="${m.mid}" stroke-width="2" fill="none"/>`;
      }
    }
    if (dateAt3) {
      const dx = shape === "round" ? 195 : shape === "square" ? 0 : 186;
      if (dx) {
        const cyc = ["Datejust", "Submariner", "GMT", "Yacht-Master", "Sky-Dweller", "Day-Date", "Oyster"].includes(p.col);
        extra += `<rect x="${dx}" y="192" width="16" height="16" rx="1.5" fill="#fbfaf6" stroke="${idxMetal}" stroke-width="1.4"/><text x="${dx + 8}" y="204.5" font-size="11" font-weight="700" text-anchor="middle" fill="#111">30</text>`;
        if (cyc) extra += `<rect x="${dx - 5}" y="187" width="26" height="26" rx="5" fill="url(#${id}cyc)" stroke="#fff" stroke-opacity=".7"/><text x="${dx + 8}" y="206.5" font-size="15" font-weight="700" text-anchor="middle" fill="#111" opacity=".5">30</text>`;
      }
      if (p.col === "Day-Date") extra += `<rect x="128" y="142" width="44" height="15" rx="2" fill="#fbfaf6" stroke="${idxMetal}"/><text x="150" y="153.5" font-size="9" font-weight="700" letter-spacing="1" text-anchor="middle" fill="#111">VIERNES</text>`;
    }

    // ---- Logotipo ----
    const ly = p.col === "Day-Date" ? 172 : shape === "square" ? 176 : shape === "round" ? 172 : 175;
    const sub2 = p.chrono ? "CHRONOGRAPH" : p.col === "GMT" ? "GMT · AUTOMATIC" : "AUTOMATIC";
    const brand = logo ? `<text x="150" y="${ly}" font-size="10" font-family="Georgia,serif" font-weight="700" letter-spacing="2.5" text-anchor="middle" fill="${ink}">GEARSMITH</text><text x="150" y="${ly + 8}" font-size="4.6" letter-spacing="1.6" text-anchor="middle" fill="${ink}" opacity=".75">${sub2}</text>` : "";
    const bottomTxt = !p.chrono && !p.open && shape !== "square" ? `<text x="150" y="${shape === "round" ? 248 : 244}" font-size="4.6" letter-spacing="1.4" text-anchor="middle" fill="${ink}" opacity=".7">${["Submariner", "Seamaster"].includes(p.col) ? "200m · SAPPHIRE" : "SAPPHIRE · 904L"}</text>` : "";

    // ---- Agujas (10:10) ----
    const handMetal = idxMetal;
    const hand = (deg, L, w, tail, lumeOn, merc) => {
      const pts = `${150 - w},${200 + tail} ${150 - w * .8},${200 - L * .78} 150,${200 - L} ${150 + w * .8},${200 - L * .78} ${150 + w},${200 + tail}`;
      const lu = lumeOn ? `<polygon points="${150 - w * .45},${200 - L * .2} ${150 - w * .4},${200 - L * .78} 150,${200 - L * .9} ${150 + w * .4},${200 - L * .78} ${150 + w * .45},${200 - L * .2}" />` : "";
      if (lu) lume.push(`<g transform="rotate(${deg} 150 200)">${lu}</g>`);
      return `<g transform="rotate(${deg} 150 200)" filter="url(#${id}hs)"><polygon points="${pts}" fill="${handMetal}" stroke="${m.lo}" stroke-width=".6"/>${lu.replace("/>", ` fill="#f2f0e6"/>`)}${merc ? `<circle cx="150" cy="${200 - L * .62}" r="${w + 3}" fill="none" stroke="${handMetal}" stroke-width="2.2"/>` : ""}</g>`;
    };
    const santos = shape === "square";
    const sc = santos ? "#2a4aa8" : p.chrono ? "#c33" : p.col === "Submariner" || p.col === "Explorer" ? handMetal : "#c63a2e";
    const L = shape === "round" ? 1 : shape === "square" ? .9 : .85;
    const merc = ["Submariner", "GMT", "Explorer", "Yacht-Master", "Sky-Dweller"].includes(p.col);
    let hands = "";
    if (p.col === "GMT") hands += `<g transform="rotate(118 150 200)"><line x1="150" y1="210" x2="150" y2="${200 - 62}" stroke="${/PEPSI|COKE/.test(T) ? "#c41f2c" : /SPRITE/.test(T) ? "#1e8a3c" : /JOKER/.test(T) ? "#6a2e9c" : /BATMAN|BATGIRL/.test(T) ? "#1c3d99" : "#c9a64c"}" stroke-width="2"/><polygon points="150,${200 - 68} 143,${200 - 58} 157,${200 - 58}" fill="${/PEPSI|COKE/.test(T) ? "#c41f2c" : /SPRITE/.test(T) ? "#1e8a3c" : /JOKER/.test(T) ? "#6a2e9c" : /BATMAN|BATGIRL/.test(T) ? "#1c3d99" : "#c9a64c"}"/></g>`;
    hands += santos
      ? `<g transform="rotate(305 150 200)"><polygon points="146,203 148,165 150,158 152,165 154,203" fill="#2a4aa8"/></g><g transform="rotate(60 150 200)"><polygon points="147,204 148.6,150 150,140 151.4,150 153,204" fill="#2a4aa8"/></g>`
      : hand(305, 40 * L, 4.6, 10, true, merc) + hand(60, 60 * L, 3.6, 12, true, false);
    hands += `<g transform="rotate(200 150 200)"><line x1="150" y1="220" x2="150" y2="${200 - 64 * L}" stroke="${sc}" stroke-width="1.1"/><circle cx="150" cy="214" r="3" fill="${sc}"/>${merc ? `<circle cx="150" cy="${200 - 48 * L}" r="3.2" fill="#f2f0e6" stroke="${sc}"/>` : ""}</g><circle cx="150" cy="200" r="4" fill="${handMetal}" stroke="${m.lo}" stroke-width=".6"/><circle cx="150" cy="200" r="1.4" fill="${m.lo}"/>`;

    // ---- Vista nocturna ----
    const night = o.night ? `<rect x="0" y="0" width="300" height="400" fill="#05070a" opacity=".78"/><g fill="#a8ffb5" filter="url(#${id}glow)">${lume.join("")}</g>` : "";

    const dialClip = shape === "round" ? `<circle cx="150" cy="200" r="68"/>` : shape === "oct" ? `<rect x="92" y="142" width="116" height="116" rx="14"/>` : shape === "square" ? `<rect x="88" y="136" width="124" height="128" rx="10"/>` : `<rect x="84" y="146" width="132" height="108" rx="${(shape === "naut" ? 46 : 62) - 14}"/>`;

    return `<svg viewBox="0 0 300 400" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(p.name)}">
<defs>
  <clipPath id="${id}sc"><path d="${clip}"/></clipPath>
  <clipPath id="${id}dc">${dialClip}</clipPath>
  <linearGradient id="${id}b" x1="0" x2="1"><stop offset="0" stop-color="${m.lo}"/><stop offset=".22" stop-color="${m.mid}"/><stop offset=".5" stop-color="${m.hi}"/><stop offset=".78" stop-color="${m.mid}"/><stop offset="1" stop-color="${m.lo}"/></linearGradient>${p.strapMetal ? `<linearGradient id="${id}sb" x1="0" x2="1"><stop offset="0" stop-color="${p.strapMetal.lo}"/><stop offset=".22" stop-color="${p.strapMetal.mid}"/><stop offset=".5" stop-color="${p.strapMetal.hi}"/><stop offset=".78" stop-color="${p.strapMetal.mid}"/><stop offset="1" stop-color="${p.strapMetal.lo}"/></linearGradient>` : ""}
  <linearGradient id="${id}p" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${m.pol}"/><stop offset=".35" stop-color="${m.mid}"/><stop offset=".55" stop-color="${m.hi}"/><stop offset="1" stop-color="${m.lo}"/></linearGradient>
  <linearGradient id="${id}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${gold.pol}"/><stop offset=".4" stop-color="${gold.mid}"/><stop offset=".6" stop-color="${gold.hi}"/><stop offset="1" stop-color="${gold.lo}"/></linearGradient>
  <linearGradient id="${id}cr" x1="0" x2="1"><stop offset="0" stop-color="${two ? gold.lo : m.lo}"/><stop offset=".5" stop-color="${two ? gold.hi : m.hi}"/><stop offset="1" stop-color="${two ? gold.lo : m.lo}"/></linearGradient>
  <linearGradient id="${id}sh" x1="0" x2="1"><stop offset="0" stop-color="#000" stop-opacity=".45"/><stop offset=".5" stop-color="#fff" stop-opacity=".12"/><stop offset="1" stop-color="#000" stop-opacity=".45"/></linearGradient>
  <radialGradient id="${id}d" cx=".38" cy=".3" r=".9"><stop offset="0" stop-color="${shade(dial, light ? 0.25 : 0.32)}"/><stop offset=".55" stop-color="${dial}"/><stop offset="1" stop-color="${shade(dial, -0.55)}"/></radialGradient>
  <radialGradient id="${id}cer" cx=".35" cy=".25" r=".9"><stop offset="0" stop-color="#fff" stop-opacity=".28"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".35"/></radialGradient>
  <radialGradient id="${id}hl" cx=".35" cy=".25" r=".9"><stop offset="0" stop-color="#fff" stop-opacity=".45"/><stop offset=".6" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".25"/></radialGradient>
  <radialGradient id="${id}gem" cx=".35" cy=".3"><stop offset="0" stop-color="#fff"/><stop offset=".6" stop-color="#dfe8f0"/><stop offset="1" stop-color="#9aa7b3"/></radialGradient>
  <radialGradient id="${id}cyc" cx=".4" cy=".35"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".7" stop-color="#fff" stop-opacity=".12"/><stop offset="1" stop-color="#fff" stop-opacity=".35"/></radialGradient>
  <radialGradient id="${id}sun"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity=".0"/></radialGradient>
  <pattern id="${id}tap" width="7" height="7" patternUnits="userSpaceOnUse"><rect width="7" height="7" fill="none" stroke="#000" stroke-opacity=".3"/><rect x="1.5" y="1.5" width="4" height="4" fill="#fff" opacity=".07"/></pattern>
  <pattern id="${id}gr" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="8" height="8" fill="none" stroke="#000" stroke-opacity=".28" stroke-width="1.4"/></pattern>
  <pattern id="${id}str" width="10" height="6" patternUnits="userSpaceOnUse"><rect width="10" height="3" fill="#000" opacity=".22"/><rect y="3" width="10" height="1" fill="#fff" opacity=".07"/></pattern>
  <pattern id="${id}mesh" width="4" height="4" patternUnits="userSpaceOnUse"><path d="M0 0L4 4M4 0L0 4" stroke="#000" stroke-opacity=".35" stroke-width=".7"/></pattern>
  <pattern id="${id}met" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M0 10 L40 18 M0 28 L40 22 M10 0 L16 40 M30 0 L24 40" stroke="#fff" stroke-opacity=".18" stroke-width="2"/><path d="M0 0 L40 40" stroke="#000" stroke-opacity=".25"/></pattern>
  <path id="${id}arc" d="M76 200 A74 74 0 0 1 224 200"/>
  <filter id="${id}ds" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="6" stdDeviation="6" flood-opacity=".35"/></filter>
  <filter id="${id}hs"><feDropShadow dx="1.5" dy="2.5" stdDeviation="1.2" flood-opacity=".45"/></filter>
  <filter id="${id}glow"><feGaussianBlur stdDeviation="2.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
</defs>
<g filter="url(#${id}ds)">${strap}${caseEl}${bezel}</g>${rehaut}${dialEl}
<g clip-path="url(#${id}dc)">${texture}${Array.from({ length: 36 }, (_, i) => `<line x1="150" y1="200" x2="${P(110, i * 10)[0]}" y2="${P(110, i * 10)[1]}" stroke="#fff" stroke-opacity="${light ? .05 : .035}" stroke-width="3"/>`).join("")}</g>
${idx}${extra}${brand}${bottomTxt}${hands}
<path d="M${shape === "round" ? "90 160 A70 70 0 0 1 190 140 L180 152 A60 60 0 0 0 100 168Z" : "96 150 L190 150 L180 160 L104 166Z"}" fill="#fff" opacity=".1"/>
${night}
</svg>`;
  }

  function boxSVG(p) {
    const T = p.T, id = "w" + (uid++);
    const brown = !/BLACK/.test(T) && /TRAVEL/.test(T);
    const n = +((T.match(/(\d) PIECE/) || [])[1] || 0);
    const body = brown ? "#6b4428" : "#1d1d20", inner = brown ? "#cfa77c" : "#3a3a3f";
    const defs = `<defs><linearGradient id="${id}l" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${shade(body, .25)}"/><stop offset="1" stop-color="${shade(body, -.4)}"/></linearGradient><filter id="${id}ds"><feDropShadow dy="10" stdDeviation="8" flood-opacity=".3"/></filter><pattern id="${id}t" width="5" height="5" patternUnits="userSpaceOnUse"><circle cx="2.5" cy="2.5" r=".7" fill="#fff" opacity=".08"/></pattern></defs>`;
    if (!n) {
      const sec = /SECURITY/.test(T);
      return `<svg viewBox="0 0 300 400" role="img" aria-label="${esc(p.name)}">${defs}<g filter="url(#${id}ds)"><path d="M40 150 L260 150 L250 110 L50 110Z" fill="${shade(body, .1)}"/><rect x="40" y="150" width="220" height="150" rx="14" fill="url(#${id}l)"/><rect x="40" y="150" width="220" height="150" rx="14" fill="url(#${id}t)"/><rect x="58" y="164" width="184" height="118" rx="10" fill="${inner}"/>${sec ? `<path d="M70 180 H230 M70 230 H230 M150 170 V275" stroke="#222" stroke-width="3"/><circle cx="150" cy="300" r="10" fill="#c9a96e"/>` : `<ellipse cx="150" cy="222" rx="46" ry="32" fill="#555"/><ellipse cx="150" cy="216" rx="40" ry="24" fill="#6a6a6f"/>`}<rect x="128" y="146" width="44" height="10" rx="3" fill="#c9a96e"/></g><text x="150" y="340" font-size="11" letter-spacing="4" text-anchor="middle" fill="#9a8f80" font-family="Georgia">GEARSMITH</text></svg>`;
    }
    const w = 70 + n * 52, x0 = 150 - w / 2;
    return `<svg viewBox="0 0 300 400" role="img" aria-label="${esc(p.name)}">${defs}<g filter="url(#${id}ds)"><rect x="${x0}" y="140" width="${w}" height="130" rx="58" fill="url(#${id}l)"/><rect x="${x0}" y="140" width="${w}" height="130" rx="58" fill="url(#${id}t)"/><rect x="${x0 + 12}" y="153" width="${w - 24}" height="104" rx="48" fill="${inner}"/>${Array.from({ length: n }, (_, i) => `<ellipse cx="${x0 + 61 + i * 52}" cy="205" rx="21" ry="34" fill="${brown ? "#8a5a36" : "#26262a"}"/><ellipse cx="${x0 + 58 + i * 52}" cy="196" rx="12" ry="18" fill="#fff" opacity=".07"/>`).join("")}<path d="M${x0 + 20} 205 H${x0 + w - 20}" stroke="#c9a96e" stroke-opacity=".4" stroke-dasharray="4 4"/></g></svg>`;
  }

  const art = (p, o) => PHOTOS[p.id] ? `<img src="${esc(PHOTOS[p.id])}" alt="${esc(p.name)}" loading="lazy">` : watchSVG(p, o);

  // ================= Estado =================
  let cart = load("tm_cart", []);
  let wish = load("tm_wish", []);
  let coupon = load("tm_coupon", null);
  let user = load("tm_user", null);
  // Valoraciones reales copiadas tal cual del perfil de Wallapop (Daniel C.)
  const WALLAPOP = "https://es.wallapop.com/user/danielc-481839043/reviews";
  const reviews = [
    { n: "Juan Carlos J.", s: 5, h: "Pack de 2", t: "El reloj Mod espectacular. Super atento.. comunicación constante sobre el producto, envio ... 100% recomendable", d: "22/10/2026" },
    { n: "Alvaro G.", s: 5, h: "Reloj Seiko mod Aquanaut", t: "Excelente vendedor, rapido y un gran producto volveria a comprar sin dudas", d: "19/10/2026" },
    { n: "marti manel g.", s: 5, h: "Reloj Seiko mod Daytona VK63", t: "Excelente trato con una alta calidad del producto.", d: "16/10/2026" },
    { n: "Thomas C.", s: 5, h: "Reloj Seiko mod Submariner Automatico", t: "Excelente vendedor y producto conforme a la fotografía 👌", d: "02/10/2026" },
    { n: "Daniel J.", s: 5, h: "Reloj Seiko mod Aquanaut", t: "Vendedor muy bueno", d: "29/09/2026" },
    { n: "Vicente", s: 5, h: "Reloj Casio Edifice Sapphire", t: "Genial! Todo perfecto.", d: "24/09/2026" },
    { n: "Alberto P.", s: 5, h: "Reloj Seiko 5 Sport Automático Vintage", t: "Todo genial. Muy buen trato y rápido en el envío. El producto tal y como se describe. Recomendado", d: "19/09/2026" },
  ];
  const CODES = { GEARSMITH10: 10, HALLOWEEN15: 15 };
  const FREE_SHIP = 0; // envío siempre gratis
  const DEF = { q: "", col: "Todos", mov: "Todos", color: "Todos", max: 300, stock: false, sort: "featured", shown: 24 };
  const filter = { ...DEF };

  // ================= Tarjetas =================
  function card(p) {
    const fav = wish.includes(p.id);
    const pct = p.ref ? Math.round((1 - p.min / p.ref) * 100) : 0;
    return `<article class="card">
      <div class="tags">${!p.avail ? '<span class="tag out">Agotado</span>' : pct ? `<span class="tag">-${pct}%</span>` : ""}</div>
      <button class="icon-btn fav ${fav ? "on" : ""}" data-wish="${p.id}" aria-label="${fav ? "Quitar de" : "Añadir a"} favoritos" aria-pressed="${fav}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg></button>
      <button class="card-art" data-open="${p.id}" aria-label="Ver ${esc(p.name)}"><div class="v v1">${art(p)}</div><div class="v v2">${art(p)}</div></button>
      <button class="btn btn-sm quick" data-quick="${p.id}" ${p.avail ? "" : "disabled"}>${p.avail ? "+ Añadir rápido" : "Agotado"}</button>
      <div>
        <p class="col">${p.col}${p.acc ? "" : " · " + p.movement}</p>
        <h3 data-open="${p.id}">${esc(p.name.split(" · ")[1] || p.name)}</h3>
      </div>
      <div class="price"><b>${money(p.min)}</b>${p.ref ? `<s>${money(p.ref)}</s>` : ""}</div>
      ${p.acc ? "" : `<div class="swatches" aria-hidden="true"><i style="background:${p.dial}"></i><i style="background:${p.metal.mid}"></i></div>`}
    </article>`;
  }

  // ================= Secciones =================
  function renderPopular() { $("#popularShelf").innerHTML = POPULAR.map((h) => byId[h]).filter(Boolean).map(card).join(""); }

  function renderShelves() {
    const list = [...COLLECTIONS.map((c) => c[0]), ...PART_COLS];
    $("#shelves").innerHTML = list.map((c, i) => {
      const items = PRODUCTS.filter((p) => p.col === c);
      return `<section class="section" ${i % 2 ? 'style="background:var(--white);border-block:1px solid var(--line)"' : ""}>
        <div class="section-head"><div><p class="eyebrow">${PART_COLS.includes(c) ? "Sección personalizable" : "Elige tu modelo"}</p><h2>${PART_COLS.includes(c) ? `Personaliza: <em>${c}</em>` : c === "Omega x Swatch" ? `Omega x Swatch <em>Mod</em>` : `Seiko Mod <em>${c}</em>`}</h2><p class="sub">${INTRO[c] || ""}</p></div>
        <div class="arrows"><button class="link-more" data-col="${c}">Ver todo (${PRODUCTS.filter((p) => p.col === c).length})</button><button class="arrow" data-scroll="sh${i}" data-d="-1" aria-label="Anterior">←</button><button class="arrow" data-scroll="sh${i}" data-d="1" aria-label="Siguiente">→</button></div></div>
        <div class="shelf" id="sh${i}">${items.map(card).join("")}</div></section>`;
    }).join("");
  }

  function renderMega() {
    const cols = [...COLLECTIONS.map((c) => c[0]), ...PART_COLS].filter((c) => PRODUCTS.some((p) => p.col === c));
    $("#mega").innerHTML = cols.map((c) => { const p = PRODUCTS.find((x) => x.col === c && POPULAR.includes(x.id)) || PRODUCTS.find((x) => x.col === c); return `<button data-col="${c}"><span class="mega-ph">${art(p)}</span>${c}<small>${PRODUCTS.filter((x) => x.col === c).length} ${PART_COLS.includes(c) ? "piezas" : "modelos"}</small></button>`; }).join("");
  }

  function filtered() {
    const q = filter.q.trim().toUpperCase();
    const list = PRODUCTS.filter((p) =>
      (filter.col === "Todos" || p.col === filter.col) && (filter.mov === "Todos" || p.movement === filter.mov) &&
      (filter.color === "Todos" || (!p.acc && p.group === filter.color)) && p.min <= filter.max && (!filter.stock || p.avail) &&
      (!q || q.split(/\s+/).every((w) => (p.T + " " + p.col.toUpperCase()).includes(w))));
    const s = { az: (a, b) => a.name.localeCompare(b.name), za: (a, b) => b.name.localeCompare(a.name), low: (a, b) => a.min - b.min || a.order - b.order, high: (a, b) => b.min - a.min || a.order - b.order, featured: (a, b) => a.order - b.order };
    return list.sort(s[filter.sort]);
  }

  function renderShop() {
    const list = filtered();
    $("#shopGrid").innerHTML = list.slice(0, filter.shown).map(card).join("") || '<p class="empty">No hay relojes con esos filtros.</p>';
    $("#resultCount").textContent = `${list.length} productos`;
    $("#loadMore").hidden = list.length <= filter.shown;
    $("#maxPriceLabel").textContent = money(filter.max);
    [["#collectionChips", "col"], ["#movementChips", "mov"], ["#colorChips", "color"]].forEach(([s, k]) => $$(s + " .chip").forEach((c) => c.classList.toggle("on", c.dataset.v === filter[k])));
  }

  function buildFilters() {
    const cols = ["Todos", ...COLLECTIONS.map((c) => c[0]), ...PART_COLS].filter((c) => c === "Todos" || PRODUCTS.some((p) => p.col === c));
    $("#collectionChips").innerHTML = cols.map((c) => `<button class="chip" data-f="col" data-v="${c}">${c}</button>`).join("");
    $("#movementChips").innerHTML = ["Todos", ...new Set(PRODUCTS.filter((p) => !p.acc).map((p) => p.movement))].map((c) => `<button class="chip" data-f="mov" data-v="${c}">${c}</button>`).join("");
    $("#colorChips").innerHTML = ["Todos", ...Object.keys(COLOR_GROUPS)].map((c) => `<button class="chip" data-f="color" data-v="${c}">${c !== "Todos" ? `<i style="display:inline-block;width:10px;height:10px;border-radius:9px;margin-right:5px;vertical-align:-1px;background:${COLOR_GROUPS[c][0]};border:1px solid #0002"></i>` : ""}${c}</button>`).join("");
  }

  function goCollection(c) {
    Object.assign(filter, DEF, { col: c }); syncFilterInputs(); renderShop();
    $("#nav").classList.remove("open"); closeMega();
    $("#tienda").scrollIntoView({ behavior: "smooth" });
  }
  function syncFilterInputs() { $("#shopSearch").value = filter.q; $("#maxPrice").value = filter.max; $("#inStock").checked = filter.stock; $("#sort").value = filter.sort; }

  // ================= Página de producto =================
  let current = null, sel = [], qty = 1, view = 0;
  const variantOf = (p, s) => vget(p, s.join(" / ")) || p.v[0];
  const hasOpts = (p) => p.o.length && p.o[0].n !== "Title";
  const optVal = (name) => { const i = current.o.findIndex((o) => o.n === name); return i >= 0 ? sel[i] : null; };

  function describe(p) {
    if (p.d) return p.d + (p.acc ? "" : " Montado a mano por Gearsmith Watches Mods y revisado antes de salir. Diseño independiente: no está relacionado con ninguna marca de relojes.");
    const base = { GMT: "Un GMT con bisel bicolor de 24 horas para seguir dos zonas horarias.", Nautilus: "Caja con orejas laterales y esfera de líneas horizontales, inspirada en el estilo deportivo de lujo.", "Royal Oak": "Bisel octogonal con tornillos y esfera con textura de cuadrícula.", Daytona: "Cronógrafo con tres subesferas y bisel taquimétrico.", Santos: "Caja cuadrada con tornillos vistos, números romanos y agujas azules.", Datejust: "Bisel estriado, lupa sobre la fecha y brazalete de cinco eslabones.", Submariner: "Reloj de buceo con bisel giratorio y índices luminosos grandes.", Aquanaut: "Caja redondeada, esfera de cuadrícula y correa de caucho cómoda.", Oyster: "Esfera limpia de color con un diseño sencillo y elegante.", "Yacht-Master": "Estilo náutico con bisel de números en relieve.", "Sky-Dweller": "Bisel estriado y un aire elegante para cualquier día.", Seamaster: "Estilo marinero con esfera de olas y bisel de buceo.", "Day-Date": "Fecha y día de la semana con brazalete President.", Explorer: "Esfera 3-6-9 muy legible, hecha para la aventura.", Speedmaster: "Cronógrafo deportivo con bisel taquimétrico negro.", "Air Queen": "Diseño de aviador limpio y fácil de leer." }[p.col] || "Una pieza especial montada a mano.";
    return `${base} Movimiento japonés ${p.movement} ${p.chrono ? "meca-quartz" : "automático"}, cristal de zafiro y acero 904L. Cada reloj se monta a mano y se revisa antes de salir. Diseño independiente: no está relacionado con ninguna marca de relojes.`;
  }

  function openProduct(id) {
    const p = byId[id]; if (!p) return;
    current = p; qty = 1; view = 0;
    const first = p.v.find((v) => v.a) || p.v[0];
    sel = defaultSel(p);
    $("#pdpEyebrow").textContent = `${p.col}${p.acc ? "" : " · " + p.movement}`;
    $("#pdpTitle").textContent = p.name;
    $("#pdpCrumb").textContent = p.name;
    $("#pdpCol").textContent = p.col; $("#pdpCol").dataset.col = p.col;
    $("#pdpReviews").textContent = p.acc ? "Pieza personalizable" : p.col === "Omega x Swatch" ? "Omega x Swatch Mod · Gearsmith" : "Seiko Mod · Gearsmith";
    $("#pdpDesc").textContent = describe(p);
    $("#pdpWa").href = WA + "?text=" + encodeURIComponent(`Hola Gearsmith, me interesa el ${p.name}. ¿Me dais más información?`);
    $("#pdpWa").onclick = () => { const opts = sel.length ? ` (${sel.join(" / ")})` : ""; $("#pdpWa").href = WA + "?text=" + encodeURIComponent(`Hola Gearsmith, me interesa el ${current.name}${opts}. ¿Me dais más información?`); };
    $("#pdpSpecs").innerHTML = (p.sp ? p.sp : p.acc ? [["Tipo", "Accesorio"], ["Uso", "Casa y viaje"], ["Material", "Piel sintética"], ["Interior", "Acolchado"]]
      : [["Movimiento", `${p.movement} ${p.chrono ? "meca-quartz" : "automático"}`], ["Caja", p.size.length ? p.size.join(" / ") : "40 mm"], ["Material", `Acero 904L · ${p.metal.name}`], ["Cristal", "Zafiro"], ["Agua", "3 ATM (5 ATM opcional)"], ["Reserva", p.chrono ? "Pila ~3 años" : "41 horas"]])
      .map(([a, b]) => `<li><span>${a}</span>${b}</li>`).join("");
    const d = (n) => { const x = new Date(); x.setDate(x.getDate() + n); return x.toLocaleDateString("es-ES", { day: "numeric", month: "short" }); };
    $("#pdpTimeline").innerHTML = `<div><b>Hoy</b><span>Pides</span></div><div><b>${d(6)}</b><span>Montado y revisado</span></div><div><b>${d(18)}</b><span>En tu casa</span></div>`;
    $("#related").innerHTML = PRODUCTS.filter((x) => x.col === p.col && x.id !== p.id).concat(PRODUCTS.filter((x) => x.col !== p.col && !x.acc && x.min === p.min).slice(0, 6)).slice(0, 8).map(card).join("");
    renderProduct();
    history.replaceState(null, "", "#p=" + id);
    show("#pdp"); $("#pdp").scrollTop = 0;
  }

  function renderGallery() {
    const p = current;
    const logo = optVal("LOGO") !== "NO LOGO";
    const views = (p.acc || PHOTOS[p.id]) ? [["Foto", {}]] : [["Frontal", { logo }], ["Tres cuartos", { logo }], ["De noche", { logo, night: true }], ["Detalle", { logo }]];
    $("#thumbs").innerHTML = views.map(([n, o], i) => `<button class="${i === view ? "on" : ""}" data-view="${i}" aria-label="Vista ${n}" style="${i === 2 ? "background:#111" : ""}"><div style="${i === 1 ? "transform:perspective(400px) rotateY(-28deg)" : i === 3 ? "transform:scale(1.9) translateY(4%)" : ""}">${art(p, o)}</div></button>`).join("");
    const [, o] = views[view] || views[0];
    const st = $("#stage"); st.classList.toggle("dark", view === 2); st.classList.remove("zoom");
    $("#view").style.transform = view === 1 ? "perspective(900px) rotateY(-26deg)" : view === 3 ? "scale(1.8)" : "";
    $("#view").innerHTML = art(p, o);
  }

  function renderProduct() {
    const p = current;
    $("#pdpOptions").innerHTML = hasOpts(p) ? p.o.map((o, i) => {
      const label = { MOVIMIENTO: "Movimiento", SIZE: "Tamaño", LOGO: "Logotipo en esfera", "WATER RESISTANCE": "Resistencia al agua", MOVEMENT: "Movimiento", COLOR: "Color", STRAP: "Correa" }[o.n] || o.n;
      const shown = sel[i] === "NO LOGO" ? "Sin logo" : sel[i] === "LOGO" ? "Con logo" : sel[i];
      return `<div class="opt-group"><span>${esc(label)} <em>${esc(shown)}</em></span><div class="chips">${o.v.map((val) => {
        const test = [...sel]; test[i] = val;
        const ok = !!(vget(p, test.join(" / ")) || {}).a;
        return `<button class="chip ${sel[i] === val ? "on" : ""}" data-opt="${i}" data-val="${esc(val)}" ${ok ? "" : "disabled"}>${esc(val === "NO LOGO" ? "Sin logo" : val === "LOGO" ? "Con logo" : val)}${o.n === "WATER RESISTANCE" && val === "5 ATM" ? " · +15 $" : ""}</button>`;
      }).join("")}</div></div>`;
    }).join("") : "";
    const v = variantOf(p, sel);
    $("#pdpPrice").innerHTML = `<b>${money(v.p * qty)}</b>${p.ref ? `<s>${money((v.p + 40) * qty)}</s><span class="save">Ahorras ${money(40 * qty)}</span>` : ""}`;
    $("#pdpQty").textContent = qty;
    const ok = v.a;
    $("#pdpAdd").disabled = !ok; $("#pdpBuy").disabled = !ok;
    $("#pdpAdd").textContent = ok ? "Añadir al carrito" : "Agotado";
    const st = $("#pdpStock"); st.className = "stock" + (ok ? "" : " no"); st.textContent = ok ? "En stock · listo para montar" : "Agotado en esta versión";
    const fav = wish.includes(p.id); const h = $("#pdpWish");
    h.classList.toggle("on", fav); h.setAttribute("aria-pressed", fav);
    renderGallery();
  }

  // ================= Carrito =================
  function addToCart(id, k, n = 1, silent, note = "") {
    const p = byId[id];
    const v = vget(p, k || (defaultSel(p).join(" / ") || "Default Title"));
    if (!v || !v.a) return toast("Ese modelo está agotado");
    const line = cart.find((l) => l.id === id && l.k === v.k && (l.note || "") === note);
    if (line) line.qty = Math.min(10, line.qty + n); else cart.push(note ? { id, k: v.k, qty: n, note } : { id, k: v.k, qty: n });
    save("tm_cart", cart); renderCart();
    if (!silent) { toast("Añadido al carrito ✓"); bump("#cartBtn"); }
  }
  const bump = (s) => $(s).animate([{ transform: "scale(1)" }, { transform: "scale(1.25)" }, { transform: "scale(1)" }], { duration: 350 });

  function totals() {
    const sub = cart.reduce((s, l) => s + ((byId[l.id] && vget(byId[l.id], l.k) || {}).p || 0) * l.qty, 0);
    const disc = coupon ? sub * coupon.pct / 100 : 0;
    return { sub, disc, total: sub - disc + FREE_SHIP };
  }
  const totalsHTML = () => { const t = totals(); return `<div><span>Subtotal</span><span>${money(t.sub)}</span></div>${coupon ? `<div><span>Cupón ${coupon.code} (−${coupon.pct}%) <button class="link" data-uncoupon>quitar</button></span><span>−${money(t.disc)}</span></div>` : ""}<div><span>Envío y aduanas</span><span>Gratis</span></div><div class="big"><span>Total</span><span>${money(t.total)}</span></div>`; };

  function renderCart() {
    cart = cart.filter((l) => byId[l.id]);
    const n = cart.reduce((s, l) => s + l.qty, 0);
    $("#cartCount").textContent = n;
    const watches = cart.filter((l) => !byId[l.id].acc).reduce((s, l) => s + l.qty, 0);
    $("#shipBar").innerHTML = `¿Dudas con tu pedido? <a href="${WA}" target="_blank" rel="noopener">WhatsApp +34 623 125 970</a>`;
    const upsell = cart.length && !cart.some((l) => byId[l.id].acc) ? (() => { const a = null; return a ? `<div class="upsell"><p>Combina con</p><div class="line"><div class="thumb">${art(a)}</div><div><h4>${esc(a.name)}</h4><small>${money(a.min)}</small></div><button class="btn btn-sm" data-quick="${a.id}">Añadir</button></div></div>` : ""; })() : "";
    $("#cartItems").innerHTML = cart.length ? cart.map((l, i) => {
      const p = byId[l.id], v = vget(p, l.k) || p.v[0];
      return `<div class="line"><div class="thumb" data-open="${p.id}">${art(p)}</div><div><h4>${esc(p.name)}</h4>${v.k !== "Default Title" ? `<small>${esc(v.k)}</small>` : ""}${l.note ? `<small>${esc(l.note)}</small>` : ""}
        <div class="qty"><button data-cq="${i}" data-d="-1" aria-label="Menos">−</button><span>${l.qty}</span><button data-cq="${i}" data-d="1" aria-label="Más">+</button></div></div>
        <div style="text-align:right"><div class="lp">${money(v.p * l.qty)}</div><button class="link" data-rm="${i}">Quitar</button></div></div>`;
    }).join("") + upsell : `<div class="empty"><p>Tu carrito está vacío.</p><button class="btn" data-close data-goto="#populares">Ver modelos</button></div>`;
    $("#cartTotals").innerHTML = totalsHTML();
    $("#checkoutBtn").disabled = !cart.length;
  }

  function renderWish() {
    wish = wish.filter((id) => byId[id]);
    $("#wishCount").textContent = wish.length;
    $("#wishItems").innerHTML = wish.length ? wish.map((id) => { const p = byId[id]; return `<div class="line"><div class="thumb" data-open="${id}">${art(p)}</div><div><h4>${esc(p.name)}</h4><small>${money(p.min)}</small><button class="btn btn-sm" style="margin-top:8px" data-quick="${id}" ${p.avail ? "" : "disabled"}>Añadir al carrito</button></div><button class="link" data-wish="${id}">Quitar</button></div>`; }).join("") : '<p class="empty">Toca el corazón de un reloj para guardarlo aquí.</p>';
  }

  function toggleWish(id) {
    wish = wish.includes(id) ? wish.filter((x) => x !== id) : [...wish, id];
    save("tm_wish", wish); renderWish();
    $$(`[data-wish="${id}"].fav`).forEach((b) => { const on = wish.includes(id); b.classList.toggle("on", on); b.setAttribute("aria-pressed", on); });
    if (current?.id === id && !$("#pdp").hidden) { const on = wish.includes(id); $("#pdpWish").classList.toggle("on", on); }
    toast(wish.includes(id) ? "Guardado en favoritos ♥" : "Quitado de favoritos"); bump("#wishBtn");
  }

  // ================= Ventanas =================
  let lastFocus = null;
  function show(s) {
    $$(".modal:not([hidden]),.drawer:not([hidden])").forEach((m) => { if ("#" + m.id !== s) m.hidden = true; });
    if (s !== "#pdp") $("#overlay").hidden = false;
    lastFocus = lastFocus || document.activeElement;
    $(s).hidden = false; document.body.style.overflow = "hidden";
    setTimeout(() => $(s).querySelector("button,input")?.focus({ preventScroll: true }), 40);
  }
  function hideTop() {
    const open = $$(".modal:not([hidden]),.drawer:not([hidden])");
    if (open.length) { open.forEach((m) => (m.hidden = true)); $("#overlay").hidden = true; if ($("#pdp").hidden) document.body.style.overflow = ""; return; }
    if (!$("#pdp").hidden) { $("#pdp").hidden = true; document.body.style.overflow = ""; history.replaceState(null, "", location.pathname); }
    lastFocus?.focus?.({ preventScroll: true }); lastFocus = null;
  }
  function hideAll() { $$(".modal,.drawer").forEach((m) => (m.hidden = true)); $("#overlay").hidden = true; $("#pdp").hidden = true; document.body.style.overflow = ""; if (location.hash.startsWith("#p=")) history.replaceState(null, "", location.pathname); }
  const closeMega = () => { $("#mega").hidden = true; $("#megaBtn").setAttribute("aria-expanded", "false"); };

  // ================= Pedido por WhatsApp / Instagram =================
  const IG_USER = "gearsmithwatches_mods";
  function orderText(f) {
    const t = totals();
    const lines = cart.map((l) => { const p = byId[l.id]; return `• ${l.qty}× ${p.name}${l.k && l.k !== "Default Title" ? ` (${l.k})` : ""}${l.note ? ` – ${l.note}` : ""} – ${money(((vget(p, l.k) || {}).p || 0) * l.qty)}`; });
    return [
      "Hola Gearsmith, quiero hacer este pedido:",
      ...lines,
      coupon ? `Cupón: ${coupon.code}` : "",
      `Total: ${money(t.total)}`,
      "",
      `Nombre: ${f.name.value.trim()}`,
      f.phone.value.trim() ? `Teléfono: ${f.phone.value.trim()}` : "",
      `Ciudad: ${f.city.value.trim()}`,
      f.notes.value.trim() ? `Notas: ${f.notes.value.trim()}` : "",
      "¿Cómo hago el pago?",
    ].filter((x, i, arr) => x !== "" || (i > 0 && arr[i - 1] !== "")).join("\n");
  }
  function openCheckout() {
    if (!cart.length) return;
    $("#coTotals").innerHTML = totalsHTML(); $("#coError").textContent = "";
    const f = $("#checkoutForm"); if (user && !f.name.value) f.name.value = user.name;
    show("#checkoutModal");
  }
  function finishOrder(method) {
    const f = $("#checkoutForm");
    const order = { n: "GS-" + Date.now().toString(36).toUpperCase(), date: new Date().toLocaleString("es-ES"), items: cart.map((l) => ({ name: byId[l.id].name, k: l.k, note: l.note || "", qty: l.qty })), total: totals().total, cur: currency, pay: "Pedido por " + method, st: "Pendiente de confirmar" };
    const orders = load("tm_orders", []); orders.unshift(order); save("tm_orders", orders);
    cart = []; coupon = null; save("tm_cart", cart); save("tm_coupon", null); renderCart(); f.reset();
    info(`<p class="eyebrow">Pedido enviado</p><h2>¡Gracias por tu <em>pedido</em>!</h2><p style="margin:14px 0">Número: <b>${order.n}</b><br>Total: <b>${money(order.total, order.cur)}</b></p><p style="color:var(--muted)">Te contestamos por ${esc(method)} para confirmar el reloj y la forma de pago.</p><button class="btn full" style="margin-top:18px" id="myOrders">Ver mis pedidos</button>`);
  }
  function sendOrder(via) {
    const f = $("#checkoutForm");
    $("#coError").textContent = "";
    if (!f.checkValidity()) { $("#coError").textContent = "Escribe tu nombre y tu ciudad."; f.reportValidity(); return; }
    const txt = orderText(f);
    if (via === "wa") {
      window.open(WA + "?text=" + encodeURIComponent(txt), "_blank", "noopener");
      finishOrder("WhatsApp");
    } else {
      const go = () => { window.open(`https://ig.me/m/${IG_USER}`, "_blank", "noopener"); finishOrder("Instagram"); };
      if (navigator.clipboard) navigator.clipboard.writeText(txt).then(() => { toast("Pedido copiado. Pégalo en el chat de Instagram."); go(); }, go);
      else go();
    }
  }
  function info(html) { $("#infoBody").innerHTML = html; show("#infoModal"); }
  function showOrders() {
    const orders = load("tm_orders", []);
    info(`<h2>Mis <em>pedidos</em></h2>${orders.length ? orders.map((o) => `<div class="review" style="margin-top:12px"><b>${o.n}</b> <small style="color:var(--muted)">· ${esc(o.date)}</small><p style="margin:8px 0">${o.items.map((i) => `${i.qty}× ${esc(i.name)}`).join("<br>")}</p><b>${money(o.total, o.cur)}</b> <span class="verified">· ${esc(o.pay ? o.pay + " · " : "")}${esc(o.st || "En montaje")}</span></div>`).join("") : '<p class="empty">Todavía no hay pedidos.</p>'}`);
  }

  // ================= Cuenta (solo en este navegador) =================
  async function hash(s) { const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)); return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join(""); }
  function renderAccount(mode = "login") {
    const body = $("#accountBody");
    if (user) { body.innerHTML = `<p class="eyebrow">Mi cuenta</p><h2 id="acTitle">Hola, <em>${esc(user.name)}</em></h2><p style="color:var(--muted);margin:6px 0 18px">${esc(user.email)}</p><div class="account-form"><button class="btn" id="myOrders">Mis pedidos</button><button class="btn btn-light" id="openWish">Mis favoritos</button><button class="btn btn-light" id="logout">Cerrar sesión</button></div>`; return; }
    body.innerHTML = `<p class="eyebrow">Mi cuenta</p><h2 id="acTitle">${mode === "login" ? "Iniciar <em>sesión</em>" : "Crear <em>cuenta</em>"}</h2>
      <form class="account-form" id="accountForm" data-mode="${mode}">
        ${mode === "register" ? '<input name="name" placeholder="Nombre" required autocomplete="name">' : ""}
        <input name="email" type="email" placeholder="Email" required autocomplete="email">
        <input name="pass" type="password" placeholder="Contraseña (mín. 6)" minlength="6" required autocomplete="${mode === "login" ? "current-password" : "new-password"}">
        <p class="form-error" id="acError" role="alert"></p>
        <button class="btn">${mode === "login" ? "Entrar" : "Registrarme"}</button>
        <button type="button" class="link" id="switchMode">${mode === "login" ? "¿No tienes cuenta? Regístrate" : "¿Ya tienes cuenta? Entra"}</button>
      </form><small style="color:var(--muted)">Demo: la cuenta se guarda solo en este navegador.</small>`;
  }
  async function submitAccount(e) {
    e.preventDefault();
    const f = e.target, mode = f.dataset.mode, users = load("tm_users", {});
    const email = f.email.value.trim().toLowerCase(), h = await hash(email + ":" + f.pass.value);
    if (mode === "register") { if (users[email]) return ($("#acError").textContent = "Ese email ya existe."); users[email] = { name: f.name.value.trim(), h }; save("tm_users", users); }
    else if (!users[email] || users[email].h !== h) return ($("#acError").textContent = "Email o contraseña incorrectos.");
    user = { name: users[email].name, email }; save("tm_user", user); renderAccount(); toast("Sesión iniciada");
  }

  // ================= FAQ y reseñas =================
  const FAQ = [
    ["¿Qué es un reloj mod?", "Es un reloj montado a mano con piezas compatibles: movimiento, caja, esfera y brazalete. 'Mod' viene de modificación."],
    ["¿Qué movimientos usáis?", "Movimientos automáticos Seiko: NH35 y NH36 con fecha, NH38 para corazón abierto, NH70 para esqueleto y 8285 para el Day-Date."],
    ["¿Puedo ajustar el tamaño yo mismo?", "Sí. Cada reloj trae un kit para quitar eslabones en casa. También lo puede hacer cualquier relojero."],
    ["¿Los relojes vienen montados?", "Sí. Todos los relojes se entregan ya montados, revisados y listos para usar."],
    ["¿Puedo personalizar mi reloj?", "Sí. Podemos cambiar el dial, las agujas, el rotor y la corona. Llámanos al +34 623 125 970 o escríbenos por Instagram a @gearsmithwatches_mods."],
    ["¿Cómo os contacto?", "Por WhatsApp o teléfono al +34 623 125 970, o por Instagram en @gearsmithwatches_mods."],
    ["¿Cuánto tarda el envío y cuánto cuesta?", "El envío es gratis y sin aduanas. Montamos el reloj en 4–6 días y el envío tarda 7–12 días."],
    ["¿Son resistentes al agua?", "Aguantan lluvia y salpicaduras. No recomendamos bañarse con ellos."],
    ["¿Qué garantía tienen?", "12 meses de garantía en todos los relojes y 14 días para devolverlo."],
  ];
  function renderFaq() {
    const q = $("#faqSearch").value.trim().toLowerCase();
    const list = FAQ.filter(([a, b]) => !q || (a + b).toLowerCase().includes(q));
    $("#faqList").innerHTML = list.map(([a, b], i) => `<details ${i === 0 && !q ? "open" : ""}><summary>${a}</summary><p>${b}</p></details>`).join("");
    $("#faqEmpty").hidden = list.length > 0;
  }
  function renderReviews() {
    $("#reviewCount").innerHTML = `★★★★★ 5,0 · ${reviews.length} valoraciones en <a href="${WALLAPOP}" target="_blank" rel="noopener">Wallapop</a>`;
    $("#reviews").innerHTML = (reviews.length ? "" : '<p class="sub">Aún no hay reseñas. ¡Sé el primero en contar qué te parece tu reloj!</p>') + reviews.slice(0, 9).map((r) => `<article class="review"><div class="stars" aria-label="${r.s} de 5">${"★".repeat(r.s)}${"☆".repeat(5 - r.s)}</div><h4>${esc(r.h)}</h4><p>“${esc(r.t)}”</p><div class="who"><span class="avatar">${esc(r.n[0] || "?")}</span><div><b>${esc(r.n)}</b><br><span class="verified">✓ Compra en Wallapop · ${esc(r.d || "")}</span></div></div></article>`).join("");
  }

  // ================= Cuenta atrás y ruleta =================
  function countdown() {
    if (!$("#countdown")) return;
    const end = new Date("2026-10-31T23:59:59");
    const tick = () => { const d = Math.max(0, end - Date.now()); const v = [Math.floor(d / 36e5), Math.floor(d % 36e5 / 6e4), Math.floor(d % 6e4 / 1e3)]; $("#countdown").innerHTML = d ? v.map((x) => `<b>${String(x).padStart(2, "0")}</b>`).join("") : "<b>Terminada</b>"; };
    tick(); setInterval(tick, 1000);
  }
  function spin() {
    const s = $("#slots"), b = $("#spinBtn"); b.disabled = true; b.textContent = "Girando…"; s.classList.add("rolling");
    const icons = ["⌚", "💎", "⭐", "🎁", "⏱️"];
    const iv = setInterval(() => $$("span", s).forEach((x) => (x.textContent = icons[Math.random() * icons.length | 0])), 90);
    setTimeout(() => { clearInterval(iv); s.classList.remove("rolling"); $$("span", s).forEach((x) => (x.textContent = "💎")); b.hidden = true;
      $("#spinResult").innerHTML = `<b>¡Premio! 10% de descuento</b><div class="code">GEARSMITH10</div><button class="btn full" id="useCode">Usar el código</button>`; save("tm_spun", true); }, 1800);
  }

  // ================= Eventos =================
  document.addEventListener("click", (e) => {
    const t = e.target.closest("button,a,[data-open]");
    if (!t) { if (!$("#mega").hidden && !e.target.closest("#mega")) closeMega(); return; }
    const d = t.dataset;
    if (t.id !== "megaBtn" && !t.closest("#mega")) closeMega();
    if (d.open) { closeDrawers(); return openProduct(d.open); }
    if (d.quick) return addToCart(d.quick);
    if (d.wish) { e.preventDefault(); return toggleWish(d.wish); }
    if (d.view) { view = +d.view; return renderGallery(); }
    if (d.col) { e.preventDefault(); hideAll(); return goCollection(d.col); }
    if (d.close !== undefined) { hideTop(); if (d.goto) $(d.goto).scrollIntoView({ behavior: "smooth" }); return; }
    if (d.opt) { sel[+d.opt] = d.val; return renderProduct(); }
    if (d.cq) { const l = cart[+d.cq]; l.qty = Math.max(1, Math.min(10, l.qty + +d.d)); save("tm_cart", cart); return renderCart(); }
    if (d.rm) { cart.splice(+d.rm, 1); save("tm_cart", cart); return renderCart(); }
    if (d.uncoupon !== undefined) { coupon = null; save("tm_coupon", null); renderCart(); $("#coTotals").innerHTML = totalsHTML(); return; }
    if (d.f) { filter[d.f] = d.v; filter.shown = 24; return renderShop(); }
    if (d.scroll) { const el = $("#" + d.scroll); return el.scrollBy({ left: +d.d * el.clientWidth * .8, behavior: "smooth" }); }
    if (d.policy) {
      e.preventDefault();
      const Pp = { privacy: ["Privacidad", "Solo usamos tus datos para enviar tu pedido. En esta demo todo se guarda en tu navegador."], refund: ["Devoluciones", "Tienes 14 días para devolver el reloj sin usar. Te devolvemos el dinero completo."], shipping: ["Envíos", "Envío gratis con seguimiento y sin aduanas. Montaje 4–6 días y entrega en 7–12 días."] }[d.policy];
      return info(`<h2>${Pp[0]}</h2><p style="margin-top:12px;color:var(--muted)">${Pp[1]}</p>`);
    }
    switch (t.id) {
      case "megaBtn": { const m = $("#mega"); m.hidden = !m.hidden; t.setAttribute("aria-expanded", !m.hidden); return; }
      case "cartBtn": renderCart(); return show("#cartDrawer");
      case "wishBtn": case "openWish": renderWish(); return show("#wishDrawer");
      case "accountBtn": renderAccount(); return show("#accountModal");
      case "switchMode": return renderAccount($("#accountForm").dataset.mode === "login" ? "register" : "login");
      case "logout": user = null; save("tm_user", null); renderAccount(); return toast("Sesión cerrada");
      case "myOrders": case "ordersLink": e.preventDefault(); return showOrders();
      case "checkoutBtn": return openCheckout();
      case "pdpMinus": qty = Math.max(1, qty - 1); return renderProduct();
      case "pdpPlus": qty = Math.min(10, qty + 1); return renderProduct();
      case "pdpAdd": addToCart(current.id, variantOf(current, sel).k, qty); renderCart(); return show("#cartDrawer");
      case "pdpBuy": addToCart(current.id, variantOf(current, sel).k, qty, true); return openCheckout();
      case "pdpWish": return toggleWish(current.id);
      case "pdpCol": hideAll(); return goCollection(t.dataset.col);
      case "loadMore": filter.shown += 24; return renderShop();
      case "resetFilters": Object.assign(filter, DEF); syncFilterInputs(); return renderShop();
      case "spinBtn": return spin();
      case "useCode": coupon = { code: "GEARSMITH10", pct: 10 }; save("tm_coupon", coupon); renderCart(); toast("Cupón GEARSMITH10 aplicado"); return show("#cartDrawer");
      case "searchBtn": { const sb = $("#searchBar"); sb.hidden = !sb.hidden; if (!sb.hidden) $("#globalSearch").focus(); return; }
      case "menuBtn": { const n = $("#nav"); n.classList.toggle("open"); t.setAttribute("aria-expanded", n.classList.contains("open")); return; }
    }
    if (t.matches(".nav a")) $("#nav").classList.remove("open");
  });
  const closeDrawers = () => { $$(".modal,.drawer").forEach((m) => (m.hidden = true)); $("#overlay").hidden = true; };

  $("#stage").addEventListener("click", () => { if (view !== 3) $("#stage").classList.toggle("zoom"); });
  $("#stage").addEventListener("mousemove", (e) => { const s = $("#stage"); if (!s.classList.contains("zoom")) return; const r = s.getBoundingClientRect(); $("#view").style.transformOrigin = `${(e.clientX - r.left) / r.width * 100}% ${(e.clientY - r.top) / r.height * 100}%`; });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") { closeMega(); hideTop(); } });
  $("#overlay").addEventListener("click", hideTop);

  $("#shopSearch").addEventListener("input", (e) => { filter.q = e.target.value; filter.shown = 24; renderShop(); });
  $("#maxPrice").addEventListener("input", (e) => { filter.max = +e.target.value; renderShop(); });
  $("#inStock").addEventListener("change", (e) => { filter.stock = e.target.checked; renderShop(); });
  $("#sort").addEventListener("change", (e) => { filter.sort = e.target.value; renderShop(); });
  $("#faqSearch").addEventListener("input", renderFaq);
  $("#globalSearch").addEventListener("input", (e) => {
    const q = e.target.value.trim().toUpperCase();
    const hits = q.length < 2 ? [] : PRODUCTS.filter((p) => q.split(/\s+/).every((w) => (p.T + " " + p.col.toUpperCase()).includes(w))).slice(0, 12);
    $("#searchResults").innerHTML = hits.map((p) => `<button data-open="${p.id}">${art(p)}<span>${esc(p.name)}<br><b>${money(p.min)}</b></span></button>`).join("") || (q.length >= 2 ? "<span>Sin resultados</span>" : "");
  });
  $("#globalSearch").addEventListener("keydown", (e) => { if (e.key === "Enter") { filter.q = e.target.value; Object.assign(filter, { col: "Todos", shown: 24 }); syncFilterInputs(); renderShop(); $("#searchBar").hidden = true; $("#tienda").scrollIntoView({ behavior: "smooth" }); } });
  $("#currency").value = currency;
  $("#currency").addEventListener("change", (e) => { currency = e.target.value; save("gs_currency", currency); renderAll(); });

  $("#couponForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const c = $("#couponInput").value.trim().toUpperCase();
    if (!CODES[c]) return toast("Código no válido");
    coupon = { code: c, pct: CODES[c] }; save("tm_coupon", coupon); $("#couponInput").value = ""; renderCart(); toast(`Cupón ${c} aplicado`);
  });
  const co = $("#checkoutForm");
  co.addEventListener("submit", (e) => { e.preventDefault(); sendOrder("wa"); });
  $("#coIg").addEventListener("click", () => sendOrder("ig"));
  document.addEventListener("submit", (e) => { if (e.target.id === "accountForm") submitAccount(e); });


  $("#contactForm").addEventListener("submit", (e) => { e.preventDefault(); const txt = `Hola Gearsmith, soy ${$("#cName").value.trim()} (${$("#cEmail").value.trim()}). ${$("#cMsg").value.trim()}`; window.open(WA + "?text=" + encodeURIComponent(txt), "_blank", "noopener"); e.target.reset(); toast("Abriendo WhatsApp…"); });
  $("#newsForm").addEventListener("submit", (e) => { e.preventDefault(); e.target.reset(); info('<p class="eyebrow">Bienvenido</p><h2>Tu <em>10%</em> te espera</h2><p style="margin-top:10px">Usa este código en el carrito:</p><div class="code">GEARSMITH10</div><button class="btn full" id="useCode">Usar el código</button>'); });


  // ================= Configurador =================
  const CFG_MODELS = [
    { key: "datejust", name: "Datejust", col: "Datejust", T: "DATEJUST", cat: "Datejust", mv: "NH35" },
    { key: "daydate", name: "Day-Date", col: "Day-Date", T: "DAYDATE", cat: "Day-Date", mv: "8285" },
    { key: "gmt", name: "GMT Master II", col: "GMT", T: "GMT", cat: "GMT y Diver", mv: "NH35", bezel: true, only: (p) => p.id.startsWith("gmt-") },
    { key: "diver", name: "Diver", col: "Submariner", T: "SUBMARINER", cat: "GMT y Diver", mv: "NH35", only: (p) => p.id.startsWith("diver-") },
    { key: "turtle", name: "Prospex Turtle", col: "Submariner", T: "SUBMARINER", cat: "Prospex Turtle", mv: "NH35" },
    { key: "royaloak", name: "Royal Oak", col: "Royal Oak", T: "ROYAL OAK", cat: "Royal Oak", mv: "NH35" },
    { key: "skeleton", name: "Skeleton", col: "Royal Oak", T: "ROYAL OAK SKELETON", cat: "Skeleton", mv: "NH70" },
    { key: "santos", name: "Santos", col: "Santos", T: "SANTOS", cat: "Santos", mv: "NH35" },
    { key: "nautilus", name: "Nautilus", col: "Nautilus", T: "NAUTILUS", cat: "Nautilus", mv: "NH35" },
    { key: "nautilusopen", name: "Nautilus Open", col: "Nautilus", T: "NAUTILUS OPEN HEART", cat: "Nautilus Open", mv: "NH38" },
  ];
  const CFG_CASE = [["Acero plateado", ""], ["Oro", " GOLD "], ["Oro rosa", " ROSE "], ["Bicolor", " TWO-TONE "], ["Negro PVD", " ALL BLACK "]];
  const CFG_DIAL = [["Negro", "#141416"], ["Blanco", "#f4f2ed"], ["Plateado", "#cdd0d3"], ["Gris", "#727578"], ["Azul", "#1c3e7a"], ["Azul hielo", "#9fcbea"], ["Turquesa", "#5fcfc1"], ["Verde", "#1e6a3f"], ["Verde oliva", "#5d6b36"], ["Marrón", "#5c3621"], ["Champán", "#e2cfa6"], ["Rojo", "#b21f2b"], ["Rosa", "#eaa3be"]];
  const CFG_STRAP = [["Acero (como la caja)", ""], ["Acero oro", " GOLDSTRAP "], ["Acero plateado", " STEELSTRAP "], ["Acero oro rosa", " ROSESTRAP "], ["Cuero", " LEATHER "], ["Caucho", " RUBBER "]];
  const CFG_BEZEL = [["Pepsi", "PEPSI"], ["Batman", "BATMAN"], ["Coke", "COKE"], ["Sprite", "SPRITE"], ["Root Beer", "ROOT BEER"], ["Negro", ""]];
  const CFG_SIZE = ["36 mm", "39 mm", "41 mm"];
  const CFG_MOV = ["NH35", "NH36", "NH38", "NH70", "8285"];
  const cfg = { model: 0, base: null, size: 1, caseM: 0, dial: 0, strap: 0, bezel: 0, mov: null, lupa: true, logo: true, notes: "" };

  function cfgModel() { return CFG_MODELS[cfg.model]; }
  function cfgCatalog() { const m = cfgModel(); return PRODUCTS.filter((p) => p.col === m.cat && (!m.only || m.only(p))); }
  function cfgPrice() { const list = cfgCatalog(); return list.length ? Math.min(...list.map((p) => p.min)) : 259; }
  function cfgFake() {
    const m = cfgModel();
    const strapT = CFG_STRAP[cfg.strap][1];
    let T = "MOD " + m.T + CFG_CASE[cfg.caseM][1] + (m.bezel ? " " + CFG_BEZEL[cfg.bezel][1] : "") + (/LEATHER|RUBBER/.test(strapT) ? strapT : "");
    if (m.key === "datejust" || m.key === "daydate") T += " JUBILEE";
    const mov = CFG_MOV[cfg.mov ?? CFG_MOV.indexOf(m.mv)];
    const p = { id: "cfg", acc: false, T, t: T, col: m.col, name: "Configurador " + m.name, movement: mov, dial: CFG_DIAL[cfg.dial][1],
      chrono: false, open: /SKELETON|OPEN HEART/.test(T) };
    p.metal = metalOf(T);
    // brazalete de otro color que la caja
    if (/GOLDSTRAP|ROSESTRAP|STEELSTRAP/.test(strapT)) {
      const sm = strapT.includes("GOLD") ? metalOf(" GOLD ") : strapT.includes("ROSE") ? metalOf(" ROSE ") : metalOf("");
      p.strapMetal = sm;
    }
    return p;
  }
  function cfgSummary() {
    const m = cfgModel();
    const rows = [["Modelo", m.name], ["Base del catálogo", cfg.base ? byId[cfg.base].name.split(" · ")[1] : "Sin base"], ["Tamaño", CFG_SIZE[cfg.size]], ["Caja", CFG_CASE[cfg.caseM][0]],
      ["Esfera", CFG_DIAL[cfg.dial][0]], ["Correa", CFG_STRAP[cfg.strap][0]]];
    if (m.bezel) rows.push(["Bisel", CFG_BEZEL[cfg.bezel][0]]);
    rows.push(["Movimiento", CFG_MOV[cfg.mov ?? CFG_MOV.indexOf(m.mv)]]);
    if (["datejust", "daydate", "gmt"].includes(m.key)) rows.push(["Lupa Cyclops", cfg.lupa ? "Sí" : "No"]);
    rows.push(["Logo en esfera", cfg.logo ? "Sí" : "No"]);
    if (cfg.notes.trim()) rows.push(["Notas", cfg.notes.trim()]);
    return rows;
  }
  function cfgText() { return "Hola Gearsmith, quiero este reloj del configurador:\n" + cfgSummary().map(([a, b]) => `· ${a}: ${b}`).join("\n") + `\nPrecio orientativo: ${money(cfgPrice())}`; }

  function cfgChips(name, list, cur, label = (x) => x) {
    return `<div class="chips">${list.map((x, i) => `<button class="chip ${i === cur ? "on" : ""}" data-cfg="${name}" data-i="${i}">${label(x, i)}</button>`).join("")}</div>`;
  }
  function renderConfig() {
    const box = $("#cfgSteps"); if (!box) return;
    const m = cfgModel();
    const movI = cfg.mov ?? CFG_MOV.indexOf(m.mv);
    const cat = cfgCatalog();
    box.innerHTML = `
      <div class="cfg-step"><h4><b>1</b> Modelo</h4>${cfgChips("model", CFG_MODELS, cfg.model, (x) => x.name)}</div>
      <div class="cfg-step"><h4><b>2</b> Parte de un reloj del catálogo <small>(opcional)</small></h4>
        <div class="cfg-base">${cat.map((p) => `<button class="${cfg.base === p.id ? "on" : ""}" data-cfgbase="${p.id}" title="${esc(p.name)}">${art(p)}<span>${esc(p.name.split(" · ")[1] || p.name)}</span></button>`).join("")}</div></div>
      <div class="cfg-step"><h4><b>3</b> Tamaño</h4>${cfgChips("size", CFG_SIZE, cfg.size)}</div>
      <div class="cfg-step"><h4><b>4</b> Caja</h4>${cfgChips("caseM", CFG_CASE, cfg.caseM, (x) => x[0])}</div>
      <div class="cfg-step"><h4><b>5</b> Color de esfera</h4><div class="chips">${CFG_DIAL.map(([n, c], i) => `<button class="chip sw ${i === cfg.dial ? "on" : ""}" data-cfg="dial" data-i="${i}"><i style="background:${c}"></i>${n}</button>`).join("")}</div></div>
      <div class="cfg-step"><h4><b>6</b> Correa</h4>${cfgChips("strap", CFG_STRAP, cfg.strap, (x) => x[0])}</div>
      ${m.bezel ? `<div class="cfg-step"><h4><b>7</b> Bisel</h4>${cfgChips("bezel", CFG_BEZEL, cfg.bezel, (x) => x[0])}</div>` : ""}
      <div class="cfg-step"><h4><b>${m.bezel ? 8 : 7}</b> Movimiento</h4>${cfgChips("mov", CFG_MOV, movI)}</div>
      <div class="cfg-step"><h4><b>${m.bezel ? 9 : 8}</b> Detalles</h4>
        <label class="check"><input type="checkbox" id="cfgLogo" ${cfg.logo ? "checked" : ""}> Logo en la esfera</label>
        ${["datejust", "daydate", "gmt"].includes(m.key) ? `<label class="check"><input type="checkbox" id="cfgLupa" ${cfg.lupa ? "checked" : ""}> Lupa Cyclops</label>` : ""}
        <textarea id="cfgNotes" class="field" placeholder="¿Algo más? Agujas, rotor, corona, grabado…" maxlength="300">${esc(cfg.notes)}</textarea></div>`;
    $("#cfgLogo").onchange = (e) => { cfg.logo = e.target.checked; drawConfig(); };
    if ($("#cfgLupa")) $("#cfgLupa").onchange = (e) => { cfg.lupa = e.target.checked; drawConfig(); };
    $("#cfgNotes").oninput = (e) => { cfg.notes = e.target.value; drawConfig(false); };
    drawConfig();
  }
  function cfgDialIndex(hex) {
    const n = (h) => [1, 3, 5].map((k) => parseInt(h.slice(k, k + 2), 16)); const a = n(hex || "#141416");
    let best = 0, bd = 1e9; CFG_DIAL.forEach(([, c], i) => { const b = n(c); const d = a.reduce((s, v, k) => s + (v - b[k]) ** 2, 0); if (d < bd) { bd = d; best = i; } }); return best;
  }
  const CFG_CASE_MT = ["Acero", "Oro", "Oro rosa", "Bicolor", "Negro PVD"];
  function cfgBezelOf(p) { return /BATMAN/.test(p.T) ? 1 : /COKE/.test(p.T) ? 2 : /SPRITE/.test(p.T) ? 3 : /PEPSI/.test(p.T) ? 0 : /ROOT/.test(p.T) ? 4 : 5; }
  function cfgStrapOf(p) { return /CAUCHO/.test(p.T) ? 5 : /PIEL/.test(p.T) ? 4 : 0; }
  // Busca la foto real del catálogo que más se parece a lo elegido
  function cfgMatch() {
    const m = cfgModel(), list = cfgCatalog(); if (!list.length) return null;
    const strapWant = cfg.strap === 4 || cfg.strap === 5 ? cfg.strap : 0;
    let best = null;
    list.forEach((p) => {
      const miss = [];
      let sc = 0;
      if (cfgDialIndex(p.dc) === cfg.dial) sc += 4; else miss.push("la esfera");
      if ((p.mt || "Acero") === CFG_CASE_MT[cfg.caseM]) sc += 3; else miss.push("la caja");
      if (m.bezel) { if (cfgBezelOf(p) === cfg.bezel) sc += 3; else miss.push("el bisel"); }
      const strapOk = cfg.strap === 4 || cfg.strap === 5 ? cfgStrapOf(p) === cfg.strap
        : cfg.strap === 0 ? cfgStrapOf(p) === 0
        : cfgStrapOf(p) === 0 && (p.mt || "Acero") === ({ 1: "Oro", 2: "Acero", 3: "Oro rosa" })[cfg.strap];
      if (strapOk) sc += 1; else miss.push("la correa");
      if (p.id === cfg.base) sc += 0.5;
      if (!best || sc > best.sc) best = { p, sc, miss };
    });
    best.exact = best.miss.length === 0;
    return best;
  }
  // ---- Recolorea la foto real del reloj que se está personalizando ----
  const MK = typeof MASKS === "object" ? MASKS : {};
  const hexRGB = (h) => [1, 3, 5].map((k) => parseInt(h.slice(k, k + 2), 16) / 255);
  const LW = [0.2126, 0.7152, 0.0722];
  const fx = (rows) => rows.map(([s, o]) => [s * LW[0], s * LW[1], s * LW[2], 0, o].join(" ")).join(" ") + " 0 0 0 1 0";
  const METAL = { // [color, ganancia, base]
    steel: [[1, 1, 1.02], 1.05, 0.03], gold: [[1, 0.83, 0.5], 1.12, 0.04], rose: [[1, 0.75, 0.63], 1.1, 0.04], pvd: [[0.3, 0.3, 0.32], 1, 0.02],
  };
  const metalFx = (m) => { const [c, g, b] = METAL[m]; return fx(c.map((v) => [v * g, v * b])); };
  const tintFx = (hex, base, k) => fx(hexRGB(hex).map((v) => [v * k, v * base]));
  const BEZ_COL = [["#b3192a", "#1f3b8c"], ["#1f3b8c", "#151517"], ["#b3192a", "#151517"], ["#1d7a45", "#151517"], ["#6a3a20", "#151517"], ["#151517", "#151517"]];
  const insetFx = (hex) => fx(hexRGB(hex).map((v) => [0.5, v * 0.75]));
  function cfgOrig(p) {
    return { dial: cfgDialIndex(p.dial || p.dc || "#141416"), caseM: { "Oro rosa": 2, Oro: 1, "Negro PVD": 4, Bicolor: 3 }[p.mt] ?? 0,
      strap: cfgStrapOf(p), bezel: cfgBezelOf(p) };
  }
  function cfgWork() { const list = cfgCatalog(); return byId[cfg.base] && list.includes(byId[cfg.base]) ? byId[cfg.base] : list[0]; }
  function cfgChanges(o) {
    const m = cfgModel(), ch = [];
    if (cfg.caseM !== o.caseM) ch.push(["Caja", CFG_CASE[cfg.caseM][0]]);
    if (cfg.dial !== o.dial) ch.push(["Esfera", CFG_DIAL[cfg.dial][0]]);
    if (cfg.strap !== 0 && cfg.strap !== o.strap) ch.push(["Correa", CFG_STRAP[cfg.strap][0]]);
    if (m.bezel && cfg.bezel !== o.bezel) ch.push(["Bisel", CFG_BEZEL[cfg.bezel][0]]);
    return ch;
  }
  function cfgPhotoSVG(p) {
    const mk = MK[p.id], src = PHOTOS[p.id];
    if (!mk || !src) return art(p);
    const o = cfgOrig(p), { w, h } = mk, m = cfgModel();
    const caseMetal = ["steel", "gold", "rose", "steel", "pvd"][cfg.caseM];
    const mask = (n) => `<mask id="cm-${n}" maskUnits="userSpaceOnUse" x="0" y="0" width="${w}" height="${h}"><image href="img/mask/${p.id}-${n}.png" width="${w}" height="${h}"/></mask>`;
    const filt = (id, v) => `<filter id="${id}" color-interpolation-filters="sRGB" x="0" y="0" width="100%" height="100%"><feColorMatrix type="matrix" values="${v}"/></filter>`;
    const layer = (f, mk2, extra = "") => `<image href="${src}" width="${w}" height="${h}" filter="url(#${f})" mask="url(#cm-${mk2})" ${extra}/>`;
    let defs = ["dial", "case", "bezel", "strap"].map(mask).join(""), body = `<image href="${src}" width="${w}" height="${h}"/>`;
    // caja
    if (cfg.caseM !== o.caseM) {
      defs += filt("cf-case", metalFx(caseMetal)); body += layer("cf-case", "case");
      if (cfg.caseM === 3) { defs += filt("cf-bz", metalFx("gold")); body += layer("cf-bz", "bezel"); }
    }
    // correa
    const st = cfg.strap, leatherOrig = o.strap === 4 || o.strap === 5;
    let sf = null;
    if (st === 4 && o.strap !== 4) sf = tintFx("#5c3a24", 0.55, 0.9);
    else if (st === 5 && o.strap !== 5) sf = tintFx("#1c1c1e", 0.6, 0.8);
    else if (st === 1 || st === 2 || st === 3) sf = metalFx(["", "gold", "steel", "rose"][st]);
    else if (st === 0 && cfg.caseM !== o.caseM && !leatherOrig) sf = metalFx(caseMetal);
    if (sf) { defs += filt("cf-strap", sf); body += layer("cf-strap", "strap"); }
    // esfera
    if (cfg.dial !== o.dial) {
      const lm = mk.lm, c = hexRGB(CFG_DIAL[cfg.dial][1]);
      const light = c[0] * LW[0] + c[1] * LW[1] + c[2] * LW[2] > 0.55, kk = light ? 0.14 : 0.32, bb = light ? 0.86 : 0.7;
      defs += filt("cf-dial", fx(c.map((v) => [v * kk / lm, v * bb]))); body += layer("cf-dial", "dial");
    }
    // bisel GMT (dos colores, mitad de arriba y de abajo)
    if (m.bezel && cfg.bezel !== o.bezel) {
      const [top, bot] = BEZ_COL[cfg.bezel], cy = Math.round(mk.cy * h);
      defs += filt("cf-bt", insetFx(top)) + filt("cf-bb", insetFx(bot)) +
        `<clipPath id="cc-top"><rect width="${w}" height="${cy}"/></clipPath><clipPath id="cc-bot"><rect y="${cy}" width="${w}" height="${h - cy}"/></clipPath>`;
      body += `<g clip-path="url(#cc-top)">${layer("cf-bt", "bezel")}</g><g clip-path="url(#cc-bot)">${layer("cf-bb", "bezel")}</g>`;
    }
    return `<svg class="cfg-svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${esc(p.name)} personalizado"><defs>${defs}</defs>${body}</svg>`;
  }
  function drawConfig(redraw = true) {
    const p = cfgWork();
    if (!p) return;
    cfg.base = p.id;
    if (redraw) {
      const st = $("#cfgPreview");
      const fresh = st.dataset.id !== p.id;
      st.dataset.id = p.id;
      const box = document.createElement("div");
      box.className = "cfg-img" + (fresh ? "" : " in");
      box.innerHTML = cfgPhotoSVG(p);
      st.querySelectorAll(".cfg-img").forEach((o) => { if (fresh) { o.classList.add("out"); setTimeout(() => o.remove(), 450); } else o.remove(); });
      st.appendChild(box); if (fresh) requestAnimationFrame(() => box.classList.add("in"));
    }
    $$(".cfg-base button").forEach((b) => { b.classList.toggle("on", b.dataset.cfgbase === p.id); b.classList.remove("shown"); });
    const st3 = { model: cfgModel().key, caseM: cfg.caseM, dial: CFG_DIAL[cfg.dial][1], strap: cfg.strap, bezel: cfg.bezel, size: cfg.size, lupa: cfg.lupa, logo: cfg.logo };
    // "Como la caja": si no cambias la correa, el 3D usa la del reloj base (cuero o caucho)
    if (cfg.strap === 0) { const os = cfgOrig(p).strap; if (os === 4 || os === 5) st3.strap = os; }
    window.__cfgState = st3; window.dispatchEvent(new CustomEvent("cfgchange", { detail: st3 }));
    const ch = cfgChanges(cfgOrig(p));
    $("#cfgMatch").innerHTML = `<b>Tu ${esc(cfgModel().name)} ${esc(p.name.split(" · ")[1] || "")}</b>${ch.length ? ` · ${ch.map(([a, b]) => esc(a + " " + b.toLowerCase())).join(" · ")}<small>Vista orientativa sobre la foto real de tu reloj</small>` : "<small>Así es el original. Pulsa una opción para cambiarlo.</small>"}`;
    $("#cfgTitle").textContent = `Seiko Mod ${cfgModel().name}`;
    $("#cfgPrice").textContent = money(p.min);
    $("#cfgSummary").innerHTML = cfgSummary().map(([a, b]) => `<li><span>${esc(a)}</span>${esc(b)}</li>`).join("");
    $("#cfgWa").href = WA + "?text=" + encodeURIComponent(cfgText());
  }
  function cfgPickBase(id) {
    const p = byId[id]; if (!p) return;
    cfg.base = id;
    if (cfg.base) {
      const near = (hex) => { const n = (h) => [1, 3, 5].map((k) => parseInt(h.slice(k, k + 2), 16)); const a = n(hex); let best = 0, bd = 1e9; CFG_DIAL.forEach(([, c], i) => { const b = n(c); const d = a.reduce((s, v, k) => s + (v - b[k]) ** 2, 0); if (d < bd) { bd = d; best = i; } }); return best; };
      cfg.dial = near(p.dial || "#141416");
      cfg.caseM = { "Oro rosa": 2, Oro: 1, "Negro PVD": 4, Bicolor: 3 }[p.mt] ?? 0;
      if (/BATMAN/.test(p.T)) cfg.bezel = 1; else if (/COKE/.test(p.T)) cfg.bezel = 2; else if (/SPRITE/.test(p.T)) cfg.bezel = 3; else if (/PEPSI/.test(p.T)) cfg.bezel = 0;
      cfg.strap = /CAUCHO/.test(p.T) ? 5 : /PIEL/.test(p.T) ? 4 : 0;
      if (/ROOT BEER/.test(p.T)) cfg.bezel = 4; else if (cfgModel().bezel && !/BATMAN|COKE|SPRITE|PEPSI/.test(p.T)) cfg.bezel = 5;
    }
    renderConfig();
  }
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-cfg],[data-cfgbase],#cfgCopy,#cfgCart");
    if (!b) return;
    if (b.id === "cfgCart") {
      const p = cfgWork(); if (!p) return;
      const want = { SIZE: CFG_SIZE[cfg.size], "COLOR DE ESFERA": CFG_DIAL[cfg.dial][0], CORREA: cfg.strap === 0 ? "Como en la foto" : CFG_STRAP[cfg.strap][0], MOVIMIENTO: CFG_MOV[cfg.mov ?? CFG_MOV.indexOf(cfgModel().mv)] };
      const sel = defaultSel(p).map((val, i) => (p.o[i].f && want[p.o[i].n] ? want[p.o[i].n] : val));
      const o = cfgOrig(p), extra = [];
      if (cfg.caseM !== o.caseM) extra.push("Caja " + CFG_CASE[cfg.caseM][0]);
      if (cfgModel().bezel && cfg.bezel !== o.bezel) extra.push("Bisel " + CFG_BEZEL[cfg.bezel][0]);
      if (!cfg.logo) extra.push("Sin logo");
      if (cfg.notes.trim()) extra.push(cfg.notes.trim());
      addToCart(p.id, sel.join(" / ") || "Default Title", 1, false, extra.length ? "Configurador: " + extra.join(" · ") : "Configurador");
      if (cart.length) { $("#cartBtn").click(); }
      return;
    }
    if (b.id === "cfgCopy") { navigator.clipboard?.writeText(cfgText()).then(() => toast("Configuración copiada. Pégala en Instagram."), () => toast("No se pudo copiar")); return; }
    if (b.dataset.cfgbase) return cfgPickBase(b.dataset.cfgbase);
    const k = b.dataset.cfg, i = +b.dataset.i;
    if (k === "model") { cfg.model = i; cfg.base = null; cfg.mov = null; cfg.bezel = 0; const first = cfgCatalog()[0]; if (first) return cfgPickBase(first.id); }
    else cfg[k] = i;
    renderConfig();
  });

  // ================= Inicio =================
  function renderAll() { renderPopular(); renderShelves(); renderShop(); renderCart(); renderWish(); if (current && !$("#pdp").hidden) renderProduct(); }
  buildFilters(); renderMega();
  const H = ["royaloak-oro-rosa-verde", "gmt-pepsi-rojo-y-azul", "nautilusopen-oro-rosa-caucho"].map((h) => byId[h]);
  $("#heroArt").innerHTML = `<img class="hero-cover" src="img/portada.jpg" alt=""><video class="hero-video" src="img/tiktok-fondo.mp4" poster="img/portada.jpg" autoplay muted loop playsinline preload="auto" aria-hidden="true" tabindex="-1"></video><button type="button" class="hv-btn" id="hvBtn" aria-label="Pausar vídeo">❚❚</button>`;
  { const v = $("#heroArt .hero-video"), b = $("#hvBtn");
    if (v && b) {
      const p = v.play(); if (p && p.catch) p.catch(() => {});
      b.addEventListener("click", (e) => { e.stopPropagation(); if (v.paused) { v.play(); b.textContent = "❚❚"; b.setAttribute("aria-label", "Pausar vídeo"); } else { v.pause(); b.textContent = "▶"; b.setAttribute("aria-label", "Reproducir vídeo"); } });
    } }
  $("#artMovement").innerHTML = art(byId["skeleton-acero"]);
  $("#artCrystal").innerHTML = art(byId["datejust-verde-menta"]);
  $("#artBuild").innerHTML = art(byId["santos-blanco-romano"]);
  renderAll(); renderFaq(); renderReviews(); countdown(); renderConfig();
  if (location.hash.startsWith("#p=")) openProduct(decodeURIComponent(location.hash.slice(3)));
  if (false) setTimeout(() => { if ($$(".modal:not([hidden]),.drawer:not([hidden])").length === 0 && $("#pdp").hidden) show("#spinModal"); }, 12000);
})();
