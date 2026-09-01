import { PieceMetadataModelSummary } from '@activepieces/pieces-framework';
import { t } from 'i18next';
import { Bot, Settings2, Table2, Workflow } from 'lucide-react';
import { ComponentType, ReactNode, useMemo, useState } from 'react';

import { mcpHooks } from '@/app/components/project-settings/mcp-server/utils/mcp-hooks';
import { getToolCategories } from '@/app/components/project-settings/mcp-server/utils/mcp-tools-metadata';
import ImageWithFallback from '@/components/custom/image-with-fallback';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { piecesHooks } from '@/features/pieces/hooks/pieces-hooks';
import { pieceSearchUtils } from '@/features/pieces/utils/piece-search-utils';
import { authenticationSession } from '@/lib/authentication-session';

import { PageBand } from './page-band';

export function CapabilitiesSection() {
  const projectId = authenticationSession.getProjectId() ?? '';
  const { data: mcpServer } = mcpHooks.useMcpServer(projectId);
  const { mutate: updateMcpServer, isPending } =
    mcpHooks.useUpdateMcpServer(projectId);
  const { pieces, isLoading } = piecesHooks.usePieces({
    skipProjectFilter: true,
  });
  const tiles = useMemo(() => popularFirst(pieces ?? []), [pieces]);
  const disabledTools = mcpServer?.disabledTools ?? [];

  const areas = controlAreas();
  const controlToolNames = areas.flatMap((area) => area.toolNames);
  const isEnabled = (toolNames: string[]) =>
    toolNames.length > 0 &&
    toolNames.some((name) => !disabledTools.includes(name));

  const setTools = ({
    toolNames,
    enabled,
  }: {
    toolNames: string[];
    enabled: boolean;
  }) => {
    const next = enabled
      ? disabledTools.filter((name) => !toolNames.includes(name))
      : Array.from(new Set([...disabledTools, ...toolNames]));
    updateMcpServer({ disabledTools: next });
  };

  return (
    <div className="flex-1 border-t bg-muted/30 pb-10 pt-8">
      <PageBand className="flex flex-col gap-6 lg:px-14">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-bold leading-7 tracking-tight">
            {t('What your AI can do')}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t('Toggle what connected clients can touch.')}
          </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <CapabilityCard
            topRow={
              <ConnectorLogos tiles={tiles.slice(0, 6)} isLoading={isLoading} />
            }
            title={
              tiles.length > 0
                ? t('{count} connectors', { count: tiles.length })
                : t('Connectors')
            }
            description={t(
              'Act in your connected apps: send the Slack message, update the CRM, draft the email.',
            )}
            trailing={
              <Switch
                checked={isEnabled([RUN_ACTION_TOOL])}
                disabled={!mcpServer || isPending}
                onCheckedChange={(checked) =>
                  setTools({ toolNames: [RUN_ACTION_TOOL], enabled: checked })
                }
                aria-label={t('Connectors')}
              />
            }
          />
          <ControlCard
            areas={areas}
            enabled={isEnabled(controlToolNames)}
            isPending={!mcpServer || isPending}
            isAreaEnabled={(area) => isEnabled(area.toolNames)}
            onToggleAll={(checked) =>
              setTools({ toolNames: controlToolNames, enabled: checked })
            }
            onToggleArea={({ area, checked }) =>
              setTools({ toolNames: area.toolNames, enabled: checked })
            }
          />
        </div>
      </PageBand>
    </div>
  );
}

function CapabilityCard({
  topRow,
  title,
  description,
  trailing,
}: {
  topRow: ReactNode;
  title: string;
  description: string;
  trailing: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-lg border bg-background p-5">
      <div className="flex items-start justify-between gap-3">
        {topRow}
        <div className="flex shrink-0 items-center gap-1.5">{trailing}</div>
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-lg font-semibold tracking-tight">{title}</span>
        <span className="text-sm leading-relaxed text-muted-foreground">
          {description}
        </span>
      </div>
    </div>
  );
}

function ConnectorLogos({
  tiles,
  isLoading,
}: {
  tiles: PieceMetadataModelSummary[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="flex gap-1.5">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="size-9 rounded-md" />
        ))}
      </div>
    );
  }
  return (
    <div className="flex gap-1.5">
      {tiles.map((tile) => (
        <span
          key={tile.name}
          title={tile.displayName}
          className="flex size-9 shrink-0 items-center justify-center rounded-md border bg-background"
        >
          <ImageWithFallback
            src={tile.logoUrl}
            alt={tile.displayName}
            className="size-5"
          />
        </span>
      ))}
    </div>
  );
}

