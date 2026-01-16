import { useEffect, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';

import { useSocket, useSocketConnection } from '@/components/socket-provider';
import { api } from '@/lib/api';
import {
  ChatWithQuickRequest,
  ConversationMessage,
  QuickStreamingEnded,
  QuickStreamingUpdate,
  WebsocketClientEvent,
} from '@activepieces/shared';

interface UseStreamChatOptions {
  sessionId: string;
  onError?: (error: Error) => void;
}

export function useStreamChat({ sessionId, onError }: UseStreamChatOptions) {
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const socket = useSocket();
  const connected = useSocketConnection();
  const isStreamingRef = useRef(false);

  const { mutate: sendMessage, isPending } = useMutation<
    void,
    Error,
    { message: string }
  >({
    mutationFn: async ({ message }) => {
      // Add user message to conversation immediately
      const userMessage: ConversationMessage = {
        role: 'user',
        content: message,
      };
      
      // Update conversation and get the new state
      let updatedConversation: ConversationMessage[] = [];
      setConversation((prev) => {
        updatedConversation = [...prev, userMessage];
        return updatedConversation;
      });

      // Reset streaming state
      isStreamingRef.current = true;

      // Prepare request body with current conversation (before adding user message)
      const requestBody: ChatWithQuickRequest = {
        message,
        sessionId,
        history: updatedConversation.slice(0, -1), // Exclude the just-added user message for history
      };

      await api.post<void>('/v1/quick/chat', requestBody);
    },
    onError: (error) => {
      isStreamingRef.current = false;
      onError?.(error);
    },
  });

  useEffect(() => {
    if (!connected) {
      return;
    }

    const handleStreamingUpdate = (event: QuickStreamingUpdate) => {
      // Only process events for the current session
      if (event.sessionId !== sessionId) {
        return;
      }

      // Update or create assistant message in conversation
      setConversation((prev) => {
        const newConversation: ConversationMessage[] = [...prev];
        
        // Check if there's already an assistant message at the end
        let lastMessage = newConversation[newConversation.length - 1];
        
        if (!lastMessage || lastMessage.role !== 'assistant') {
          newConversation.push({
            role: 'assistant',
            parts: [ event.part ],
          } as ConversationMessage);
        } else {

          const lastPart = lastMessage.parts[lastMessage.parts.length - 1];
          if (lastPart && lastPart.type === event.part.type) {
            lastMessage.parts[lastMessage.parts.length - 1] = event.part;
          } else {
            lastMessage.parts.push(event.part);
          }
        }
        
        return newConversation;
      });

    };

    socket.on(WebsocketClientEvent.QUICK_STREAMING_UPDATE, handleStreamingUpdate);
    
    const handleStreamingEnded = (event: QuickStreamingEnded) => {
      if (event.sessionId !== sessionId) {
        return;
      }
      isStreamingRef.current = false;
    };
    socket.on(WebsocketClientEvent.QUICK_STREAMING_ENDED, handleStreamingEnded);
    return () => {
      socket.off(WebsocketClientEvent.QUICK_STREAMING_UPDATE, handleStreamingUpdate);
      socket.off(WebsocketClientEvent.QUICK_STREAMING_ENDED, handleStreamingEnded);
    };
  }, [socket, connected, sessionId]);

  // Reset conversation
  const resetConversation = () => {
    setConversation([]);
    isStreamingRef.current = false;
  };

  return {
    conversation,
    sendMessage,
    isPending,
    isStreaming: isStreamingRef.current,
    resetConversation,
  };
}

