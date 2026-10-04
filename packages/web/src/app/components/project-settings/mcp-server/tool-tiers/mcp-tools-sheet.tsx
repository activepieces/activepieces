import { t } from 'i18next';
import { Fragment } from 'react';

import { TextWithTooltip } from '@/components/custom/text-with-tooltip';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemSeparator,
  ItemTitle,
} from '@/components/ui/item';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { adminControl } from '@/lib/admin-control';

import { McpToolTierGroup, mcpToolTiers } from './mcp-tool-tiers';

export function McpToolsSheet({
  tier,
  onClose,
  offTools,
  platformDisabledTools,
  readOnly,
  onToggleTool,
  onSetAll,
}: McpToolsSheetProps) {
  return (
    <Sheet open={tier !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:w-[544px] sm:max-w-[544px]">
        {tier !== null && (
          <TierTools
            tier={tier}
            offTools={offTools}
            platformDisabledTools={platformDisabledTools}
            readOnly={readOnly}
            onToggleTool={onToggleTool}
            onSetAll={onSetAll}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

function TierTools({
  tier,
  offTools,
  platformDisabledTools,
  readOnly,
  onToggleTool,
  onSetAll,
}: TierToolsProps) {
  const copy = mcpToolTiers.copyOf(tier.id);
  const editableNames = tier.tools
    .map((tool) => tool.name)
    .filter((name) => !platformDisabledTools.includes(name));
  const allOn = editableNames.every((name) => !offTools.includes(name));
  const canSetAll = !tier.locked && !readOnly && editableNames.length > 0;
  return (
    <>
      <SheetHeader className="shrink-0 border-b px-6 py-4 pr-12">
        <SheetTitle>{copy.label}</SheetTitle>
        <div className="flex items-center justify-between gap-4">
          <SheetDescription>
            {tier.locked
              ? t('Always on. Other tools need these to work.')
              : editableNames.length === 0
              ? t('A platform admin turned these off for every project.')
              : readOnly
              ? t('You can see these tools, but your role cannot change them.')
              : t('Turn a tool off to stop MCP clients from calling it.')}
          </SheetDescription>
          {canSetAll && (
            <Button
              variant="outline"
              size="sm"
              className="shrink-0"
              {...adminControl('mcp.tools-all.run')}
              onClick={() =>
                onSetAll({ names: editableNames, enabled: !allOn })
              }
            >
              {allOn ? t('Turn all off') : t('Turn all on')}
            </Button>
          )}
        </div>
      </SheetHeader>

      <ItemGroup className="flex-1 overflow-y-auto px-6 py-2">
        {tier.tools.map((tool, index) => {
          const offForPlatform = platformDisabledTools.includes(tool.name);
          return (
            <Fragment key={tool.name}>
              {index > 0 && <ItemSeparator />}
              <Item size="sm" className="px-0">
                <ItemContent>
                  <ItemTitle className="flex min-w-0 items-baseline gap-2">
                    <span>{mcpToolTiers.titleOf(tool.name)}</span>
                    <TextWithTooltip tooltipMessage={tool.name}>
                      <code className="truncate font-mono text-xs font-normal text-gray-11">
                        {tool.name}
                      </code>
                    </TextWithTooltip>
                    {offForPlatform && (
                      <Badge variant="neutral" className="shrink-0 font-normal">
                        {t('Off for the platform')}
                      </Badge>
                    )}
                  </ItemTitle>
                  <ItemDescription>{tool.description}</ItemDescription>
                </ItemContent>
                {!tier.locked && (
                  <ItemActions>
                    <Switch
                      {...adminControl('mcp.tool.toggle')}
                      checked={!offTools.includes(tool.name)}
                      disabled={readOnly || offForPlatform}
                      onCheckedChange={(checked) =>
                        onToggleTool({
                          name: tool.name,
                          enabled: checked === true,
                        })
                      }
                      aria-label={mcpToolTiers.titleOf(tool.name)}
                    />
                  </ItemActions>
                )}
              </Item>
            </Fragment>
          );
        })}
      </ItemGroup>
    </>
  );
}

type McpToolsSheetProps = {
  tier: McpToolTierGroup | null;
  onClose: () => void;
  offTools: string[];
  platformDisabledTools: string[];
  readOnly: boolean;
  onToggleTool: (params: { name: string; enabled: boolean }) => void;
  onSetAll: (params: { names: string[]; enabled: boolean }) => void;
};

type TierToolsProps = Omit<McpToolsSheetProps, 'tier' | 'onClose'> & {
  tier: McpToolTierGroup;
};
