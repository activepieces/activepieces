import { useParams } from 'react-router-dom';
import { useSearchParam } from 'react-use';

import { ChatDrawerSource } from '@/app/builder/builder-hooks';
import { USE_DRAFT_QUERY_PARAM_NAME } from '@activepieces/shared';

import NotFoundPage from '../404-page';

import { FlowChat } from './flow-chat';

export function ChatPage() {
  const { flowId } = useParams();
  const useDraft = useSearchParam(USE_DRAFT_QUERY_PARAM_NAME) === 'true';

  if (!flowId) {
    return (
      <NotFoundPage
        title="Hmm... this chat isn't here"
        description="The chat you're looking for isn't here or maybe hasn't been published by the owner yet"
      />
    );
  }

  return (
    <FlowChat
      flowId={flowId}
      mode={useDraft ? ChatDrawerSource.TEST_FLOW : ChatDrawerSource.TEST_STEP}
      onSendingMessage={() => {}}
      onError={(error) => {
        console.error('Chat error:', error);
      }}
    />
  );
}
