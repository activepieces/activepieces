import { useMutation } from '@tanstack/react-query';
import { nanoid } from 'nanoid';

import {
  RightSideBarType,
  useBuilderStateContext,
} from '@/app/builder/builder-hooks';
import { useSocket } from '@/components/socket-provider';
import { ChatInput } from '@/components/ui/chat/chat-input';
import { ChatMessageList } from '@/components/ui/chat/chat-message-list';
import MessageLoading from '@/components/ui/chat/message-loading';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ActionType,
  AskCopilotRequest,
  FlowOperationType,
  flowStructureUtil,
  PackageType,
  PieceTriggerSettings,
  PieceType,
  StepLocationRelativeToParent,
  TriggerType,
} from '@activepieces/shared';

import { copilotApi } from './copilot-api';
import { PreviewPlanMessage } from './messages/preview-plan-message';
import { TextMessage } from './messages/text-message';
import { CopilotStepStatus, FlowPlanMessageContent } from './types';

const code = `
function getLoremIpsum() {
  return \`Lorem ipsum dolor sit amet, consectetur adipiscing elit, AP.
  Lorem ipsum dolor sit amet, consectetur adipiscing elit,
  Lorem ipsum dolor sit amet, consectetur adipiscing elit, AP.
  Lorem ipsum dolor sit amet, consectetur adipiscing elit, AP.
  \`;
}
export const code = async (inputs) => {
  const numbers = inputs.numbers || [];
  const sum = numbers.reduce((acc, curr) => acc + curr, 0);
  return { sum };
};`;
async function* codeStepStreamer() {
  const splitCode: string[] = [];
  for (let i = 0; i < code.length; i += 4) {
    splitCode.push(code.substring(i, i + 4));
  }
  for (const substring of splitCode) {
    yield substring;
    await sleep(0);
  }
}
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const planDemo = {
  id: nanoid(),
  type: 'plan' as const,
  content: {
    steps: [
      {
        title: 'Add Schedule Trigger',
        description:
          'Configure a schedule trigger to run the flow at specified intervals',
        status: CopilotStepStatus.SUCCESS,
        isTrigger: true as const,
        triggerSettings: {
          pieceName: '@activepieces/piece-schedule',
          pieceVersion: '~0.1.5',
          pieceType: PieceType.OFFICIAL,
          packageType: PackageType.REGISTRY,
          input: {
            minutes: 1,
          },
          inputUiInfo: {
            customizedInputs: {},
          },
          triggerName: 'every_x_minutes',
        } as PieceTriggerSettings,
      },
      {
        title: 'Send Slack Message',
        description:
          'Connect to Slack and send a message to the specified channel',
        status: CopilotStepStatus.PENDING,
        isTrigger: false as const,
      },
      {
        title: 'Send Discord Message',
        description:
          'Connect to Discord and send a message to the specified channel',
        status: CopilotStepStatus.PENDING,
        isTrigger: false as const,
      },
      {
        title: 'Send Email',
        description:
          'Connect to Email and send a message to the specified channel',
        status: CopilotStepStatus.PENDING,
        isTrigger: false as const,
      },
    ],
  },
};
export const CopilotSidebar = () => {
  const socket = useSocket();
  const [
    messages,
    addMessage,
    setRightSidebar,
    applyOperation,
    selectStepByName,
    refreshPieceSettings,
    flowVersion,
    setRightSidebarSize,
    removeStepSelection,
    setIsApplyingCopilotPlan,
  ] = useBuilderStateContext((state) => [
    state.messages,
    state.addMessage,
    state.setRightSidebar,
    state.applyOperation,
    state.selectStepByName,
    state.refreshPieceSettings,
    state.flowVersion,
    state.setRightSidebarSize,
    state.removeStepSelection,
    state.setIsApplyingCopilotPlan,
  ]);

  const mutation = useMutation({
    mutationFn: (request: AskCopilotRequest) => copilotApi.ask(socket, request),
    onError: () => {
      addMessage({
        id: nanoid(),
        type: 'assistant_message',
        content: 'Sorry, there was an error generating the workflow.',
      });
    },
  });

  const handleSendMessage = (content: string) => {
    const trimmedContent = content.trim();
    if (!trimmedContent) return;

    addMessage({
      id: nanoid(),
      type: 'user_message',
      content: trimmedContent,
    });
    addMessage(planDemo);
    animate(planDemo);
  };

  async function animate(message: FlowPlanMessageContent) {
    setRightSidebar(RightSideBarType.NONE);
    setIsApplyingCopilotPlan(true);
    await sleep(100);
    const allStepsNames = flowStructureUtil
      .getAllSteps(flowVersion.trigger)
      .map((step) => step.name);
    let previousStepName = 'trigger';
    for (const step of message.content.steps) {
      const stepName = flowStructureUtil.findUnusedName(allStepsNames);
      const stepIndexInMessage = message.content.steps.findIndex(
        (s) => step.title === s.title,
      );
      message.content.steps[stepIndexInMessage].status =
        CopilotStepStatus.RUNNING;
      addMessage(message);
      if (step.isTrigger) {
        applyOperation({
          type: FlowOperationType.UPDATE_TRIGGER,
          request: {
            displayName: 'Schedule Trigger',
            name: 'trigger',
            type: TriggerType.PIECE,
            valid: true,
            settings: step.triggerSettings,
          },
        });
        selectStepByName('trigger');
      } else {
        applyOperation({
          type: FlowOperationType.ADD_ACTION,
          request: {
            stepLocationRelativeToParent: StepLocationRelativeToParent.AFTER,
            parentStep: previousStepName,
            action: {
              displayName: step.title,
              name: stepName,
              valid: true,
              skip: false,
              type: ActionType.CODE,
              settings: {
                sourceCode: {
                  code: '',
                  packageJson: '{}',
                },
                input: {
                  numbers: [],
                },
                inputUiInfo: {
                  customizedInputs: {},
                },
                errorHandlingOptions: {
                  continueOnFailure: {
                    value: false,
                  },
                  retryOnFailure: {
                    value: false,
                  },
                },
              },
            },
          },
        });
      }

      if (!step.isTrigger) {
        selectStepByName(stepName);
        allStepsNames.push(stepName);
        previousStepName = stepName;
        let stepCode = '';
        refreshPieceSettings();
        await sleep(1000);
        setRightSidebarSize(50);
        for await (const codeChunk of codeStepStreamer()) {
          stepCode += codeChunk;
          applyOperation({
            type: FlowOperationType.UPDATE_ACTION,
            request: {
              displayName: step.title,
              name: stepName,
              type: ActionType.CODE,
              valid: true,
              settings: {
                input: {},
                sourceCode: {
                  code: stepCode,
                  packageJson: '{}',
                },
              },
            },
          });
          refreshPieceSettings();
        }
        await sleep(1000);
      } else {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      if (stepIndexInMessage < message.content.steps.length - 1) {
        removeStepSelection();
      }
      await sleep(750);
      message.content.steps[stepIndexInMessage].status =
        CopilotStepStatus.SUCCESS;
      addMessage(message);
    }
    setIsApplyingCopilotPlan(false);
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
