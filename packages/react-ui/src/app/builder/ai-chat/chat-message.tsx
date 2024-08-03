import React from 'react';
import { Bot } from 'lucide-react';
import { CodeEditior } from '../step-settings/code-settings/code-editior';

interface ChatMessageProps {
    message: string;
    userType: string;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, userType }) => {

    const sourceCode = {
        code: message,
        packageJson: ''
    };

    return (
        <div className={`flex ${userType === 'user' ? 'justify-end' : 'justify-start'} m-4`}>
            {userType === 'bot' && (
                <>
                    <div className="w-7 h-7 border rounded-full border-gray-300 flex items-center justify-center">
                        <Bot className="w-5 h-5 text-gray-500" />
                    </div>
                    <div className={`w-full pl-7 pr-7 mb-6`}>
                        <CodeEditior sourceCode={sourceCode} readonly={true} onChange={() => { }} skipLineNumbers={true} applyButton={true}></CodeEditior>
                    </div>
                </>
            )}
            {userType === 'user' && (
                <>
                    <p className={`flex max-w-xs lg:max-w-md bg-gray-100 rounded-2xl pl-5 pr-5 pt-2 pb-2 break-all`}>{message}</p>
                </>
            )}
        </div>
    )
}