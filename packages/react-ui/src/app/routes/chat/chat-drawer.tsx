import { ArrowRight } from 'lucide-react';

import {
  ChatDrawerSource,
  useBuilderStateContext,
} from '@/app/builder/builder-hooks';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { flowsHooks } from '@/features/flows/lib/flows-hooks';

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

  const { mutate: runFlow } = flowsHooks.useTestFlow({
    flowVersionId: flowVersion.id,
    onUpdateRun: (run) => {
      setRun(run, flowVersion);
    },
  });

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
            closeChat={() => {
              setChatDrawerOpenSource(null);
            }}
            onSendingMessage={() => {
              if (chatDrawerOpenSource === ChatDrawerSource.TEST_FLOW) {
                runFlow();
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
