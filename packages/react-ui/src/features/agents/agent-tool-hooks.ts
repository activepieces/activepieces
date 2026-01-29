import { useQuery } from '@tanstack/react-query';

import { type ToolCallConversationMessage } from '@activepieces/shared';

type ToolMetadata = {
  displayName?: string | null;
  logoUrl?: string | null;
};

export const agentToolHooks = {
  useToolMetadata(toolCall: ToolCallConversationMessage) {
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
