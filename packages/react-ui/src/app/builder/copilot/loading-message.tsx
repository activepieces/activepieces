import React, { useEffect, useState } from 'react';
import { CopilotAvatar } from './copilot-avatar';
import { ChatBubble, ChatBubbleMessage } from '@/components/ui/chat/chat-bubble';

type LoadingMessageProps = {
  message: string;
}

export const LoadingMessage = ({ message }: LoadingMessageProps) => {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => {
        if (prev.length >= 3) return '';
        return prev + '.';
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <ChatBubble variant="received">
      <CopilotAvatar />
      <ChatBubbleMessage>
        {message}
        <span className="inline-block w-8 text-left">{dots}</span>
      </ChatBubbleMessage>
    </ChatBubble>
  );
};