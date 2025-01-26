import { t } from 'i18next';
import { RightSideBarType, useBuilderStateContext } from '@/app/builder/builder-hooks';
import { ScrollArea } from '@/components/ui/scroll-area';
import { copilotApi } from './copilot-api';
import { useMutation } from '@tanstack/react-query';
import { useSocket } from '@/components/socket-provider';
import { ChatMessageList } from '@/components/ui/chat/chat-message-list';
import { ChatInput } from '@/components/ui/chat/chat-input';
import MessageLoading from '@/components/ui/chat/message-loading';
import { PreviewPlanMessage } from './messages/preview-plan-message';
import { TextMessage } from './messages/text-message';
import { ActionType, AskCopilotRequest, FlowOperationType } from '@activepieces/shared';
import { nanoid } from 'nanoid';
import { CopilotStepStatus, FlowPlanMessageContent } from './types';


const planDemo =   {
  id: nanoid(),
  type: 'plan',
  content: {
      steps: [
          {
              title: 'Add Schedule Trigger',
              description: 'Configure a schedule trigger to run the flow at specified intervals',
              status: CopilotStepStatus.SUCCESS
          },
          {
              title: 'Send Slack Message',
              description: 'Connect to Slack and send a message to the specified channel',
              status: CopilotStepStatus.PENDING
          },
          {
              title: 'Send Discord Message', 
              description: 'Connect to Discord and send a message to the specified channel',
              status: CopilotStepStatus.PENDING
          },
          {
            title: 'Send Email',
            description: 'Connect to Email and send a message to the specified channel',
            status: CopilotStepStatus.PENDING
          }
      ]
  }
}
export const CopilotSidebar = () => {
  const socket = useSocket();
  const [messages, addMessage, setRightSidebar, applyOperation, selectStepByName, refreshPieceSettings] = useBuilderStateContext((state) => [
    state.messages,
    state.addMessage,
    state.setRightSidebar,
    state.applyOperation,
    state.selectStepByName,
    state.refreshPieceSettings
  ]);

  const mutation = useMutation({
    mutationFn: (request: AskCopilotRequest) => copilotApi.ask(socket, request),
    onError: () => {
      addMessage({
        id: nanoid(),
        type: 'assistant_message',
        content: 'Sorry, there was an error generating the workflow.'
      });
    }
  });

  const handleSendMessage = (content: string) => {
    console.log('content', content);
    const trimmedContent = content.trim();
    if (!trimmedContent) return;

    addMessage({
      id: nanoid(),
      type: 'user_message',
      content: trimmedContent
    });
    addMessage(planDemo as FlowPlanMessageContent);
    animate(planDemo as FlowPlanMessageContent);
  };

  async function animate(message: FlowPlanMessageContent) {
    setRightSidebar(RightSideBarType.NONE);
    let stepIndex = 0;
    for (const step of message.content.steps) {
      stepIndex++;
      if (stepIndex === 1) {
        continue;
      }
      const stepName = `step_${stepIndex}`;
      applyOperation({
        type: FlowOperationType.ADD_ACTION,
        request: {
          parentStep: stepIndex === 2 ? 'trigger' : `step_${stepIndex - 1}`,
          action: {
            displayName: step.title,
            name: stepName,
            valid: true,
            skip: false,
            type: ActionType.CODE,
            settings: {
              sourceCode: {
                code: "export const code = async (inputs) => {\n  const numbers = inputs.numbers || [];\n  const sum = numbers.reduce((acc, curr) => acc + curr, 0);\n  return { sum };\n};",
                packageJson: "{}"
              },
              input: {
                numbers: []
              },
              inputUiInfo: {
                customizedInputs: {}
              },
              errorHandlingOptions: {
                continueOnFailure: {
                  value: false
                },
                retryOnFailure: {
                  value: false
                }
              }
            }
          }
        }
      });
      selectStepByName(stepName)
      setRightSidebar(RightSideBarType.PIECE_SETTINGS);
      refreshPieceSettings();
      message.content.steps[stepIndex - 1].status = CopilotStepStatus.SUCCESS;
      addMessage(message);
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }

  return (
    <div className="flex h-full flex-col">
      <ScrollArea className="flex-1">
        <div className="flex flex-col h-full">
          <ChatMessageList className="flex-1">
            {messages.map((message, index) => {
              if (message.type === 'plan') {
                return <PreviewPlanMessage key={index} message={message} />;
              }
              return <TextMessage key={index} content={message} />;
            })}
            {mutation.isPending && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg p-2">
                  <MessageLoading />
                </div>
              </div>
            )}
          </ChatMessageList>
        </div>
      </ScrollArea>

      <div className="p-4">
        <ChatInput
          placeholder="How can I help you today?"
          onSendMessage={handleSendMessage}
        />
      </div>
    </div>
  );
};