function ProductIcons() {
  return (
    <div className="flex gap-1.5">
      {PRODUCT_ICONS.map(({ key, icon: Icon }) => (
        <span
          key={key}
          className="flex size-9 shrink-0 items-center justify-center rounded-md border bg-muted/40"
        >
          <Icon className="size-4.5 text-foreground/70" />
        </span>
      ))}
    </div>
  );
}

function ControlCard({
  areas,
  enabled,
  isPending,
  isAreaEnabled,
  onToggleAll,
  onToggleArea,
}: {
  areas: ControlArea[];
  enabled: boolean;
  isPending: boolean;
  isAreaEnabled: (area: ControlArea) => boolean;
  onToggleAll: (checked: boolean) => void;
  onToggleArea: (params: { area: ControlArea; checked: boolean }) => void;
}) {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <CapabilityCard
      topRow={<ProductIcons />}
      title={t('Control Activepieces')}
      description={t(
        'Let your AI build, edit, and run your flows and tables, one place for everything it makes.',
      )}
      trailing={
        <>
          {(enabled || settingsOpen) && (
            <Popover open={settingsOpen} onOpenChange={setSettingsOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 text-muted-foreground"
                  aria-label={t('Choose what it can control')}
                >
                  <Settings2 className="size-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-60 p-2">
                <div className="flex flex-col gap-0.5">
                  <span className="px-2 pb-1 pt-0.5 text-xs font-medium text-muted-foreground">
                    {t('Quick toggles')}
                  </span>
                  <QuickToggleRow
                    icon={Bot}
                    label={t('Agents')}
                    hint={t('Coming soon')}
                    checked={false}
                    disabled={true}
                  />
                  {areas.map((area) => (
                    <QuickToggleRow
                      key={area.key}
                      icon={area.icon}
                      label={area.label}
                      checked={isAreaEnabled(area)}
                      disabled={isPending}
                      onCheckedChange={(checked) =>
                        onToggleArea({ area, checked })
                      }
                    />
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          )}
          <Switch
            checked={enabled}
            disabled={isPending}
            onCheckedChange={onToggleAll}
            aria-label={t('Control Activepieces')}
          />
        </>
      }
    />
  );
}

function QuickToggleRow({
  icon: Icon,
  label,
  hint,
  checked,
  disabled,
  onCheckedChange,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  hint?: string;
  checked: boolean;
  disabled?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-md px-2 py-1.5 hover:bg-muted/50">
      <Icon className="size-4 shrink-0 text-muted-foreground" />
      <span className="min-w-0 flex-1 truncate text-sm">{label}</span>
      {hint && (
        <span className="shrink-0 text-xs text-muted-foreground">{hint}</span>
      )}
      <Switch
        checked={checked}
        disabled={disabled}
        onCheckedChange={onCheckedChange}
        aria-label={label}
      />
    </div>
  );
}

function controlAreas(): ControlArea[] {
  const categories = getToolCategories({ toolSearchEnabled: false });
  const categoryTools = (label: string) =>
    categories
      .find((category) => category.label === label)
      ?.tools.map((tool) => tool.name) ?? [];
  return [
    {
      key: 'flows',
      label: t('Flows'),
      icon: Workflow,
      toolNames: [
        ...FLOW_CATEGORY_LABELS.flatMap(categoryTools),
        ...FLOW_RUN_TOOLS,
      ],
    },
    {
      key: 'tables',
      label: t('Tables'),
      icon: Table2,
      toolNames: categoryTools('Tables'),
    },
  ];
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

const RUN_ACTION_TOOL = 'ap_run_action';

const FLOW_CATEGORY_LABELS = [
  'Flow Management',
  'Flow Building',
  'Router & Branching',
  'Annotations',
];

const FLOW_RUN_TOOLS = ['ap_test_flow', 'ap_test_step', 'ap_retry_run'];

const PRODUCT_ICONS: {
  key: string;
  icon: ComponentType<{ className?: string }>;
}[] = [
  { key: 'agents', icon: Bot },
  { key: 'flows', icon: Workflow },
  { key: 'tables', icon: Table2 },
];

type ControlArea = {
  key: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  toolNames: string[];
};
