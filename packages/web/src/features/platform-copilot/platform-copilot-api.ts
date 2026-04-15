import {
  PlatformCopilotChatRequest,
  PlatformCopilotChatResponse,
} from '@activepieces/shared';

import { api } from '@/lib/api';

export const platformCopilotApi = {
  chat: (request: PlatformCopilotChatRequest) =>
    api.post<PlatformCopilotChatResponse>('/v1/platform-copilot/chat', request),
};
