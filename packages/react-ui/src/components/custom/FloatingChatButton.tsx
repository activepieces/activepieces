import React, { useEffect, useRef, useState } from 'react';
import { ChevronsLeftRight, Send, X } from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import './FloatingChatButton.css';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { AvatarLetter } from '../ui/avatar-letter';
import { useEmbedding } from '../embed-provider';
import { userHooks } from '@/hooks/user-hooks';

export const modulesChat = {
  toolbar: [
    ['bold', 'italic', 'underline'],
    ['link'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    [{ align: [] }],
    ['code-block'],
  ],
};

export const FloatingChatButton: React.FC = () => {
  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const { embedState } = useEmbedding();
  const { data: user } = userHooks.useCurrentUser();
  if (!user || embedState.isEmbedded) {
    return null;
  }
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<
    { sender: string; text: string }[]
  >([]);

  const toggleChat = () => setIsOpen(!isOpen);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('message', message);
    if (message.trim()) {
      // Add user message to chat history
      setChatHistory((prev) => [...prev, { sender: 'user', text: message }]);

      // Simulate AI response
      const aiResponse = await getAIResponse(message);
      setChatHistory((prev) => [...prev, { sender: 'ai', text: aiResponse }]);

      setMessage('');
    }
  };

  const getAIResponse = async (userMessage: string): Promise<string> => {
    // Simulate an API call to get a response from AI
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(`${userMessage}`);
      }, 1000); // Simulate a delay
    });
  };

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const renderChatMessages = () => {
    return chatHistory.map((chat, index) => (
      <div key={index} className="flex items-start justify-start space-x-4">
        <Avatar className="rounded-xs h-10 w-10">
          <AvatarFallback className="rounded-xs">
            {chat.sender === 'user' ? (
              <AvatarLetter
                name={user.firstName + ' ' + user.lastName}
                email={user.email}
                disablePopup={true}
              />
            ) : (
              <div className="flex items-center justify-center h-full w-full text-white bg-primary">
                <ChevronsLeftRight className="size-7" />
              </div>
            )}
          </AvatarFallback>
        </Avatar>
        <div>
          <span className="font-black text-sm">
            {chat.sender === 'user' ? user.firstName : 'PromptX'}
          </span>
          <span dangerouslySetInnerHTML={{ __html: chat.text }} />
        </div>
      </div>
    ));
  };

  return (
    <>
      {isOpen && (
        <div className="floating-chat-container rounded-lg shadow-xl flex flex-col animate-in slide-in-from-bottom-5">
          <div className="flex items-center justify-between border-b rounded-t-lg pb-3">
            <h3 className="font-semibold">
              Describe the workflow you want to create
            </h3>
            <button onClick={toggleChat}>
              <X className="size-5 hover:opacity-75" />
            </button>
          </div>

          <div
            ref={chatContainerRef}
            className="custom-scroll flex-1 p-4 overflow-y-auto space-y-4"
          >
            {renderChatMessages()}
          </div>

          <form onSubmit={sendMessage}>
            <ReactQuill
              value={message}
              onChange={setMessage}
              placeholder="Describe the workflow you want to create"
              className="flex-1 relative"
              modules={modulesChat}
            />
            <button
              type="submit"
              className="send-chat-button p-2 text-gray-400 rounded-md "
            >
              <Send className="size-5" />
            </button>
          </form>
        </div>
      )}

      <button
        className="floating-btn size-10 rounded-full bg-primary shadow-lg hover:bg-primary/90 transition-all duration-200 animate-in zoom-in"
        onClick={toggleChat}
      >
        <ChevronsLeftRight className="size-5" />
      </button>
    </>
  );
};
