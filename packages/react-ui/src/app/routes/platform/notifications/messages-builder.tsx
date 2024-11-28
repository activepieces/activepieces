import semver from 'semver';
import { Message } from './message';

export const MessagesBuilder = (
    currentVersion: string | null,
    latestVersion: string | null,
    socketConnected: boolean,
    providers: any,
    isLoading: boolean
): Message[] => {
    const newMessages: Message[] = [];

    const isVersionUpToDate = currentVersion && latestVersion
        ? semver.gte(currentVersion, latestVersion)
        : false;

    if (isVersionUpToDate) {
        newMessages.push({
            id: 'version-warning',
            title: 'New Version Available',
            description: `<b>Current:</b> ${currentVersion || 'Unknown'} <br/> <b>Latest:</b> ${latestVersion || 'Unknown'}`,
            actionText: 'View Changelog',
            actionLink: '/platform/infrastructure/health',
            type: 'destructive',
            alert: false,
        });
    }

    if (!socketConnected) {
        newMessages.push({
            id: 'connection-issue',
            title: 'Connection Issues Detected',
            description: "We're having trouble maintaining a connection to the server.",
            actionText: 'Troubleshoot',
            actionLink: '/platform/infrastructure/health',
            type: 'destructive',
        });
    }

    if (!(providers && providers.data.length > 0) && !isLoading) {
        newMessages.push({
            id: 'ai-setup',
            title: "Hey! Your Universal AI needs a quick setup",
            description: "I noticed you haven't set up any AI providers yet. To unlock Universal AI pieces for your team, you'll need to configure some provider credentials first.",
            actionText: 'Configure',
            actionLink: '/platform/settings/ai',
        });
    }

    return newMessages;
};
