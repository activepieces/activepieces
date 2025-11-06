import { ArrowRight } from 'lucide-react';
import { useRef } from 'react';

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

export const ChatDrawer = () => {
  const [
    chatSessionMessages,
    chatSessionId,
    addChatMessage,
    flowVersion,
    setChatSessionId,
    setRun,
    chatDrawerOpenSource,
    setChatDrawerOpenSource,
  ] = useBuilderStateContext((state) => [
    state.chatSessionMessages,
    state.chatSessionId,
    state.addChatMessage,
    state.flowVersion,
    state.setChatSessionId,
    state.setRun,
    state.chatDrawerOpenSource,
    state.setChatDrawerOpenSource,
  ]);
  const socket = useSocket();
  const isListening = useRef(false);
  //shouldn't use testFlow hook here because it would run the flow with sample data not the real user message
  const listenToTestRun = () => {
    isListening.current = true;
    const onTestFlowRunStarted = (run: FlowRun) => {
      if (
        run.flowVersionId === flowVersion.id &&
        run.environment === RunEnvironment.TESTING &&
        isListening.current
      ) {
        setRun(run, flowVersion);
        isListening.current = false;
        socket.off(
          WebsocketClientEvent.TEST_FLOW_RUN_STARTED,
          onTestFlowRunStarted,
        );
      }
    };
    socket.on(WebsocketClientEvent.TEST_FLOW_RUN_STARTED, onTestFlowRunStarted);
  };
  return (
    <Drawer
      open={chatDrawerOpenSource !== null}
      onOpenChange={() => setChatDrawerOpenSource(null)}
      direction="right"
      dismissible={false}
      modal={false}
    >
      <DrawerContent className="w-[500px] overflow-x-hidden">
        <DrawerHeader>
          <div className="p-4">
            <div className="flex items-center gap-1">
              <Button
                variant="basic"
                size={'icon'}
                className="text-foreground"
                onClick={() => setChatDrawerOpenSource(null)}
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
            mode={chatDrawerOpenSource}
            showWelcomeMessage={true}
            onError={() => {}}
            onSendingMessage={() => {
              if (chatDrawerOpenSource === ChatDrawerSource.TEST_FLOW) {
                listenToTestRun();
              }
            }}
            closeChat={() => {
              setChatDrawerOpenSource(null);
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
