import { t } from 'i18next';

import { TextWithTooltip } from '@/components/custom/text-with-tooltip';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
} from '@/components/ui/item';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';

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
      <SheetContent>
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
      <SheetHeader>
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
              onClick={() =>
                onSetAll({ names: editableNames, enabled: !allOn })
              }
            >
              {allOn ? t('Turn all off') : t('Turn all on')}
            </Button>
          )}
        </div>
      </SheetHeader>

      <SheetBody className="py-2">
        <ItemGroup>
          {tier.tools.map((tool) => {
            const offForPlatform = platformDisabledTools.includes(tool.name);
            return (
              <Item key={tool.name} size="sm" className="px-0">
                <ItemContent>
                  <ItemTitle className="flex min-w-0 items-baseline gap-2">
                    <span>{mcpToolTiers.titleOf(tool.name)}</span>
                    <TextWithTooltip tooltipMessage={tool.name}>
                      <code className="truncate font-mono text-xs font-normal text-gray-11">
                        {tool.name}
                      </code>
                    </TextWithTooltip>
                    {offForPlatform && (
                      <Badge variant="secondary">
                        {t('Off for the platform')}
                      </Badge>
                    )}
                  </ItemTitle>
                  <ItemDescription>{tool.description}</ItemDescription>
                </ItemContent>
                {!tier.locked && (
                  <ItemActions>
                    <Switch
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
            );
          })}
        </ItemGroup>
      </SheetBody>
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
