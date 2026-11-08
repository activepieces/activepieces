import { BuildPlanStep } from '@activepieces/shared';
import { t } from 'i18next';
import { Workflow } from 'lucide-react';
import { ReactNode, useState } from 'react';

import { TextWithTooltip } from '@/components/custom/text-with-tooltip';
import { Button } from '@/components/ui/button';
import { BuildState, chatStoreSelectors } from '@/features/chat/lib/chat-store';
import { useChatStoreContext } from '@/features/chat/lib/chat-store-context';
import { authenticationSession } from '@/lib/authentication-session';
import { useNewWindow } from '@/lib/navigation-utils';
import { cn } from '@/lib/utils';

import {
  ChatCard,
  ChatCardActions,
  ChatCardBody,
  ChatCardFold,
  ChatCardHeader,
  ChatCardNested,
  ChatCardTile,
} from './chat-ui/chat-card';
import { ChatStatusIcon, ChatStatusText } from './chat-ui/chat-status';
import { chatStatusUtils } from './chat-ui/chat-status-utils';

export function FlowBuildCard({
  buildId,
  onSendPrompt,
  activity,
}: {
  buildId: string;
  onSendPrompt?: (text: string) => void;
  activity?: ReactNode;
}) {
  const build = useChatStoreContext((s) =>
    chatStoreSelectors.buildById({ state: s, buildId }),
  );
  const [doneOnMount] = useState(() => build?.phase === 'done');

  if (!build) return activity ? <>{activity}</> : null;

  const isDone = build.phase === 'done';
  const isFailed = build.phase === 'failed';
  const projectId = build.projectId ?? authenticationSession.getProjectId();
  const title = build.flowName ?? t('New flow');
  const meta = buildMeta(build);
  const tile = <ChatCardTile kind="bits" icon={Workflow} />;
  const steps = (
    <ChatCardBody className="gap-0">
      <ul className="flex flex-col divide-y divide-gray-4 rounded-lg border border-gray-5 bg-gray-2 px-3">
        {build.steps.map((step) => (
          <BuildStepRow key={step.id} step={step} />
        ))}
      </ul>
    </ChatCardBody>
  );

  return (
    <ChatCard>
      {isDone ? (
        <ChatCardFold
          defaultOpen={!doneOnMount}
          tile={tile}
          title={title}
          meta={meta}
        >
          {steps}
        </ChatCardFold>
      ) : (
        <>
          <div
            className={cn(
              'z-10 rounded-t-xl bg-panel',
              !isFailed && 'sticky top-0',
            )}
          >
            <ChatCardHeader
              tile={tile}
              title={title}
              meta={meta}
              trailing={
                <ChatStatusText
                  status={chatStatusUtils.fromBuildPhase(build.phase)}
                />
              }
            />
          </div>
          {steps}
        </>
      )}

      {activity && (
        <ChatCardBody>
          <ChatCardNested>
            <div className="min-w-0">{activity}</div>
          </ChatCardNested>
        </ChatCardBody>
      )}

      {isDone && build.flowId && projectId && (
        <ChatCardActions>
          <Button
            size="sm"
            onClick={() =>
              onSendPrompt?.(
                t('Publish and enable the automation so it runs live'),
              )
            }
            disabled={!onSendPrompt}
          >
            {t('Turn on')}
          </Button>
          <OpenInBuilderButton projectId={projectId} flowId={build.flowId} />
        </ChatCardActions>
      )}
    </ChatCard>
  );
}

function OpenInBuilderButton({
  projectId,
  flowId,
}: {
  projectId: string;
  flowId: string;
}) {
  const openNewWindow = useNewWindow();
  return (
    <Button
      size="sm"
      variant="outline"
      onClick={() => openNewWindow(`/projects/${projectId}/flows/${flowId}`)}
    >
      {t('Open in builder')}
    </Button>
  );
}

function BuildStepRow({ step }: { step: BuildPlanStep }) {
  const status = chatStatusUtils.fromBuildStep(step.status);
  return (
    <li className="flex min-h-9 items-center gap-3 py-2 text-sm">
      {status ? (
        <ChatStatusIcon status={status} />
      ) : (
        <span
          aria-hidden
          className="size-3.5 shrink-0 rounded-full border-2 border-gray-6"
        />
      )}
      <TextWithTooltip tooltipMessage={step.label}>
        <span
          className={cn(
            'min-w-0 flex-1 truncate',
            step.status === 'pending' ? 'text-gray-11' : 'text-gray-12',
            step.status === 'failed' && 'text-danger-11',
          )}
        >
          {step.label}
        </span>
      </TextWithTooltip>
    </li>
  );
}

function buildMeta(build: BuildState): string {
  const total = build.steps.length;
  if (build.phase === 'done') {
    return t('New flow · {count, plural, =1 {1 step} other {# steps}}', {
      count: total,
    });
  }
  const current = build.steps.findIndex((step) => step.status !== 'done');
  const position = current === -1 ? total : current + 1;
  return t('New flow · step {position} of {total}', { position, total });
}
