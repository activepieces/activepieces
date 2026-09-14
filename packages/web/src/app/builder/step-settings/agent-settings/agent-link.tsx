import { isNil, spreadIfDefined } from '@activepieces/core-utils';
import {
  AgentPieceProps,
  AgentSummary,
  AgentToolType,
  AgentVisibility,
  McpAuthType,
  Permission,
} from '@activepieces/shared';
import { t } from 'i18next';
import { ExternalLinkIcon, Link2OffIcon, PlusIcon } from 'lucide-react';
import { useMemo } from 'react';
import { useFormContext } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

import { agentLinkUtils } from '@/app/builder/step-settings/agent-settings/agent-link-utils';
import { DataFetchErrorState } from '@/components/custom/data-fetch-error-state';
import { PermissionNeededTooltip } from '@/components/custom/permission-needed-tooltip';
import { SearchableSelect } from '@/components/custom/searchable-select';
import { TextWithTooltip } from '@/components/custom/text-with-tooltip';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FormItem, FormLabel } from '@/components/ui/form';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  agentsQueries,
  useAgentsAvailable,
} from '@/features/agents/hooks/agents-hooks';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import { cn } from '@/lib/utils';

export const AgentLink = ({ disabled }: AgentLinkProps) => {
  const form = useFormContext();
  const projectId = authenticationSession.getProjectId() ?? undefined;
  const agentsAvailable = useAgentsAvailable();
  const { checkAccess } = useAuthorization();
  const mayReadAgents = checkAccess(Permission.READ_AGENT);
  const mayWriteAgents = checkAccess(Permission.WRITE_AGENT);

  const { data, isLoading, isError, refetch } = agentsQueries.useAgents({
    projectId,
    enabled: agentsAvailable && mayReadAgents,
  });
  const agents = useMemo(
    () => (data?.pages ?? []).flatMap((page): AgentSummary[] => page.data),
    [data],
  );
  const runnable = useMemo(
    () =>
      agents.filter((agent) => agent.visibility === AgentVisibility.PROJECT),
    [agents],
  );

  const linkedExternalId = agentLinkUtils.externalIdOf(
    form.watch(`settings.input.${AgentPieceProps.AGENT_ID}`),
  );
  const linked = agents.find((agent) => agent.externalId === linkedExternalId);
  const { data: linkedAgent } = agentsQueries.useAgent({
    id: linked?.id ?? '',
    enabled: !isNil(linked),
  });
  const stillFindingIt = isLoading && !isNil(linkedExternalId);
  const linkedConfig = linkedAgent?.published ?? linkedAgent?.draft;

  const instructionsPreview = linkedConfig?.instructions?.trim();
  const summaryText = linkedAgent?.description?.trim() || instructionsPreview;
  const cannotRun = !stillFindingIt && (isNil(linked) || !linked.isPublished);
  const modelLabel = linkedConfig?.modelName ?? undefined;
  const toolChips = [
    ...new Set(
      (linked?.toolPieceNames ?? []).map((pieceName) =>
        pieceName.replace('@activepieces/piece-', ''),
      ),
    ),
  ].slice(0, MAX_TOOL_CHIPS);
  const hiddenToolCount = Math.max(
    new Set(linked?.toolPieceNames ?? []).size - toolChips.length,
    0,
  );

  if (!agentsAvailable || !mayReadAgents) {
    return null;
  }

  const link = (externalId: string | null) => {
    form.setValue(
      `settings.input.${AgentPieceProps.AGENT_ID}`,
      externalId ?? undefined,
      { shouldValidate: true },
    );
  };

  const detach = () => {
    if (isNil(linkedConfig)) {
      return;
    }
    const authedMcpTools = linkedConfig.tools.filter(
      (tool) =>
        tool.type === AgentToolType.MCP && tool.auth.type !== McpAuthType.NONE,
    );
    form.setValue(
      `settings.input.${AgentPieceProps.AGENT_TOOLS}`,
      linkedConfig.tools.filter((tool) => !authedMcpTools.includes(tool)),
      { shouldValidate: true },
    );
    form.setValue(
      `settings.input.${AgentPieceProps.STRUCTURED_OUTPUT}`,
      linkedConfig.structuredOutput,
      { shouldValidate: true },
    );
    form.setValue(
      `settings.input.${AgentPieceProps.MAX_STEPS}`,
      linkedConfig.maxSteps,
      { shouldValidate: true },
    );
    if (!isNil(linkedConfig.provider) && !isNil(linkedConfig.modelName)) {
      form.setValue(
        `settings.input.${AgentPieceProps.AI_PROVIDER_MODEL}`,
        {
          provider: linkedConfig.provider,
          model: linkedConfig.modelName,
          picked: 'user',
          ...spreadIfDefined(
            'configId',
            linkedConfig.providerConfigId ?? undefined,
          ),
        },
        { shouldValidate: true },
      );
    }
    form.setValue(`settings.input.${AgentPieceProps.AGENT_ID}`, undefined, {
      shouldValidate: true,
    });
    if (authedMcpTools.length > 0) {
      toast(
        t(
          'MCP tools were left behind. Their credentials stay with the agent, so add them again here.',
        ),
      );
    }
  };

  if (isError) {
    return (
      <FormItem className="flex flex-col gap-2">
        <FormLabel>{t('Agent')}</FormLabel>
        <DataFetchErrorState entity={t('agents')} onRetry={refetch} />
      </FormItem>
    );
  }

  return (
    <FormItem className="flex flex-col gap-2">
      <FormLabel>{t('Agent')}</FormLabel>
      <SearchableSelect
        options={runnable.map((agent) => ({
          value: agent.externalId,
          label: agent.displayName,
          description: agent.isPublished ? undefined : t('Not published yet'),
        }))}
        value={linkedExternalId}
        loading={isLoading}
        disabled={disabled}
        showDeselect={!isNil(linkedExternalId)}
        placeholder={t('Pick a saved agent')}
        onChange={link}
      />
      {isNil(linkedExternalId) ? (
        <PermissionNeededTooltip hasPermission={mayWriteAgents}>
          <Button
            variant="link"
            size="sm"
            className="h-auto self-start p-0"
            disabled={!mayWriteAgents}
            asChild={mayWriteAgents}
          >
            {mayWriteAgents ? (
              <Link to="/agents" target="_blank" rel="noreferrer">
                <PlusIcon className="size-4" />
                {t('Create agent')}
              </Link>
            ) : (
              <span>
                <PlusIcon className="size-4" />
                {t('Create agent')}
              </span>
            )}
          </Button>
        </PermissionNeededTooltip>
      ) : (
        <div className="flex flex-col gap-2.5 rounded-lg border p-3">
          {!isNil(summaryText) && (
            <TextWithTooltip tooltipMessage={summaryText}>
              <p className="line-clamp-2 text-xs text-muted-foreground">
                {summaryText}
              </p>
            </TextWithTooltip>
          )}

          {(!isNil(modelLabel) || toolChips.length > 0) && (
            <div className="flex flex-wrap items-center gap-1.5">
              {!isNil(modelLabel) && (
                <Badge variant="accent" className="font-normal">
                  {modelLabel}
                </Badge>
              )}
              {toolChips.map((chip) => (
                <Badge key={chip} variant="outline" className="font-normal">
                  {chip}
                </Badge>
              ))}
              {hiddenToolCount > 0 && (
                <Badge variant="outline" className="font-normal">
                  {t('+{count}', { count: hiddenToolCount })}
                </Badge>
              )}
            </div>
          )}

          <p
            className={cn(
              'text-xs',
              cannotRun
                ? 'text-warning-700 dark:text-warning-300'
                : 'text-muted-foreground',
            )}
          >
            {stillFindingIt
              ? t('Looking it up.')
              : isNil(linked)
              ? t('Not in this project, so this step cannot run.')
              : !linked.isPublished
              ? t('Not published yet. Publish it before this flow can run.')
              : t('Shared with every flow that uses it.')}
          </p>

          <div className="flex flex-wrap items-center gap-2">
            {!isNil(linked) && (
              <Button variant="outline" size="sm" asChild>
                <Link
                  to={`/agents/${linked.id}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {t('Edit agent')}
                  <ExternalLinkIcon className="size-3.5" />
                </Link>
              </Button>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={disabled || isNil(linkedConfig)}
                  onClick={detach}
                >
                  <Link2OffIcon className="size-4" />
                  {t('Detach')}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {t(
                  'Copies the tools and model. Instructions stay with the agent.',
                )}
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      )}
    </FormItem>
  );
};

type AgentLinkProps = {
  disabled: boolean;
};

const MAX_TOOL_CHIPS = 3;
