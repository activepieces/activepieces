import { notificationHooks } from './hooks/notifictions-hooks';
import PlatformAlert from './platform-alert';

export const PlatformMessages = () => {
  const messages = notificationHooks.useNotifications();

  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <PlatformAlert
          key={message.title}
          title={message.title}
          description={message.description}
          actionText={message.actionText}
          actionLink={message.actionLink}
          type={message.type}
        />
      ))}
    </div>
  );
};
