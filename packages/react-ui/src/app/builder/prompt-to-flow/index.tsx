// Custom
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { useState, useRef, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { CardList } from '@/components/custom/card-list';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

import { LeftSideBarType, useBuilderStateContext } from '../builder-hooks';
import { SidebarHeader } from '../sidebar-header';

import { ChatMessage } from './chat-message';
import { PromptInput } from '@/components/custom/prompt-input';
import {
  promptFlowApi,
  PromptMessage,
} from '@/features/flows/lib/prompt-to-flow-api';

import { flowsApi } from '@/features/flows/lib/flows-api';
import {
  BuilderMessage,
  BuilderMessageRole,
} from '@activepieces/shared';
import { AssistantContent } from 'ai';
import { toast } from 'sonner';

const WELCOME_MESSAGE =
  "Hello! How can I help you today?\nYou can type the changes you'd like for this flow, and I'll help you create or modify it";

export const PromptToFlowSidebar = ({
  onShouldReloadCreditUsage,
}: {
  onShouldReloadCreditUsage?: () => void;
}) => {
  const [isShowWelcomeMessage, setIsShowWelcomeMessage] = useState(false);
  const [messages, setMessages] = useState<PromptMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [flow, setLeftSidebar, setFlow, setVersion] = useBuilderStateContext(
    (state) => [
      state.flow,
      state.setLeftSidebar,
      state.setFlow,
      state.setVersion,
    ]
  );
  const lastMessageRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  const scrollToLastMessage = () => {
    setTimeout(() => {
      lastMessageRef.current?.scrollIntoView({
        behavior: 'smooth',
      });
    }, 1);
  };

  const mapBuilderToPromptMessages = (
    builderMessages: BuilderMessage[]
  ): PromptMessage[] => {
    const mappedMessages = builderMessages.map((m) => {
      try {
        if (m.role === BuilderMessageRole.TOOL) {
          return null;
        }

        if (m.role === BuilderMessageRole.USER) {
          return {
            role: m.role,
            content: JSON.parse(m.content),
            created: m.created,
          };
        }

        // Assistant messages
        const jsonContent = JSON.parse(m.content) as AssistantContent;
        if (Array.isArray(jsonContent) && jsonContent[0]?.type === 'text') {
          return {
            role: m.role,
            content: jsonContent?.[0]?.text,
            created: m.created,
          };
        }
        return null;
      } catch (e) {
        return null;
      }
    });

    return mappedMessages.filter((m) => m !== null);
  };

  const reloadMessages = async () => {
    if (!flow?.id) {
      return;
    }
    try {
      const serverMessages = await promptFlowApi.get(flow.id);
      const mapped = mapBuilderToPromptMessages(serverMessages);
      setMessages(mapped);
      handleUpdateLocationState(mapped);
      setIsShowWelcomeMessage(mapped.length === 0);
      onShouldReloadCreditUsage?.();
    } catch (e) {
      console.error('Failed to load conversation history', e);
    }
  };

  const { isPending, mutate } = useMutation({
    mutationFn: (messages: PromptMessage[]) => {
      return promptFlowApi.chat(flow.id, messages);
    },
    onSuccess: async (response: string) => {
      // Ignore direct response string; reload full conversation instead
      try {
        await reloadMessages();
        scrollToLastMessage();
        const freshFlow = await flowsApi.get(flow.id);
        setFlow(freshFlow);
        setVersion(freshFlow.version, true);
      } catch (e) {
        console.error(
          'Failed to reload messages or flow after chat response',
          e
        );
      }
    },
    onError: (error: any) => {
      toast.error(t('Error generating code'), {
        description: error.message,
        duration: 3000,
      });
    },
  });

  const handleInstantDisplayUserMessage = (message: PromptMessage) => {
    // This is for realtime display for user messages
    const messagesToUpdate = [...messages, message];
    setMessages(messagesToUpdate);
  };

  const handleUpdateLocationState = (messages: PromptMessage[]) => {
    const currentState = (location.state as Record<string, unknown>) ?? {};
    navigate(location.pathname, {
      replace: true,
      state: { ...currentState, messages },
    });
  };

  const handleSendMessage = () => {
    const trimmedInputMessage = inputMessage.trim();
    if (trimmedInputMessage === '') {
      return;
    }
    const toSendMessages = [
      {
        role: BuilderMessageRole.USER,
        content: inputMessage,
        created: new Date().toISOString(),
      },
    ];
    handleInstantDisplayUserMessage(toSendMessages[0]);
    mutate(toSendMessages);
    setInputMessage('');
    scrollToLastMessage();
  };

  const handleCloseSidebar = () => {
    setLeftSidebar(LeftSideBarType.NONE);
  };

  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.focus();
    }
    // Load existing conversation history on mount
    reloadMessages();
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollToLastMessage();
      }, 100);
    }
  }, [messages]);

  const welcomeMessage = useMemo(() => {
    return {
      role: BuilderMessageRole.ASSISTANT,
      content: WELCOME_MESSAGE,
      created: new Date().toISOString(),
    };
  }, []);

  return (
    <div className="relative h-full">
      <div className="absolute top-0 bottom-0 flex flex-col">
        <SidebarHeader onClose={handleCloseSidebar}>AutomationX</SidebarHeader>
        <div className="pt-0 p-4 flex flex-col flex-grow overflow-hidden">
          <ScrollArea className="flex-grow overflow-auto">
            <CardList className="pb-3 pr-3" listClassName="gap-6">
              {isShowWelcomeMessage && <ChatMessage message={welcomeMessage} />}
              {messages.map((message, index) => (
                <ChatMessage
                  key={index}
                  message={message}
                  ref={index === messages.length - 1 ? lastMessageRef : null}
                />
              ))}
              <ScrollBar />
            </CardList>
          </ScrollArea>

          <PromptInput
            ref={textAreaRef}
            value={inputMessage}
            onChange={setInputMessage}
            onSubmit={handleSendMessage}
            loading={isPending}
            placeholder={t('Describe your automation flow')}
            icon
          />
        </div>
      </div>
    </div>
  );
};

PromptToFlowSidebar.displayName = 'PromptToFlowSidebar';
