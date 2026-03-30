/**
 * Q8 Oils Design System — Style Dictionary build
 *
 * Input : tokens/tokens.json  (Token Studio export)
 * Output:
 *   build/css/tokens.css            — variabili CSS con light-dark()
 *   build/figma/Color/Light.tokens.json
 *   build/figma/Color/Dark.tokens.json
 *   build/figma/Spacings/Spacing.tokens.json
 *   build/figma/Corners/Corner.tokens.json
 *   build/figma/Typography/Mobile.tokens.json
 *   build/figma/Typography/Tablet.tokens.json
 *   build/figma/Typography/Desktop.tokens.json
 *
 * I file figma/ sono nel formato figma_tokens_builder (W3C flat token).
 * Copia l'intera cartella build/figma/ in assets/figma/ del progetto Flutter
 * poi esegui: dart run build_runner build --delete-conflicting-outputs
 *
 * Esegui: node sd.config.cjs
 */

const fs   = require('fs');
const path = require('path');

// ─────────────────────────────────────────────────────────────────────────────
// Legge il JSON Token Studio
// ─────────────────────────────────────────────────────────────────────────────
const raw = JSON.parse(fs.readFileSync('./tokens/tokens.json', 'utf8'));

const light  = raw['global']['M3']['sys']['light'];
const dark   = raw['global']['M3']['sys']['dark'];
const m3Base = raw['global']['M3'];                          // white, black
const addOn  = raw['global']['M3']['']['add-on'] ?? {};      // Section background

// Risolve i pesi da Font theme/Baseline (es. Bold → SemiBold → 600)
const fontThemeWeights = raw['Font theme/Baseline']['Static']['Weight'] ?? {};
const WEIGHT_NAME_MAP  = { Regular: 400, Medium: 500, SemiBold: 600, Bold: 600, ExtraBold: 800 };
const resolveWeight = (alias) => {
  const name = resolveAlias(alias);                          // es. "Bold"
  const themeVal = fontThemeWeights[name]?.['$value'];       // es. "SemiBold"
  const finalName = themeVal ?? name;
  return WEIGHT_NAME_MAP[finalName] ?? 400;
};

const typoScales = {
  mobile:  raw['Typescale/Mobile'],
  tablet:  raw['Typescale/Tablet'],
  desktop: raw['Typescale/Desktop'],
};

const corners = raw['Shape/Baseline']['Corner'];
const spacing = raw['Shape/Baseline']['Spacing'];

const ROLES = [
  'Display Large','Display Medium','Display Small',
  'Headline Large','Headline Medium','Headline Small',
  'Title Large','Title Medium','Title Small',
  'Body Large','Body Medium','Body Small',
  'Label Large','Label Medium','Label Small',
];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** "Title Large" → "title-large" */
const toKebab = str => str.toLowerCase().replace(/\s+/g, '-');

/** "Extra-small" → "extra-small" */
const cornerKebab = str => str.toLowerCase().replace(/\s+/g, '-');

/** "Title Large" → "titleLarge" */
const toCamel = str =>
  str.toLowerCase().replace(/[^a-z0-9]+(.)/g, (_, c) => c.toUpperCase());

/** Risolve alias Token Studio come {Static.Weight.Regular} → "Regular" */
const resolveAlias = val => {
  if (typeof val === 'string' && val.includes('{')) {
    return val.replace(/[{}]/g, '').split('.').pop();
  }
  return String(val);
};

const WEIGHT_MAP = {
  Regular: 400, Medium: 500, SemiBold: 600, Bold: 700, ExtraBold: 800,
};

/**
 * JSON.stringify che serializza i campi numerici float-safe:
 * i valori interi vengono scritti come 57.0 invece di 57
 * così Dart li deserializza come double e non int.
 * Usato solo per i file Typography.
 */
const FLOAT_KEYS = new Set(['$value', 'line-height', 'letter-spacing']);
const toFloatJson = (obj) =>
  JSON.stringify(obj, (key, val) => {
    if (FLOAT_KEYS.has(key) && typeof val === 'number' && Number.isInteger(val)) {
      return `__FLOAT__${val}.0`;
    }
    return val;
  }, 2).replace(/"__FLOAT__([\d.]+)"/g, '$1');

