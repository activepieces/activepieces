import React from 'react';
import { WelcomeMessage } from "./messages/welcome-message";
import { UserMessage } from "./messages/user-message";
import { FeedbackMessage } from "./messages/feedback-message";
import { LoadingMessage } from "./messages/loading-message";
import { PiecesMessage } from "./messages/pieces-message";

type CopilotMessage = {
  type: 'welcome' | 'user' | 'feedback' | 'loading' | 'pieces';
  message?: string;
  pieces?: string[];
}

interface CopilotMessageListProps {
  messages: CopilotMessage[];
}

export const CopilotMessageList: React.FC<CopilotMessageListProps> = ({ messages }) => {
  return (
    <>
      {messages.map((msg, index) => {
        switch (msg.type) {
          case 'welcome':
            return <WelcomeMessage key={index} />;
          case 'user':
            return <UserMessage key={index} message={msg.message || ''} />;
          case 'feedback':
            return <FeedbackMessage key={index} message={msg.message || ''} />;
          case 'loading':
            return <LoadingMessage key={index} message={msg.message || ''} />;
          case 'pieces':
            return <PiecesMessage key={index} pieces={msg.pieces || []} />;
          default:
            return null;
        }
      })}
    </>
  );
}; 