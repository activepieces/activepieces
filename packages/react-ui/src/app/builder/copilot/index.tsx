import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { ArrowUp, LoaderCircle } from 'lucide-react';
import { nanoid } from 'nanoid';
import { useState, useRef, useEffect } from 'react';
import { Socket } from 'socket.io-client';

import { CardList } from '@/components/custom/card-list';
import { useSocket } from '@/components/socket-provider';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { toast } from '@/components/ui/use-toast';
import { CORE_STEP_METADATA } from '@/features/pieces/lib/step-utils';
import {
  CodeAction,
  FlowOperationType,
  flowStructureUtil,
  AskCopilotCodeResponse,
  AskCopilotRequest,
  WebsocketClientEvent,
  WebsocketServerEvent,
  AskCopilotTool,
  FlowActionType,
} from '@activepieces/shared';

import { Textarea } from '../../../components/ui/textarea';
import { pieceSelectorUtils } from '../../../features/pieces/lib/piece-selector-utils';
import { LeftSideBarType, useBuilderStateContext } from '../builder-hooks';
import { SidebarHeader } from '../sidebar-header';

import { ChatMessage, CopilotMessage } from './chat-message';
import { LoadingMessage } from './loading-message';

interface DefaultEventsMap {
  [event: string]: (...args: any[]) => void;
}

const COPILOT_WELCOME_MESSAGES: CopilotMessage[] = [
  {
    messageType: 'text',
    content: 'welcome',
    userType: 'bot',
  },
];

async function getCodeResponse(
  socket: Socket<DefaultEventsMap, DefaultEventsMap>,
  request: AskCopilotRequest,
): Promise<AskCopilotCodeResponse> {
  const id = nanoid();

  socket.emit(WebsocketServerEvent.ASK_COPILOT, {
    ...request,
    id,
  });
  return new Promise<AskCopilotCodeResponse>((resolve, reject) => {
    socket.on(
      WebsocketClientEvent.ASK_COPILOT_FINISHED,
      (response: AskCopilotCodeResponse) => {
        resolve(response);
      },
    );
    socket.on('error', (error: any) => {
      reject(error);
    });
  });
}

export const CopilotSidebar = () => {
  const [messages, setMessages] = useState<CopilotMessage[]>(
    COPILOT_WELCOME_MESSAGES,
  );
  const [inputMessage, setInputMessage] = useState('');
  const [
    flowVersion,
    refreshSettings,
    applyOperation,
    setLeftSidebar,
    askAiButtonProps,
    selectStepByName,
    setAskAiButtonProps,
    selectedStep,
  ] = useBuilderStateContext((state) => [
    state.flowVersion,
    state.refreshSettings,
    state.applyOperation,
    state.setLeftSidebar,
    state.askAiButtonProps,
    state.selectStepByName,
    state.setAskAiButtonProps,
    state.selectedStep,
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
    mutationFn: (request: AskCopilotRequest) =>
      getCodeResponse(socket, request),
    onSuccess: (response: AskCopilotCodeResponse) => {
      console.log(response);
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          content: {
            code: response.code,
            packages: response.packageJson,
            inputs: response.inputs,
            icon: response.icon ?? '',
            title: response.title,
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
      prompt: inputMessage,
      context: messages.map((message) => ({
        role: message.userType === 'user' ? 'user' : 'assistant',
        content: JSON.stringify(message.content),
      })),
      tools: [AskCopilotTool.GENERATE_CODE],
      flowId: flowVersion.flowId,
      flowVersionId: flowVersion.id,
      selectedStepName: selectedStep ?? undefined,
    });

    setMessages([
      ...messages,
      { content: inputMessage, userType: 'user', messageType: 'text' },
    ]);
    setInputMessage('');
    scrollToLastMessage();
  };
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);
  const applyCodeToCurrentStep = (message: CopilotMessage) => {
    if (!askAiButtonProps) {
      return;
    }
    if (message.messageType !== 'code') {
      return;
    }
    if (askAiButtonProps) {
      const stepName =
        askAiButtonProps.type === FlowOperationType.UPDATE_ACTION
          ? askAiButtonProps.stepName
          : flowStructureUtil.findUnusedName(flowVersion.trigger);
      const codeAction = pieceSelectorUtils.getDefaultStepValues({
        stepName,
        pieceSelectorItem: CORE_STEP_METADATA[FlowActionType.CODE],
        overrideDefaultSettings: {
          input: message.content.inputs,
          sourceCode: {
            code: message.content.code,
            packageJson: JSON.stringify(message.content.packages, null, 2),
          },
        },
      }) as CodeAction;

      codeAction.displayName = message.content.title;
      codeAction.settings.customLogoUrl = message.content.icon;
      if (askAiButtonProps.type === FlowOperationType.ADD_ACTION) {
        applyOperation({
          type: FlowOperationType.ADD_ACTION,
          request: {
            action: codeAction,
            ...askAiButtonProps.actionLocation,
          },
        });
        selectStepByName(stepName);
        setAskAiButtonProps({
          type: FlowOperationType.UPDATE_ACTION,
          stepName: codeAction.name,
        });
      } else {
        const step = flowStructureUtil.getStep(
          askAiButtonProps.stepName,
          flowVersion.trigger,
        );
        if (step) {
          const errorHandlingOptions =
            step.type === FlowActionType.CODE ||
            step.type === FlowActionType.PIECE
              ? step.settings.errorHandlingOptions
              : codeAction.settings.errorHandlingOptions;

          applyOperation({
            type: FlowOperationType.UPDATE_ACTION,
            request: {
              displayName: message.content.title,
              name: step.name,
              settings: {
                ...codeAction.settings,
                customLogoUrl: message.content.icon,
                input: message.content.inputs,
                errorHandlingOptions,
              },
              type: FlowActionType.CODE,
              valid: true,
            },
          });
        }
      }
    }
    refreshSettings();
  };
  useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.focus();
    }
  }, []);

  return (
    <div className="flex flex-col h-full">
      <SidebarHeader onClose={() => setLeftSidebar(LeftSideBarType.NONE)}>
        {t('AI Copilot')}
      </SidebarHeader>
      <div className="flex flex-col flex-grow overflow-hidden ">
        <ScrollArea className="flex-grow overflow-auto">
          <CardList className="pb-3" listClassName="gap-4">
            {messages.map((message, index) => (
              <ChatMessage
                key={index}
                message={message}
                ref={index === messages.length - 1 ? lastMessageRef : null}
                onApplyCode={(message) => applyCodeToCurrentStep(message)}
              />
            ))}
            {isPending && <LoadingMessage></LoadingMessage>}
            <ScrollBar />
          </CardList>
        </ScrollArea>
        <div className="flex items-center py-4 px-3 gap-2 bg-white dark:bg-gray-900 border-t dark:border-gray-700">
          <Textarea
            ref={textAreaRef}
            value={inputMessage}
            className="w-full focus:outline-none p-2 border rounded-xl bg-gray-100 dark:bg-gray-700 dark:text-gray-100 pr-12 resize-none"
            minRows={1}
            autoFocus={true}
            maxRows={4}
            placeholder={t('i.e Calculate the sum of a list...')}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !isPending) {
                handleSendMessage();
                e.preventDefault();
              }
            }}
          />
          <button
            onClick={handleSendMessage}
            className="transform  w-8 h-8 rounded-full flex items-center justify-center border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-md hover:bg-gray-100 dark:hover:bg-gray-600"
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
