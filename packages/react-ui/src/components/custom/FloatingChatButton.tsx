import React, { useEffect, useRef, useState } from 'react';
import { ChevronsLeftRight, Send, X } from 'lucide-react';
import { ApFlagId } from '@activepieces/shared';
import './FloatingChatButton.css';
import { useMutation, useQuery } from '@tanstack/react-query';
import { t } from 'i18next';
import { useForm, Controller } from 'react-hook-form';

import { flagsHooks } from '../../hooks/flags-hooks';
import { useEmbedding } from '../embed-provider';
import { botxApi } from '../lib/botx-api';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { AvatarLetter } from '../ui/avatar-letter';
import { Input } from '../ui/input';
import { Skeleton } from '../ui/skeleton';

import StreamMarkdown from './StreamMarkdown';

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
  const [isOpen, setIsOpen] = useState(false);
  const branding = flagsHooks.useWebsiteBranding();
  const [chatHistory, setChatHistory] = useState<
    {
      sender: string;
      text: any;
      isLoadingText?: boolean;
      showStreamText?: boolean;
    }[]
  >([]);
  const { data: BOTX_API_URL } = flagsHooks.useFlag<string>(ApFlagId.BOTX_URL);

  const botxApiUrls = botxApi({ BOTX_API_URL });

  const { mutate, data, isSuccess, isError, error } = useMutation({
    mutationFn: (message: string) => botxApiUrls.sendMessage({ message }),
  });

  const { data: userLastMessages, isSuccess: isUserMessageSuccess } = useQuery({
    queryKey: ['user-messages'],
    queryFn: botxApiUrls.getLastUserChatMessages,
    enabled: isOpen && !!user,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: false,
  });

  const { handleSubmit, control, reset } = useForm({
    defaultValues: {
      message: '',
    },
  });

  const toggleChat = () => setIsOpen(!isOpen);
  const sendMessage = (data: any) => {
    if (data.message) {
      setChatHistory((prev) => [
        ...prev,
        { sender: 'human', text: data.message },
        { sender: 'ai', text: '', isLoadingText: true },
      ]);
      mutate(data.message);
      reset();
    }
  };

  useEffect(() => {
    if (isSuccess) {
      setChatHistory((prev) => [
        ...prev.filter((chat) => chat.sender !== 'ai' || !chat.isLoadingText),
        { sender: 'ai', text: data, showStreamText: true },
      ]);
      reset();
    }
  }, [isSuccess, data, reset]);

  useEffect(() => {
    if (isError) {
      setChatHistory((prev) => [
        ...prev.filter((chat) => chat.sender !== 'ai' || !chat.isLoadingText),
        { sender: 'ai', text: error.message },
      ]);
    }
  }, [isError, error]);

  useEffect(() => {
    if (isUserMessageSuccess) {
      // not to show stream text style for history messages
      const chatHistory = userLastMessages.map((m) => ({
        text: m.content,
        sender: m.speaker,
        showStreamText: false,
      }));
      setChatHistory(chatHistory);
    }
  }, [isUserMessageSuccess, userLastMessages]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  if (!user || embedState.isEmbedded || !BOTX_API_URL) {
    return null;
  }

  const renderChatMessages = () => {
    return chatHistory.map((chat, index) => (
      <div key={index} className="flex items-start justify-start space-x-4">
        {chat.sender === 'ai' ? (
          <img
            src={branding.logos.logoIconUrl}
            alt={t('home')}
            width={24}
            height={24}
            className="max-h-[30px] max-w-[30px] object-contain"
          />
        ) : (
          <Avatar className="rounded-xs h-5 w-5">
            <AvatarFallback className="rounded-xs">
              <AvatarLetter
                name={user.firstName + ' ' + user.lastName}
                email={user.email}
                disablePopup={true}
              />
            </AvatarFallback>
          </Avatar>
        )}
        <div>
          <span className="font-semibold text-base">
            {chat.sender === 'human' ? user.firstName : 'PromptX'}
          </span>
          {chat.isLoadingText ? (
            <Skeleton className="font-semibold text-xl">.....</Skeleton>
          ) : (
            <StreamMarkdown
              content={chat.text}
              showStreamText={chat.showStreamText}
            />
          )}
        </div>
      </div>
    ));
  };

  return (
    <>
      {isOpen && (
        <div className="floating-chat-container rounded-lg shadow-xl flex flex-col animate-in slide-in-from-bottom-5">
          <div className="flex items-center justify-between border-b rounded-t-lg pb-3">
            <h3 className="font-semibold">AutomationX</h3>
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

          <form
            onSubmit={handleSubmit(sendMessage)}
            className="flex items-start gap-2 he"
          >
            <Controller
              name="message"
              control={control}
              render={({ field }) => (
                <Input {...field} placeholder="How can I help you?" />
              )}
            />
            <button
              type="submit"
              className="send-chat-button p-2 text-gray-400 rounded-md"
            >
              <Send className="size-5" />
            </button>
          </form>
        </div>
      )}

      <button
        className="floating-btn size-10 rounded-full bg-[#254C7E] shadow-lg hover:bg-[#254C7E]/90 transition-all duration-200 animate-in zoom-in"
        onClick={toggleChat}
      >
        <ChevronsLeftRight className="size-5" />
      </button>
    </>
  );
};
