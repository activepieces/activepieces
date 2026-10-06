import { Permission } from '@activepieces/core-utils';
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
import { Fragment, useEffect, useMemo, useState } from 'react';
import { useDebouncedCallback } from 'use-debounce';

import { ConfirmationDeleteDialog } from '@/components/custom/delete-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
} from '@/components/ui/item';
import { Switch } from '@/components/ui/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { flagsHooks } from '@/hooks/flags-hooks';
import { AdminControl, adminControl } from '@/lib/admin-control';
import { cn } from '@/lib/utils';

import { getToolCategories } from '../utils/mcp-tools-metadata';

import { McpToolTier, McpToolTierGroup, mcpToolTiers } from './mcp-tool-tiers';
import { McpToolsSheet } from './mcp-tools-sheet';

export function McpToolTierList({
  disabledTools: savedDisabledTools,
  platformDisabledTools = NO_TOOLS,
  scope,
  projectId,
  onUpdateDisabledTools,
}: McpToolTierListProps) {
  const { checkAccess } = useAuthorization(projectId);
  const readOnly = scope === 'project' && !checkAccess(Permission.WRITE_MCP);
  const { data: toolSearchEnabled } = flagsHooks.useFlag<boolean>(
    ApFlagId.TOOL_SEARCH_ENABLED,
  );
  const tiers = useMemo(
    () =>
      mcpToolTiers.groupByTier(
        getToolCategories({ toolSearchEnabled: toolSearchEnabled ?? false }),
      ),
    [toolSearchEnabled],
  );
  const [pendingDisabledTools, setPendingDisabledTools] = useState<
    string[] | null
  >(null);
  const disabledTools = pendingDisabledTools ?? savedDisabledTools ?? NO_TOOLS;
  const [openTierId, setOpenTierId] = useState<McpToolTier | null>(null);
  const [pendingDeleteTools, setPendingDeleteTools] = useState<string[] | null>(
    null,
  );
  const deleteToolNames = useMemo(
    () =>
      tiers
        .filter((tier) => tier.id === 'delete')
        .flatMap((tier) => tier.tools.map((tool) => tool.name)),
    [tiers],
  );
  const offTools = useMemo(
    () => [...new Set([...disabledTools, ...platformDisabledTools])],
    [disabledTools, platformDisabledTools],
  );

  const save = useDebouncedCallback((tools: string[]) => {
    onUpdateDisabledTools({
      tools,
      onSettled: () =>
        setPendingDisabledTools((current) =>
          current === tools ? null : current,
        ),
    });
  }, 300);

  useEffect(() => () => save.flush(), [save]);

  const applyToolsEnabled = ({
    names,
    enabled,
  }: {
    names: string[];
    enabled: boolean;
  }) => {
    const next = enabled
      ? disabledTools.filter((name) => !names.includes(name))
      : [...disabledTools, ...names.filter((n) => !disabledTools.includes(n))];
    setPendingDisabledTools(next);
    save(next);
  };

  const setToolsEnabled = ({
    names,
    enabled,
  }: {
    names: string[];
    enabled: boolean;
  }) => {
    if (readOnly) {
      return;
    }
    const editable = names.filter(
      (name) => !platformDisabledTools.includes(name),
    );
    const turnsOnDeleteTool =
      enabled &&
      editable.some(
        (name) =>
          deleteToolNames.includes(name) && disabledTools.includes(name),
      );
    if (turnsOnDeleteTool) {
      setPendingDeleteTools(editable);
      return;
    }
    applyToolsEnabled({ names: editable, enabled });
  };

  return (
    <div className="flex flex-col gap-3">
      {readOnly && (
        <p className="text-sm text-gray-11">
          {t('You can see these tools, but your role cannot change them.')}
        </p>
      )}
      <ItemGroup className="rounded-lg border bg-gray-1">
        {tiers.map((tier, index) => (
          <Fragment key={tier.id}>
            {index > 0 && <ItemSeparator />}
            <TierRow
              tier={tier}
              offTools={offTools}
              platformDisabledTools={platformDisabledTools}
              readOnly={readOnly}
              onOpenTools={() => setOpenTierId(tier.id)}
              onChange={(enabled) =>
                setToolsEnabled({
                  names: tier.tools.map((tool) => tool.name),
                  enabled,
                })
              }
            />
          </Fragment>
        ))}
      </ItemGroup>

      <McpToolsSheet
        tier={tiers.find((tier) => tier.id === openTierId) ?? null}
        onClose={() => setOpenTierId(null)}
        offTools={offTools}
        platformDisabledTools={platformDisabledTools}
        readOnly={readOnly}
        onToggleTool={({ name, enabled }) =>
          setToolsEnabled({ names: [name], enabled })
        }
        onSetAll={({ names, enabled }) => setToolsEnabled({ names, enabled })}
      />

      <ConfirmationDeleteDialog
        open={pendingDeleteTools !== null}
        onOpenChange={(open) => !open && setPendingDeleteTools(null)}
        title={t('Turn on Delete tools?')}
        message={
          scope === 'platform'
            ? t(
                'MCP clients will be able to use the delete tools you are turning on, in every project their user can edit, unless the project turned them off. Deleted items cannot be restored.',
              )
            : t(
                'MCP clients will be able to use the delete tools you are turning on in this project. Deleted items cannot be restored.',
              )
        }
        buttonText={t('Turn on')}
        entityName={t('Delete tools')}
        mutationFn={async () => {
          if (pendingDeleteTools !== null) {
            applyToolsEnabled({ names: pendingDeleteTools, enabled: true });
          }
          setPendingDeleteTools(null);
        }}
      />
    </div>
  );
}

