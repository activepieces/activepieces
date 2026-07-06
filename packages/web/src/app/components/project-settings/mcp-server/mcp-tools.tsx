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
import { Checkbox } from '@/components/ui/checkbox';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

import { TOOL_CATEGORIES } from './utils/mcp-tools-metadata';

type McpToolsProps = {
  disabledTools: string[] | null;
  isPending: boolean;
  onUpdateDisabledTools: (tools: string[]) => void;
};

export function McpTools({
  disabledTools: externalDisabledTools,
  isPending,
  onUpdateDisabledTools,
}: McpToolsProps) {
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
    const next = checked
      ? disabledTools.filter((n) => n !== name)
      : [...disabledTools, name];
    setDisabledTools(next);
    saveDisabledTools(next);
  };

  const toggleCategory = (toolNames: string[], checked: boolean) => {
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
    <Accordion type="multiple" className="space-y-2">
      {TOOL_CATEGORIES.map((category) => {
        const toolNames = category.tools.map((tool) => tool.name);
        const enabledInCategory = category.locked
          ? toolNames
          : toolNames.filter((n) => !disabledTools.includes(n));
        const allChecked = enabledInCategory.length === toolNames.length;
        const someChecked =
          enabledInCategory.length > 0 &&
          enabledInCategory.length < toolNames.length;

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
                      allChecked ? true : someChecked ? 'indeterminate' : false
                    }
                    onCheckedChange={(v) =>
                      toggleCategory(toolNames, v === true)
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
                  const isChecked =
                    category.locked || !disabledTools.includes(tool.name);
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
                          onCheckedChange={(v) =>
                            toggleTool(tool.name, v === true)
                          }
                          className="mt-0.5"
                        />
                      )}
                      <label
                        htmlFor={category.locked ? undefined : tool.name}
                        className={cn(
                          'flex flex-col gap-0.5',
                          !category.locked && 'cursor-pointer',
                        )}
                      >
                        <span className="text-sm font-mono font-medium">
                          {tool.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {tool.description}
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
  );
}
