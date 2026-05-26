import { DynamicToolUIPart, UIMessageChunk } from 'ai';

import { ChatUIMessage } from './chat-types';

function createStreamingState({
  messageId,
}: { messageId?: string } = {}): StreamingState {
  return {
    message: {
      id: messageId ?? `stream-${Date.now()}`,
      role: 'assistant',
      parts: [],
    },
    activeTextParts: {},
    activeReasoningParts: {},
    partialToolCalls: {},
    seenToolCallIds: new Set(),
  };
}

function findToolPartIndex({
  state,
  toolCallId,
}: {
  state: StreamingState;
  toolCallId: string;
}): number {
  return state.message.parts.findIndex(
    (p) =>
      p.type === 'dynamic-tool' &&
      'toolCallId' in p &&
      p.toolCallId === toolCallId,
  );
}

function updateToolPartFields({
  state,
  idx,
  fields,
}: {
  state: StreamingState;
  idx: number;
  fields: Partial<
    Pick<MutableToolPart, 'state' | 'input' | 'output' | 'errorText'>
  >;
}): void {
  const part = state.message.parts[idx] as MutableToolPart;
  if (fields.state !== undefined) part.state = fields.state;
  if ('input' in fields) part.input = fields.input;
  if ('output' in fields) part.output = fields.output;
  if ('errorText' in fields) part.errorText = fields.errorText;
}

function applyChunk({
  state,
  chunk,
}: {
  state: StreamingState;
  chunk: UIMessageChunk;
}): void {
  switch (chunk.type) {
    case 'start': {
      if (chunk.messageId) {
        state.message.id = chunk.messageId;
      }
      break;
    }

    case 'text-start': {
      const partIndex = state.message.parts.length;
      state.message.parts.push({ type: 'text', text: '' });
      state.activeTextParts[chunk.id] = partIndex;
      break;
    }

    case 'text-delta': {
      const idx = state.activeTextParts[chunk.id];
      if (idx === undefined) break;
      const part = state.message.parts[idx];
      if (part?.type === 'text') {
        part.text += chunk.delta;
      }
      break;
    }

    case 'text-end': {
      delete state.activeTextParts[chunk.id];
      break;
    }

    case 'reasoning-start': {
      const partIndex = state.message.parts.length;
      state.message.parts.push({ type: 'reasoning', text: '' });
      state.activeReasoningParts[chunk.id] = partIndex;
      break;
    }

    case 'reasoning-delta': {
      const idx = state.activeReasoningParts[chunk.id];
      if (idx === undefined) break;
      const part = state.message.parts[idx];
      if (part?.type === 'reasoning') {
        part.text += chunk.delta;
      }
      break;
    }

    case 'reasoning-end': {
      delete state.activeReasoningParts[chunk.id];
      break;
    }

    case 'tool-input-start': {
      if (state.seenToolCallIds.has(chunk.toolCallId)) break;
      state.seenToolCallIds.add(chunk.toolCallId);

      state.message.parts.push({
        type: 'dynamic-tool',
        toolCallId: chunk.toolCallId,
        toolName: chunk.toolName,
        title: chunk.title ?? chunk.toolName,
        state: 'input-streaming',
        input: undefined,
      });
      state.partialToolCalls[chunk.toolCallId] = {
        toolName: chunk.toolName,
        inputText: '',
      };
      break;
    }

    case 'tool-input-delta': {
      const partial = state.partialToolCalls[chunk.toolCallId];
      if (!partial) break;
      partial.inputText += chunk.inputTextDelta;
      break;
    }

    case 'tool-input-available': {
      const idx = findToolPartIndex({ state, toolCallId: chunk.toolCallId });
      if (idx === -1) {
        if (state.seenToolCallIds.has(chunk.toolCallId)) break;
        state.seenToolCallIds.add(chunk.toolCallId);
        state.message.parts.push({
          type: 'dynamic-tool',
          toolCallId: chunk.toolCallId,
          toolName: chunk.toolName,
          title: chunk.title ?? chunk.toolName,
          state: 'input-available',
          input: chunk.input,
        });
      } else {
        updateToolPartFields({
          state,
          idx,
          fields: { state: 'input-available', input: chunk.input },
        });
      }
      delete state.partialToolCalls[chunk.toolCallId];
      break;
    }

    case 'tool-input-error': {
      const idx = findToolPartIndex({ state, toolCallId: chunk.toolCallId });
      if (idx === -1) {
        state.message.parts.push({
          type: 'dynamic-tool',
          toolCallId: chunk.toolCallId,
          toolName: chunk.toolName,
          title: chunk.title ?? chunk.toolName,
          state: 'output-error',
          input: chunk.input,
          errorText: chunk.errorText,
        });
        state.seenToolCallIds.add(chunk.toolCallId);
      } else {
        updateToolPartFields({
          state,
          idx,
          fields: {
            state: 'output-error',
            input: chunk.input,
            errorText: chunk.errorText,
          },
        });
      }
      delete state.partialToolCalls[chunk.toolCallId];
      break;
    }

    case 'tool-output-available': {
      const idx = findToolPartIndex({ state, toolCallId: chunk.toolCallId });
      if (idx === -1) break;
      updateToolPartFields({
        state,
        idx,
        fields: { state: 'output-available', output: chunk.output },
      });
      break;
    }

    case 'tool-output-error': {
      const idx = findToolPartIndex({ state, toolCallId: chunk.toolCallId });
      if (idx === -1) break;
      updateToolPartFields({
        state,
        idx,
        fields: { state: 'output-error', errorText: chunk.errorText },
      });
      break;
    }

    case 'tool-output-denied': {
      const idx = findToolPartIndex({ state, toolCallId: chunk.toolCallId });
      if (idx === -1) break;
      updateToolPartFields({ state, idx, fields: { state: 'output-denied' } });
      break;
    }

    case 'start-step': {
      state.message.parts.push({ type: 'step-start' });
      break;
    }

    case 'finish-step': {
      state.activeTextParts = {};
      state.activeReasoningParts = {};
      break;
    }

    case 'source-url': {
      state.message.parts.push({
        type: 'source-url',
        sourceId: chunk.sourceId,
        url: chunk.url,
        title: chunk.title,
      });
      break;
    }

    case 'source-document': {
      state.message.parts.push({
        type: 'source-document',
        sourceId: chunk.sourceId,
        mediaType: chunk.mediaType,
        title: chunk.title,
        filename: chunk.filename,
      });
      break;
    }

    case 'file': {
      state.message.parts.push({
        type: 'file',
        mediaType: chunk.mediaType,
        url: chunk.url,
      });
      break;
    }

    case 'finish':
    case 'error':
    case 'abort':
    case 'message-metadata':
    case 'tool-approval-request':
      break;

    default: {
      handleDataChunk({ state, chunk: chunk as DataChunk });
      break;
    }
  }
}

