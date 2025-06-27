import { ArrowLeft } from 'lucide-react';
import React, { useEffect } from 'react';

import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { FlowRun, FlowVersion, RunEnvironment, WebsocketClientEvent, WebsocketServerEvent } from '@activepieces/shared';
import { FlowChat } from './flow-chat';
import { useSocket } from '@/components/socket-provider';
import { ChatDrawerSource, useBuilderStateContext } from '@/app/builder/builder-hooks';

interface ChatDrawerProps {
  source: ChatDrawerSource | null;
  onOpenChange: (open: boolean) => void;
  flowVersion: FlowVersion;
}

export const ChatDrawer = ({
  source,
  onOpenChange,
  flowVersion,
}: ChatDrawerProps) => {


  const [setRun] =
    useBuilderStateContext((state) => [
      state.setRun,
    ]);
  const socket = useSocket();

  const isListening = React.useRef(false);

  useEffect(() => {

    const onTestFlowRunStarted = (run: FlowRun) => {
      if (run.flowVersionId === flowVersion.id && run.environment === RunEnvironment.TESTING && isListening.current) {
        setRun(run, flowVersion);
        isListening.current = false;

      }

    };
    socket.on(WebsocketClientEvent.TEST_FLOW_RUN_STARTED, onTestFlowRunStarted);

    return () => {
      socket.off(WebsocketClientEvent.TEST_FLOW_RUN_STARTED, onTestFlowRunStarted);
    };
  }, [socket]);

  return (
    <Drawer
      open={source !== null}
      onOpenChange={onOpenChange}
      dismissible={false}
      direction="right"
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
                <ArrowLeft className="h-5 w-5" />
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
            onError={() => { }}
            closeChat={() => {
              onOpenChange(false)
            }}
            onSendingMessage={() => {
              if (source === 'test-flow') {
                isListening.current = true;
              }
            }}
          />
        </div>
      </DrawerContent>
    </Drawer>
  );
};