// ─────────────────────────────────────────────────────────────────────────────
// OUTPUT DIRECTORIES
// ─────────────────────────────────────────────────────────────────────────────
fs.mkdirSync('./build/css',                    { recursive: true });
fs.mkdirSync('./build/figma/Color',            { recursive: true });
fs.mkdirSync('./build/figma/Spacings',         { recursive: true });
fs.mkdirSync('./build/figma/Corners',          { recursive: true });
fs.mkdirSync('./build/figma/Typography',       { recursive: true });
fs.mkdirSync('./build/figma/Breakpoints',      { recursive: true });
fs.mkdirSync('./build/figma/Grids',            { recursive: true });

// ═════════════════════════════════════════════════════════════════════════════
// 1. CSS  —  light-dark()   [INVARIATO]
// ═════════════════════════════════════════════════════════════════════════════

const cssLines = [
  '/* ─────────────────────────────────────────────────────────────────────────',
  ' * Q8 Oils Design System — CSS Tokens',
  ' * Auto-generated — do not edit directly',
  ' * light-dark() richiede color-scheme: light dark sul root',
  ' * ───────────────────────────────────────────────────────────────────────── */',
  '',
  ':root {',
  '  color-scheme: light dark;',
  '',
  '  /* ── Color — sys ──────────────────────────────────────────────────────── */',
];

for (const key of Object.keys(light)) {
  const lv = light[key]?.['$value'] ?? '';
  const dv = dark[key]?.['$value']  ?? lv;
  cssLines.push(`  --mat-sys-${key}: light-dark(${lv}, ${dv});`);
}

// white / black
cssLines.push(`  --mat-sys-white: ${m3Base.white?.['$value'] ?? '#ffffff'};`);
cssLines.push(`  --mat-sys-black: ${m3Base.black?.['$value'] ?? '#000000'};`);

// add-on colors
if (Object.keys(addOn).length > 0) {
  cssLines.push('');
  cssLines.push('  /* ── Color — add-on ───────────────────────────────────────── */');
  for (const [name, tok] of Object.entries(addOn)) {
    const key = name.toLowerCase().replace(/\s+/g, '-');
    cssLines.push(`  --mat-sys-${key}: ${tok['$value'] ?? ''};`);
  }
}

cssLines.push('');
cssLines.push('  /* ── Corner radius ────────────────────────────────────────── */');
for (const [name, tok] of Object.entries(corners)) {
  cssLines.push(`  --mat-sys-corner-${cornerKebab(name)}: ${tok['$value']}px;`);
}

cssLines.push('');
cssLines.push('  /* ── Spacing ───────────────────────────────────────────────── */');
for (const [name, tok] of Object.entries(spacing)) {
  const varName = name === 'none' ? 'none' : name;
  cssLines.push(`  --mat-sys-spacing-${varName}: ${tok['$value']}px;`);
}

cssLines.push('');
cssLines.push('  /* ── Grid ──────────────────────────────────────────────────── */');
for (const [scale, data] of Object.entries(typoScales)) {
  const bp   = data['Breakpoint']?.['$value'] ?? '';
  const cols = data['Columns']?.['$value']    ?? '';
  const marg = data['Margin']?.['$value']     ?? '';
  const gut  = data['Gutter']?.['$value']     ?? '';
  cssLines.push(`  --mat-sys-grid-${scale}-breakpoint: ${bp}px;`);
  cssLines.push(`  --mat-sys-grid-${scale}-columns: ${cols};`);
  cssLines.push(`  --mat-sys-grid-${scale}-margin: ${marg}px;`);
  cssLines.push(`  --mat-sys-grid-${scale}-gutter: ${gut}px;`);
}

