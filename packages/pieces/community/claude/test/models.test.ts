import { describe, expect, it, vi, beforeEach } from 'vitest';

const create = vi.fn();
vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn(function () {
    return { messages: { create } };
  }),
}));

import { createMockActionContext } from '@activepieces/pieces-framework';
import {
  resolveModelId,
  supportsForcedToolChoice,
  supportsTemperature,
} from '../src/lib/common/common';
import { askClaude } from '../src/lib/actions/send-prompt';
import { extractStructuredDataAction } from '../src/lib/actions/extract-structured-data';

describe('resolveModelId', () => {
  it('maps retiring Sonnet 4.5 ids to Sonnet 5.5', () => {
    expect(resolveModelId('claude-sonnet-4-5-20250929')).toBe('claude-sonnet-5-5');
    expect(resolveModelId('claude-sonnet-4-5')).toBe('claude-sonnet-5-5');
  });
  it('maps retired models to the current family member', () => {
    expect(resolveModelId('claude-3-7-sonnet-20250219')).toBe('claude-sonnet-5-5');
    expect(resolveModelId('claude-3-haiku-20240307')).toBe('claude-haiku-5-5');
    expect(resolveModelId('claude-opus-4-1-20250805')).toBe('claude-opus-5-5');
  });
  it('keeps current ids and defaults empty to Sonnet 5.5', () => {
    expect(resolveModelId('claude-opus-5-5')).toBe('claude-opus-5-5');
    expect(resolveModelId('claude-haiku-4-5')).toBe('claude-haiku-4-5');
    expect(resolveModelId(undefined)).toBe('claude-sonnet-5-5');
  });
  it('knows which models reject forced tool choice and temperature', () => {
    expect(supportsForcedToolChoice('claude-sonnet-5-5')).toBe(false);
    expect(supportsForcedToolChoice('claude-haiku-4-5')).toBe(true);
    expect(supportsTemperature('claude-opus-5-5')).toBe(false);
    expect(supportsTemperature('claude-sonnet-4-6')).toBe(true);
  });
});

const auth = { type: 'SECRET_TEXT' as const, secret_text: 'k' };

describe('actions use resolved models', () => {
  beforeEach(() => create.mockReset());

  it('ask_claude sends Sonnet 5.5 for a saved Sonnet 4.5 flow and drops temperature', async () => {
    create.mockResolvedValue({ content: [{ type: 'text', text: ' hi ' }] });
    await askClaude.run({ ...createMockActionContext({ propsValue: { model: 'claude-sonnet-4-5-20250929', prompt: 'q', temperature: 0.5 } }), auth });
    const req = create.mock.calls[0][0];
    expect(req.model).toBe('claude-sonnet-5-5');
    expect(req.temperature).toBeUndefined();
  });

  it('ask_claude thinking mode uses Sonnet 5.5 with adaptive thinking', async () => {
    create.mockResolvedValue({ content: [{ type: 'text', text: 'ok' }] });
    await askClaude.run({ ...createMockActionContext({ propsValue: { model: 'claude-haiku-4-5', prompt: 'q', thinkingMode: true, thinkingModeParams: { budgetTokens: 2000 } } }), auth });
    const req = create.mock.calls[0][0];
    expect(req.model).toBe('claude-sonnet-5-5');
    expect(req.thinking).toEqual({ type: 'adaptive' });
  });

  it('ask_claude keeps temperature on models that accept it', async () => {
    create.mockResolvedValue({ content: [{ type: 'text', text: 'ok' }] });
    await askClaude.run({ ...createMockActionContext({ propsValue: { model: 'claude-haiku-4-5', prompt: 'q', temperature: 0.3 } }), auth });
    expect(create.mock.calls[0][0].temperature).toBe(0.3);
  });

  it('ask_claude joins all text blocks when a thinking block comes first', async () => {
    create.mockResolvedValue({ content: [{ type: 'thinking', thinking: 'hmm' }, { type: 'text', text: ' Claude ' }, { type: 'text', text: 'Sonnet ' }], stop_reason: 'end_turn' });
    const out = await askClaude.run({ ...createMockActionContext({ propsValue: { model: 'claude-haiku-4-5', prompt: 'q', thinkingMode: true } }), auth });
    expect(out).toBe('Claude \nSonnet');
  });

  it('ask_claude throws with the stop reason when no text comes back', async () => {
    create.mockResolvedValue({ content: [{ type: 'thinking', thinking: 'hmm' }], stop_reason: 'max_tokens' });
    await expect(askClaude.run({ ...createMockActionContext({ propsValue: { model: 'claude-haiku-4-5', prompt: 'q' } }), auth })).rejects.toThrow('Claude returned no text (stop_reason: max_tokens)');
  });

  it('ask_claude throws when the text is empty', async () => {
    create.mockResolvedValue({ content: [{ type: 'text', text: '  ' }], stop_reason: 'end_turn' });
    await expect(askClaude.run({ ...createMockActionContext({ propsValue: { model: 'claude-haiku-4-5', prompt: 'q' } }), auth })).rejects.toThrow('stop_reason: end_turn');
  });

  const extractProps = (model: string) => ({
    model,
    text: 'John is 30',
    mode: 'simple',
    schema: { fields: [{ name: 'name', description: 'n', type: 'string', isRequired: true }] },
  });

  it('extract uses auto tool choice on Sonnet 5.5 (mapped from 4.5)', async () => {
    create.mockResolvedValue({ content: [{ type: 'tool_use', input: { name: 'John' } }] });
    const out = await extractStructuredDataAction.run({ ...createMockActionContext({ propsValue: extractProps('claude-sonnet-4-5-20250929') }), auth });
    const req = create.mock.calls[0][0];
    expect(req.model).toBe('claude-sonnet-5-5');
    expect(req.tool_choice).toEqual({ type: 'auto' });
    expect(req.system).toContain('extract_structured_data');
    expect(out).toEqual({ name: 'John' });
  });

  it('extract still forces the tool on older models', async () => {
    create.mockResolvedValue({ content: [{ type: 'tool_use', input: { name: 'John' } }] });
    await extractStructuredDataAction.run({ ...createMockActionContext({ propsValue: extractProps('claude-haiku-4-5') }), auth });
    expect(create.mock.calls[0][0].tool_choice).toEqual({ type: 'tool', name: 'extract_structured_data' });
  });

  it('extract throws a clear error when no tool call comes back', async () => {
    create.mockResolvedValue({ content: [{ type: 'text', text: 'cannot' }] });
    await expect(
      extractStructuredDataAction.run({ ...createMockActionContext({ propsValue: extractProps('claude-opus-5-5') }), auth })
    ).rejects.toThrow(/did not return structured data.*cannot/);
  });
});
