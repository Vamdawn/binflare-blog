import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { MarkdownRenderer } from './MarkdownRenderer';

afterEach(() => {
  cleanup();
});

describe('MarkdownRenderer', () => {
  it('renders markdown table syntax as html table', () => {
    const content = [
      '| 工具 | 说明 |',
      '| --- | --- |',
      '| Claude Code | 编码代理 |',
      '| Codex | 代码助手 |',
    ].join('\n');

    render(<MarkdownRenderer content={content} />);

    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: '工具' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Claude Code' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: '代码助手' })).toBeInTheDocument();
  });
});
