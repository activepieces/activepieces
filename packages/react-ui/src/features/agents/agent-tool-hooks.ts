import { useQuery } from '@tanstack/react-query';

import { type ToolCallConversationMessage } from '@activepieces/shared';
import { stepsHooks } from '../pieces/lib/steps-hooks';
import { useMemo } from 'react';
import { PieceStepMetadataWithSuggestions } from '@/lib/types';

type ToolMetadata = {
  displayName?: string | null;
  logoUrl?: string | null;
};

export function sanitizeToolName(name: string): string {
  return name.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
}

export const agentToolHooks = {

  usePieceMetadata(pieceName: string) {
    const { metadata, isLoading } = stepsHooks.useAllStepsMetadata({
      searchQuery: '',
      type: 'action',
    });
  
    const piecesMetadata = useMemo(() => {
      return metadata?.filter(
        (m): m is PieceStepMetadataWithSuggestions =>
          'suggestedActions' in m && 'suggestedTriggers' in m,
      );
    }, [metadata]);
  
    const pieceMetadata = piecesMetadata?.find(
      (p) => p.pieceName === pieceName,
    );

    return { pieceMetadata, isLoading };
  },

  useToolMetadata(toolCall: ToolCallConversationMessage) {

    if (toolCall.toolType === 'piece') {
      const { pieceMetadata, isLoading } = this.usePieceMetadata(toolCall.pieceMetadata.pieceName);
      const displayName = pieceMetadata?.suggestedActions?.find(
        (action) =>
          sanitizeToolName(
            `${pieceMetadata.pieceName}-${action.name}`,
          ) === toolCall.toolName,
      )?.displayName ?? toolCall.toolName;

      return {
        data: {
          displayName,
          logoUrl: pieceMetadata?.logoUrl,
        },
        isLoading: isLoading,
      };
    }

    return useQuery<ToolMetadata, Error>({
      queryKey: [
        'tool-metadata',
        toolCall.toolName,
      ],
      queryFn: async () => {
        return {
          displayName: toolCall.toolName,
          logoUrl: null,
        };
      },
    });
  },
};
