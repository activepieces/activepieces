import { FlowStatus } from '@activepieces/shared';
import { useQuery } from '@tanstack/react-query';
import { t } from 'i18next';
import { Hammer, LucideIcon, Play, Plug, Search } from 'lucide-react';

import { CopyButton } from '@/components/custom/clipboard/copy-button';
import { appConnectionsQueries } from '@/features/connections/hooks/app-connections-hooks';
import { flowsApi } from '@/features/flows/api/flows-api';
import { piecesHooks } from '@/features/pieces/hooks/pieces-hooks';
import { projectCollectionUtils } from '@/features/projects';
import { authenticationSession } from '@/lib/authentication-session';

export function TryPrompts() {
  const prompts = useTryPrompts();
  return (
    <ul className="flex flex-col gap-1.5">
      {prompts.map((prompt) => (
        <li
          key={prompt.kind}
          className="flex items-center gap-3 rounded-xl border bg-gray-2 py-1 pr-1 pl-3"
        >
          <prompt.icon aria-hidden className="size-4 shrink-0 text-gray-11" />
          <span className="min-w-0 flex-1 py-1.5 text-sm text-pretty text-gray-12">
            {prompt.text}
          </span>
          <CopyButton
            textToCopy={prompt.text}
            variant="ghost"
            size="icon-sm"
            aria-label={t('Copy prompt')}
          />
        </li>
      ))}
    </ul>
  );
}

function useTryPrompts(): TryPrompt[] {
  const projectId = authenticationSession.getProjectId();
  const { project } = projectCollectionUtils.useCurrentProject();
  const { data: flows } = useQuery({
    queryKey: ['mcp-try-prompts-flows', projectId],
    queryFn: () =>
      flowsApi.list({
        projectId: projectId ?? '',
        limit: FLOWS_TO_SCAN,
        cursor: undefined,
      }),
    enabled: projectId !== null,
    staleTime: PROMPTS_STALE_MS,
  });
  const { data: connections } = appConnectionsQueries.useAppConnections({
    request: { projectId: projectId ?? '', limit: CONNECTIONS_TO_SCAN },
    extraKeys: ['mcp-try-prompts', projectId],
    enabled: projectId !== null,
  });
  const enabledFlow = flows?.data.find(
    (flow) => flow.status === FlowStatus.ENABLED,
  );
  const firstConnection = connections?.data[0];
  const { summary } = piecesHooks.usePieceSummary({
    name: firstConnection?.pieceName ?? '',
  });
  const projectName = project?.displayName;
  const flowName = enabledFlow?.version.displayName;
  const appName = firstConnection ? summary?.displayName : undefined;

  return [
    {
      kind: 'look',
      icon: Search,
      text: projectName
        ? t('Which of my flows in {project} failed this week, and why?', {
            project: projectName,
          })
        : t('Which of my flows failed this week, and why?'),
    },
    {
      kind: 'run',
      icon: Play,
      text: flowName
        ? t('Run “{flow}” now and tell me what it did.', { flow: flowName })
        : t('Show me the runs from the last 24 hours.'),
    },
    {
      kind: 'act',
      icon: Plug,
      text: appName
        ? t('What can you do with my {app} connection? Do one useful thing.', {
            app: appName,
          })
        : t('Which apps can you reach from here, and what can you do in them?'),
    },
    {
      kind: 'build',
      icon: Hammer,
      text: t(
        'Build a flow that sends me a message every morning with yesterday’s failed runs, then turn it on.',
      ),
    },
  ];
}

const FLOWS_TO_SCAN = 25;
const CONNECTIONS_TO_SCAN = 10;
const PROMPTS_STALE_MS = 60 * 1000;

type TryPrompt = {
  kind: 'look' | 'run' | 'act' | 'build';
  icon: LucideIcon;
  text: string;
};
