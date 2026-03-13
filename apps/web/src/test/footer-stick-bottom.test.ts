import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const appCss = readFileSync(resolve(process.cwd(), 'apps/web/src/App.css'), 'utf8');

describe('site footer layout', () => {
  it('keeps footer at the bottom when page content is short', () => {
    expect(appCss).toMatch(/\.site-shell\s*\{[^}]*display:\s*flex;/s);
    expect(appCss).toMatch(/\.site-shell\s*\{[^}]*flex-direction:\s*column;/s);
    expect(appCss).toMatch(/\.site-shell\s*\{[^}]*min-height:\s*100vh;/s);
    expect(appCss).toMatch(/\.site-main\s*\{[^}]*flex:\s*1;/s);
    expect(appCss).toMatch(/\.site-shell\s*\{[^}]*padding:\s*2rem 1\.25rem 1\.25rem;/s);
    expect(appCss).toMatch(
      /@media\s*\(max-width:\s*720px\)\s*\{[\s\S]*?\.site-shell\s*\{[^}]*padding:\s*1\.4rem 0\.95rem 0\.8rem;/s,
    );
  });
});
