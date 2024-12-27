import { ChatBubble, ChatBubbleMessage } from "@/components/ui/chat/chat-bubble";
import { PieceIcon } from "@/features/pieces/components/piece-icon";
import { CopilotAvatar } from "./copilot-avatar";
import { piecesHooks } from "@/features/pieces/lib/pieces-hook";
import { LoadingMessage } from "./loading-message";

type PiecesMessageProps = {
  pieces: string[];
};

export const PiecesMessage = ({ pieces }: PiecesMessageProps) => {
  const { pieces: piecesData, isLoading } = piecesHooks.usePiecesByName({
    names: pieces,
  });

  if (isLoading) {
    return <LoadingMessage message="Discovering relevant pieces" />;
  }

  return (
    <ChatBubble variant="received">
      <CopilotAvatar />
      <ChatBubbleMessage>
        <div className="flex flex-col gap-2">
          <div>
            I found these pieces that might help:
          </div>
          <div className="flex flex-wrap gap-3 items-center">
            {piecesData?.map(
              (piece) =>
                piece && (
                  <div
                    key={piece.displayName}
                    className="transition-transform hover:scale-110"
                  >
                    <PieceIcon
                      displayName={piece.displayName}
                      logoUrl={piece.logoUrl}
                      size="md"
                      circle={true}
                      border={true}
                      showTooltip={true}
                    />
                  </div>
                )
            )}
          </div>
        </div>
      </ChatBubbleMessage>
    </ChatBubble>
  );
};
