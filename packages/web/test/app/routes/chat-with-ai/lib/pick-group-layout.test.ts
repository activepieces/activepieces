import { describe, expect, it } from 'vitest';

import {
  OutcomeCardBlock,
  pickGroupLayout,
} from '@/app/routes/chat-with-ai/lib/message-blocks';

const image = (id: string): OutcomeCardBlock => ({
  kind: 'image',
  toolCallId: id,
});
const receipt = (id: string): OutcomeCardBlock => ({
  kind: 'action-receipt',
  toolCallId: id,
});
const files = (id: string): OutcomeCardBlock => ({
  kind: 'files',
  toolCallId: id,
});

describe('pickGroupLayout', () => {
  it('routes a homogeneous image run to the gallery', () => {
    expect(pickGroupLayout([image('a'), image('b')])).toBe('gallery');
  });

  it('routes a homogeneous receipt run to the receipt list', () => {
    expect(pickGroupLayout([receipt('a'), receipt('b'), receipt('c')])).toBe(
      'receipts',
    );
  });

  it('routes a homogeneous file run to the file grid', () => {
    expect(pickGroupLayout([files('a'), files('b')])).toBe('files');
  });

  it('routes a mixed run to the fallback stack', () => {
    expect(pickGroupLayout([image('a'), receipt('b')])).toBe('mixed');
    expect(pickGroupLayout([files('a'), image('b')])).toBe('mixed');
  });

  it('treats an empty run as mixed', () => {
    expect(pickGroupLayout([])).toBe('mixed');
  });
});
