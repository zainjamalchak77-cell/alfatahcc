#!/usr/bin/env node
/**
 * Al Fatah Cricket Club, fixtures builder.
 *
 * Reads fixtures from the club's Google Sheet (published as CSV) and rewrites
 * the generated regions of fixtures.html and index.html. Falls back to the
 * committed data/fixtures.csv when no sheet URL is set or the sheet cannot be
 * reached, so the site never ends up with an empty fixtures page.
 *
 * Usage:
 *   node scripts/build-fixtures.mjs            # uses FIXTURES_CSV_URL, else the local file
 *   FIXTURES_CSV_URL=... node scripts/build-fixtures.mjs
 *
 * No dependencies. Node 18 or newer.
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const LOCAL_CSV = join(ROOT, "data", "fixtures.csv");

/* ------------------------------------------------------------------ *
 * CSV parsing. Handles quoted fields, embedded commas, and "" escapes,
 * which is what Google Sheets produces when a cell contains a comma.
 * ------------------------------------------------------------------ */
function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;

  const src = text.replace(/\r\n?/g, "\n");
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (quoted) {
      if (c === '"') {
        if (src[i + 1] === '"') { field += '"'; i++; }
        else quoted = false;
      } else field += c;
    } else if (c === '"') {
      quoted = true;
    } else if (c === ",") {
      row.push(field); field = "";
    } else if (c === "\n") {
      row.push(field); rows.push(row); row = []; field = "";
    } else {
      field += c;
    }
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }

  const nonEmpty = rows.filter((r) => r.some((c) => c.trim() !== ""));
  if (!nonEmpty.length) return [];

  const head = nonEmpty[0].map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));
  return nonEmpty.slice(1).map((r) => {
    const o = {};
    head.forEach((h, i) => { o[h] = (r[i] ?? "").trim(); });
    return o;
  });
}

/* ------------------------------------------------------------------ *
 * Helpers
 * ------------------------------------------------------------------ */
const esc = (s = "") =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