cssLines.push('');
cssLines.push('  /* ── Typescale — mobile (default) ──────────────────────────── */');
const mobileStatic = typoScales.mobile['Static'];
for (const role of ROLES) {
  const tok = mobileStatic[role];
  if (!tok) continue;
  const k        = toKebab(role);
  const weight   = resolveWeight(tok['Weight']?.['$value']            ?? 'Regular');
  const weightEm = resolveWeight(tok['Weight-emphasized']?.['$value'] ?? tok['Weight']?.['$value'] ?? 'Regular');
  cssLines.push(`  --mat-sys-${k}-size: ${tok['Size']?.['$value'] ?? ''}px;`);
  cssLines.push(`  --mat-sys-${k}-line-height: ${tok['Line Height']?.['$value'] ?? ''}px;`);
  cssLines.push(`  --mat-sys-${k}-tracking: ${tok['Tracking']?.['$value'] ?? 0}px;`);
  cssLines.push(`  --mat-sys-${k}-weight: ${weight};`);
  cssLines.push(`  --mat-sys-${k}-weight-emphasized: ${weightEm};`);
  cssLines.push(`  --mat-sys-${k}-font: Manrope, sans-serif;`);
}
cssLines.push('}');

const tabletBp  = typoScales.tablet['Breakpoint']?.['$value']  ?? 768;
const tabletSt  = typoScales.tablet['Static'];
cssLines.push('');
cssLines.push(`/* ── Typescale — tablet ≥${tabletBp}px ────────────────────────── */`);
cssLines.push(`@media (min-width: ${tabletBp}px) {`);
cssLines.push('  :root {');
for (const role of ROLES) {
  const tok = tabletSt[role];
  if (!tok) continue;
  const k        = toKebab(role);
  const weight   = resolveWeight(tok['Weight']?.['$value']            ?? 'Regular');
  const weightEm = resolveWeight(tok['Weight-emphasized']?.['$value'] ?? tok['Weight']?.['$value'] ?? 'Regular');
  cssLines.push(`    --mat-sys-${k}-size: ${tok['Size']?.['$value'] ?? ''}px;`);
  cssLines.push(`    --mat-sys-${k}-line-height: ${tok['Line Height']?.['$value'] ?? ''}px;`);
  cssLines.push(`    --mat-sys-${k}-tracking: ${tok['Tracking']?.['$value'] ?? 0}px;`);
  cssLines.push(`    --mat-sys-${k}-weight: ${weight};`);
  cssLines.push(`    --mat-sys-${k}-weight-emphasized: ${weightEm};`);
  cssLines.push(`    --mat-sys-${k}-font: Manrope, sans-serif;`);
}
cssLines.push('  }');
cssLines.push('}');

const desktopBp = typoScales.desktop['Breakpoint']?.['$value'] ?? 1440;
const desktopSt = typoScales.desktop['Static'];
cssLines.push('');
cssLines.push(`/* ── Typescale — desktop ≥${desktopBp}px ──────────────────────── */`);
cssLines.push(`@media (min-width: ${desktopBp}px) {`);
cssLines.push('  :root {');
for (const role of ROLES) {
  const tok = desktopSt[role];
  if (!tok) continue;
  const k        = toKebab(role);
  const weight   = resolveWeight(tok['Weight']?.['$value']            ?? 'Regular');
  const weightEm = resolveWeight(tok['Weight-emphasized']?.['$value'] ?? tok['Weight']?.['$value'] ?? 'Regular');
  cssLines.push(`    --mat-sys-${k}-size: ${tok['Size']?.['$value'] ?? ''}px;`);
  cssLines.push(`    --mat-sys-${k}-line-height: ${tok['Line Height']?.['$value'] ?? ''}px;`);
  cssLines.push(`    --mat-sys-${k}-tracking: ${tok['Tracking']?.['$value'] ?? 0}px;`);
  cssLines.push(`    --mat-sys-${k}-weight: ${weight};`);
  cssLines.push(`    --mat-sys-${k}-weight-emphasized: ${weightEm};`);
  cssLines.push(`    --mat-sys-${k}-font: Manrope, sans-serif;`);
}
cssLines.push('  }');
cssLines.push('}');

fs.writeFileSync('./build/css/tokens.css', cssLines.join('\n') + '\n');
console.log('✅  build/css/tokens.css');

