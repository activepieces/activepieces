import * as React from 'react';
import { AiMessageContent, UserMessageContent } from '../types';
import { ChatBubble, ChatBubbleMessage } from '@/components/ui/chat/chat-bubble';
import { CopilotAvatar } from '../copilot-avatar';


type TextMessageProps = {
    content: AiMessageContent | UserMessageContent;
}
export const TextMessage: React.FC<TextMessageProps> = ({
    content
}) => {
    return (
        <ChatBubble variant={content.type === 'user_message' ? 'sent' : 'received'}>
            {content.type !== 'user_message' && <CopilotAvatar />}
            <ChatBubbleMessage variant={content.type === 'user_message' ? 'sent' : 'received'}>

                {content.content}
            </ChatBubbleMessage>
        </ChatBubble>
    );
};
