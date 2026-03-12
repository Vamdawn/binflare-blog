import { describe, expect, it } from 'vitest';

describe('dom smoke', () => {
  it('supports toBeInTheDocument matcher', () => {
    document.body.innerHTML = '<div data-testid="x">x</div>';
    expect(document.querySelector('[data-testid="x"]')).toBeInTheDocument();
  });
});
