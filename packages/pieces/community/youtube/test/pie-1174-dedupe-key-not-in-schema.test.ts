import { describe, expect, it } from 'vitest';
import { DEDUPE_KEY_PROPERTY } from '@activepieces/pieces-framework';
import { youtubeNewVideoTrigger } from '../src/lib/triggers/new-video.trigger';

describe('New Video In Channel output schema', () => {
  it('does not offer the dedupe key the platform strips before the run starts', () => {
    const keys = (youtubeNewVideoTrigger.outputSchema?.fields ?? []).map((field) => field.key);
    expect(keys).not.toContain(DEDUPE_KEY_PROPERTY);
    expect(keys).toContain('guid');
  });
});
