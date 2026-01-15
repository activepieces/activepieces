import React from 'react';

interface ConversationProps {
  children: React.ReactNode;
  className?: string;
}

export function Conversation({ children, className }: ConversationProps) {
  return (
    <div className={className}>
      {children}
    </div>
  );
}

