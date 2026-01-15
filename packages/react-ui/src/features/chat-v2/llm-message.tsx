import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { CopyButton } from '@/components/custom/clipboard/copy-button';
import { Reasoning, ReasoningTrigger, ReasoningContent } from './reasoning';

export type LLMMessageItem = 
  | { type: 'text'; text: string }
  | { 
      type: 'reasoning'; 
      isStreaming?: boolean;
      defaultOpen?: boolean;
      content: string;
      duration?: number;
    };

interface LLMMessageProps {
  messages: LLMMessageItem[];
  className?: string;
}

export function LLMMessage({ messages, className }: LLMMessageProps) {
  const fullText = useMemo(() => {
    return messages
      .map((msg) => msg.type === 'text' ? msg.text : msg.content)
      .join('\n\n');
  }, [messages]);

  return (
    <div
      className={cn(
        'group text-base max-w-[70%] space-y-4',
        className
      )}
    >
      {messages.map((message, index) => {
        if (message.type === 'text') {
          return <div key={index}>{message.text}</div>;
        }
        
        if (message.type === 'reasoning') {
          return (
            <Reasoning 
              key={index}
              isStreaming={message.isStreaming ?? false}
              defaultOpen={message.defaultOpen ?? true}
              duration={message.duration}
            >
              <ReasoningTrigger />
              <ReasoningContent>
                {message.content}
              </ReasoningContent>
            </Reasoning>
          );
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
  );
}

