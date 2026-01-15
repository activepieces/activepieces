'use client';

import { t } from 'i18next';
import { DashboardPageHeader } from '@/app/components/dashboard-page-header';
import PromptInput from '@/features/chat-v2/prompt-input';
import { Conversation } from '@/features/chat-v2/conversation';
import { UserMessage } from '@/features/chat-v2/user-message';
import { LLMMessage } from '@/features/chat-v2/llm-message';
import { Reasoning, ReasoningTrigger, ReasoningContent } from '@/features/chat-v2/reasoning';

export function CoworkPage() {
  const handleMessageSend = (message: string) => {
    // eslint-disable-next-line no-console
    console.log('Message sent:', message);
    // TODO: Implement message sending logic
  };

  return (
    <div className="flex flex-col gap-2 w-full min-h-screen relative">
      <div className='h-10'>

      </div>
      <div className="flex-1 flex justify-center">
        <Conversation className="w-full max-w-4xl px-4 py-4 space-y-10">
          {/* Example user message */}
          <UserMessage text="Hello, this is a test message" />
          {/* Example LLM message */}
          <LLMMessage messages={[
            {
              type: 'reasoning',
              isStreaming: false,
              defaultOpen: true,
              content: 'Here is the reasoning behind the response. This content is collapsible and shows the thinking process.'
            },
            {
              type: 'text',
              text: 'This is a response from the LLM. It appears on the left side with a maximum width of 70%.'
            }
          ]} />
        </Conversation>
      </div>
      <div className="sticky bottom-0 left-0 right-0 flex justify-center pb-4 pt-4 bg-background z-10">
        <div className="w-full max-w-4xl px-4">
          <PromptInput
            onMessageSend={handleMessageSend}
            placeholder="Ask Quick..."
          />
        </div>
      </div>
    </div>
  );
}
