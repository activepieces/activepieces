import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { ArrowUp, LoaderCircle } from 'lucide-react';
import { nanoid } from 'nanoid';
import { useState, useRef } from 'react';
import { Socket } from 'socket.io-client';

import { useSocket } from '@/components/socket-provider';
import { CardList } from '@/components/ui/card-list';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { toast, UNSAVED_CHANGES_TOAST } from '@/components/ui/use-toast';
import {
  Action,
  ActionType,
  deepMergeAndCast,
  flowHelper,
  FlowOperationType,
  GenerateCodeRequest,
  GenerateCodeResponse,
  WebsocketClientEvent,
  WebsocketServerEvent,
} from '@activepieces/shared';

import { LeftSideBarType, useBuilderStateContext } from '../builder-hooks';
import { SidebarHeader } from '../sidebar-header';

import { ChatMessage, CopilotMessage } from './chat-message';

interface DefaultEventsMap {
  [event: string]: (...args: any[]) => void;
}

const initialMessages: CopilotMessage[] = [
  {
    messageType: 'text',
    content: t("Hi! Give me an idea and I'll write the code for it."),
    userType: 'bot',
  },
];

async function getCodeResponse(
  socket: Socket<DefaultEventsMap, DefaultEventsMap>,
  request: GenerateCodeRequest,
): Promise<GenerateCodeResponse> {
  const id = nanoid();
  socket.emit(WebsocketServerEvent.GENERATE_CODE, {
    ...request,
    id,
  });
  return new Promise<GenerateCodeResponse>((resolve, reject) => {
    socket.on(
      WebsocketClientEvent.GENERATE_CODE_FINISHED,
      (response: GenerateCodeResponse) => {
        resolve(response);
      },
    );
    socket.on('error', (error: any) => {
      reject(error);
    });
  });
}

export const CopilotSidebar = () => {
  const [messages, setMessages] = useState<CopilotMessage[]>(initialMessages);
  const [inputMessage, setInputMessage] = useState('');
  const [
    selectedStep,
    flowVersion,
    refreshSettings,
    applyOperation,
    setLeftSidebar,
  ] = useBuilderStateContext((state) => [
    state.selectedStep,
    state.flowVersion,
    state.refreshSettings,
    state.applyOperation,
    state.setLeftSidebar,
  ]);
  const lastMessageRef = useRef<HTMLDivElement>(null);
  const socket = useSocket();
  const scrollToLastMessage = () => {
    setTimeout(() => {
      lastMessageRef.current?.scrollIntoView({
        behavior: 'smooth',
      });
    }, 1);
  };
  const { isPending, mutate } = useMutation({
    mutationFn: (request: GenerateCodeRequest) =>
      getCodeResponse(socket, request),
    onSuccess: (response: GenerateCodeResponse) => {
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          content: {
            code: response.code,
            packages: response.packageJson,
            inputs: response.inputs,
          },
          messageType: 'code',
          userType: 'bot',
        },
      ]);
      scrollToLastMessage();
    },
    onError: (error: any) => {
      toast({
        title: t('Error generating code'),
        description: error.message,
      });
    },
  });

  const handleSendMessage = () => {
    const trimmedInputMessage = inputMessage.trim();
    if (trimmedInputMessage === '') {
      return;
    }
    mutate({
      prompt: `${inputMessage}. ${t(
        'Please return the code formatted and use inputs parameter for the inputs. All TypeScript code, should use import for dependencies.',
      )}`,
      previousContext: messages.map((message) => ({
        role: message.userType === 'user' ? 'user' : 'assistant',
        content: JSON.stringify(message.content),
      })),
    });
    setMessages([
      ...messages,
      { content: inputMessage, userType: 'user', messageType: 'text' },
    ]);
    setInputMessage('');
    scrollToLastMessage();
  };

  const updateAction = (newAction: Action): void => {
    setMessages([
      ...messages,
      {
        content: t('I have updated the code piece for you.'),
        userType: 'bot',
        messageType: 'text',
      },
    ]);
    applyOperation(
      {
        type: FlowOperationType.UPDATE_ACTION,
        request: newAction,
      },
      () => toast(UNSAVED_CHANGES_TOAST),
    );
  };

  const mergeInputs = (
    inputsOne: Record<string, string>,
    inputsTwo: Record<string, string> | undefined,
  ) => {
    if (!inputsOne) {
      return {};
    }
    return Object.keys(inputsOne).reduce(
      (acc: Record<string, string>, input) => {
        acc[input] = inputsOne[input];
        if (inputsTwo && inputsTwo[input] !== undefined) {
          acc[input] = inputsTwo[input];
        }
        return acc;
      },
      {},
    );
  };

  const applyCodeToCurrentStep = (message: CopilotMessage) => {
    if (!selectedStep) {
      return;
    }
    const step = flowHelper.getStep(flowVersion, selectedStep);
    if (!step) {
      return;
    }
    const isCodeType = message.messageType !== 'code';
    if (isCodeType) {
      return;
    }
    const mergedInputs = mergeInputs(
      message.content.inputs,
      step.settings.input,
    );
    if (step.type === ActionType.CODE) {
      const newStep = deepMergeAndCast(step, {
        settings: {
          input: mergedInputs,
          sourceCode: {
            code: message.content.code,
            packageJson: JSON.stringify(message.content.packages, null, 2),
          },
        },
      });
      updateAction(newStep);
      refreshSettings();
    }
  };

  return (
    <div className="flex flex-col h-full">
      <SidebarHeader onClose={() => setLeftSidebar(LeftSideBarType.NONE)}>
        {t('AI Copilot')}
      </SidebarHeader>
      <div className="flex flex-col flex-grow overflow-hidden">
        <ScrollArea className="flex-grow overflow-auto">
          <CardList>
            {messages.map((message, index) => (
              <ChatMessage
                key={index}
                message={message}
                ref={index === messages.length - 1 ? lastMessageRef : null}
                onApplyCode={(message) => applyCodeToCurrentStep(message)}
              />
            ))}
            <ScrollBar />
          </CardList>
        </ScrollArea>
        <div className="relative p-4 bg-white dark:bg-gray-900 border-t dark:border-gray-700">
          <input
            value={inputMessage}
            type="text"
            className="w-full focus:outline-none p-2 border rounded-xl bg-gray-100 dark:bg-gray-700 dark:text-gray-100 pr-12"
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSendMessage();
              }
            }}
          />
          <button
            onClick={handleSendMessage}
            className="absolute right-5 top-1/2 transform -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-md hover:bg-gray-100 dark:hover:bg-gray-600"
            aria-label={t('Send')}
            disabled={isPending}
          >
            {isPending ? (
              <LoaderCircle className="w-5 h-5 text-gray-700 dark:text-gray-300 animate-spin" />
            ) : (
              <ArrowUp className="w-5 h-5 text-gray-700 dark:text-gray-300 " />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

CopilotSidebar.displayName = 'ChatSidebar';
