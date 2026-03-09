import { PopulatedMcpServer } from '@activepieces/shared';
import { t } from 'i18next';
import { Lock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useDebouncedCallback } from 'use-debounce';

import { Checkbox } from '@/components/ui/checkbox';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { authenticationSession } from '@/lib/authentication-session';

import { mcpHooks } from './utils/mcp-hooks';
import {
  ALL_CONTROLLABLE_TOOL_NAMES,
  TOOL_CATEGORIES,
} from './utils/mcp-tools-metadata';

type McpToolsProps = {
  mcpServer: PopulatedMcpServer;
};

export function McpTools({ mcpServer }: McpToolsProps) {
  const currentProjectId = authenticationSession.getProjectId();
  const { mutate: updateMcpServer } = mcpHooks.useUpdateMcpServer(
    currentProjectId!,
  );

  const [enabledTools, setEnabledTools] = useState<string[]>(
    () => mcpServer.enabledTools ?? ALL_CONTROLLABLE_TOOL_NAMES,
  );

  useEffect(() => {
    setEnabledTools(mcpServer.enabledTools ?? ALL_CONTROLLABLE_TOOL_NAMES);
  }, [mcpServer.enabledTools]);

  const saveEnabledTools = useDebouncedCallback((tools: string[]) => {
    updateMcpServer({ enabledTools: tools });
  }, 300);

  const toggleTool = (name: string, checked: boolean) => {
    const next = checked
      ? [...enabledTools, name]
      : enabledTools.filter((n) => n !== name);
    setEnabledTools(next);
    saveEnabledTools(next);
  };

  const toggleCategory = (toolNames: string[], checked: boolean) => {
    const next = checked
      ? [...enabledTools, ...toolNames.filter((n) => !enabledTools.includes(n))]
      : enabledTools.filter((n) => !toolNames.includes(n));
    setEnabledTools(next);
    saveEnabledTools(next);
  };

  return (
    <div className="space-y-4">
      {TOOL_CATEGORIES.map((category) => {
        const toolNames = category.tools.map((tool) => tool.name);
        const enabledInCategory = category.locked
          ? toolNames
          : toolNames.filter((n) => enabledTools.includes(n));
        const allChecked = enabledInCategory.length === toolNames.length;
        const someChecked =
          enabledInCategory.length > 0 &&
          enabledInCategory.length < toolNames.length;

        return (
          <div
            key={category.label}
            className="border rounded-lg overflow-hidden"
          >
            {/* Category header */}
            <div className="flex items-center gap-3 px-4 py-3 bg-muted/40 border-b">
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
                  onCheckedChange={(v) => toggleCategory(toolNames, v === true)}
                  aria-label={t('Select all in {{category}}', {
                    category: category.label,
                  })}
                />
              )}
              <span className="text-sm font-semibold">{t(category.label)}</span>
              {category.locked && (
                <span className="text-xs text-muted-foreground ml-1">
                  ({t('always enabled')})
                </span>
              )}
            </div>

            {/* Tool rows */}
            <div className="divide-y">
              {category.tools.map((tool) => {
                const isChecked =
                  category.locked || enabledTools.includes(tool.name);
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
                      className={`flex flex-col gap-0.5 ${
                        !category.locked ? 'cursor-pointer' : ''
                      }`}
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
          </div>
        );
      })}
    </div>
  );
}
