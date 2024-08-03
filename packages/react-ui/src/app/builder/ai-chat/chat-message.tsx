import React from 'react';
import { Bot } from 'lucide-react';

interface ChatMessageProps {
    message: string;
    userType: string;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, userType }) => {
    return (
        <div className={`flex ${userType === 'user' ? 'justify-end' : 'justify-start'} m-4`}>
            {userType === 'bot' && (
                <>
                    <div className="w-7 h-7 border rounded-full border-gray-300 flex items-center justify-center">
                        <Bot className="w-5 h-5 text-gray-500" />
                    </div>
                    <p className={`flex max-w-xs lg:max-w-md rounded-2xl pl-5 pr-5 pt-2 pb-2`}>{message}</p>
                </>
            )}
            {userType === 'user' && (
                <>
                    <p className={`flex max-w-xs lg:max-w-md bg-gray-100 rounded-2xl pl-5 pr-5 pt-2 pb-2`}>{message}</p>
                </>
            )}
        </div>
    )
}