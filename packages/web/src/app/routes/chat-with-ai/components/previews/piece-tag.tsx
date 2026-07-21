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
    // Predefined share targets (set after the pieces so they always win): plain consumer names
    // with bundled brand logos, independent of which pieces exist or what they're called
    // ("WhatsApp", never "WhatsApp Business").
    for (const target of SHARE_TARGET_LOGOS) {
      index.set(target.displayName.toLowerCase(), target);
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

function brandLogoDataUri(color: string, path: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}"><path d="${path}"/></svg>`,
  )}`;
}

// Brand icon paths (Simple Icons, 24×24 viewBox) for the predefined share targets.
const DISCORD_PATH =
  'M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z';
const TELEGRAM_PATH =
  'M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z';
const WHATSAPP_PATH =
  'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z';

const SHARE_TARGET_LOGOS: PieceLogoHit[] = [
  {
    displayName: 'WhatsApp',
    logoUrl: brandLogoDataUri('#25D366', WHATSAPP_PATH),
  },
  {
    displayName: 'Telegram',
    logoUrl: brandLogoDataUri('#229ED9', TELEGRAM_PATH),
  },
  {
    displayName: 'Discord',
    logoUrl: brandLogoDataUri('#5865F2', DISCORD_PATH),
  },
];

export { PieceTagInline, usePieceTagPlugins };
