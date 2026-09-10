import { isNil, spreadIfDefined } from '@activepieces/core-utils';
import {
  AgentPieceProps,
  AgentSummary,
  Permission,
} from '@activepieces/shared';
import { t } from 'i18next';
import { BotIcon, Link2OffIcon, PlusIcon } from 'lucide-react';
import { useMemo } from 'react';
import { useFormContext } from 'react-hook-form';
import { Link } from 'react-router-dom';

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

  const { data, isLoading } = agentsQueries.useAgents({
    projectId,
    enabled: agentsAvailable && mayReadAgents,
  });
  const agents = useMemo(
    () => (data?.pages ?? []).flatMap((page): AgentSummary[] => page.data),
    [data],
  );

  const linkedExternalId = form.watch(
    `settings.input.${AgentPieceProps.AGENT_ID}`,
  ) as string | undefined;
  const linked = agents.find((agent) => agent.externalId === linkedExternalId);
  const { data: linkedAgent } = agentsQueries.useAgent({
    id: linked?.id ?? '',
    enabled: !isNil(linked),
  });

  if (!agentsAvailable || !mayReadAgents) {
    return null;
  }

  const link = (externalId: string | null) => {
    form.setValue(
      `settings.input.${AgentPieceProps.AGENT_ID}`,
      externalId ?? undefined,
      { shouldValidate: true },
    );
    if (isNil(externalId)) {
      return;
    }
    form.setValue(`settings.input.${AgentPieceProps.AGENT_TOOLS}`, [], {
      shouldValidate: true,
    });
    form.setValue(
      `settings.input.${AgentPieceProps.STRUCTURED_OUTPUT}`,
      undefined,
      { shouldValidate: true },
    );
  };

  const detach = () => {
    const config = linkedAgent?.published ?? linkedAgent?.draft;
    form.setValue(`settings.input.${AgentPieceProps.AGENT_ID}`, undefined, {
      shouldValidate: true,
    });
    if (isNil(config)) {
      return;
    }
    form.setValue(
      `settings.input.${AgentPieceProps.AGENT_TOOLS}`,
      config.tools,
      { shouldValidate: true },
    );
    form.setValue(
      `settings.input.${AgentPieceProps.STRUCTURED_OUTPUT}`,
      config.structuredOutput,
      { shouldValidate: true },
    );
    form.setValue(
      `settings.input.${AgentPieceProps.MAX_STEPS}`,
      config.maxSteps,
      { shouldValidate: true },
    );
    if (!isNil(config.provider) && !isNil(config.modelName)) {
      form.setValue(
        `settings.input.${AgentPieceProps.AI_PROVIDER_MODEL}`,
        {
          provider: config.provider,
          model: config.modelName,
          picked: 'user',
          ...spreadIfDefined('configId', config.providerConfigId ?? undefined),
        },
        { shouldValidate: true },
      );
    }
  };

  return (
    <FormItem className="flex flex-col gap-2">
      <FormLabel>{t('Agent')}</FormLabel>
      <SearchableSelect
        options={agents.map((agent) => ({
          value: agent.externalId,
          label: agent.displayName,
        }))}
        value={linkedExternalId}
        loading={isLoading}
        disabled={disabled}
        showDeselect={!isNil(linkedExternalId)}
        placeholder={t('Configure this step, or run a saved agent')}
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
            <span className="truncate">
              {linked?.displayName ?? linkedExternalId}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {isNil(linked)
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
            disabled={disabled}
            onClick={detach}
          >
            <Link2OffIcon className="size-4" />
            {t('Detach & customize')}
          </Button>
        </div>
      )}
    </FormItem>
  );
};

type AgentLinkProps = {
  disabled: boolean;
};
