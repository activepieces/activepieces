import { t } from 'i18next';
import { useEffect, useState } from 'react';

import { ChatMessage, CopilotMessage } from './chat-message';

const LoadingMessage = () => {
  const [message, setMessage] = useState<CopilotMessage>({
    content: t('Generating Code'),
    messageType: 'text',
    userType: 'bot',
  });

  useEffect(() => {
    const interval = setInterval(() => {
      if (message.messageType === 'text') {
        const numberOfDots = message.content.split('.').length - 1;
        setMessage({
          ...message,
          content: `${t('Generating Code')}${
            numberOfDots === 1 ? '..' : numberOfDots === 2 ? '...' : '.'
          }`,
        });
      }
    }, 250);
    return () => clearInterval(interval);
  });
  return <ChatMessage message={message} onApplyCode={() => {}} />;
};
LoadingMessage.displayName = 'LoadingMessage';
export { LoadingMessage };
