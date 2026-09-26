/**
 * Record per-page clips of the IRIS Portico portal for the contest demo video.
 *
 * One shared context (cookies persist -> login once). Each page = its own
 * recordVideo file. After all clips, this script runs ffmpeg to:
 *   - overlay a lower-third (title + description) on each clip
 *   - generate a title card + end card
 *   - concat everything into a single H.264 .mp4
 *
 * Run:  node make-video.js     (use the libuv>=1.52 node in tools/)
 */
'use strict';
const { chromium } = require('playwright-core');
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const BASE = 'http://localhost:80';
const USER = 'Portico';
const PASS = 'Portico123';
const FFMPEG = 'ffmpeg';
const FONT_B = 'C:/Windows/Fonts/arialbd.ttf';
const FONT_R = 'C:/Windows/Fonts/arial.ttf';
const W = 1440, H = 900;
const OUT = path.join(__dirname, 'video');
const CLIPS = path.join(OUT, 'clips');
const FINAL = path.join(OUT, 'iris-portico-demo.mp4');

const SEGMENTS = [
  { file: '01-login',      path: '/',            title: 'Sign In',            desc: 'OAuth2 + Basic auth via /api/admin', dwell: 8000,  login: true },
  { file: '02-dashboard',  path: '/',            title: 'Dashboard',          desc: 'Server identity, usage & privileges', dwell: 10000 },
  { file: '03-webapps',    path: '/webapps',     title: 'Web Apps & REST',    desc: 'Browse & manage web applications', dwell: 18000, scroll: true },
  { file: '04-permissions',path: '/permissions', title: 'Permissions',        desc: 'Privileges & role grants', dwell: 12000 },
  { file: '05-security',   path: '/security',    title: 'Security & Secrets', desc: 'Wallets, X509, OAuth2, SSL, crypto', dwell: 35000, tabs: true },
  { file: '06-tasks',      path: '/tasks',       title: 'Tasks',              desc: 'Run, schedule & control jobs', dwell: 28000, scroll: true },
  { file: '07-system',     path: '/system',      title: 'System',             desc: 'Namespaces, processes, threads, memory', dwell: 22000 },
  { file: '08-logs',       path: '/logs',        title: 'Log Center',         desc: 'Journal & event log browsing', dwell: 12000 },
  { file: '09-async',      path: '/async',       title: 'Async Tasks',        desc: 'Long-running background operations', dwell: 12000 },
];

function ff(args) {
  execFileSync(FFMPEG, ['-y', '-hide_banner', '-loglevel', 'error', ...args], { stdio: 'pipe' });
}