function handleDataChunk({
  state,
  chunk,
}: {
  state: StreamingState;
  chunk: DataChunk;
}): void {
  if (!chunk.type?.startsWith('data-')) return;
  if (chunk.transient) return;

  if (chunk.id) {
    const existing = state.message.parts.findIndex(
      (p) => 'id' in p && p.id === chunk.id && p.type === chunk.type,
    );
    if (existing >= 0) {
      (state.message.parts[existing] as Record<string, unknown>).data =
        chunk.data;
      return;
    }
  }

  state.message.parts.push(chunk as ChatUIMessage['parts'][number]);
}

function applyChunks({
  state,
  chunks,
}: {
  state: StreamingState;
  chunks: UIMessageChunk[];
}): void {
  for (const chunk of chunks) {
    applyChunk({ state, chunk });
  }
}

function extractDataParts({
  chunks,
}: {
  chunks: UIMessageChunk[];
}): DataPart[] {
  const result: DataPart[] = [];
  for (const chunk of chunks) {
    if (
      typeof chunk.type === 'string' &&
      chunk.type.startsWith('data-') &&
      'data' in chunk
    ) {
      result.push({
        type: chunk.type,
        data: (chunk as DataChunk).data,
      });
    }
  }
  return result;
}

function snapshotMessage({ state }: { state: StreamingState }): ChatUIMessage {
  return {
    ...state.message,
    parts: state.message.parts.map((part) => ({ ...part })),
  };
}

export const chunkReducer = {
  createStreamingState,
  applyChunk,
  applyChunks,
  extractDataParts,
  snapshotMessage,
};

/**
 * Writable view of DynamicToolUIPart fields. The AI SDK types use a discriminated
 * union keyed on `state`, which prevents mutating the discriminant in-place.
 * This type is used only inside updateToolPartFields where we deliberately
 * mutate the runtime object to avoid re-creating it on every chunk.
 */
type MutableToolPart = Pick<
  DynamicToolUIPart,
  'type' | 'toolCallId' | 'toolName' | 'title'
> & {
  state: string;
  input: unknown;
  output?: unknown;
  errorText?: string;
};

type StreamingState = {
  message: ChatUIMessage;
  activeTextParts: Record<string, number>;
  activeReasoningParts: Record<string, number>;
  partialToolCalls: Record<string, { toolName: string; inputText: string }>;
  seenToolCallIds: Set<string>;
};

type DataChunk = {
  type: string;
  id?: string;
  data: unknown;
  transient?: boolean;
};

type DataPart = {
  type: string;
  data: unknown;
};

export type { StreamingState, DataPart };