// ═════════════════════════════════════════════════════════════════════════════
// 2. FIGMA TOKENS BUILDER — formato W3C flat token
//    Destinazione: build/figma/  →  copia in assets/figma/ del progetto Flutter
// ═════════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// 2a. Color/Light.tokens.json
// ─────────────────────────────────────────────────────────────────────────────
const colorLight = {};
for (const [key, tok] of Object.entries(light)) {
  colorLight[key] = { $type: 'color', $value: tok['$value'] ?? '', $extensions: { 'com.figma.modeName': 'Light' } };
}
colorLight['white'] = { $type: 'color', $value: m3Base.white?.['$value'] ?? '#ffffff', $extensions: { 'com.figma.modeName': 'Light' } };
colorLight['black'] = { $type: 'color', $value: m3Base.black?.['$value'] ?? '#000000', $extensions: { 'com.figma.modeName': 'Light' } };
for (const [name, tok] of Object.entries(addOn)) {
  const key = name.toLowerCase().replace(/\s+/g, '-');
  colorLight[key] = { $type: 'color', $value: tok['$value'] ?? '', $extensions: { 'com.figma.modeName': 'Light' } };
}
colorLight['$extensions'] = { 'com.figma.modeName': 'Light' };

fs.writeFileSync(
  './build/figma/Color/Light.tokens.json',
  JSON.stringify(colorLight, null, 2),
);
console.log('✅  build/figma/Color/Light.tokens.json');

// ─────────────────────────────────────────────────────────────────────────────
// 2b. Color/Dark.tokens.json
// ─────────────────────────────────────────────────────────────────────────────
const colorDark = {};
for (const [key, tok] of Object.entries(dark)) {
  colorDark[key] = { $type: 'color', $value: tok['$value'] ?? '', $extensions: { 'com.figma.modeName': 'Dark' } };
}
colorDark['white'] = { $type: 'color', $value: m3Base.white?.['$value'] ?? '#ffffff', $extensions: { 'com.figma.modeName': 'Dark' } };
colorDark['black'] = { $type: 'color', $value: m3Base.black?.['$value'] ?? '#000000', $extensions: { 'com.figma.modeName': 'Dark' } };
for (const [name, tok] of Object.entries(addOn)) {
  const key = name.toLowerCase().replace(/\s+/g, '-');
  colorDark[key] = { $type: 'color', $value: tok['$value'] ?? '', $extensions: { 'com.figma.modeName': 'Dark' } };
}
colorDark['$extensions'] = { 'com.figma.modeName': 'Dark' };

fs.writeFileSync(
  './build/figma/Color/Dark.tokens.json',
  JSON.stringify(colorDark, null, 2),
);
console.log('✅  build/figma/Color/Dark.tokens.json');

// ─────────────────────────────────────────────────────────────────────────────
// 2c. Spacing/Spacing.tokens.json
// ─────────────────────────────────────────────────────────────────────────────
const spacingOut = {};
for (const [name, tok] of Object.entries(spacing)) {
  const key = name === 'none' ? 'space-none' : `space-${name}`;
  spacingOut[key] = {
    $type:  'number',
    $value: tok['$value'],
    $extensions: { 'com.figma.modeName': 'Spacing' },
  };
}
spacingOut['$extensions'] = { 'com.figma.modeName': 'Spacing' };

fs.writeFileSync(
  './build/figma/Spacings/Spacing.tokens.json',
  JSON.stringify(spacingOut, null, 2),
);
console.log('✅  build/figma/Spacings/Spacing.tokens.json');

// ─────────────────────────────────────────────────────────────────────────────
// 2d. Corners/Corner.tokens.json
// ─────────────────────────────────────────────────────────────────────────────
const cornerOut = {};
for (const [name, tok] of Object.entries(corners)) {
  const key = `corner-${cornerKebab(name)}`;
  cornerOut[key] = {
    $type:  'number',
    $value: tok['$value'],
    $extensions: { 'com.figma.modeName': 'Corner' },
  };
}
cornerOut['$extensions'] = { 'com.figma.modeName': 'Corner' };

fs.writeFileSync(
  './build/figma/Corners/Corner.tokens.json',
  JSON.stringify(cornerOut, null, 2),
);
console.log('✅  build/figma/Corners/Corner.tokens.json');