function TierRow({
  tier,
  offTools,
  platformDisabledTools,
  readOnly,
  onOpenTools,
  onChange,
}: TierRowProps) {
  const copy = mcpToolTiers.copyOf(tier.id);
  const Icon = TIER_ICON[tier.id];
  const enabled = mcpToolTiers.countEnabled({
    group: tier,
    disabledTools: offTools,
  });
  const total = tier.tools.length;
  const editable = tier.tools.filter(
    (tool) => !platformDisabledTools.includes(tool.name),
  );
  const editableOn = editable.filter(
    (tool) => !offTools.includes(tool.name),
  ).length;
  const offForPlatform = !tier.locked && editable.length === 0;
  const isPartial = editableOn > 0 && editableOn < editable.length;
  const someOff = enabled > 0 && enabled < total;
  const countLabel = someOff
    ? t('{enabled} of {total} on', { enabled, total })
    : t('{total, plural, =1 {1 tool} other {# tools}}', { total });

  return (
    <Item>
      <ItemMedia variant="icon">
        <Icon className="size-4 text-gray-11" />
      </ItemMedia>
      <ItemContent>
        <ItemTitle>
          {copy.label}
          {tier.locked && (
            <TitleBadge
              label={t('Always on')}
              tooltip={t('Other tools need these to work.')}
            />
          )}
          {offForPlatform && (
            <TitleBadge
              label={t('Off for the platform')}
              tooltip={t(
                'A platform admin turned these off for every project.',
              )}
            />
          )}
        </ItemTitle>
        <ItemDescription>{copy.description}</ItemDescription>
      </ItemContent>
      <ItemActions className="gap-4">
        <Button
          variant="ghost"
          size="sm"
          className={cn('text-gray-11', someOff && 'text-gray-12')}
          onClick={onOpenTools}
          {...adminControl(AdminControl.MCP_TIER_TOOLS_OPEN)}
          aria-label={t('{tier}: {status}', {
            tier: copy.label,
            status: countLabel,
          })}
        >
          {countLabel}
          <ChevronRight className="size-4" />
        </Button>
        <div className="flex w-8 justify-end">
          {!tier.locked && (
            <Switch
              {...adminControl(AdminControl.MCP_TIER_TOGGLE)}
              checked={editable.length > 0 && editableOn === editable.length}
              indeterminate={isPartial}
              disabled={readOnly || offForPlatform}
              onCheckedChange={(checked) => onChange(checked === true)}
              aria-label={
                isPartial
                  ? t('{tier}, {status}', {
                      tier: copy.label,
                      status: countLabel,
                    })
                  : copy.label
              }
            />
          )}
        </div>
      </ItemActions>
    </Item>
  );
}

function TitleBadge({ label, tooltip }: { label: string; tooltip: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant="neutral" className="font-normal" tabIndex={0}>
          {label}
        </Badge>
      </TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  );
}

const NO_TOOLS: string[] = [];

const TIER_ICON: Record<McpToolTier, LucideIcon> = {
  read: Eye,
  draft: Pencil,
  live: Play,
  delete: Trash2,
};

type McpToolTierListProps = {
  disabledTools: string[] | null;
  platformDisabledTools?: string[];
  scope: 'platform' | 'project';
  projectId?: string;
  onUpdateDisabledTools: (params: {
    tools: string[];
    onSettled: () => void;
  }) => void;
};

type TierRowProps = {
  tier: McpToolTierGroup;
  offTools: string[];
  platformDisabledTools: string[];
  readOnly: boolean;
  onOpenTools: () => void;
  onChange: (enabled: boolean) => void;
};
