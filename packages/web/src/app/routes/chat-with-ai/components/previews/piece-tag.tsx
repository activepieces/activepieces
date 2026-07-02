import React, { useMemo } from 'react';
import { type Options } from 'react-markdown';

import { piecesHooks } from '@/features/pieces/hooks/pieces-hooks';

import {
  pieceTagMarker,
  type PieceLogoHit,
  type PieceTagHastNode,
} from '../../lib/piece-tag-marker';

function PieceTagInline({
  node,
  children,
}: {
  node?: PieceTagHastNode;
  children?: React.ReactNode;
}) {
  const logoUrl =
    node && typeof node.properties?.logourl === 'string'
      ? node.properties.logourl
      : undefined;

  if (!logoUrl) return <>{children}</>;

  return (
    <span className="inline-flex items-center gap-1 align-middle whitespace-nowrap">
      <img
        src={logoUrl}
        alt=""
        loading="lazy"
        className="inline-block size-3.5 shrink-0 rounded-sm object-contain"
      />
      {children}
    </span>
  );
}

function usePieceTagPlugins(): Options['rehypePlugins'] {
  const { pieces } = piecesHooks.usePieces({});

  return useMemo(() => {
    const index = new Map<string, PieceLogoHit>();
    for (const piece of pieces ?? []) {
      if (!piece.logoUrl || !piece.displayName) continue;
      const hit: PieceLogoHit = {
        logoUrl: piece.logoUrl,
        displayName: piece.displayName,
      };
      const display = piece.displayName.toLowerCase();
      index.set(display, hit);
      index.set(display.replace(/\s+/g, ''), hit);
      if (piece.name) index.set(piece.name.toLowerCase(), hit);
    }

    const resolve = (name: string): PieceLogoHit | undefined => {
      const key = name.toLowerCase();
      return index.get(key) ?? index.get(key.replace(/\s+/g, ''));
    };

    const plugin = () => (tree: PieceTagHastNode) =>
      pieceTagMarker.apply({ tree, resolve });
    return [plugin];
  }, [pieces]);
}

export { PieceTagInline, usePieceTagPlugins };
