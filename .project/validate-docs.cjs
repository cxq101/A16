// Read-only repository documentation checks; no network, gameplay or save access.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const errors = [];
let pathChecks = 0, linkChecks = 0, assetChecks = 0;
const fail = message => errors.push(message);
const nonempty = value => typeof value === 'string' && value.trim().length > 0;
function target(value, label, kind = 'file', base = root) {
  if (!nonempty(value) || path.isAbsolute(value) || /^[a-z]:/i.test(value) || value.split(/[\\/]/).includes('..') && base === root) {
    fail(`${label}: invalid project-relative path`); return null;
  }
  const resolved = path.resolve(base, value);
  const inside = name => name === root || name.startsWith(root + path.sep);
  if (!inside(resolved)) { fail(`${label}: escapes root`); return null; }
  if (!fs.existsSync(resolved)) { fail(`${label}: missing ${value}`); return null; }
  if (!inside(fs.realpathSync(resolved))) { fail(`${label}: symlink escapes root`); return null; }
  const stat = fs.statSync(resolved);
  if (kind === 'file' && !stat.isFile() || kind === 'dir' && !stat.isDirectory()) fail(`${label}: wrong path type`);
  pathChecks++; return resolved;
}
function json(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '')); }
  catch (error) { fail(`${path.relative(root, file)}: ${error.message}`); return {}; }
}
function rows(value, fields, unique, name, allowEmpty = false) {
  if (!Array.isArray(value) || !allowEmpty && !value.length) { fail(`${name}: expected array`); return []; }
  const seen = new Set();
  return value.filter((item, index) => {
    if (!item || fields.some(key => !nonempty(item[key]))) { fail(`${name}[${index}]: required fields`); return false; }
    if (unique) {
      const id = item[unique].trim().toLowerCase();
      if (seen.has(id)) fail(`${name}: duplicate ${unique} ${id}`);
      seen.add(id);
    }
    return true;
  });
}
const profile = json(path.join(__dirname, 'formalization.json'));
if (profile.schemaVersion !== 1) fail('profile schemaVersion');
if (!/^\d+\.\d+\.\d+$/.test(profile.standardVersion || '')) fail('standardVersion');
if (!['preparing', 'formalized'].includes(profile.phase)) fail('phase');
const directories = rows(profile.directories, ['path', 'purpose'], 'path', 'directories');
for (const item of directories) target(item.path, 'directory', 'dir');
const docs = rows(profile.documents, ['topic', 'path'], 'topic', 'documents');
for (const item of docs) target(item.path, item.topic);
for (const item of rows(profile.versions, ['object', 'source', 'selector'], 'object', 'versions')) {
  const file = target(item.source, item.object);
  if (file && item.selector.startsWith('$.')) {
    let value = json(file);
    for (const key of item.selector.slice(2).split('.')) value = value?.[key];
    if (value === undefined) fail(`${item.object}: selector missing`);
  }
}
const exceptions = rows(profile.exceptions, ['rule', 'reason', 'scope', 'reviewWhen'], null, 'exceptions', true);
if (profile.framework === null) {
  if (!exceptions.some(row => row.rule === 'core-library')) fail('null framework requires core-library exception');
} else if (profile.framework && ['name', 'versionSource', 'boundaryDocument'].every(key => nonempty(profile.framework[key]))) {
  target(profile.framework.versionSource, 'framework version'); target(profile.framework.boundaryDocument, 'framework boundary');
} else fail('framework');
if (!Array.isArray(profile.requiredFiles) || !profile.requiredFiles.length) fail('requiredFiles');
for (const name of profile.requiredFiles || []) target(name, 'requiredFile');

const markdown = new Set(['README.md', 'AGENTS.md', 'fragment-demo/README.md', 'fragment-demo/3D-STUDY.md', 'fragment-demo/ART-DIRECTION.md', ...docs.map(row => row.path), ...(profile.requiredFiles || [])].filter(name => name.endsWith('.md')));
for (const name of markdown) {
  const file = path.join(root, name);
  if (!fs.existsSync(file)) continue;
  const text = fs.readFileSync(file, 'utf8');
  for (const match of text.matchAll(/!?\[[^\]\n]*\]\(([^)\n]+)\)/g)) {
    let href = match[1].trim().replace(/^<|>$/g, '');
    if (/^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith('#')) continue;
    href = decodeURIComponent(href.split('#')[0]);
    if (!href) continue;
    target(href, `link in ${name}`, 'any', path.dirname(file)); linkChecks++;
  }
}
const registry = json(path.join(__dirname, 'artifacts.json'));
if (registry.schemaVersion !== 1 || registry.pathBase !== 'project-root') fail('registry schema/base');
const sets = rows(registry.sets, ['id', 'status', 'notes'], 'id', 'artifact sets');
if (!sets.some(set => set.id === registry.latestReviewSet)) fail('latestReviewSet missing');
if (registry.approvedSet !== null && !sets.some(set => set.id === registry.approvedSet)) fail('approvedSet missing');
if (registry.approvedSet !== null || registry.demoUsesGeneratedReviewImages !== false) fail('current documented approval/integration state changed; review required');
for (const set of sets) {
  for (const file of set.files || []) { target(file, `asset ${set.id}`); assetChecks++; }
  if (set.manifest) {
    const file = target(set.manifest, `manifest ${set.id}`);
    if (file) {
      const manifest = json(file);
      if (!Array.isArray(manifest.cards) || manifest.cards.length !== 3) fail(`${set.id}: expected three study cards`);
      for (const card of manifest.cards || []) {
        for (const key of ['image', 'prompt']) { target(card[key], `${set.id} ${key}`, 'file', path.dirname(file)); assetChecks++; }
      }
    }
  }
}
if (errors.length) {
  for (const message of errors) process.stderr.write(`FAIL: ${message}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(`PASS: ${pathChecks} path checks; ${linkChecks} Markdown local links; ${assetChecks} asset file references; profile fields, unique topics/versions, selectors and review state.\n`);
  process.stdout.write('Semantic alignment requires review. No gameplay, network, Python checker or user-save tests performed.\n');
}
