import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import semver from 'semver';

import { useSocket } from '@/components/socket-provider';
import { aiProviderApi } from '@/features/platform-admin-panel/lib/ai-provider-api';
import { flagsHooks } from '@/hooks/flags-hooks';
import { ApFlagId } from '@activepieces/shared';

export interface Message {
  title: string;
  description: string;
  actionText: string;
  actionLink: string;
  type?: 'default' | 'destructive';
}

export const notificationHooks = {
  useNotifications: () => {
    const { data: currentVersion } = flagsHooks.useFlag<string>(
      ApFlagId.CURRENT_VERSION,
    );
    const { data: latestVersion } = flagsHooks.useFlag<string>(
      ApFlagId.LATEST_VERSION,
    );
    const socket = useSocket();
    const { data: providers, isLoading } = useQuery({
      queryKey: ['ai-providers'],
      queryFn: () => aiProviderApi.list(),
    });

    const [messages, setMessages] = useState<Message[]>([]);

    useEffect(() => {
      socket.on('connect_error', (err) => {
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            title: 'Websocket Connection Error',
            description: `We encountered an error trying to connect to the websocket: ${
              err.message || 'Unknown error'
            }. Please check your network or server.`,
            actionText: 'Retry Connection',
            actionLink: '/platform/infrastructure/health',
            type: 'destructive',
          },
        ]);
      });

      return () => {
        socket.off('connect_error');
      };
    }, [socket]);

    const notifications = useMemo(() => {
      const allMessages: Message[] = [];

      const isVersionUpToDate = semver.gte(currentVersion!, latestVersion!);

      if (!isVersionUpToDate) {
        allMessages.push({
          title: 'Update Available',
          description: `Version ${latestVersion} is now available. Update to get the latest features and security improvements.`,
          actionText: 'Update Now',
          actionLink: '/platform/infrastructure/health',
        });
      }

      if (!(providers && providers.data.length > 0) && !isLoading) {
        allMessages.push({
          title: 'Your Universal AI needs a quick setup',
          description:
            "I noticed you haven't set up any AI providers yet. To unlock Universal AI pieces for your team, you'll need to configure some provider credentials first.",
          actionText: 'Configure',
          actionLink: '/platform/setup/ai',
        });
      }

      // Combine all messages and remove duplicates
      const combinedMessages = [...allMessages, ...messages];
      return combinedMessages.filter(
        (message, index, self) =>
          index === self.findIndex((m) => m.title === message.title),
      );
    }, [
      currentVersion,
      latestVersion,
      socket.connected,
      providers,
      isLoading,
      messages,
    ]);

    return notifications;
  },
};
