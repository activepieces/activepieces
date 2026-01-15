import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { CopyButton } from '@/components/custom/clipboard/copy-button';
import { Reasoning, ReasoningTrigger, ReasoningContent } from './reasoning';
import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { Plan, PlanItemData } from './todo';
import { Thinking } from './thinking';

export type LLMMessageItem = 
  | { type: 'text'; text: string }
  | { 
      type: 'reasoning'; 
      isStreaming?: boolean;
      defaultOpen?: boolean;
      content: string;
      duration?: number;
    }
  | {
      type: 'plan';
      items: PlanItemData[];
    };

interface LLMMessageProps {
  messages: LLMMessageItem[];
  className?: string;
}

export function LLMMessage({ messages, className }: LLMMessageProps) {
  const fullText = useMemo(() => {
    return messages
      .map((msg) => {
        if (msg.type === 'text') return msg.text;
        if (msg.type === 'reasoning') return msg.content;
        if (msg.type === 'plan') return msg.items.map(item => item.text).join('\n');
        return '';
      })
      .join('\n\n');
  }, [messages]);

  const hasNoMessage = messages.length === 0 || fullText.trim().length === 0;

  if (hasNoMessage) {
    return <Thinking className={className} />;
  }

  return (
    <div
      className={cn(
        'group text-base max-w-[70%] space-y-4 flex items-start gap-2',
        className
      )}
    >
      <div className="flex-1 space-y-4">
        {messages.map((message, index) => {
          if (message.type === 'text') {
            return <div key={index}>{message.text}</div>;
          }
          
          if (message.type === 'reasoning') {
            const isStreaming = message.isStreaming ?? false;
            const defaultOpen = message.defaultOpen ?? (isStreaming ? true : false);
            
            return (
              <Reasoning 
                key={index}
                isStreaming={isStreaming}
                defaultOpen={defaultOpen}
              >
                <ReasoningTrigger />
                <ReasoningContent>
                  {message.content}
                </ReasoningContent>
              </Reasoning>
            );
          }
          
          if (message.type === 'plan') {
            return <Plan key={index} items={message.items} />;
          }
          
          return null;
        })}
        <div className="h-5 mt-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
          <CopyButton
            textToCopy={fullText}
            variant="ghost"
            className="h-5 w-5 p-0"
          />
        </div>
      </div>
    </div>
  );
}

