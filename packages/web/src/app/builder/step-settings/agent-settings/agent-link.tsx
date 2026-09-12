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
import { BotIcon, Link2OffIcon, PlusIcon } from 'lucide-react';
import { useMemo } from 'react';
import { useFormContext } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

import { DataFetchErrorState } from '@/components/custom/data-fetch-error-state';
import { PermissionNeededTooltip } from '@/components/custom/permission-needed-tooltip';
import { SearchableSelect } from '@/components/custom/searchable-select';
import { Button } from '@/components/ui/button';
import { FormItem, FormLabel } from '@/components/ui/form';
import {
  agentsQueries,
  useAgentsAvailable,
} from '@/features/agents/hooks/agents-hooks';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { authenticationSession } from '@/lib/authentication-session';

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

  const linkedExternalId = form.watch(
    `settings.input.${AgentPieceProps.AGENT_ID}`,
  ) as string | undefined;
  const linked = agents.find((agent) => agent.externalId === linkedExternalId);
  const { data: linkedAgent } = agentsQueries.useAgent({
    id: linked?.id ?? '',
    enabled: !isNil(linked),
  });
  const stillFindingIt = isLoading && !isNil(linkedExternalId);
  const linkedConfig = linkedAgent?.published ?? linkedAgent?.draft;

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
          'An MCP tool keeps its credentials on the agent, so this step could not take them. Add those tools again here.',
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
          description: agent.isPublished
            ? undefined
            : t('Never published, so a flow cannot run it yet'),
        }))}
        value={linkedExternalId}
        loading={isLoading}
        disabled={disabled}
        showDeselect={!isNil(linkedExternalId)}
        placeholder={t('Pick a saved agent, or configure this step')}
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
        <div className="flex flex-col gap-2 rounded-lg border p-3">
          <div className="flex items-center gap-2 text-sm">
            <BotIcon className="size-4 shrink-0 text-muted-foreground" />
            {isNil(linked) ? (
              <span className="text-muted-foreground">
                {stillFindingIt ? t('Loading') : t('Agent')}
              </span>
            ) : (
              <Link
                to={`/agents/${linked.id}`}
                target="_blank"
                rel="noreferrer"
                className="truncate hover:underline"
              >
                {linked.displayName}
              </Link>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {stillFindingIt
              ? t('Looking up the agent this step runs.')
              : isNil(linked)
              ? t('This agent is not in this project, so the step cannot run.')
              : !linked.isPublished
              ? t(
                  'This agent has never been published, and a flow runs the published version.',
                )
              : t(
                  'Instructions, tools and model come from the agent. Editing the agent changes what this step runs.',
                )}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="self-start"
            disabled={disabled || isNil(linkedConfig)}
            onClick={detach}
          >
            <Link2OffIcon className="size-4" />
            {t('Detach & customize')}
          </Button>
          {!isNil(linkedConfig) && (
            <p className="text-xs text-muted-foreground">
              {t(
                'Detaching copies its tools and model into this step. Its instructions stay with the agent.',
              )}
            </p>
          )}
        </div>
      )}
    </FormItem>
  );
};

type AgentLinkProps = {
  disabled: boolean;
};
