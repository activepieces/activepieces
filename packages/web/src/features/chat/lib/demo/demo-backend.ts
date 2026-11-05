import { ErrorCode, isObject, SeekPage } from '@activepieces/core-utils';
import {
  ActionPreviewEvent,
  ActionReceiptEvent,
  AgentConversation,
  AgentConversationStatus,
  AgentEventType,
  AgentRunSource,
  BuildPlanEvent,
  ConnectionOption,
  CreateAgentConversationRequest,
  FileProducedEvent,
  ImageGeneratedEvent,
  PersistedAgentMessage,
  PersistedAgentPart,
  PersistedAgentPartType,
  PersistedAgentRole,
  PersistedToolCallStatus,
  SubagentActivity,
  ToolProgressEvent,
  UpdateAgentConversationRequest,
} from '@activepieces/shared';
import { UIMessageChunk } from 'ai';

import type { ChatApi, PendingGate } from '../chat-api';
import { chunkReducer, StreamingState } from '../chunk-reducer';

import { chatDemo } from './chat-demo';
import { demoHistory } from './demo-history';
import { demoScenarios, DemoScenario } from './demo-scenarios';

// An in-memory stand-in for the chat API. It keeps demo conversations here,
// plays a scenario's script when a message is sent, and publishes the same
// websocket events the server would, so the real stream reader, reducer and
// components render the result. Nothing reaches the server.

const conversations = new Map<string, DemoConversation>();
let armedScenarioId: string | null = null;
let idCounter = 0;

