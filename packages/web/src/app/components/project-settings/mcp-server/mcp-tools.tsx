import { Permission } from '@activepieces/core-utils';
import { ApFlagId } from '@activepieces/shared';
import { t } from 'i18next';
import { Lock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useDebouncedCallback } from 'use-debounce';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { flagsHooks } from '@/hooks/flags-hooks';
import { cn } from '@/lib/utils';

import { getToolCategories } from './utils/mcp-tools-metadata';

export function McpTools({
  disabledTools: externalDisabledTools,
  platformDisabledTools = [],
  projectId,
  isPending,
  onUpdateDisabledTools,
}: McpToolsProps) {
  const { checkAccess } = useAuthorization(projectId);
  const canWrite = checkAccess(Permission.WRITE_MCP);
  const { data: toolSearchEnabled } = flagsHooks.useFlag<boolean>(
    ApFlagId.TOOL_SEARCH_ENABLED,
  );
  const toolCategories = getToolCategories({
    toolSearchEnabled: toolSearchEnabled ?? false,
  });
  const [disabledTools, setDisabledTools] = useState<string[]>(
    () => externalDisabledTools ?? [],
  );

  useEffect(() => {
    if (!isPending) {
      setDisabledTools(externalDisabledTools ?? []);
    }
  }, [externalDisabledTools, isPending]);

  const saveDisabledTools = useDebouncedCallback((tools: string[]) => {
    onUpdateDisabledTools(tools);
  }, 300);

  const toggleTool = (name: string, checked: boolean) => {
    if (!canWrite) {
      return;
    }
    const next = checked
      ? disabledTools.filter((n) => n !== name)
      : [...disabledTools, name];
    setDisabledTools(next);
    saveDisabledTools(next);
  };

  const toggleCategory = (toolNames: string[], checked: boolean) => {
    if (!canWrite) {
      return;
    }
    const next = checked
      ? disabledTools.filter((n) => !toolNames.includes(n))
      : [
          ...disabledTools,
          ...toolNames.filter((n) => !disabledTools.includes(n)),
        ];
    setDisabledTools(next);
    saveDisabledTools(next);
  };

  return (
    <div className="flex flex-col gap-2">
      {!canWrite && (
        <p className="text-xs text-muted-foreground">
          {t('You can see these tools, but your role cannot change them.')}
        </p>
      )}
      <Accordion type="multiple" className="space-y-2">
        {toolCategories.map((category) => {
          const toolNames = category.tools.map((tool) => tool.name);
          const isPlatformOff = (name: string) =>
            !category.locked && platformDisabledTools.includes(name);
          const editableNames = toolNames.filter((n) => !isPlatformOff(n));
          const enabledInCategory = category.locked
            ? toolNames
            : editableNames.filter((n) => !disabledTools.includes(n));
          const allChecked =
            editableNames.length > 0 &&
            enabledInCategory.length === editableNames.length;
          const someChecked =
            enabledInCategory.length > 0 &&
            enabledInCategory.length < editableNames.length;

          return (
            <AccordionItem key={category.label} value={category.label}>
              <AccordionTrigger className="bg-muted/40 hover:no-underline">
                <div className="flex items-center gap-3">
                  {category.locked ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Lock className="h-4 w-4 text-muted-foreground shrink-0" />
                      </TooltipTrigger>
                      <TooltipContent>
                        {t('Required by other tools — always enabled')}
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <Checkbox
                      checked={
                        allChecked
                          ? true
                          : someChecked
                          ? 'indeterminate'
                          : false
                      }
                      disabled={!canWrite || editableNames.length === 0}
                      onCheckedChange={(v) =>
                        toggleCategory(editableNames, v === true)
                      }
                      onClick={(e) => e.stopPropagation()}
                      aria-label={t('Select all in {{category}}', {
                        category: category.label,
                      })}
                    />
                  )}
                  <span className="text-sm font-semibold">
                    {t(category.label)}
                  </span>
                  {category.locked && (
                    <span className="text-xs text-muted-foreground ml-1">
                      ({t('always enabled')})
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {enabledInCategory.length}/{toolNames.length}
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="p-0 pl-6">
                <div className="divide-y">
                  {category.tools.map((tool) => {
                    const platformOff = isPlatformOff(tool.name);
                    const isChecked =
                      !platformOff &&
                      (category.locked || !disabledTools.includes(tool.name));
                    const isEditable =
                      !category.locked && !platformOff && canWrite;
                    return (
                      <div
                        key={tool.name}
                        className="flex items-start gap-3 px-4 py-3"
                      >
                        {category.locked ? (
                          <div className="h-4 w-4 shrink-0 mt-0.5" />
                        ) : (
                          <Checkbox
                            id={tool.name}
                            checked={isChecked}
                            disabled={platformOff || !canWrite}
                            onCheckedChange={(v) =>
                              toggleTool(tool.name, v === true)
                            }
                            className="mt-0.5"
                          />
                        )}
                        <label
                          htmlFor={isEditable ? tool.name : undefined}
                          className={cn(
                            'flex flex-col gap-0.5',
                            isEditable && 'cursor-pointer',
                            platformOff && 'opacity-60',
                          )}
                        >
                          <span className="flex items-center gap-2">
                            <span className="text-sm font-mono font-medium">
                              {tool.name}
                            </span>
                            {platformOff && (
                              <Badge variant="outline" className="font-normal">
                                {t('Off for the whole platform')}
                              </Badge>
                            )}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {platformOff
                              ? t(
                                  'A platform admin switched this off for the whole platform, so no client can call it here or on the platform MCP server.',
                                )
                              : tool.description}
                          </span>
                        </label>
                      </div>
                    );
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}

type McpToolsProps = {
  disabledTools: string[] | null;
  platformDisabledTools?: string[];
  projectId?: string;
  isPending: boolean;
  onUpdateDisabledTools: (tools: string[]) => void;
};
