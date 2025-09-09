import { ApEdition, ApFlagId } from '@activepieces/shared';
import { useQuery } from '@tanstack/react-query';
import { t } from 'i18next';
import { useMemo, useState } from 'react';

import { useSocket } from '@/components/socket-provider';
import { aiProviderApi } from '@/features/platform-admin/lib/ai-provider-api';
import { flagsHooks } from '@/hooks/flags-hooks';

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
    const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);
    const socket = useSocket();
    const { data: providers, isLoading } = useQuery({
      queryKey: ['ai-providers'],
      queryFn: () => aiProviderApi.list(),
    });

    const [messages] = useState<Message[]>([]);

    const notifications = useMemo(() => {
      const allMessages: Message[] = [];

      if (
        !(providers && providers.data.length > 0) &&
        !isLoading &&
        edition !== ApEdition.CLOUD
      ) {
        allMessages.push({
          title: t('Your Universal AI needs a quick setup'),
          description: t(
            "We noticed you haven't set up any AI providers yet. To unlock Universal AI pieces for your team, you'll need to configure some provider credentials first.",
          ),
          actionText: t('Configure'),
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
