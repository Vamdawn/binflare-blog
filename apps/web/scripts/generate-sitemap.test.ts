import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { collectPublishedPostSlugs } from './generate-sitemap.mjs';

const tempDirectories: string[] = [];

afterEach(() => {
  for (const dir of tempDirectories) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
  tempDirectories.length = 0;
});

describe('collectPublishedPostSlugs', () => {
  it('excludes draft posts', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'binflare-posts-'));
    tempDirectories.push(dir);

    fs.writeFileSync(
      path.join(dir, 'draft.md'),
      ['---', 'title: Draft', 'date: 2026-03-11', 'draft: true', '---', '', 'draft'].join('\n'),
      'utf-8',
    );
    fs.writeFileSync(
      path.join(dir, 'published.md'),
      ['---', 'title: Published', 'date: 2026-03-11', '---', '', 'published'].join('\n'),
      'utf-8',
    );

    const slugs = collectPublishedPostSlugs(dir);
    expect(slugs).toEqual(['published']);
  });
});
