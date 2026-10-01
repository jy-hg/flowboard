import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(import.meta.dirname, '../..');
const read = (path: string) => readFileSync(resolve(root, path), 'utf8');

describe('SEO / GEO files (audit)', () => {
  it('robots.txt blocks /boards for everyone and links the sitemap', () => {
    const robots = read('public/robots.txt');
    const groups = robots.split(/\n\s*\n/).filter((g) => /User-agent/i.test(g));
    expect(groups.length).toBeGreaterThan(0);
    for (const group of groups) expect(group).toMatch(/Disallow:\s*\/boards/);
    expect(robots).toMatch(/^Sitemap:\s*https?:\/\/.+\/sitemap\.xml/m);
  });

  it.each(['public/sitemap.xml', 'public/llms.txt', 'public/site.webmanifest', 'public/favicon.svg'])(
    '%s exists',
    (file) => expect(existsSync(resolve(root, file))).toBe(true),
  );

  it('the web manifest is valid JSON with a name', () => {
    expect(JSON.parse(read('public/site.webmanifest')).name).toBeTruthy();
  });

  it('sitemap lists the public page but not /boards', () => {
    const sitemap = read('public/sitemap.xml');
    expect(sitemap).toContain('<loc>');
    expect(sitemap).not.toContain('/boards');
  });
});

describe('index.html head (audit)', () => {
  const html = read('index.html');

  it.each([
    ['title', /<title>[^<]{10,}<\/title>/],
    ['meta description', /<meta name="description" content="[^"]{50,}"/],
    ['canonical', /<link rel="canonical"/],
    ['robots', /<meta name="robots"/],
    ['theme-color', /<meta name="theme-color"/],
    ['manifest', /<link rel="manifest"/],
    ['apple-touch-icon', /<link rel="apple-touch-icon"/],
    ['og:title', /property="og:title"/],
    ['og:image', /property="og:image"/],
    ['twitter:card', /name="twitter:card"/],
  ])('has %s', (_name, pattern) => expect(html).toMatch(pattern));

  it('has valid WebApplication JSON-LD', () => {
    const json = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1];
    expect(JSON.parse(json!)['@type']).toBe('WebApplication');
  });

  it('ships crawlable content inside #root before JavaScript runs', () => {
    const rootHtml = html.match(/<div id="root">([\s\S]*?)<\/div>\s*<script/)?.[1] ?? '';
    expect(rootHtml).toMatch(/<h1>/);
    expect(rootHtml).toMatch(/<noscript>/);
  });
});

describe('vercel.json (audit)', () => {
  const config = JSON.parse(read('vercel.json'));
  const headersFor = (source: string) =>
    Object.fromEntries(
      config.headers.find((h: { source: string }) => h.source === source).headers.map((h: { key: string; value: string }) => [h.key, h.value]),
    );

  it('falls back to index.html for client routes but not for assets or files', () => {
    const { source, destination } = config.rewrites[0];
    expect(destination).toBe('/index.html');
    const re = new RegExp(`^${source}$`);
    expect(re.test('/boards/abc')).toBe(true);
    expect(re.test('/assets/app.js')).toBe(false);
    expect(re.test('/robots.txt')).toBe(false);
  });

  it('caches hashed assets immutably', () => {
    expect(headersFor('/assets/(.*)')['Cache-Control']).toBe('public, max-age=31536000, immutable');
  });

  it('sets basic security headers', () => {
    expect(headersFor('/(.*)')).toMatchObject({
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'X-Frame-Options': 'DENY',
    });
  });

  it('runs the tests before building so a failing test blocks deploys', () => {
    expect(config.buildCommand).toBe('npm test && npm run build');
  });
});

describe('performance config (audit)', () => {
  it('lazy-loads the authenticated pages', () => {
    const app = read('src/App.tsx');
    expect(app).toMatch(/lazy\(\(\) => import\('\.\/pages\/BoardsPage'\)/);
    expect(app).toMatch(/lazy\(\(\) => import\('\.\/pages\/BoardPage'\)/);
    expect(app).toMatch(/<Suspense/);
  });

  it('splits react and supabase into their own chunks', () => {
    const config = read('vite.config.ts');
    expect(config).toContain("'supabase'");
    expect(config).toContain("'react'");
  });
});
