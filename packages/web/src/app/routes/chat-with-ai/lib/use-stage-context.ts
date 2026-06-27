import { isNil } from '@activepieces/core-utils';
import { useQuery } from '@tanstack/react-query';
import { t } from 'i18next';
import { useMemo } from 'react';

import { useStageOptional } from '@/app/components/workspace-shell/stage-context';
import { stageExcerptUtils } from '@/app/routes/chat-with-ai/lib/stage-excerpt';
import { useStableResourceName } from '@/app/routes/chat-with-ai/lib/use-stable-resource-name';
import { ActiveChatContext } from '@/features/chat/lib/chat-types';
import { flowHooks } from '@/features/flows';
import { getProjectName, projectCollectionUtils } from '@/features/projects';
import { tablesApi } from '@/features/tables/api/tables-api';

// The ambient context the chat is "aware of": whatever the user has open in the
// Stage (the primary viewing area). Returns undefined when the Stage is closed
// (bare chat-only landing) so nothing shows and nothing takes effect. Resource
// names are resolved best-effort from existing client caches; the project rides
// along on every page so the server can set the working project.
export function useStageContext(): ActiveChatContext | undefined {
  const stage = useStageOptional();
  const current = stage?.current;
  const activeProjectId = stage?.activeProjectId ?? null;
  const stageFocus = stage?.stageFocus ?? null;
  const stageExcerpt = stage?.stageExcerpt ?? null;

  const { project } = projectCollectionUtils.useCurrentProject();
  const projectName = project ? getProjectName(project) : undefined;
  const resolveName = useStableResourceName();

  const flowId = current?.type === 'flow' ? current.id : undefined;
  const tableId = current?.type === 'table' ? current.id : undefined;

  const { data: flow } = flowHooks.useGetFlow({
    flowId: flowId ?? '',
    enabled: !isNil(flowId),
  });

  const { data: table } = useQuery({
    queryKey: ['stage-table-name', tableId],
    queryFn: () => tablesApi.getById(tableId!),
    enabled: !isNil(tableId),
    staleTime: 60_000,
  });

  return useMemo<ActiveChatContext | undefined>(() => {
    if (isNil(current) || current.type === 'none' || isNil(activeProjectId)) {
      return undefined;
    }
    const currentId = 'id' in current ? current.id : undefined;
    // Only attach the fine-grained focus when it belongs to the resource that
    // is actually open — guards against a stale selection bleeding through
    // during navigation between resources.
    const focus =
      stageFocus &&
      stageFocus.scopeType === current.type &&
      stageFocus.scopeId === currentId
        ? {
            kind: stageFocus.kind,
            label: stageFocus.label,
            ...(stageFocus.ref ? { ref: stageFocus.ref } : {}),
            ...(stageFocus.detail ? { detail: stageFocus.detail } : {}),
          }
        : undefined;
    // A page can report a compact snapshot of what it's rendering (connections
    // rows, etc.). Attach it only when it belongs to the open page so a stale
    // snapshot never bleeds through during navigation.
    const reportedExcerpt =
      stageExcerpt &&
      stageExcerpt.scopeType === current.type &&
      stageExcerpt.scopeId === currentId
        ? stageExcerpt.text
        : undefined;
    const projectFields = {
      projectId: activeProjectId,
      ...(projectName ? { projectName } : {}),
    };
    const withName = (name: string | undefined, excerpt = reportedExcerpt) => ({
      type: current.type,
      ...('id' in current ? { id: current.id } : {}),
      ...(name ? { name } : {}),
      ...(excerpt ? { excerpt } : {}),
      ...(focus ? { focus } : {}),
      ...projectFields,
    });
    switch (current.type) {
      case 'flow':
        return withName(
          resolveName({
            type: 'flow',
            id: current.id,
            liveName: flow?.version.displayName,
          }),
          flow
            ? stageExcerptUtils.flowOutline(flow.version, {
                selectedStepName:
                  focus?.kind === 'flow-step' ? focus.ref : undefined,
              })
            : undefined,
        );
      case 'table':
        return withName(
          resolveName({ type: 'table', id: current.id, liveName: table?.name }),
        );
      case 'run':
        return withName(t('Run'));
      case 'release':
        return withName(t('Release'));
      case 'runs':
        return withName(t('Runs'));
      case 'connections':
        return withName(t('Connections'));
      case 'variables':
        return withName(t('Variables'));
      case 'releases':
        return withName(t('Releases'));
      case 'settings':
        return withName(t('Settings'));
      case 'automations':
      default:
        // The project home (flows list) represents the project itself.
        return withName(projectName);
    }
  }, [
    activeProjectId,
    projectName,
    current,
    flow,
    table,
    stageFocus,
    stageExcerpt,
    resolveName,
  ]);
}
