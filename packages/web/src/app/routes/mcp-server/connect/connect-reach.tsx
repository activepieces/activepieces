import { PieceMetadataModelSummary } from '@activepieces/pieces-framework';
import { ApFlagId } from '@activepieces/shared';
import { t } from 'i18next';
import {
  ChevronRight,
  Eye,
  LucideIcon,
  Pencil,
  Play,
  Trash2,
} from 'lucide-react';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  McpToolTier,
  McpToolTierGroup,
  mcpToolTiers,
} from '@/app/components/project-settings/mcp-server/tool-tiers/mcp-tool-tiers';
import { mcpHooks } from '@/app/components/project-settings/mcp-server/utils/mcp-hooks';
import { getToolCategories } from '@/app/components/project-settings/mcp-server/utils/mcp-tools-metadata';
import { LogoPlate } from '@/components/custom/logo-plate';
import { PageSection } from '@/components/custom/page';
import { Panel, SettingRow, SettingRows } from '@/components/custom/panel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { piecesHooks } from '@/features/pieces/hooks/pieces-hooks';
import { pieceSearchUtils } from '@/features/pieces/utils/piece-search-utils';
import { flagsHooks } from '@/hooks/flags-hooks';

import { useMcpNav } from '../mcp-nav';

export function ConnectReach() {
  const nav = useMcpNav();
  const navigate = useNavigate();
  return (
    <PageSection
      title={t('What your AI can reach')}
      description={t(
        'Built-in tools to work with your flows, plus every piece action in the project.',
      )}
      action={
        <Button variant="outline" onClick={() => nav.showTab('tools')}>
          {t('Manage tools')}
        </Button>
      }
    >
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
        <ToolTiersSummary projectId={nav.projectId} />
        <PiecesSummary
          onBrowse={() => navigate('/mcp-server/tools?segment=pieces')}
        />
      </div>
    </PageSection>
  );
}

function ToolTiersSummary({ projectId }: { projectId: string | null }) {
  const { data: toolSearchEnabled } = flagsHooks.useFlag<boolean>(
    ApFlagId.TOOL_SEARCH_ENABLED,
  );
  const { data: mcpServer, isLoading } = mcpHooks.useMcpServer(projectId ?? '');
  const tiers = useMemo(
    () =>
      mcpToolTiers.groupByTier(
        getToolCategories({ toolSearchEnabled: toolSearchEnabled ?? false }),
      ),
    [toolSearchEnabled],
  );
  const offTools = [
    ...(mcpServer?.disabledTools ?? []),
    ...(mcpServer?.platformDisabledTools ?? []),
  ];
  const total = tiers.reduce((sum, tier) => sum + tier.tools.length, 0);

  return (
    <Panel
      flush
      title={t('Built-in tools')}
      description={t('{total} tools, grouped by what a wrong call costs.', {
        total,
      })}
    >
      <SettingRows>
        {tiers.map((tier) => {
          const Icon = TIER_ICON[tier.id];
          const copy = mcpToolTiers.copyOf(tier.id);
          return (
            <SettingRow
              key={tier.id}
              icon={<Icon className="text-gray-11" />}
              title={copy.label}
              description={copy.description}
            >
              {isLoading ? (
                <Skeleton className="h-6 w-14 rounded-md" />
              ) : (
                mcpServer && <TierStatus tier={tier} offTools={offTools} />
              )}
            </SettingRow>
          );
        })}
      </SettingRows>
    </Panel>
  );
}

function TierStatus({
  tier,
  offTools,
}: {
  tier: McpToolTierGroup;
  offTools: string[];
}) {
  const enabled = mcpToolTiers.countEnabled({
    group: tier,
    disabledTools: offTools,
  });
  const total = tier.tools.length;
  if (enabled === total) {
    return (
      <Badge variant="success">{tier.locked ? t('Always on') : t('On')}</Badge>
    );
  }
  if (enabled === 0) {
    return <Badge variant="secondary">{t('Off')}</Badge>;
  }
  return (
    <Badge variant="outline">
      {t('{enabled} of {total} on', { enabled, total })}
    </Badge>
  );
}

function PiecesSummary({ onBrowse }: { onBrowse: () => void }) {
  const { pieces, isLoading } = piecesHooks.usePieces({
    skipProjectFilter: true,
  });
  const ranked = useMemo(() => popularFirst(pieces ?? []), [pieces]);
  const shown = ranked.slice(0, SHOWN_PIECES);
  const rest = ranked.length - shown.length;

  return (
    <Panel
      title={t('Pieces')}
      description={
        isLoading
          ? t('Every piece action your AI can run.')
          : t('{count} pieces your AI can run actions from.', {
              count: ranked.length,
            })
      }
    >
      <div className="flex flex-wrap gap-2">
        {isLoading
          ? Array.from({ length: SHOWN_PIECES }).map((_, index) => (
              <Skeleton key={index} className="size-9 rounded-lg" />
            ))
          : shown.map((piece) => (
              <LogoPlate
                key={piece.name}
                src={piece.logoUrl}
                alt={piece.displayName}
                title={piece.displayName}
                size="md"
                border
                className="rounded-lg"
              />
            ))}
      </div>
      {rest > 0 && (
        <Button variant="ghost" size="sm" className="w-fit" onClick={onBrowse}>
          {t('See all {count} pieces', { count: ranked.length })}
          <ChevronRight />
        </Button>
      )}
    </Panel>
  );
}

function popularFirst(
  pieces: PieceMetadataModelSummary[],
): PieceMetadataModelSummary[] {
  const rank = (piece: PieceMetadataModelSummary) => {
    const index = pieceSearchUtils.POPULAR_PIECES_NAMES.indexOf(piece.name);
    return index === -1 ? pieceSearchUtils.POPULAR_PIECES_NAMES.length : index;
  };
  return [...pieces].sort((a, b) => rank(a) - rank(b));
}

const SHOWN_PIECES = 30;

const TIER_ICON: Record<McpToolTier, LucideIcon> = {
  read: Eye,
  draft: Pencil,
  live: Play,
  delete: Trash2,
};
