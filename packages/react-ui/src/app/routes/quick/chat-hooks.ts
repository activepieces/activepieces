import { useSocket } from "@/components/socket-provider"
import { internalErrorToast } from "@/components/ui/sonner"
import { api } from "@/lib/api"
import { ChatSession, ChatSessionEnded, ChatSessionUpdate, chatSessionUtils, ChatWithQuickRequest, isNil, WebsocketClientEvent, WebsocketServerEvent } from "@activepieces/shared"
import { useMutation } from "@tanstack/react-query"


export const chatHooks = {

    useSendMessage(setSession: (session: ChatSession) => void) {
        const socket = useSocket();
        return useMutation<ChatSession, Error, { message: string, session: ChatSession | null }>({
            mutationFn: async (request) => {
                let currentSession = request.session ?? await api.post<ChatSession>('/v1/chat-sessions', {})
                await api.post<void>(`/v1/chat-sessions/${currentSession.id}/chat`, {
                    message: request.message,
                })
                currentSession = chatSessionUtils.addUserMessage(currentSession, request.message);
                setSession(currentSession);
                return new Promise((resolve) => {
                    socket.on(WebsocketClientEvent.AGENT_STREAMING_UPDATE, (data: ChatSessionUpdate) => {
                        if (data.sessionId !== currentSession.id) {
                            return;
                        }
                        currentSession = chatSessionUtils.streamChunk(currentSession, {
                            sessionId: currentSession.id,
                            part: data.part,
                        });
                        setSession(currentSession);
                    })
                    socket.on(WebsocketClientEvent.AGENT_STREAMING_ENDED, (data: ChatSessionEnded) => {
                        if (data.sessionId !== currentSession.id) {
                            return;
                        }
                        socket.off(WebsocketClientEvent.AGENT_STREAMING_UPDATE);
                        socket.off(WebsocketClientEvent.AGENT_STREAMING_ENDED);
                        setSession(currentSession);
                        resolve(currentSession);
                    })
                })
            },
            onError: (error) => {
                internalErrorToast();
                console.error(error);
            },
        })
    }
}