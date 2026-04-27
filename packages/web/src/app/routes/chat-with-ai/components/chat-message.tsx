import { ChatUIMessage } from '@/features/chat/lib/chat-types';

import { AssistantMessage } from './assistant-message';
import { UserMessage } from './user-message';

export function ChatMessage({
  message,
  isStreaming,
  onCancel,
  onRetry,
  onSend,
  connectedPieces,
  onPieceConnected,
}: {
  message: ChatUIMessage;
  isStreaming: boolean;
  onCancel: () => void;
  onRetry: () => void;
  onSend: (text: string, files?: File[]) => void;
  connectedPieces: Set<string>;
  onPieceConnected: (piece: string) => void;
}) {
  if (message.role === 'user') {
    return <UserMessage message={message} />;
  }

  return (
    <AssistantMessage
      message={message}
      isStreaming={isStreaming}
      onCancel={onCancel}
      onRetry={onRetry}
      onSend={onSend}
      connectedPieces={connectedPieces}
      onPieceConnected={onPieceConnected}
    />
  );
}