// ─────────────────────────────────────────────────────────────────────────────
// 2e. Typography/{Mobile|Tablet|Desktop}.tokens.json
//
// figma_tokens_builder è un flat token builder: ogni token ha $type/$value.
// Per la tipografia usiamo $value = fontSize e aggiungiamo le props extra
// come campi di primo livello (line-height, letter-spacing, font-weight,
// font-family) — il builder le espone come proprietà separate sulla classe.
// ─────────────────────────────────────────────────────────────────────────────
const TYPO_MODES = [
  { key: 'mobile',  label: 'Mobile',  data: typoScales.mobile  },
  { key: 'tablet',  label: 'Tablet',  data: typoScales.tablet  },
  { key: 'desktop', label: 'Desktop', data: typoScales.desktop },
];

for (const { label, data } of TYPO_MODES) {
  const typoOut = {};
  const st = data['Static'];

  for (const role of ROLES) {
    const tok = st[role];
    if (!tok) continue;

    const size     = tok['Size']?.['$value']        ?? 16;
    const lh       = tok['Line Height']?.['$value'] ?? 24;
    const tr       = tok['Tracking']?.['$value']    ?? 0;
    const weight   = resolveWeight(tok['Weight']?.['$value']            ?? 'Regular');
    const weightEm = resolveWeight(tok['Weight-emphasized']?.['$value'] ?? tok['Weight']?.['$value'] ?? 'Regular');
    const tokenKey = toKebab(role);

    typoOut[tokenKey] = {
      $type:                    'font',
      $value:                   parseFloat(size),
      'line-height':            parseFloat(lh),
      'letter-spacing':         parseFloat(tr),
      'font-weight':            weight,
      'font-weight-emphasized': weightEm,
      'font-family':            'Manrope',
      $extensions: { 'com.figma.modeName': label },
    };
  }

  typoOut['$extensions'] = { 'com.figma.modeName': label };

  fs.writeFileSync(
    `./build/figma/Typography/${label}.tokens.json`,
    toFloatJson(typoOut),
  );
  console.log(`✅  build/figma/Typography/${label}.tokens.json`);
}

// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// 2f. Breakpoints/{Mobile|Tablet|Desktop}.tokens.json
// ─────────────────────────────────────────────────────────────────────────────
for (const [scale, data] of Object.entries(typoScales)) {
  const label = scale.charAt(0).toUpperCase() + scale.slice(1);
  const out = {
    breakpoint: {
      $type:  'number',
      $value: data['Breakpoint']?.['$value'] ?? 0,
      $extensions: { 'com.figma.modeName': label },
    },
    '$extensions': { 'com.figma.modeName': label },
  };
  fs.writeFileSync(`./build/figma/Breakpoints/${label}.tokens.json`, JSON.stringify(out, null, 2));
  console.log(`✅  build/figma/Breakpoints/${label}.tokens.json`);
}

// ─────────────────────────────────────────────────────────────────────────────
// 2g. Grids/{Mobile|Tablet|Desktop}.tokens.json
// ─────────────────────────────────────────────────────────────────────────────
for (const [scale, data] of Object.entries(typoScales)) {
  const label = scale.charAt(0).toUpperCase() + scale.slice(1);
  const out = {
    columns: { $type: 'number', $value: data['Columns']?.['$value'] ?? 0, $extensions: { 'com.figma.modeName': label } },
    margin:  { $type: 'number', $value: data['Margin']?.['$value']  ?? 0, $extensions: { 'com.figma.modeName': label } },
    gutter:  { $type: 'number', $value: data['Gutter']?.['$value']  ?? 0, $extensions: { 'com.figma.modeName': label } },
    '$extensions': { 'com.figma.modeName': label },
  };
  fs.writeFileSync(`./build/figma/Grids/${label}.tokens.json`, JSON.stringify(out, null, 2));
  console.log(`✅  build/figma/Grids/${label}.tokens.json`);
}

console.log('');
console.log('Done.');
console.log('');
console.log('Prossimi passi Flutter:');
console.log('  1. Copia build/figma/ → assets/figma/ nel progetto Flutter');
console.log('  2. Aggiorna pubspec.yaml: assets: [assets/figma/]');
console.log('  3. Esegui: dart run build_runner build --delete-conflicting-outputs');
console.log('  4. Usa: context.color.primary  context.spacing.space16  context.corner.cornerSmall');
