import { PopulatedFlow, Table } from '@activepieces/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { flowsApi } from '@/features/flows/api/flows-api';
import { projectCollectionUtils } from '@/features/projects';
import { tableHooks } from '@/features/tables/hooks/table-hooks';
import { NEW_FLOW_QUERY_PARAM, NEW_TABLE_QUERY_PARAM } from '@/lib/route-utils';

import { useChatNavigation } from '../../workspace-shell/use-chat-navigation';

// The API token is platform-scoped (not project-scoped), so we can create in any project
// the user can access by passing its id in the body — we only switch the "current project"
// so the resource we navigate to afterwards resolves against the right project.
export function useCreateActions({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { newChat } = useChatNavigation();

  const createChat = useCallback(
    (projectId: string) => {
      projectCollectionUtils.setCurrentProject(projectId);
      newChat();
      onClose();
    },
    [newChat, onClose],
  );

  const { mutate: createFlow, isPending: isCreatingFlow } = useMutation<
    PopulatedFlow,
    Error,
    string
  >({
    mutationFn: (projectId) => {
      projectCollectionUtils.setCurrentProject(projectId);
      return flowsApi.create({ projectId, displayName: t('Untitled') });
    },
    onSuccess: (flow, projectId) => {
      navigate(
        `/projects/${projectId}/flows/${flow.id}?${NEW_FLOW_QUERY_PARAM}=true`,
      );
      onClose();
    },
    onError: () => toast.error(t('Failed to create flow')),
  });

  const { mutate: createTable, isPending: isCreatingTable } = useMutation<
    Table,
    Error,
    string
  >({
    mutationFn: (projectId) => {
      projectCollectionUtils.setCurrentProject(projectId);
      return tableHooks.createTableWithDefaults({
        name: t('Untitled'),
        projectId,
      });
    },
    onSuccess: (table, projectId) => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      navigate(
        `/projects/${projectId}/tables/${table.id}?${NEW_TABLE_QUERY_PARAM}=true`,
      );
      onClose();
    },
    onError: () => toast.error(t('Failed to create table')),
  });

  return {
    createChat,
    createFlow,
    createTable,
    isCreatingFlow,
    isCreatingTable,
  };
}