// drawtext lower-third: bold title + smaller description.
function lowerThird(title, desc) {
  const t = title.replace(/'/g, "''");
  const d = desc.replace(/'/g, "''");
  return [
    `drawtext=fontfile='${FONT_B}':text='${t}':fontcolor=white:fontsize=34:x=40:y=h-96:box=1:boxcolor=black@0.55:boxborderw=14`,
    `drawtext=fontfile='${FONT_R}':text='${d}':fontcolor=white:fontsize=20:x=44:y=h-54:box=1:boxcolor=black@0.4:boxborderw=9`,
  ].join(',');
}

function encodeClip(inWebm, outMp4, vf) {
  ff(['-i', inWebm, '-vf', vf, '-c:v', 'libx264', '-preset', 'medium', '-crf', '20',
      '-pix_fmt', 'yuv420p', '-r', '30', '-an', outMp4]);
}

function makeCard(outMp4, lines, dur = 4) {
  // lines: [{ text, size, y }]
  const vf = lines.map((l) =>
    `drawtext=fontfile='${l.bold ? FONT_B : FONT_R}':text='${l.text.replace(/'/g, "''")}':fontcolor=white:fontsize=${l.size}:x=(w-tw)/2:y=${l.y}:box=1:boxcolor=black@0.35:boxborderw=${l.bold ? 20 : 12}`
  ).join(',');
  ff(['-f', 'lavfi', '-i', `color=c=0x10141f:s=${W}x${H}:d=${dur}:r=30`,
      '-vf', vf, '-c:v', 'libx264', '-preset', 'medium', '-crf', '20',
      '-pix_fmt', 'yuv420p', '-r', '30', '-an', outMp4]);
}

(async () => {
  fs.mkdirSync(CLIPS, { recursive: true });

  // ---------- 1. record clips ----------
  const browser = await chromium.launch({ executablePath: EDGE, headless: true });
  const ctx = await browser.newContext({
    viewport: { width: W, height: H },
    recordVideo: { dir: CLIPS, size: { width: W, height: H } },
  });

  const clipFiles = [];
  for (const seg of SEGMENTS) {
    const page = await ctx.newPage();
    const video = page.video();
    await page.goto(BASE + seg.path, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1200);

    if (seg.login) {
      if (page.url().includes('/login')) {
        await page.fill('input[name="user"]', USER);
        await page.fill('input[name="password"]', PASS);
        await page.click('button[type="submit"]');
      }
      await page.waitForTimeout(2500); // let dashboard render
    }

    if (seg.tabs) {
      // click through the security tabs in order
      const tabs = await page.locator('.tabbar button').all();
      for (const tb of tabs) {
        await tb.click();
        await page.waitForTimeout(4500);
      }
    }

    // optional gentle scroll to show more rows
    if (seg.scroll) {
      await page.mouse.wheel(0, 600);
      await page.waitForTimeout(1500);
      await page.mouse.wheel(0, -600);
      await page.waitForTimeout(1500);
    }

    await page.waitForTimeout(seg.dwell);
    await page.close();
    const videoPath = await video.path();
    const dest = path.join(CLIPS, seg.file + '.webm');
    fs.copyFileSync(videoPath, dest);
    clipFiles.push(dest);
    console.log(`recorded ${seg.file}  (${Math.round(fs.statSync(dest).size / 1024)} KB)`);
  }
  await ctx.close();
  await browser.close();

  // ---------- 2. overlay + encode each clip ----------
  const encoded = [];
  for (const seg of SEGMENTS) {
    const src = path.join(CLIPS, seg.file + '.webm');
    const out = path.join(CLIPS, seg.file + '.mp4');
    encodeClip(src, out, lowerThird(seg.title, seg.desc));
    encoded.push(out);
    console.log(`encoded ${seg.file}.mp4`);
  }

  // ---------- 3. title + end cards ----------
  const titleCard = path.join(CLIPS, '00-title.mp4');
  makeCard(titleCard, [
    { text: 'IRIS Portico', size: 64, y: 340, bold: true },
    { text: 'A Self-Service Management Portal for InterSystems IRIS', size: 26, y: 450 },
    { text: 'InterSystems Programming Contest #48', size: 20, y: 500 },
  ], 5);
  const endCard = path.join(CLIPS, '99-end.mp4');
  makeCard(endCard, [
    { text: 'Thank You', size: 56, y: 380, bold: true },
    { text: 'Built with the IRIS v2 admin API + Angular', size: 22, y: 470 },
  ], 5);
  console.log('generated title + end cards');

  // ---------- 4. concat ----------
  const listFile = path.join(OUT, 'concat.txt');
  const order = [titleCard, ...encoded, endCard];
  fs.writeFileSync(listFile, order.map((f) => `file '${f.replace(/\\/g, '/')}'`).join('\n') + '\n');
  ff(['-f', 'concat', '-safe', '0', '-i', listFile, '-c', 'copy', FINAL]);
  console.log(`\nFINAL -> ${FINAL}`);
  console.log(`size: ${(fs.statSync(FINAL).size / 1024 / 1024).toFixed(2)} MB`);
})().catch((e) => { console.error('FATAL: ' + e.stack); process.exit(2); });
