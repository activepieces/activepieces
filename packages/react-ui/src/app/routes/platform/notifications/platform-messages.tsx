import { AlertCircle, SparklesIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

import { notificationHooks } from './hooks/notifications-hooks';

export const PlatformMessages = () => {
  const messages = notificationHooks.useNotifications();
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <Alert
          key={message.title}
          variant={message.type}
          className="flex items-start"
        >
          {message.type === 'destructive' ? (
            <AlertCircle className="h-4 w-4" />
          ) : (
            <SparklesIcon className="h-4 w-4" />
          )}
          <div className="flex-grow">
            <AlertTitle>{message.title}</AlertTitle>
            <AlertDescription>{message.description}</AlertDescription>
          </div>
          {message.actionText && message.actionLink && (
            <Button
              variant="link"
              className={
                message.type === 'destructive'
                  ? ' text-destructive-300'
                  : 'text-primary-300'
              }
              onClick={() => navigate(message.actionLink)}
            >
              {message.actionText}
            </Button>
          )}
        </Alert>
      ))}
    </div>
  );
};
