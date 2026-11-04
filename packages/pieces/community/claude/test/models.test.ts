import { describe, expect, it, vi, beforeEach } from 'vitest';

const create = vi.fn();
const countTokens = vi.fn();
vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn(function () {
    return { messages: { create, countTokens } };
  }),
}));

import { createMockActionContext } from '@activepieces/pieces-framework';
import {
  resolveModelId,
  supportsForcedToolChoice,
  supportsTemperature,
  thinksByDefault,
} from '../src/lib/common/common';
import { countTokensAction } from '../src/lib/actions/count-tokens';
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
  it('turns forced tool choice off only for models that reject it', () => {
    for (const id of ['claude-sonnet-5-5', 'claude-opus-5-5', 'claude-fable-5-1', 'claude-mythos-5-1']) {
      expect(supportsForcedToolChoice(id)).toBe(false);
    }
    for (const id of ['claude-haiku-5-5', 'claude-haiku-4-5', 'claude-opus-5', 'claude-sonnet-4-6']) {
      expect(supportsForcedToolChoice(id)).toBe(true);
    }
  });
  it('sends temperature only to models on the allow-list', () => {
    for (const id of ['claude-sonnet-4-6', 'claude-opus-4-6', 'claude-opus-4-5', 'claude-haiku-4-5', 'claude-sonnet-4-5-20250929', 'claude-sonnet-4-20250514', 'claude-opus-4-1', 'claude-3-5-haiku-latest', 'claude-2.1']) {
      expect(supportsTemperature(id)).toBe(true);
    }
    for (const id of ['claude-opus-5-5', 'claude-sonnet-5-5', 'claude-haiku-5-5', 'claude-opus-5', 'claude-opus-4-8', 'claude-opus-4-7', 'claude-sonnet-5', 'claude-fable-5', 'claude-fable-5-1', 'claude-mythos-5-1', 'claude-future-9']) {
      expect(supportsTemperature(id)).toBe(false);
    }
  });
  it('knows which models think by default', () => {
    expect(thinksByDefault('claude-haiku-5-5')).toBe(true);
    expect(thinksByDefault('claude-opus-5-5')).toBe(true);
    expect(thinksByDefault('claude-sonnet-5-5')).toBe(true);
    expect(thinksByDefault('claude-haiku-4-5')).toBe(false);
  });
});

const auth = { type: 'SECRET_TEXT' as const, secret_text: 'k' };

describe('actions use resolved models', () => {
  beforeEach(() => {
    create.mockReset();
    countTokens.mockReset();
  });

  it('ask_claude sends Sonnet 5.5 for a saved Sonnet 4.5 flow and drops temperature', async () => {
    create.mockResolvedValue({ content: [{ type: 'text', text: ' hi ' }] });
    await askClaude.run({ ...createMockActionContext({ propsValue: { model: 'claude-sonnet-4-5-20250929', prompt: 'q', temperature: 0.5 } }), auth });
    const req = create.mock.calls[0][0];
    expect(req.model).toBe('claude-sonnet-5-5');
    expect(req.temperature).toBeUndefined();
  });

  it('ask_claude thinking mode uses Sonnet 5.5 with adaptive thinking', async () => {
    create.mockResolvedValue({ content: [{ type: 'text', text: 'ok' }] });
    await askClaude.run({ ...createMockActionContext({ propsValue: { model: 'claude-haiku-4-5', prompt: 'q', thinkingMode: true } }), auth });
    const req = create.mock.calls[0][0];
    expect(req.model).toBe('claude-sonnet-5-5');
    expect(req.thinking).toEqual({ type: 'adaptive' });
    expect(req.output_config).toBeUndefined();
  });

  it('ask_claude asks 5.5 models for low effort when thinking mode is off', async () => {
    create.mockResolvedValue({ content: [{ type: 'text', text: 'ok' }] });
    await askClaude.run({ ...createMockActionContext({ propsValue: { model: 'claude-3-haiku-20240307', prompt: 'q' } }), auth });
    const req = create.mock.calls[0][0];
    expect(req.model).toBe('claude-haiku-5-5');
    expect(req.max_tokens).toBe(1000);
    expect(req.output_config).toEqual({ effort: 'low' });
  });

  it('ask_claude sends no effort to models that do not think by default', async () => {
    create.mockResolvedValue({ content: [{ type: 'text', text: 'ok' }] });
    await askClaude.run({ ...createMockActionContext({ propsValue: { model: 'claude-haiku-4-5', prompt: 'q' } }), auth });
    expect(create.mock.calls[0][0].output_config).toBeUndefined();
  });

  it('ask_claude drops temperature on live models outside the allow-list', async () => {
    create.mockResolvedValue({ content: [{ type: 'text', text: 'ok' }] });
    await askClaude.run({ ...createMockActionContext({ propsValue: { model: 'claude-opus-4-8', prompt: 'q', temperature: 0.4 } }), auth });
    expect(create.mock.calls[0][0].temperature).toBeUndefined();
  });

  it('count_tokens counts against the replacement for a retired model', async () => {
    countTokens.mockResolvedValue({ input_tokens: 3 });
    await countTokensAction.run({ ...createMockActionContext({ propsValue: { model: 'claude-3-7-sonnet-latest', prompt: 'q' } }), auth });
    expect(countTokens.mock.calls[0][0].model).toBe('claude-sonnet-5-5');
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
    expect(req.output_config).toEqual({ effort: 'low' });
    expect(out).toEqual({ name: 'John' });
  });

  it('extract still forces the tool on Haiku 5.5 (mapped from Haiku 3)', async () => {
    create.mockResolvedValue({ content: [{ type: 'tool_use', input: { name: 'John' } }] });
    await extractStructuredDataAction.run({ ...createMockActionContext({ propsValue: extractProps('claude-3-haiku-20240307') }), auth });
    const req = create.mock.calls[0][0];
    expect(req.model).toBe('claude-haiku-5-5');
    expect(req.tool_choice).toEqual({ type: 'tool', name: 'extract_structured_data' });
    expect(req.system).toBeUndefined();
    expect(req.output_config).toEqual({ effort: 'low' });
  });

  it('extract asks once more on the auto path when no tool call comes back', async () => {
    create
      .mockResolvedValueOnce({ content: [{ type: 'text', text: 'Here you go' }], stop_reason: 'end_turn' })
      .mockResolvedValueOnce({ content: [{ type: 'tool_use', input: { name: 'John' } }], stop_reason: 'tool_use' });
    const out = await extractStructuredDataAction.run({ ...createMockActionContext({ propsValue: extractProps('claude-sonnet-5-5') }), auth });
    expect(out).toEqual({ name: 'John' });
    expect(create).toHaveBeenCalledTimes(2);
    const retry = create.mock.calls[1][0].messages;
    expect(retry.at(-2)).toEqual({ role: 'assistant', content: [{ type: 'text', text: 'Here you go' }] });
    expect(retry.at(-1).role).toBe('user');
  });

  it('extract does not retry when the reply ran out of tokens', async () => {
    create.mockResolvedValue({ content: [{ type: 'thinking', thinking: 'hmm' }], stop_reason: 'max_tokens' });
    await expect(
      extractStructuredDataAction.run({ ...createMockActionContext({ propsValue: extractProps('claude-sonnet-5-5') }), auth })
    ).rejects.toThrow(/ran out of tokens.*Maximum Tokens/);
    expect(create).toHaveBeenCalledTimes(1);
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
    expect(create).toHaveBeenCalledTimes(2);
  });
});
