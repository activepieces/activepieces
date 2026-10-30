import { describe, it, expect, vi, beforeEach } from 'vitest';

const update = vi.fn();

vi.mock('@notionhq/client', () => ({
  Client: vi.fn().mockImplementation(() => ({ blocks: { update } })),
}));

import { notionUpdateBlock } from '../src/lib/actions/notion-update-block';

async function runWith(props: Record<string, unknown>) {
  update.mockResolvedValue({ id: 'b1' });
  await Reflect.apply(notionUpdateBlock.run, undefined, [
    {
      auth: { access_token: 'tok' },
      propsValue: { block_id: 'b1', content: 'hello', ...props },
    },
  ]);
  return update.mock.calls[0][0];
}

describe('notion_update_block', () => {
  beforeEach(() => {
    update.mockReset();
  });

  it('omits checked when unchanged', async () => {
    const req = await runWith({ block_type: 'to_do', checked: 'unchanged' });
    expect(req.to_do).not.toHaveProperty('checked');
  });

  it('omits checked when undefined', async () => {
    const req = await runWith({ block_type: 'to_do' });
    expect(req.to_do).not.toHaveProperty('checked');
  });

  it('omits checked when empty string', async () => {
    const req = await runWith({ block_type: 'to_do', checked: '' });
    expect(req.to_do).not.toHaveProperty('checked');
  });

  it('omits checked when null', async () => {
    const req = await runWith({ block_type: 'to_do', checked: null });
    expect(req.to_do).not.toHaveProperty('checked');
  });

  it('sends true for yes', async () => {
    const req = await runWith({ block_type: 'to_do', checked: 'yes' });
    expect(req.to_do.checked).toBe(true);
  });

  it('sends false for no', async () => {
    const req = await runWith({ block_type: 'to_do', checked: 'no' });
    expect(req.to_do.checked).toBe(false);
  });

  it('sends true for the legacy string true', async () => {
    const req = await runWith({ block_type: 'to_do', checked: 'true' });
    expect(req.to_do.checked).toBe(true);
  });

  it('sends false for the legacy string false', async () => {
    const req = await runWith({ block_type: 'to_do', checked: 'False' });
    expect(req.to_do.checked).toBe(false);
  });

  it('keeps legacy true', async () => {
    const req = await runWith({ block_type: 'to_do', checked: true });
    expect(req.to_do.checked).toBe(true);
  });

  it('keeps legacy false', async () => {
    const req = await runWith({ block_type: 'to_do', checked: false });
    expect(req.to_do.checked).toBe(false);
  });

  it('ignores checked for non to_do blocks', async () => {
    const req = await runWith({ block_type: 'paragraph', checked: 'yes' });
    expect(req.paragraph).not.toHaveProperty('checked');
    expect(req.paragraph.rich_text).toEqual([{ text: { content: 'hello' } }]);
  });

  it('sends language for code when provided', async () => {
    const req = await runWith({ block_type: 'code', language: 'python' });
    expect(req.code.language).toBe('python');
  });

  it('omits language for code when not provided', async () => {
    const req = await runWith({ block_type: 'code' });
    expect(req.code).not.toHaveProperty('language');
  });
});
