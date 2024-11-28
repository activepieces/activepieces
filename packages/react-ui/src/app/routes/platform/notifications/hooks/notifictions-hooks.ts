import { useMemo } from 'react';
import { useSocket } from '@/components/socket-provider';
import { flagsHooks } from '@/hooks/flags-hooks';
import { useQuery } from '@tanstack/react-query';
import { aiProviderApi } from '@/features/platform-admin-panel/lib/ai-provider-api';
import { ApFlagId } from '@activepieces/shared';
import semver from 'semver';

export interface Message {
    title: string;
    description: string;
    actionText: string;
    actionLink: string;
    alert?: boolean;
    type?: 'default' | 'destructive';
}

export const notificationHooks = {
    useNotifications: () => {
        const { data: currentVersion } = flagsHooks.useFlag<string>(ApFlagId.CURRENT_VERSION);
        const { data: latestVersion } = flagsHooks.useFlag<string>(ApFlagId.LATEST_VERSION);
        const socket = useSocket();
        const { data: providers, isLoading } = useQuery({
            queryKey: ['ai-providers'],
            queryFn: () => aiProviderApi.list(),
        });

        return useMemo(() => {
            const messages: Message[] = [];

            const isVersionUpToDate = semver.gte(currentVersion!, latestVersion!)

            if (isVersionUpToDate) {
                messages.push({
                    title: 'Update Available',
                    description: `Version ${latestVersion} is now available. Update to get the latest features and security improvements.`,
                    actionText: 'Update Now',
                    actionLink: '/platform/infrastructure/health',
                    alert: false,
                });
            }

            if (!socket.connected) {
                messages.push({
                    title: 'Websocket Issues Detected',
                    description: "We're experiencing connectivity issues with the websocket server. This may affect real-time updates and notifications. Please check your network connection and server status to ensure everything is working properly.",
                    actionText: 'Troubleshoot',
                    actionLink: '/platform/infrastructure/health', 
                    type: 'destructive',
                });
            }

            if (!(providers && providers.data.length > 0) && !isLoading) {
                messages.push({
                    title: "Your Universal AI needs a quick setup",
                    description: "I noticed you haven't set up any AI providers yet. To unlock Universal AI pieces for your team, you'll need to configure some provider credentials first.",
                    actionText: 'Configure', 
                    actionLink: '/platform/setup/ai',
                });
            }

            return messages;
        }, [currentVersion, latestVersion, socket.connected, providers, isLoading]);
    }
}