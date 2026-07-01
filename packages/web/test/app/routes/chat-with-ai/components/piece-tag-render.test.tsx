// @vitest-environment jsdom
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it, expect } from 'vitest';

import { Markdown } from '@/components/prompt-kit/markdown';
import { PieceTagInline } from '@/app/routes/chat-with-ai/components/previews/piece-tag';
import {
  pieceTagMarker,
  type PieceLogoHit,
  type PieceTagHastNode,
} from '@/app/routes/chat-with-ai/lib/piece-tag-marker';

const resolve = (name: string): PieceLogoHit | undefined =>
  name.toLowerCase() === 'gmail'
    ? { logoUrl: 'logo://gmail.png', displayName: 'Gmail' }
    : undefined;

const pieceTagPlugin = () => (tree: PieceTagHastNode) =>
  pieceTagMarker.apply({ tree, resolve });

function renderMarkdown(markdown: string): string {
  return renderToStaticMarkup(
    createElement(Markdown, {
      components: { data: PieceTagInline },
      rehypePlugins: [pieceTagPlugin],
      children: markdown,
    }),
  );
}

describe('piece tag rendering through react-markdown', () => {
  it('renders a resolved app as an inline logo + name', () => {
    const html = renderMarkdown('Send it via {{app:Gmail}} now.');
    expect(html).toContain('logo://gmail.png');
    expect(html).toContain('<img');
    expect(html).toContain('Gmail');
    expect(html).not.toContain('{{app:');
  });

  it('renders an unresolved app as plain text, no broken image', () => {
    const html = renderMarkdown('Try {{app:Unknownia}} today.');
    expect(html).toContain('Unknownia');
    expect(html).not.toContain('logo://');
    expect(html).not.toContain('<img');
    expect(html).not.toContain('{{app:');
  });

  it('leaves a marker inside inline code untouched', () => {
    const html = renderMarkdown('use `{{app:Gmail}}` literally');
    expect(html).toContain('{{app:Gmail}}');
    expect(html).not.toContain('logo://');
  });
});
