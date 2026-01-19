import { ArrowUp } from 'lucide-react';
import React, { useState, useRef, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { chatHooks } from '@/features/chat-v2/lib/chat-hooks';
import { useChatSessionStore } from '@/features/chat-v2/store';
import { cn } from '@/lib/utils';
import { isNil } from '@activepieces/shared';

import { AIModelSelector } from './model-selector';
import { WebSearchToolToggle } from './tools/web-search';

interface PromptInputProps {
  placeholder?: string;
}

export const PromptInput = ({ placeholder }: PromptInputProps) => {
  const [message, setMessage] = useState('');
  const internalRef = useRef<HTMLTextAreaElement>(null);

  const { session, setSession } = useChatSessionStore();
  const { mutate: sendMessage, isPending: isStreaming } =
    chatHooks.useSendMessage(setSession);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setMessage(newValue);
  };

  const handleSend = () => {
    if (message.trim() && !isStreaming) {
      sendMessage({
        message,
        currentSession: isNil(session) ? null : session,
      });
      setMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col w-full">
      <div className="relative">
        <div
          className={`h-[155px] w-full p-px rounded-lg border border-input-border`}
        >
          <div
            className={cn(
              'relative rounded-md bg-background w-full h-full flex flex-col justify-between',
            )}
          >
            <div className="p-2 pb-0 grow flex flex-col">
              <Textarea
                ref={internalRef}
                className="w-full bg-background border-none resize-none overflow-hidden grow"
                placeholder={placeholder}
                minRows={10}
                maxRows={4}
                value={message}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
              />
            </div>
            <div className="flex justify-between mx-2 mb-3">
              <div className="flex justify-start items-center gap-x-1">
                <WebSearchToolToggle />
                <AIModelSelector />
              </div>
              <Button
                variant="default"
                size="icon"
                onClick={handleSend}
                loading={isStreaming}
                disabled={!message.trim() || isStreaming}
              >
                <ArrowUp className="w-5 h-5 stroke-[3px]" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