function nextId(kind: string): string {
  idCounter += 1;
  return `${chatDemo.DEMO_ID_PREFIX}${kind}-${Date.now().toString(
    36,
  )}-${idCounter}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function makeConversation({
  title,
  projectId,
  updated,
  status = AgentConversationStatus.IDLE,
}: {
  title: string | null;
  projectId: string | null;
  updated?: string;
  status?: AgentConversationStatus;
}): AgentConversation {
  const stamp = updated ?? nowIso();
  return {
    id: nextId('conv'),
    created: stamp,
    updated: stamp,
    platformId: 'demo',
    projectId,
    userId: 'demo',
    agentId: null,
    flowRunId: null,
    waitpointId: null,
    aiCredits: null,
    source: AgentRunSource.CHAT,
    title,
    modelName: null,
    modelTierId: null,
    providerConfigId: null,
    status,
    activeRunId: null,
    messages: [],
    uiMessages: null,
    summary: null,
    summarizedUpToIndex: null,
  };
}

function touch(entry: DemoConversation, patch: Partial<AgentConversation>) {
  entry.conv = { ...entry.conv, ...patch, updated: nowIso() };
}

function getEntry(id: string): DemoConversation {
  const entry = conversations.get(id) ?? demoHistory.materialize(id);
  if (!entry) {
    throw new Error('Conversation not found');
  }
  conversations.set(id, entry);
  return entry;
}

// ---------------------------------------------------------------------------
// Playing a script

class DemoStop extends Error {}

class DemoFailure extends Error {
  constructor(message: string, readonly code?: string) {
    super(message);
  }
}

function startRun({
  entry,
  scenario,
  userText,
  fileNames,
  runId,
}: {
  entry: DemoConversation;
  scenario: DemoScenario;
  userText: string;
  fileNames: string[];
  runId?: string;
}): void {
  const attempt = entry.attempts[scenario.id] ?? 0;
  entry.attempts[scenario.id] = attempt + 1;
  const run: DemoRun = {
    runId,
    stopped: false,
    mirror: chunkReducer.createStreamingState(),
    extras: [],
    builds: {},
    gate: null,
    timers: new Set(),
    startedAt: Date.now(),
    textCounter: 0,
  };
  entry.run = run;
  touch(entry, { status: AgentConversationStatus.STREAMING });

  const convId = entry.conv.id;
  const emit = (type: AgentEventType, data: unknown) => {
    if (run.stopped) throw new DemoStop();
    chatDemo.publish({ conversationId: convId, runId, type, data });
  };
  const chunk = (...chunks: UIMessageChunk[]) => {
    if (run.stopped) throw new DemoStop();
    chunkReducer.applyChunks({ state: run.mirror, chunks });
    emit(AgentEventType.CHUNK, chunks);
  };
  const wait = (ms: number) =>
    new Promise<void>((resolve, reject) => {
      if (run.stopped) {
        reject(new DemoStop());
        return;
      }
      const scaled = Math.round(ms * chatDemo.speedFactor());
      const timer = setTimeout(() => {
        run.timers.delete(timer);
        if (run.stopped) reject(new DemoStop());
        else resolve();
      }, scaled);
      run.timers.add(timer);
      run.cancelWait = () => reject(new DemoStop());
    });

  const ctx = createContext({ run, chunk, emit, wait, attempt, userText });
  ctx.fileNames = fileNames;
  const titleOnStart =
    entry.turns === 1 && scenario.title ? scenario.title : null;

  const finish = (error?: DemoFailure) => {
    if (entry.run !== run) return;
    persistRun({ entry, run });
    entry.run = null;
    touch(entry, {
      status: error
        ? AgentConversationStatus.ERROR
        : AgentConversationStatus.IDLE,
    });
    if (error) {
      chatDemo.publish({
        conversationId: convId,
        runId,
        type: AgentEventType.ERROR,
        data: { message: error.message, code: error.code },
      });
    } else {
      chatDemo.publish({
        conversationId: convId,
        runId,
        type: AgentEventType.FINISHED,
        data: { conversationId: convId },
      });
    }
  };

  void (async () => {
    try {
      chunk({ type: 'start' }, { type: 'start-step' });
      if (titleOnStart) {
        touch(entry, { title: titleOnStart });
        emit(AgentEventType.TITLE_UPDATE, { title: titleOnStart });
      }
      await scenario.play(ctx);
      if (run.stopped) return;
      chunk({ type: 'finish-step' }, { type: 'finish' });
      finish();
    } catch (error) {
      if (error instanceof DemoStop || run.stopped) return;
      if (error instanceof DemoFailure) {
        finish(error);
        return;
      }
      finish(
        new DemoFailure(
          error instanceof Error ? error.message : 'Demo script failed',
        ),
      );
    }
  })();
}

function stopRun(entry: DemoConversation): void {
  const run = entry.run;
  if (!run) return;
  run.stopped = true;
  run.timers.forEach((timer) => clearTimeout(timer));
  run.timers.clear();
  run.cancelWait?.();
  run.gate?.reject(new DemoStop());
  persistRun({ entry, run });
  entry.run = null;
  touch(entry, { status: AgentConversationStatus.IDLE });
}

function createContext({
  run,
  chunk,
  emit,
  wait,
  attempt,
  userText,
}: {
  run: DemoRun;
  chunk: (...chunks: UIMessageChunk[]) => void;
  emit: (type: AgentEventType, data: unknown) => void;
  wait: (ms: number) => Promise<void>;
  attempt: number;
  userText: string;
}): DemoContext {
  const toolId = () => nextId('tc');

  async function streamText(
    kind: 'text' | 'reasoning',
    text: string,
    { wordsPerTick = 2, tickMs = 45 }: StreamOptions = {},
  ): Promise<void> {
    run.textCounter += 1;
    const id = `${kind}-${run.textCounter}`;
    chunk({ type: `${kind}-start`, id });
    if (chatDemo.speedFactor() === 0) {
      chunk({ type: `${kind}-delta`, id, delta: text });
    } else {
      const tokens = text.split(/(\s+)/);
      const step = Math.max(1, wordsPerTick) * 2;
      for (let i = 0; i < tokens.length; i += step) {
        chunk({
          type: `${kind}-delta`,
          id,
          delta: tokens.slice(i, i + step).join(''),
        });
        await wait(tickMs);
      }
    }
    chunk({ type: `${kind}-end`, id });
  }

  function toolStart({ name, input, title }: ToolCall): string {
    const toolCallId = toolId();
    chunk(
      { type: 'tool-input-start', toolCallId, toolName: name, title },
      {
        type: 'tool-input-available',
        toolCallId,
        toolName: name,
        title,
        input: input ?? {},
      },
    );
    return toolCallId;
  }

  function awaitDecision(gate: PendingGate): Promise<GateDecision> {
    return new Promise<GateDecision>((resolve, reject) => {
      run.gate = {
        pending: gate,
        resolve: (decision) => {
          run.gate = null;
          resolve(decision);
        },
        reject,
      };
    });
  }

  const ctx: DemoContext = {
    attempt,
    userText,
    fileNames: [],
    wait,
    text: (text, options) => streamText('text', text, options),
    reasoning: (text, options) =>
      streamText('reasoning', text, {
        wordsPerTick: 3,
        tickMs: 40,
        ...options,
      }),
    status: async (status) => {
      const toolCallId = toolStart({
        name: 'ap_update_thinking_status',
        input: { status },
      });
      chunk({
        type: 'tool-output-available',
        toolCallId,
        output: { success: true },
      });
      await wait(250);
    },
    tool: async ({ ms = 900, output = { success: true }, error, ...call }) => {
      const toolCallId = toolStart(call);
      await wait(ms);
      if (error) {
        chunk({ type: 'tool-output-error', toolCallId, errorText: error });
      } else {
        chunk({ type: 'tool-output-available', toolCallId, output });
      }
      return toolCallId;
    },
    startTool: (call) => {
      const toolCallId = toolStart(call);
      return {
        toolCallId,
        succeed: (output = { success: true }) =>
          chunk({ type: 'tool-output-available', toolCallId, output }),
        fail: (errorText) =>
          chunk({ type: 'tool-output-error', toolCallId, errorText }),
        deny: () => chunk({ type: 'tool-output-denied', toolCallId }),
      };
    },
    complete: (toolCallId, output = { success: true }) =>
      chunk({ type: 'tool-output-available', toolCallId, output }),
    deny: (toolCallId) => chunk({ type: 'tool-output-denied', toolCallId }),
    approval: async ({ name, input, preview, title }) => {
      const toolCallId = toolStart({ name, input, title });
      const actionPreview: ActionPreviewEvent = { toolCallId, ...preview };
      emit(AgentEventType.ACTION_PREVIEW, actionPreview);
      const decision = await awaitDecision({
        gateId: toolCallId,
        toolName: name,
        displayName: preview.actionDisplayName,
        toolInput: input ?? {},
      });
      return { ...decision, toolCallId };
    },
    display: async ({ name, input, output, ms = 500 }) => {
      const toolCallId = nextId('tc');
      chunk({ type: 'tool-input-start', toolCallId, toolName: name });
      await wait(ms);
      chunk({
        type: 'tool-input-available',
        toolCallId,
        toolName: name,
        input,
      });
      const decision = await awaitDecision({
        gateId: toolCallId,
        toolName: name,
        displayName: name,
        toolInput: input,
      });
      chunk({
        type: 'tool-output-available',
        toolCallId,
        output: decision.approved
          ? output?.(decision.payload ?? {}) ?? decision.payload ?? {}
          : { dismissed: true },
      });
      return { ...decision, toolCallId };
    },
    showInline: ({ name, input }) => {
      const toolCallId = toolStart({ name, input });
      chunk({
        type: 'tool-output-available',
        toolCallId,
        output: { displayed: true },
      });
    },
    receipt: (toolCallId, receipt) => {
      const event: ActionReceiptEvent = {
        toolCallId,
        timestamp: nowIso(),
        ...receipt,
      };
      run.extras.push({
        type: PersistedAgentPartType.ACTION_RECEIPT,
        ...event,
      });
      emit(AgentEventType.ACTION_RECEIPT, event);
    },
    image: (toolCallId, image) => {
      const event: ImageGeneratedEvent = {
        toolCallId,
        fileId: nextId('file'),
        timestamp: nowIso(),
        ...image,
      };
      run.extras.push({
        type: PersistedAgentPartType.IMAGE,
        toolCallId,
        fileId: event.fileId,
        url: event.url,
        mediaType: event.mediaType,
        prompt: event.prompt,
        model: event.model,
        timestamp: event.timestamp,
      });
      emit(AgentEventType.IMAGE, event);
    },
    file: (toolCallId, file) => {
      const event: FileProducedEvent = {
        toolCallId,
        fileId: nextId('file'),
        timestamp: nowIso(),
        ...file,
      };
      run.extras.push({ type: PersistedAgentPartType.FILE, ...event });
      emit(AgentEventType.FILE, event);
    },
    toolProgress: (toolCallId, data) => {
      const event: ToolProgressEvent = { toolCallId, data };
      emit(AgentEventType.TOOL_PROGRESS, event);
    },
    subagent: (toolCallId, data) => {
      emit(AgentEventType.SUBAGENT_PROGRESS, { toolCallId, data });
    },
    buildPlan: (plan) => {
      const event: BuildPlanEvent = { ...plan, updatedAt: nowIso() };
      const firstForPhase =
        run.builds[event.buildId]?.phase !== event.phase ||
        !run.builds[event.buildId];
      run.builds[event.buildId] = event;
      emit(AgentEventType.BUILD_PLAN, event);
      if (firstForPhase) {
        const toolCallId = toolStart({
          name: 'ap_set_build_plan',
          input: { phase: event.phase },
        });
        chunk({
          type: 'tool-output-available',
          toolCallId,
          output: { ok: true, buildId: event.buildId },
        });
      }
    },
    source: (url, title) => {
      chunk({ type: 'source-url', sourceId: nextId('src'), url, title });
    },
    title: (title) => emit(AgentEventType.TITLE_UPDATE, { title }),
    fail: (message, code) => {
      throw new DemoFailure(message, code);
    },
    quotaExceeded: () => {
      throw new DemoFailure(
        'You have run out of AI credits.',
        ErrorCode.QUOTA_EXCEEDED,
      );
    },
  };
  return ctx;
}

// ---------------------------------------------------------------------------
// History: what a finished (or in-flight) turn looks like once "saved".

function toPersistedParts(run: DemoRun): PersistedAgentPart[] {
  const parts: PersistedAgentPart[] = [];
  for (const part of run.mirror.message.parts) {
    switch (part.type) {
      case 'text':
        if (part.text)
          parts.push({ type: PersistedAgentPartType.TEXT, text: part.text });
        break;
      case 'reasoning':
        if (part.text) {
          parts.push({
            type: PersistedAgentPartType.REASONING,
            text: part.text,
          });
        }
        break;
      case 'source-url':
        parts.push({
          type: PersistedAgentPartType.SOURCE_URL,
          sourceId: part.sourceId,
          url: part.url,
          title: part.title,
        });
        break;
      case 'dynamic-tool': {
        const input = isObject(part.input) ? part.input : {};
        if (part.toolName === 'ap_update_thinking_status') {
          const status = typeof input.status === 'string' ? input.status : '';
          if (status) {
            parts.push({
              type: PersistedAgentPartType.THINKING_STATUS,
              text: status,
            });
          }
          break;
        }
        if (part.toolName === 'ap_set_build_plan') {
          const output = isObject(part.output) ? part.output : {};
          const buildId =
            typeof output.buildId === 'string' ? output.buildId : null;
          const build = buildId ? run.builds[buildId] : undefined;
          if (buildId && build) {
            parts.push({
              type: PersistedAgentPartType.BUILD_PLAN,
              buildId,
              data: { ...build, phase: input.phase ?? build.phase },
            });
          }
          break;
        }
        const base = {
          type: PersistedAgentPartType.TOOL_CALL,
          toolCallId: part.toolCallId,
          toolName: part.toolName,
          title: part.title,
          input,
        } as const;
        if (part.state === 'output-available') {
          parts.push({
            ...base,
            status: PersistedToolCallStatus.COMPLETED,
            output: part.output,
          });
        } else if (part.state === 'output-error') {
          parts.push({
            ...base,
            status: PersistedToolCallStatus.ERROR,
            errorText: part.errorText,
          });
        } else if (part.state === 'output-denied') {
          parts.push({
            ...base,
            status: PersistedToolCallStatus.ERROR,
            errorText: 'Declined',
          });
        }
        // Pending calls are not saved, like on the server; a resumed stream
        // re-adds a pending gate from getPendingGate.
        break;
      }
      default:
        break;
    }
  }
  return [...parts, ...run.extras];
}

function persistRun({
  entry,
  run,
}: {
  entry: DemoConversation;
  run: DemoRun;
}): void {
  const parts = toPersistedParts(run);
  if (parts.length === 0) return;
  entry.messages.push({
    role: PersistedAgentRole.ASSISTANT,
    parts,
    thinkingDurationMs: Date.now() - run.startedAt,
  });
}

function pickScenario({
  entry,
  content,
}: {
  entry: DemoConversation;
  content: string;
}): DemoScenario {
  const byText = demoScenarios.match(content);
  if (byText) return byText;
  const ownScenario = entry.scenarioId
    ? demoScenarios.byId(entry.scenarioId)
    : undefined;
  if (ownScenario && entry.turns === 0) return ownScenario;
  return demoScenarios.fallback;
}

// ---------------------------------------------------------------------------
// The API surface, shaped like chatApi.

async function createConversation(
  request: CreateAgentConversationRequest,
): Promise<AgentConversation> {
  const conv = makeConversation({
    title: request.title ?? null,
    projectId: request.projectId ?? null,
  });
  conversations.set(conv.id, {
    conv,
    scenarioId: armedScenarioId,
    messages: [],
    turns: 0,
    attempts: {},
    run: null,
  });
  armedScenarioId = null;
  return conv;
}

async function sendMessage({
  conversationId,
  content,
  runId,
  files,
}: {
  conversationId: string;
  content: string;
  runId?: string;
  files?: Array<{ name: string }>;
}): Promise<{ conversationId: string; runId?: string }> {
  const entry = getEntry(conversationId);
  const scenario = pickScenario({ entry, content });
  const attempt = entry.attempts[scenario.id] ?? 0;
  if (scenario.rejectSendOnFirstTry && attempt === 0) {
    entry.attempts[scenario.id] = 1;
    await sleep(600);
    throw new Error('Network error: the message could not be sent.');
  }
  stopRun(entry);
  entry.messages.push({
    role: PersistedAgentRole.USER,
    parts: [{ type: PersistedAgentPartType.TEXT, text: content }],
  });
  entry.turns += 1;
  touch(entry, {});
  // Give the client a beat to subscribe, like a real round trip.
  setTimeout(
    () =>
      startRun({
        entry,
        scenario,
        userText: content,
        fileNames: files?.map((file) => file.name) ?? [],
        runId,
      }),
    chatDemo.speedFactor() === 0 ? 0 : 350,
  );
  return { conversationId, runId };
}

async function getConversation(id: string): Promise<AgentConversation> {
  return getEntry(id).conv;
}

async function getMessages(
  id: string,
): Promise<{ data: PersistedAgentMessage[] }> {
  const entry = getEntry(id);
  const data = [...entry.messages];
  if (entry.run) {
    const parts = toPersistedParts(entry.run);
    if (parts.length > 0) {
      data.push({ role: PersistedAgentRole.ASSISTANT, parts });
    }
  }
  return { data };
}

async function getPendingGate(id: string): Promise<PendingGate | null> {
  return getEntry(id).run?.gate?.pending ?? null;
}

async function approveToolCall({
  gateId,
  approved,
  payload,
}: {
  gateId: string;
  approved: boolean;
  payload?: Record<string, unknown>;
}): Promise<void> {
  for (const entry of conversations.values()) {
    const gate = entry.run?.gate;
    if (gate && gate.pending.gateId === gateId) {
      gate.resolve({ approved, payload });
      return;
    }
  }
}

async function cancelConversation(id: string): Promise<void> {
  const entry = conversations.get(id);
  if (entry) stopRun(entry);
}

async function updateConversation(
  id: string,
  request: UpdateAgentConversationRequest,
): Promise<AgentConversation> {
  const entry = getEntry(id);
  touch(entry, {
    ...(request.title !== undefined ? { title: request.title } : {}),
  });
  return entry.conv;
}

async function deleteConversation(id: string): Promise<void> {
  const entry = conversations.get(id);
  if (entry) stopRun(entry);
  conversations.delete(id);
  demoHistory.remove(id);
}

async function getPickerConnections(): Promise<{
  connections: ConnectionOption[];
  reconnectOnly: boolean;
}> {
  await sleep(400);
  return { connections: [], reconnectOnly: false };
}

function listedConversations(): AgentConversation[] {
  const own = [...conversations.values()]
    .filter((entry) => !demoHistory.isFake(entry.conv.id))
    .map((entry) => entry.conv);
  const fake = chatDemo.settings().fakeHistory
    ? demoHistory.list().map((conv) => conversations.get(conv.id)?.conv ?? conv)
    : [];
  return [...own, ...fake];
}

function mergeIntoFirstPage(
  page: SeekPage<AgentConversation>,
  { cursor, agentId }: { cursor?: string; agentId?: string },
): SeekPage<AgentConversation> {
  if (cursor || agentId !== undefined) return page;
  const extra = listedConversations();
  if (extra.length === 0) return page;
  return { ...page, data: [...extra, ...page.data] };
}

// Starts a scenario. A live one arms the next new conversation and returns the
// prompt to send; a seeded one is created here, already full, and opened.
function prepare(scenarioId: string): DemoPrepared | null {
  const scenario = demoScenarios.byId(scenarioId);
  if (!scenario) return null;
  if (scenario.seed) {
    const conv = makeConversation({
      title: scenario.title,
      projectId: null,
    });
    conversations.set(conv.id, {
      conv,
      scenarioId: scenario.id,
      messages: scenario.seed(),
      turns: 1,
      attempts: {},
      run: null,
    });
    return { kind: 'conversation', conversationId: conv.id };
  }
  armedScenarioId = scenario.id;
  return { kind: 'prompt', prompt: scenario.prompt };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) =>
    setTimeout(resolve, Math.round(ms * chatDemo.speedFactor())),
  );
}

// Routes each call: demo conversations (and new chats while demo mode is on)
// go to the in-memory backend; everything else goes to the real API.
function wrap(real: ChatApi): ChatApi {
  const isDemo = chatDemo.isDemoId;
  return {
    ...real,
    createConversation: (request) =>
      chatDemo.isActive() && request.agentId === undefined
        ? createConversation(request)
        : real.createConversation(request),
    listConversations: async (args) =>
      mergeIntoFirstPage(await real.listConversations(args), args),
    getConversation: (id) =>
      isDemo(id) ? getConversation(id) : real.getConversation(id),
    getMessages: (id) => (isDemo(id) ? getMessages(id) : real.getMessages(id)),
    updateConversation: (id, request) =>
      isDemo(id)
        ? updateConversation(id, request)
        : real.updateConversation(id, request),
    deleteConversation: (id) =>
      isDemo(id) ? deleteConversation(id) : real.deleteConversation(id),
    sendMessage: (request) =>
      isDemo(request.conversationId)
        ? sendMessage(request)
        : real.sendMessage(request),
    approveToolCall: (request) =>
      isDemo(request.gateId)
        ? approveToolCall(request)
        : real.approveToolCall(request),
    cancelConversation: (id) =>
      isDemo(id) ? cancelConversation(id) : real.cancelConversation(id),
    submitMessageFeedback: (request) =>
      isDemo(request.conversationId)
        ? Promise.resolve()
        : real.submitMessageFeedback(request),
    getPickerConnections: (request) =>
      isDemo(request.conversationId)
        ? getPickerConnections()
        : real.getPickerConnections(request),
    getPendingGate: (id) =>
      isDemo(id) ? getPendingGate(id) : real.getPendingGate(id),
  };
}

export const demoBackend = {
  wrap,
  prepare,
  makeConversation,
};

export type DemoConversation = {
  conv: AgentConversation;
  scenarioId: string | null;
  messages: PersistedAgentMessage[];
  turns: number;
  attempts: Record<string, number>;
  run: DemoRun | null;
};

type DemoRun = {
  runId?: string;
  stopped: boolean;
  mirror: StreamingState;
  extras: PersistedAgentPart[];
  builds: Record<string, BuildPlanEvent>;
  gate: {
    pending: PendingGate;
    resolve: (decision: {
      approved: boolean;
      payload?: Record<string, unknown>;
    }) => void;
    reject: (error: Error) => void;
  } | null;
  timers: Set<ReturnType<typeof setTimeout>>;
  cancelWait?: () => void;
  startedAt: number;
  textCounter: number;
};

type DemoPrepared =
  | { kind: 'prompt'; prompt: string }
  | { kind: 'conversation'; conversationId: string };

type StreamOptions = { wordsPerTick?: number; tickMs?: number };

type ToolCall = {
  name: string;
  input?: Record<string, unknown>;
  title?: string;
};

export type GateDecision = {
  approved: boolean;
  payload?: Record<string, unknown>;
};

export type DemoContext = {
  // How many times this scenario already played in this chat (0 the first time).
  attempt: number;
  userText: string;
  fileNames: string[];
  wait: (ms: number) => Promise<void>;
  text: (text: string, options?: StreamOptions) => Promise<void>;
  reasoning: (text: string, options?: StreamOptions) => Promise<void>;
  status: (status: string) => Promise<void>;
  tool: (
    call: ToolCall & { ms?: number; output?: unknown; error?: string },
  ) => Promise<string>;
  startTool: (call: ToolCall) => {
    toolCallId: string;
    succeed: (output?: unknown) => void;
    fail: (errorText: string) => void;
    deny: () => void;
  };
  complete: (toolCallId: string, output?: unknown) => void;
  deny: (toolCallId: string) => void;
  approval: (args: {
    name: string;
    title?: string;
    input?: Record<string, unknown>;
    preview: Omit<ActionPreviewEvent, 'toolCallId'>;
  }) => Promise<GateDecision & { toolCallId: string }>;
  display: (args: {
    name: string;
    input: Record<string, unknown>;
    output?: (payload: Record<string, unknown>) => Record<string, unknown>;
    ms?: number;
  }) => Promise<GateDecision & { toolCallId: string }>;
  showInline: (args: { name: string; input: Record<string, unknown> }) => void;
  receipt: (
    toolCallId: string,
    receipt: Omit<ActionReceiptEvent, 'toolCallId' | 'timestamp'>,
  ) => void;
  image: (
    toolCallId: string,
    image: Omit<ImageGeneratedEvent, 'toolCallId' | 'timestamp' | 'fileId'>,
  ) => void;
  file: (
    toolCallId: string,
    file: Omit<FileProducedEvent, 'toolCallId' | 'timestamp' | 'fileId'>,
  ) => void;
  toolProgress: (toolCallId: string, data: ToolProgressEvent['data']) => void;
  subagent: (toolCallId: string, data: SubagentActivity) => void;
  buildPlan: (plan: Omit<BuildPlanEvent, 'updatedAt'>) => void;
  source: (url: string, title?: string) => void;
  title: (title: string) => void;
  fail: (message: string, code?: string) => never;
  quotaExceeded: () => never;
};
