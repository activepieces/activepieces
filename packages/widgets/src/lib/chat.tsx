import React from 'react';
import ReactDOM from 'react-dom/client';
import { ChatWidget, ChatWidgetProps } from '../components/ChatWidget';

export interface ChatOptions extends ChatWidgetProps {
  parent?: HTMLElement;
}

export function createChat(options: ChatOptions) {
  const { parent = document.body, ...rest } = options;

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

  const root = ReactDOM.createRoot(container);
  root.render(<ChatWidget {...rest} />);

  return {
    destroy: () => {
      root.unmount();
      container.remove();
    },
  };
}
