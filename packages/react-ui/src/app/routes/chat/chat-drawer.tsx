import { ArrowRight } from 'lucide-react';
import React, { useEffect } from 'react';

import {
  ChatDrawerSource,
  useBuilderStateContext,
} from '@/app/builder/builder-hooks';
import { useSocket } from '@/components/socket-provider';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import {
  FlowRun,
  RunEnvironment,
  WebsocketClientEvent,
} from '@activepieces/shared';

import { FlowChat } from './flow-chat';

interface ChatDrawerProps {
  source: ChatDrawerSource | null;
  onOpenChange: (open: boolean) => void;
}

export const ChatDrawer = ({ source, onOpenChange }: ChatDrawerProps) => {
  const [
    setRun,
    chatSessionMessages,
    chatSessionId,
    addChatMessage,
    flowVersion,
    setChatSessionId,
  ] = useBuilderStateContext((state) => [
    state.setRun,
    state.chatSessionMessages,
    state.chatSessionId,
    state.addChatMessage,
    state.flowVersion,
    state.setChatSessionId,
  ]);
  const socket = useSocket();

  const isListening = React.useRef(false);

  useEffect(() => {
    const onTestFlowRunStarted = (run: FlowRun) => {
      if (
        run.flowVersionId === flowVersion.id &&
        run.environment === RunEnvironment.TESTING &&
        isListening.current
      ) {
        setRun(run, flowVersion);
        isListening.current = false;
      }
    };
    socket.on(WebsocketClientEvent.TEST_FLOW_RUN_STARTED, onTestFlowRunStarted);

    return () => {
      socket.off(
        WebsocketClientEvent.TEST_FLOW_RUN_STARTED,
        onTestFlowRunStarted,
      );
    };
  }, [socket]);

  return (
    <Drawer
      open={source !== null}
      onOpenChange={onOpenChange}
      direction="right"
      dismissible={false}
    >
      <DrawerContent className="w-[500px] overflow-x-hidden">
        <DrawerHeader>
          <div className="p-4">
            <div className="flex items-center gap-1">
              <Button
                variant="basic"
                size={'icon'}
                className="text-foreground"
                onClick={() => onOpenChange(false)}
              >
                <ArrowRight className="h-5 w-5" />
              </Button>
              <DrawerTitle>Chat</DrawerTitle>
            </div>
          </div>
        </DrawerHeader>
        <div className="flex-1 overflow-hidden">
          <FlowChat
            flowId={flowVersion.flowId}
            className="h-full"
            mode={source}
            showWelcomeMessage={true}
            onError={() => {}}
            closeChat={() => {
              onOpenChange(false);
            }}
            onSendingMessage={() => {
              if (source === 'test-flow') {
                isListening.current = true;
              }
            }}
            messages={chatSessionMessages}
            chatSessionId={chatSessionId}
            onAddMessage={addChatMessage}
            onSetSessionId={setChatSessionId}
          />
        </div>
      </DrawerContent>
    </Drawer>
  );
};
