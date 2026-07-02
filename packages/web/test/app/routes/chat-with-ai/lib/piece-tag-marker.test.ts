import { describe, it, expect } from 'vitest';

import {
  pieceTagMarker,
  type PieceLogoHit,
  type PieceTagHastNode,
} from '@/app/routes/chat-with-ai/lib/piece-tag-marker';

const resolve = (name: string): PieceLogoHit | undefined =>
  name.toLowerCase() === 'gmail'
    ? { logoUrl: 'logo://gmail', displayName: 'Gmail' }
    : undefined;

describe('pieceTagMarker.strip', () => {
  it('replaces a marker with its bare name', () => {
    expect(pieceTagMarker.strip('send via {{app:Gmail}} now')).toBe(
      'send via Gmail now',
    );
  });

  it('handles multiple markers and trims inner whitespace', () => {
    expect(
      pieceTagMarker.strip('{{app: Attio }} then {{app:Slack}}'),
    ).toBe('Attio then Slack');
  });

  it('leaves text without markers untouched', () => {
    expect(pieceTagMarker.strip('no markers here')).toBe('no markers here');
  });
});

describe('pieceTagMarker.splitTextNode', () => {
  it('returns null when there is no marker', () => {
    expect(
      pieceTagMarker.splitTextNode({ value: 'plain text', resolve }),
    ).toBeNull();
  });

  it('injects a carrier element for a resolved app', () => {
    const nodes = pieceTagMarker.splitTextNode({
      value: 'send via {{app:Gmail}} now',
      resolve,
    });
    expect(nodes).not.toBeNull();
    expect(nodes).toHaveLength(3);
    expect(nodes?.[0]).toEqual({ type: 'text', value: 'send via ' });
    const tag = nodes?.[1];
    expect(tag?.type).toBe('element');
    expect(tag?.tagName).toBe(pieceTagMarker.tagName);
    expect(tag?.properties?.logourl).toBe('logo://gmail');
    expect(tag?.children?.[0]).toEqual({ type: 'text', value: 'Gmail' });
    expect(nodes?.[2]).toEqual({ type: 'text', value: ' now' });
  });

  it('degrades an unresolved app to plain text', () => {
    const nodes = pieceTagMarker.splitTextNode({
      value: 'try {{app:Unknownia}} ok',
      resolve,
    });
    expect(nodes?.every((n) => n.type === 'text')).toBe(true);
    expect(nodes?.map((n) => n.value).join('')).toBe('try Unknownia ok');
  });
});

describe('pieceTagMarker.apply', () => {
  it('decorates prose but skips code blocks', () => {
    const tree: PieceTagHastNode = {
      type: 'root',
      children: [
        {
          type: 'element',
          tagName: 'p',
          properties: {},
          children: [{ type: 'text', value: 'open {{app:Gmail}} fast' }],
        },
        {
          type: 'element',
          tagName: 'code',
          properties: {},
          children: [{ type: 'text', value: '{{app:Gmail}}' }],
        },
      ],
    };

    pieceTagMarker.apply({ tree, resolve });

    const prose = tree.children?.[0].children ?? [];
    expect(prose).toHaveLength(3);
    expect(prose[1].tagName).toBe(pieceTagMarker.tagName);
    expect(prose[1].properties?.logourl).toBe('logo://gmail');

    const code = tree.children?.[1].children ?? [];
    expect(code).toEqual([{ type: 'text', value: '{{app:Gmail}}' }]);
  });
});
