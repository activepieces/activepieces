import { useEffect, useState } from 'react';
import { ApFlagId } from '@activepieces/shared';
import { useSocket } from '@/components/socket-provider';
import { flagsHooks } from '@/hooks/flags-hooks';
import { useQuery } from '@tanstack/react-query';
import { aiProviderApi } from '@/features/platform-admin-panel/lib/ai-provider-api';
import { PlatformMessage } from './platform-message';
import { Message } from './message';
import { MessagesBuilder } from './messages-builder'; 


export const PlatformMessages = () => {
    const { data: currentVersion } = flagsHooks.useFlag<string>(ApFlagId.CURRENT_VERSION);
    const { data: latestVersion } = flagsHooks.useFlag<string>(ApFlagId.LATEST_VERSION);
    const [messages, setMessages] = useState<Message[]>([]);
    const socket = useSocket();
    const { data: providers, isLoading } = useQuery({
        queryKey: ['ai-providers'],
        queryFn: () => aiProviderApi.list(),
    });

    useEffect(() => {
        const newMessages = MessagesBuilder(currentVersion, latestVersion, socket.connected, providers, isLoading);
        setMessages(newMessages);
    }, [socket.connected, currentVersion, latestVersion, providers, isLoading]);


    return (
        <div className="space-y-4">
            {messages.map((message) => (
                <PlatformMessage
                    key={message.id}
                    id={message.id}
                    title={message.title}
                    description={message.description}
                    actionText={message.actionText}
                    actionLink={message.actionLink}
                    alert={message.alert}
                    type={message.type}
                />
            ))}
        </div>
    );
};
