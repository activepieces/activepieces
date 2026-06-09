import { UIMessageChunk } from 'ai';
import { describe, expect, it } from 'vitest';

import { chunkReducer, StreamingState } from '@/features/chat/lib/chunk-reducer';

function makeChunk(override: UIMessageChunk): UIMessageChunk {
  return override;
}

function createAndApply(chunks: UIMessageChunk[]): StreamingState {
  const state = chunkReducer.createStreamingState({ messageId: 'test-msg' });
  chunkReducer.applyChunks({ state, chunks });
  return state;
}

describe('chunkReducer', () => {
  describe('createStreamingState', () => {
    it('creates an empty assistant message', () => {
      const state = chunkReducer.createStreamingState({ messageId: 'msg-1' });
      expect(state.message.id).toBe('msg-1');
      expect(state.message.role).toBe('assistant');
      expect(state.message.parts).toEqual([]);
    });

    it('generates a default id when none provided', () => {
      const state = chunkReducer.createStreamingState();
      expect(state.message.id).toMatch(/^stream-/);
    });
  });

  describe('text accumulation', () => {
    it('accumulates text from start + deltas + end', () => {
      const state = createAndApply([
        makeChunk({ type: 'text-start', id: 't1' }),
        makeChunk({ type: 'text-delta', id: 't1', delta: 'Hello' }),
        makeChunk({ type: 'text-delta', id: 't1', delta: ' world' }),
        makeChunk({ type: 'text-end', id: 't1' }),
      ]);
      expect(state.message.parts).toHaveLength(1);
      expect(state.message.parts[0]).toEqual({
        type: 'text',
        text: 'Hello world',
      });
    });

    it('handles multiple text parts', () => {
      const state = createAndApply([
        makeChunk({ type: 'text-start', id: 't1' }),
        makeChunk({ type: 'text-delta', id: 't1', delta: 'First' }),
        makeChunk({ type: 'text-end', id: 't1' }),
        makeChunk({ type: 'text-start', id: 't2' }),
        makeChunk({ type: 'text-delta', id: 't2', delta: 'Second' }),
        makeChunk({ type: 'text-end', id: 't2' }),
      ]);
      expect(state.message.parts).toHaveLength(2);
      expect(state.message.parts[0]).toEqual({ type: 'text', text: 'First' });
      expect(state.message.parts[1]).toEqual({ type: 'text', text: 'Second' });
    });
  });

  describe('reasoning accumulation', () => {
    it('accumulates reasoning from start + deltas + end', () => {
      const state = createAndApply([
        makeChunk({ type: 'reasoning-start', id: 'r1' }),
        makeChunk({ type: 'reasoning-delta', id: 'r1', delta: 'Thinking' }),
        makeChunk({ type: 'reasoning-delta', id: 'r1', delta: '...' }),
        makeChunk({ type: 'reasoning-end', id: 'r1' }),
      ]);
      expect(state.message.parts).toHaveLength(1);
      expect(state.message.parts[0]).toEqual({
        type: 'reasoning',
        text: 'Thinking...',
      });
    });
  });

  describe('tool call lifecycle', () => {
    it('handles full tool lifecycle: start → delta → available → output', () => {
      const state = createAndApply([
        makeChunk({
          type: 'tool-input-start',
          toolCallId: 'tc1',
          toolName: 'ap_run_action',
        }),
        makeChunk({
          type: 'tool-input-delta',
          toolCallId: 'tc1',
          inputTextDelta: '{"key":',
        }),
        makeChunk({
          type: 'tool-input-delta',
          toolCallId: 'tc1',
          inputTextDelta: '"value"}',
        }),
        makeChunk({
          type: 'tool-input-available',
          toolCallId: 'tc1',
          toolName: 'ap_run_action',
          input: { key: 'value' },
        }),
        makeChunk({
          type: 'tool-output-available',
          toolCallId: 'tc1',
          output: { result: 'ok' },
        }),
      ]);
      expect(state.message.parts).toHaveLength(1);
      const part = state.message.parts[0] as Record<string, unknown>;
      expect(part.type).toBe('dynamic-tool');
      expect(part.toolCallId).toBe('tc1');
      expect(part.state).toBe('output-available');
      expect(part.input).toEqual({ key: 'value' });
      expect(part.output).toEqual({ result: 'ok' });
    });

    it('handles tool-input-available without prior start', () => {
      const state = createAndApply([
        makeChunk({
          type: 'tool-input-available',
          toolCallId: 'tc1',
          toolName: 'ap_search',
          input: { query: 'test' },
        }),
      ]);
      expect(state.message.parts).toHaveLength(1);
      const part = state.message.parts[0] as Record<string, unknown>;
      expect(part.state).toBe('input-available');
      expect(part.input).toEqual({ query: 'test' });
    });

    it('handles tool-output-error', () => {
      const state = createAndApply([
        makeChunk({
          type: 'tool-input-start',
          toolCallId: 'tc1',
          toolName: 'ap_run_action',
        }),
        makeChunk({
          type: 'tool-input-available',
          toolCallId: 'tc1',
          toolName: 'ap_run_action',
          input: {},
        }),
        makeChunk({
          type: 'tool-output-error',
          toolCallId: 'tc1',
          errorText: 'Something went wrong',
        }),
      ]);
      const part = state.message.parts[0] as Record<string, unknown>;
      expect(part.state).toBe('output-error');
      expect(part.errorText).toBe('Something went wrong');
    });

    it('handles tool-output-denied', () => {
      const state = createAndApply([
        makeChunk({
          type: 'tool-input-start',
          toolCallId: 'tc1',
          toolName: 'ap_run_action',
        }),
        makeChunk({
          type: 'tool-input-available',
          toolCallId: 'tc1',
          toolName: 'ap_run_action',
          input: {},
        }),
        makeChunk({ type: 'tool-output-denied', toolCallId: 'tc1' }),
      ]);
      const part = state.message.parts[0] as Record<string, unknown>;
      expect(part.state).toBe('output-denied');
    });

    it('handles tool-input-error', () => {
      const state = createAndApply([
        makeChunk({
          type: 'tool-input-error',
          toolCallId: 'tc1',
          toolName: 'ap_run_action',
          input: {},
          errorText: 'Invalid input',
        }),
      ]);
      const part = state.message.parts[0] as Record<string, unknown>;
      expect(part.state).toBe('output-error');
      expect(part.errorText).toBe('Invalid input');
    });
  });

  describe('dedup', () => {
    it('ignores duplicate tool-input-start for same toolCallId', () => {
      const state = createAndApply([
        makeChunk({
          type: 'tool-input-start',
          toolCallId: 'tc1',
          toolName: 'ap_run_action',
        }),
        makeChunk({
          type: 'tool-input-start',
          toolCallId: 'tc1',
          toolName: 'ap_run_action',
        }),
      ]);
      expect(state.message.parts).toHaveLength(1);
    });

    it('ignores duplicate tool-input-available for already-seen toolCallId', () => {
      const state = createAndApply([
        makeChunk({
          type: 'tool-input-start',
          toolCallId: 'tc1',
          toolName: 'ap_run_action',
        }),
        makeChunk({
          type: 'tool-input-available',
          toolCallId: 'tc1',
          toolName: 'ap_run_action',
          input: { v: 1 },
        }),
        makeChunk({
          type: 'tool-input-available',
          toolCallId: 'tc1',
          toolName: 'ap_run_action',
          input: { v: 2 },
        }),
      ]);
      expect(state.message.parts).toHaveLength(1);
      const part = state.message.parts[0] as Record<string, unknown>;
      expect(part.input).toEqual({ v: 2 });
    });
  });

  describe('resilience', () => {
    it('silently skips text-delta for unknown id', () => {
      const state = createAndApply([
        makeChunk({ type: 'text-delta', id: 'unknown', delta: 'orphan' }),
      ]);
      expect(state.message.parts).toHaveLength(0);
    });

    it('silently skips reasoning-delta for unknown id', () => {
      const state = createAndApply([
        makeChunk({
          type: 'reasoning-delta',
          id: 'unknown',
          delta: 'orphan',
        }),
      ]);
      expect(state.message.parts).toHaveLength(0);
    });

    it('silently skips tool-input-delta for unknown toolCallId', () => {
      const state = createAndApply([
        makeChunk({
          type: 'tool-input-delta',
          toolCallId: 'unknown',
          inputTextDelta: '{}',
        }),
      ]);
      expect(state.message.parts).toHaveLength(0);
    });

    it('silently skips tool-output-available for unknown toolCallId', () => {
      const state = createAndApply([
        makeChunk({
          type: 'tool-output-available',
          toolCallId: 'unknown',
          output: {},
        }),
      ]);
      expect(state.message.parts).toHaveLength(0);
    });
  });

  describe('step boundaries', () => {
    it('finish-step resets active text parts', () => {
      const state = chunkReducer.createStreamingState({ messageId: 'test' });

      chunkReducer.applyChunks({
        state,
        chunks: [
          makeChunk({ type: 'text-start', id: 't1' }),
          makeChunk({ type: 'text-delta', id: 't1', delta: 'Step 1' }),
          makeChunk({ type: 'finish-step' }),
        ],
      });

      expect(Object.keys(state.activeTextParts)).toHaveLength(0);

      chunkReducer.applyChunks({
        state,
        chunks: [
          makeChunk({ type: 'text-delta', id: 't1', delta: ' more' }),
        ],
      });

      const textPart = state.message.parts[0] as { type: string; text: string };
      expect(textPart.text).toBe('Step 1');
    });
  });

  describe('unknown chunk types are ignored', () => {
    it('ignores data-* chunks (no longer handled by chunk-reducer)', () => {
      const state = createAndApply([
        {
          type: 'data-connection-picker',
          data: { connections: [] },
        } as unknown as UIMessageChunk,
      ]);
      expect(state.message.parts).toHaveLength(0);
    });
  });

  describe('snapshotMessage', () => {
    it('returns a deep clone of parts so mutations do not leak', () => {
      const state = createAndApply([
        makeChunk({ type: 'text-start', id: 't1' }),
        makeChunk({ type: 'text-delta', id: 't1', delta: 'Hello' }),
      ]);
      const snapshot = chunkReducer.snapshotMessage({ state });
      expect(snapshot.parts).toEqual(state.message.parts);
      expect(snapshot.parts).not.toBe(state.message.parts);
      expect(snapshot.parts[0]).not.toBe(state.message.parts[0]);

      chunkReducer.applyChunk({
        state,
        chunk: makeChunk({ type: 'text-delta', id: 't1', delta: ' world' }),
      });
      const snapshotText = (snapshot.parts[0] as { text: string }).text;
      expect(snapshotText).toBe('Hello');
    });
  });

  describe('start chunk', () => {
    it('sets message id from start chunk', () => {
      const state = createAndApply([
        makeChunk({ type: 'start', messageId: 'server-id-123' }),
      ]);
      expect(state.message.id).toBe('server-id-123');
    });
  });

  describe('batch consistency', () => {
    it('produces same result whether applied one-by-one or as batch', () => {
      const chunks: UIMessageChunk[] = [
        makeChunk({ type: 'text-start', id: 't1' }),
        makeChunk({ type: 'text-delta', id: 't1', delta: 'Hello' }),
        makeChunk({
          type: 'tool-input-start',
          toolCallId: 'tc1',
          toolName: 'test',
        }),
        makeChunk({
          type: 'tool-input-available',
          toolCallId: 'tc1',
          toolName: 'test',
          input: { a: 1 },
        }),
        makeChunk({ type: 'text-delta', id: 't1', delta: ' world' }),
        makeChunk({ type: 'text-end', id: 't1' }),
      ];

      const batchState = chunkReducer.createStreamingState({
        messageId: 'test',
      });
      chunkReducer.applyChunks({ state: batchState, chunks });

      const oneByOneState = chunkReducer.createStreamingState({
        messageId: 'test',
      });
      for (const chunk of chunks) {
        chunkReducer.applyChunk({ state: oneByOneState, chunk });
      }

      expect(batchState.message.parts).toEqual(oneByOneState.message.parts);
    });
  });
});