function parseDate(s) {
  const m = String(s).trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  const d = new Date(s);
  return isNaN(d) ? null : d;
}
const fmtDay   = (d) => String(d.getUTCDate()).padStart(2, "0");
const fmtMon   = (d) => `${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
const fmtLong  = (d) => `${DAYS[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;

/** Home fixtures read "Al Fatah CC v X", away fixtures read "X v Al Fatah CC". */
function teams(f) {
  const opp = esc(f.opponent || "Opponent to be confirmed");
  return String(f.home_away).toLowerCase().startsWith("h")
    ? { left: "Al Fatah CC", right: opp }
    : { left: opp, right: "Al Fatah CC" };
}

const SVG = {
  cal:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>',
  clock:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>',
  pin:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/></svg>',
  ball: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M8.5 3.5c2 3.5 2 13.5 0 17M15.5 3.5c-2 3.5-2 13.5 0 17"/></svg>',
  pinSm:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/></svg>',
};

/* ------------------------------------------------------------------ *
 * Renderers
 * ------------------------------------------------------------------ */
function renderNextMatch(f) {
  if (!f) {
    return `        <p class="lead">No fixture scheduled right now. Check back soon, or message the club for the latest.</p>`;
  }
  const t = teams(f);
  const squad = (f.squad || "")
    .split(/\s*,\s*/)
    .map((s) => s.trim())
    .filter(Boolean);

  const squadHtml = squad.length
    ? `
          <h3 style="font-size:1.05rem;margin-top:2rem;color:var(--cream)">Match day squad</h3>
          <ol class="squadlist">
${squad.map((name, i) => {
    const cap = /\(c\)/i.test(name);
    const clean = esc(name.replace(/\s*\(c\)\s*/i, "").trim());
    return `            <li><span class="num">${i + 1}</span><span>${clean}${cap ? ' <span class="cap">(C)</span>' : ""}</span></li>`;
  }).join("\n")}
          </ol>`
    : "";

  const meta = [
    [SVG.cal,  `<strong>${esc(fmtLong(f._date))}</strong>`],
    f.time   ? [SVG.clock, `<strong>${esc(f.time)}</strong> start`] : null,
    f.venue  ? [SVG.pin,   `<strong>${esc(f.venue)}</strong>`] : null,
    f.format ? [SVG.ball,  `<strong>${esc(f.format)}</strong>`] : null,
  ].filter(Boolean);

  return `        <figure class="nextmatch-figure" style="margin:0">
          <img src="assets/img/matchday-wollert-thumb.jpg"
               alt="Al Fatah Cricket Club match day poster"
               width="600" height="900" loading="lazy">
        </figure>

        <div>
          <span class="nextmatch-tag">${esc(f.competition || "Next fixture")}</span>
          <p class="nextmatch-teams">
            ${t.left}
            <span class="vs">versus</span>
            ${t.right}
          </p>

          <ul class="nextmatch-meta">
${meta.map(([svg, txt]) => `            <li>\n              ${svg}\n              <span>${txt}</span>\n            </li>`).join("\n")}
          </ul>
${squadHtml}

          <p style="margin-top:1.75rem">
            <a class="btn btn-sm" href="contact.html">Ask about this match</a>
          </p>
        </div>`;
}

function renderFixtureCard(f) {
  const t = teams(f);
  const isResult = String(f.status).toLowerCase().startsWith("res") || !!f.result;
  const won = /\bwon\b/i.test(f.result || "");
  const lost = /\blost\b/i.test(f.result || "");
  const cls = isResult ? (won ? "is-win" : lost ? "is-loss" : "") : "is-upcoming";

  const right = isResult
    ? `            <div class="fixture-score">${esc(f.our_score || "")}${f.our_score && f.their_score ? " &nbsp;v&nbsp; " : ""}${esc(f.their_score || "")}</div>
            ${f.result ? `<span class="badge ${won ? "badge-win" : lost ? "badge-loss" : ""}">${esc(f.result)}</span>` : ""}`
    : `            <span class="badge${f._isNext ? " badge-next" : ""}">${f._isNext ? "Next match" : String(f.home_away).toLowerCase().startsWith("h") ? "Home" : "Away"}</span>`;

  const venueLine = [f.venue, f.time].filter(Boolean).map(esc).join(" &middot; ");

  return `        <article class="fixture ${cls}">
          <div class="fixture-date">
            <span class="fixture-day">${fmtDay(f._date)}</span>
            <span class="fixture-month">${fmtMon(f._date)}</span>
          </div>
          <div>
            <p class="fixture-comp">${esc(f.competition || "")}</p>
            <h3 class="fixture-teams">${t.left} v ${t.right}</h3>
            ${venueLine ? `<p class="fixture-venue">\n              ${SVG.pinSm}\n              ${venueLine}\n            </p>` : ""}
          </div>
          <div class="fixture-result">
${right}
          </div>
        </article>`;
}

function renderList(list, emptyMsg) {
  if (!list.length) return `        <p class="lead">${emptyMsg}</p>`;
  return list.map(renderFixtureCard).join("\n\n");
}

function renderHomeBand(f) {
  if (!f) return `          <p class="lead">No fixture scheduled right now.</p>`;
  const t = teams(f);
  const line = [fmtLong(f._date), f.time, f.venue].filter(Boolean).map(esc).join(", ");
  return `          <div>
            <span class="nextmatch-tag">Next match &middot; ${esc(f.competition || "")}</span>
            <p class="nextmatch-teams" style="font-size:clamp(1.5rem,1rem+1.8vw,2.2rem)">
              ${t.left} <span class="vs" style="display:inline;font-size:0.6em;margin:0 0.35rem">v</span> ${t.right}
            </p>
            <ul class="nextmatch-meta" style="margin-top:1.1rem;grid-template-columns:1fr">
              <li>
                ${SVG.cal}
                <span><strong>${line}</strong></span>
              </li>
            </ul>
            <p style="margin-top:1.5rem">
              <a class="btn btn-sm" href="fixtures.html">Match details &amp; squad</a>
            </p>
          </div>`;
}

/* ------------------------------------------------------------------ *
 * Marker replacement
 * ------------------------------------------------------------------ */
function replaceRegion(html, name, body, file) {
  const start = `<!-- AUTO:${name}:START -->`;
  const end = `<!-- AUTO:${name}:END -->`;
  const i = html.indexOf(start);
  const j = html.indexOf(end);
  if (i === -1 || j === -1) {
    throw new Error(`Markers AUTO:${name} not found in ${file}. The generated region must be wrapped in ${start} ... ${end}`);
  }
  return html.slice(0, i + start.length) + "\n" + body + "\n        " + html.slice(j);
}

/* ------------------------------------------------------------------ *
 * Main
 * ------------------------------------------------------------------ */
async function loadCSV() {
  const url = process.env.FIXTURES_CSV_URL;
  if (url) {
    try {
      const res = await fetch(url, { redirect: "follow" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      if (!/date/i.test(text.slice(0, 400))) throw new Error("response does not look like the fixtures sheet");
      console.log(`  source: Google Sheet (${text.length} bytes)`);
      // keep a copy so the site still builds if the sheet ever goes away
      writeFileSync(LOCAL_CSV, text);
      return text;
    } catch (err) {
      console.warn(`  WARNING: could not read the sheet (${err.message}). Falling back to data/fixtures.csv`);
    }
  }
  if (!existsSync(LOCAL_CSV)) throw new Error("No sheet URL set and data/fixtures.csv is missing");
  console.log("  source: data/fixtures.csv");
  return readFileSync(LOCAL_CSV, "utf8");
}

async function main() {
  const rows = parseCSV(await loadCSV());

  const fixtures = rows
    .map((r) => ({ ...r, _date: parseDate(r.date) }))
    .filter((r) => r._date && (r.opponent || r.competition));

  if (fixtures.length !== rows.length) {
    console.warn(`  ${rows.length - fixtures.length} row(s) skipped: missing or unreadable date`);
  }

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const isResult = (f) => String(f.status).toLowerCase().startsWith("res") || !!f.result;
  const upcoming = fixtures.filter((f) => !isResult(f) && f._date >= today).sort((a, b) => a._date - b._date);
  const results  = fixtures.filter(isResult).sort((a, b) => b._date - a._date);
  const next = upcoming[0] || null;
  if (next) next._isNext = true;

  console.log(`  ${fixtures.length} fixture(s): ${upcoming.length} upcoming, ${results.length} result(s)`);
  if (next) console.log(`  next match: ${teams(next).left} v ${teams(next).right}, ${fmtLong(next._date)}`);

  // fixtures.html
  const fp = join(ROOT, "fixtures.html");
  let fx = readFileSync(fp, "utf8");
  fx = replaceRegion(fx, "NEXTMATCH", renderNextMatch(next), "fixtures.html");
  fx = replaceRegion(fx, "UPCOMING", renderList(upcoming.slice(1), "Nothing else on the schedule yet. The leagues release dates round by round."), "fixtures.html");
  fx = replaceRegion(fx, "RESULTS", renderList(results, "No results published yet this season."), "fixtures.html");
  writeFileSync(fp, fx);

  // index.html
  const ip = join(ROOT, "index.html");
  let ix = readFileSync(ip, "utf8");
  ix = replaceRegion(ix, "HOMENEXT", renderHomeBand(next), "index.html");
  writeFileSync(ip, ix);

  console.log("  wrote fixtures.html and index.html");
}

main().catch((err) => {
  console.error("BUILD FAILED:", err.message);
  process.exit(1);
});
