import { AIProviderName } from '@activepieces/core-utils';
import { aiProviderUtils } from '@activepieces/shared';
import { describe, expect, it } from 'vitest';

import { chatUtils } from '@/features/chat/lib/chat-utils';

describe('chatUtils.newChatModelName', () => {
  it('sends no model on a tier picker, so the published chat default decides', () => {
    expect(
      chatUtils.newChatModelName({ provider: AIProviderName.ACTIVEPIECES }),
    ).toBeNull();
    expect(
      chatUtils.newChatModelName({ provider: AIProviderName.BEDROCK }),
    ).toBeNull();
    expect(chatUtils.newChatModelName({ provider: undefined })).toBeNull();
  });

  it('sends the model a curated own-key picker shows, so the turn cannot run the published default instead', () => {
    const shown = aiProviderUtils.getCuratedChatModels({
      provider: AIProviderName.ANTHROPIC,
    })?.[0]?.id;

    expect(shown).toBeDefined();
    expect(
      chatUtils.newChatModelName({ provider: AIProviderName.ANTHROPIC }),
    ).toBe(shown);
  });
});
