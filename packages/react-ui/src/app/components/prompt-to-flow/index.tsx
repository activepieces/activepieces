// Custom
import { BuilderMessageRole } from '@activepieces/shared';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

import PromptInput from '@/components/custom/prompt-input';
import { flowsApi } from '@/features/flows/lib/flows-api';
import {
  promptFlowApi,
  PromptMessage,
} from '@/features/flows/lib/prompt-to-flow-api';
import { folderIdParamName } from '@/features/folders/component/folder-filter-list';
import { foldersApi } from '@/features/folders/lib/folders-api';
import { authenticationSession } from '@/lib/authentication-session';
import {
  NEW_FLOW_QUERY_PARAM,
  NEW_FLOW_WITH_AI_QUERY_PARAM,
} from '@/lib/utils';


export function CreateFlowWithAI() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [prompt, setPrompt] = useState('');
  const messages = useRef<PromptMessage[]>([]);

  const { mutate: sendMessage, isPending: isMessagePending } = useMutation<
    { message: string; flowId: string },
    Error,
    void
  >({
    mutationFn: async () => {
      const folderId = searchParams.get(folderIdParamName);
      const folder =
        folderId && folderId !== 'NULL'
          ? await foldersApi.get(folderId)
          : undefined;

      const flow = await flowsApi.create({
        projectId: authenticationSession.getProjectId()!,
        displayName: t('Untitled'),
        folderName: folder?.displayName,
      });

      const response = await promptFlowApi.chat(flow.id, messages.current);
      return { message: response, flowId: flow.id };
    },

    onSuccess: (response) => {
      const nextMessages = [
        ...messages.current,
        {
          role: BuilderMessageRole.ASSISTANT,
          content: response.message,
          createdAt: new Date().toISOString(),
        },
      ];
      navigate(
        `/flows/${response.flowId}?${NEW_FLOW_QUERY_PARAM}=true&${NEW_FLOW_WITH_AI_QUERY_PARAM}=true`,
        { state: { messages: nextMessages } },
      );
    },
  });

  const handleSubmit = async () => {
    messages.current = [
      {
        role: BuilderMessageRole.USER,
        content: prompt,
        created: new Date().toISOString(),
      },
    ];
    sendMessage();
  };

  return (
    <div className="mt-2 p-4 rounded-lg flex flex-col gap-4 bg-gray-100">
      <PromptInput
        placeholder={t(
          'Describe your automation flow (e.g., "Send welcome email to new users, add to CRM, and schedule follow-up task after 2 days")',
        )}
        className="w-full"
        minRows={3}
        maxRows={5}
        value={prompt}
        onChange={setPrompt}
        onSubmit={handleSubmit}
        loading={isMessagePending}
      />
    </div>
  );
}
