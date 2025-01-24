import { t } from "i18next";
import { LeftSideBarType, useBuilderStateContext } from "../builder-hooks";
import { SidebarHeader } from "../sidebar-header";
import { ChatInput } from "@/components/ui/chat/chat-input";
import { ChatMessageList } from "@/components/ui/chat/chat-message-list";
import { Button } from "@/components/ui/button";
import { ArrowUpIcon } from "@radix-ui/react-icons";
import { useState } from "react";
import { ActionType, FlowOperationType, flowStructureUtil, isNil, PackageType, PieceType } from "@activepieces/shared";
import { Workflow } from "lucide-react";
import { CopilotMessageList } from "./copilot-message-list";

type CopilotMessage = {
  type: 'welcome' | 'user' | 'feedback' | 'loading' | 'pieces';
  message?: string;
  pieces?: string[];
}

export const CopilotSidebar = () => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<CopilotMessage[]>([
    { type: 'welcome', message: "Hi! I'm Lotfi, your AI assistant. How can I help you today?" }
  ]);
  const [setLeftSidebar, applyOperation, selectedStep] = useBuilderStateContext(
    (state) => [state.setLeftSidebar, state.applyOperation, isNil(state.selectedStep) ? null : flowStructureUtil.getStep(state.selectedStep, state.flow.version.trigger)],
  );

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      const newMessages: CopilotMessage[] = [...messages, { type: 'user', message: input }];
      setMessages(newMessages);
      setInput("");
      addAnimation(newMessages);
    }
  };

  async function addAnimation(messages: CopilotMessage[]) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    setMessages([...messages, { type: 'loading', message: 'Thinking...' }]);
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Add Gmail action
    applyOperation(
      {
        type: FlowOperationType.ADD_ACTION,
        request: {
          parentStep: 'trigger',
          action: {
            name: "step_1",
            skip: false,
            type: ActionType.PIECE,
            valid: false,
            settings: {
              input: {},
              pieceName: "@activepieces/piece-gmail",
              pieceType: PieceType.OFFICIAL,
              packageType: PackageType.REGISTRY,
              actionName: "send_email",
              inputUiInfo: {
                customizedInputs: {}
              },
              pieceVersion: "~0.8.1",
            },
            displayName: "Send Email"
          },
        },
      },
    );

    await new Promise(resolve => setTimeout(resolve, 2600));

    // Add Slack action
    applyOperation(
      {
        type: FlowOperationType.ADD_ACTION,
        request: {
          parentStep: 'step_1',
          action: {
            name: "step_2",
            skip: false,
            type: ActionType.PIECE,
            valid: false,
            settings: {
              input: {},
              pieceName: "@activepieces/piece-slack",
              pieceType: PieceType.OFFICIAL,
              packageType: PackageType.REGISTRY,
              actionName: "send_message",
              inputUiInfo: {
                customizedInputs: {}
              },
              pieceVersion: "~0.5.0",
            },
            displayName: "Send Slack Message"
          },
        },
      },
    );

    await new Promise(resolve => setTimeout(resolve, 3000));

    // Add Discord action
    applyOperation(
      {
        type: FlowOperationType.ADD_ACTION,
        request: {
          parentStep: 'step_2',
          action: {
            name: "step_3",
            skip: false,
            type: ActionType.PIECE,
            valid: false,
            settings: {
              input: {},
              pieceName: "@activepieces/piece-discord",
              pieceType: PieceType.OFFICIAL,
              packageType: PackageType.REGISTRY,
              actionName: "send_message_webhook",
              inputUiInfo: {
                customizedInputs: {}
              },
              pieceVersion: "~0.3.0",
            },
            displayName: "Send Discord Message"
          },
        },
      },
    );
    setMessages([...messages, { type: 'feedback', message: 'I added three actions in sequence - Gmail, Slack and Discord. What do you think?' }]);
  }

  return (
    <div className="flex flex-col h-full">
      <SidebarHeader onClose={() => setLeftSidebar(LeftSideBarType.NONE)}>
        {t('Ask Lotfi')}
      </SidebarHeader>
      <ChatMessageList className="flex-grow space-y-6">
        <CopilotMessageList messages={messages} />
      </ChatMessageList>
      <div className="p-4">
        {selectedStep && (
          <div className="mb-2 text-sm text-muted-foreground flex items-center gap-2">
            <Workflow className="w-4 h-4" />
            <span>Selected step: {selectedStep.displayName}</span>
          </div>
        )}
        <form onSubmit={onSubmit}>
          <ChatInput
            autoFocus
            minRows={1}
            maxRows={10}
            value={input}
            onChange={(e) => {
              setInput(e.target.value)
              e.stopPropagation()
              e.preventDefault()
            }}
            placeholder="Message Lotfi"
            className="rounded-lg"
            button={
              <Button
                disabled={!input}
                type="submit"
                size="icon"
                className="rounded-full min-w-6 min-h-6 h-6 w-6 text-black bg-black"
              >
                <ArrowUpIcon className="w-3 h-3 " />
              </Button>
            }
          />
        </form>
      </div>
    </div>
  );
};

CopilotSidebar.displayName = 'ChatSidebar';
