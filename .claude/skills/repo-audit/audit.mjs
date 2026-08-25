#!/usr/bin/env node
// repo-audit — static scanner for voetbalTrainingApp guideline violations.
// Rule definitions live in docs/guidelines/*.md; this file automates the mechanical ones.
// Usage: node .claude/skills/repo-audit/audit.mjs [--json]
// Exit code: 1 if any ERROR-severity finding, else 0.

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep, posix } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..", "..", "..");
const JSON_OUT = process.argv.includes("--json");

const SKIP_DIRS = new Set([
  "node_modules", ".next", ".git", "generated", "dist", "build", "coverage", "public",
]);

/** Recursively collect files under ROOT, skipping SKIP_DIRS. */
function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const abs = join(dir, name);
    let st;
    try {
      st = statSync(abs);
    } catch {
      continue;
    }
    if (st.isDirectory()) {
      if (!SKIP_DIRS.has(name)) walk(abs, out);
    } else {
      out.push(abs);
    }
  }
  return out;
}

const rel = (abs) => relative(ROOT, abs).split(sep).join(posix.sep);
const isCode = (p) => /\.(ts|tsx)$/.test(p);
const inDirs = (p, ...dirs) => dirs.some((d) => p === d || p.startsWith(d + "/"));

const files = walk(ROOT).map((abs) => ({ abs, path: rel(abs) })).filter((f) => isCode(f.path));
const read = (abs) => {
  try {
    return readFileSync(abs, "utf8");
  } catch {
    return "";
  }
};

const findings = [];
const add = (rule, severity, file, line, text) =>
  findings.push({ rule, severity, file, line, text: text.trim().slice(0, 160) });

/** Emit a finding per matching line. `when` optionally filters files by relative path. */
function lineRule(rule, severity, regex, { when } = {}) {
  for (const f of files) {
    if (when && !when(f.path)) continue;
    const lines = read(f.abs).split(/\r?\n/);
    lines.forEach((ln, i) => {
      regex.lastIndex = 0;
      if (regex.test(ln)) add(rule, severity, f.path, i + 1, ln);
    });
  }
}

/** Emit one finding per file when `test(content)` is true. */
function fileRule(rule, severity, test, note, { when } = {}) {
  for (const f of files) {
    if (when && !when(f.path)) continue;
    if (test(read(f.abs), f.path)) add(rule, severity, f.path, 1, note);
  }
}

// ---- TS ---------------------------------------------------------------------
lineRule("TS-1", "error", /(:\s*any(\b|\[))|(\bas\s+any\b)|(<any>)|(\bAny\b>?\s*=\s*any)/);
lineRule("TS-2", "error", /@ts-ignore/);

// ---- Backend / Prisma -------------------------------------------------------
lineRule("BE-1", "error", /from\s+["']@prisma\/client["']|require\(\s*["']@prisma\/client["']\s*\)/);
lineRule("BE-2", "error", /new\s+PrismaClient\s*\(/, {
  when: (p) => p !== "lib/prisma.ts",
});

// BE-5: server-action files must declare "use server".
fileRule(
  "BE-5",
  "error",
  (src) => !/^\s*["']use server["']/m.test(src),
  'server-action file missing top-level "use server" directive',
  { when: (p) => /^app\/.*actions\.ts$/.test(p) },
);

// BE-15: no console.* in app/components/lib (scripts are the report channel).
lineRule("BE-15", "warn", /\bconsole\.(log|warn|error|info|debug)\s*\(/, {
  when: (p) => inDirs(p, "app", "components", "lib"),
});

// ---- Frontend ---------------------------------------------------------------
const CLIENT_SIGNALS =
  /\buse(State|Effect|Ref|Memo|Callback|Reducer|Context|LayoutEffect)\s*\(|\son(Click|Change|Submit|Input|KeyDown|KeyUp|MouseDown|Focus|Blur)\s*=/;
fileRule(
  "FE-1",
  "error",
  (src) => CLIENT_SIGNALS.test(src) && !/^\s*["']use client["']/m.test(src),
  'client hooks/handlers used without a top-level "use client" directive',
  { when: (p) => inDirs(p, "app", "components") },
);

// FE-6: DB-backed pages must opt out of static caching.
const DB_SIGNALS = /\bprisma\.|getDrills?\s*\(|getSession\s*\(|getSettings\s*\(|loadGeneratorContext\s*\(/;
fileRule(
  "FE-6",
  "warn",
  (src) => DB_SIGNALS.test(src) && !/export\s+const\s+dynamic\s*=\s*["']force-dynamic["']/.test(src),
  'DB-backed page missing `export const dynamic = "force-dynamic"`',
  { when: (p) => /^app\/.*page\.tsx$/.test(p) },
);

// ---- Info -------------------------------------------------------------------
lineRule("INFO", "info", /\b(TODO|FIXME|XXX)\b/);

// ---- Report -----------------------------------------------------------------
const ORDER = { error: 0, warn: 1, info: 2 };
findings.sort(
  (a, b) => ORDER[a.severity] - ORDER[b.severity] || a.rule.localeCompare(b.rule) || a.file.localeCompare(b.file),
);

const counts = { error: 0, warn: 0, info: 0 };
for (const f of findings) counts[f.severity]++;

if (JSON_OUT) {
  console.log(JSON.stringify({ counts, findings }, null, 2));
} else {
  const COLOR = { error: "\x1b[31m", warn: "\x1b[33m", info: "\x1b[36m" };
  const RESET = "\x1b[0m";
  console.log(`repo-audit — scanned ${files.length} TS/TSX files\n`);
  if (findings.length === 0) {
    console.log("\x1b[32mNo violations found.\x1b[0m");
  } else {
    let lastSev = "";
    for (const f of findings) {
      if (f.severity !== lastSev) {
        console.log(`\n${COLOR[f.severity]}== ${f.severity.toUpperCase()} ==${RESET}`);
        lastSev = f.severity;
      }
      console.log(`${COLOR[f.severity]}[${f.rule}]${RESET} ${f.file}:${f.line}  ${f.text}`);
    }
  }
  console.log(
    `\nSummary: ${counts.error} error, ${counts.warn} warn, ${counts.info} info` +
      ` (see docs/guidelines/* for rule details).`,
  );
}

process.exit(counts.error > 0 ? 1 : 0);
