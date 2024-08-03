import React, { useState } from 'react';
import { SidebarHeader } from '../sidebar-header';
import { CardList } from '@/components/ui/card-list';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { ChatMessage } from './chat-message';
import { Button } from '@/components/ui/button';
import { ArrowUp } from 'lucide-react';
import { LeftSideBarType, useBuilderStateContext } from '../builder-hooks';

interface ChatMessageType {
    message: string;
    userType: 'user' | 'bot';
}

const initialMessages: ChatMessageType[] = [
    {
        message: 'Hello',
        userType: 'bot'
    },
    {
        message: 'Hi',
        userType: 'user'
    },
];

export const ChatSidebar = () => {
    const [messages, setMessages] = useState<ChatMessageType[]>(initialMessages);
    const [inputMessage, setInputMessage] = useState('');
    const [setLeftSidebar] = useBuilderStateContext((state) => [
        state.setLeftSidebar,
        state.run,
      ]);

    const handleSendMessage = () => {
        if (inputMessage.trim() !== '') {
            setMessages([...messages, { message: inputMessage, userType: 'user' }]);
            setInputMessage('');
        }
    };

    return (
        <div className="flex flex-col h-full">
            <SidebarHeader onClose={() => {setLeftSidebar(LeftSideBarType.NONE)}}>
                Chat
            </SidebarHeader>
            <CardList>
                <ScrollArea >
                    {messages.map((message, index) => (
                        <ChatMessage key={index} message={message.message} userType={message.userType} />
                    ))}
                    <ScrollBar />
                </ScrollArea>
            </CardList>
            <div className="relative mb-3 p-4">
                <input 
                    value={inputMessage}
                    type="text"
                    className="w-full p-2 border rounded-xl bg-gray-100 pr-12"
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            handleSendMessage();
                        }
                    }}
                />
                <button 
                    onClick={handleSendMessage}
                    className="absolute right-5 top-1/2 transform -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center border border-gray-300 bg-white shadow-md hover:bg-gray-100"
                    aria-label="Send"
                >
                    <ArrowUp className="w-5 h-5 text-gray-700" />
                </button>
            </div>
        </div>
    );
}

ChatSidebar.displayName = 'ChatSidebar';
