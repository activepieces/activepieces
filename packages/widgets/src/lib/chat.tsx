import React from 'react';
import ReactDOM from 'react-dom/client';
import { ChatWindow, ChatWindowProps } from '../components/ChatWindow';

export interface ChatOptions extends ChatWindowProps {
  parent?: HTMLElement;
}

export function createChat(options: ChatOptions) {
  const {
    parent = document.body,
    title = 'Chat',
    welcomeMessage = '👋 Hi there! How can I help you today?',
    webhookUrl,
    theme = {},
  } = options;

  // Check if the container already exists
  let container = parent.querySelector('.automationx-chat-container');

  // If container doesn't exist, create it
  if (!container) {
    container = document.createElement('div');
    container.className = 'automationx-chat-container';
    parent.appendChild(container);
  } else {
    console.log('Widget is already attached to this parent.');
    return;
  }

  // Set default styles
  theme.headerColor = theme.headerColor ?? '#333';
  theme.headerTextColor = theme.headerTextColor ?? '#fff';
  theme.backgroundColor = theme.backgroundColor ?? '#fff';
  theme.userMessageColor = theme.userMessageColor ?? '#ccc';
  theme.userMessageTextColor = theme.userMessageTextColor ?? '#333';
  theme.botMessageColor = theme.botMessageColor ?? '#333';
  theme.botMessageTextColor = theme.botMessageTextColor ?? '#fff';
  theme.buttonColor = theme.buttonColor ?? '#333';
  theme.buttonTextColor = theme.buttonTextColor ?? '#fff';
  theme.inputBorderColor = theme.inputBorderColor ?? '#ccc';

  const root = ReactDOM.createRoot(container);
  root.render(
    <ChatWindow
      webhookUrl={webhookUrl}
      title={title}
      welcomeMessage={welcomeMessage}
      theme={theme}
    />
  );

  return {
    destroy: () => {
      root.unmount();
      container.remove();
    },
  };
}
