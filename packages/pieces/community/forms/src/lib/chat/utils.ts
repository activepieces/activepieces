import { Store } from "@activepieces/pieces-framework";
import { Chat } from "@activepieces/shared";
  
export const saveChat = async (store: Store, chat: Chat): Promise<Chat> => {
  await store.put(`chat-${chat.id}`, chat)
  return chat;
}

export const getChat = async (store: Store, chatId: string): Promise<Chat | null> => {
  return await store.get(`chat-${chatId}`) as Chat | null;
}

export const sampleData = {
  chatId: "MOCK_CHAT_ID",
  message: "Hello, how are you?",
};