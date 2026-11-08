import type { ChatApi } from '../chat-api';

import type { DemoPlayTarget, DemoSocketEvent } from './chat-demo';
import type { demoRuntime } from './demo-runtime';

function load(): Promise<DemoRuntime> {
  return import.meta.env.DEV
    ? import('./demo-runtime').then((module) => {
        loaded = module.demoRuntime;
        return module.demoRuntime;
      })
    : Promise.reject(new Error('The chat demo runs in development only'));
}

function isDemoId(id: string | null | undefined): boolean {
  return (
    import.meta.env.DEV &&
    typeof id === 'string' &&
    id.startsWith(DEMO_ID_PREFIX)
  );
}

function subscribe(attach: (runtime: DemoRuntime) => () => void): () => void {
  if (!import.meta.env.DEV) return noop;
  if (loaded) return attach(loaded);
  let live = true;
  let detach: () => void = noop;
  load()
    .then((runtime) => {
      if (live) detach = attach(runtime);
    })
    .catch(() => undefined);
  return () => {
    live = false;
    detach();
  };
}

function onEvent(handler: (event: DemoSocketEvent) => void): () => void {
  return subscribe((runtime) => runtime.chatDemo.onEvent(handler));
}

function onPlay(handler: (target: DemoPlayTarget) => void): () => void {
  return subscribe((runtime) => runtime.subscribePlay(handler));
}

async function attachmentsFor(content: string): Promise<File[] | undefined> {
  const runtime = await load();
  return runtime.demoScenarios.attachmentsFor(content);
}

async function saveSecret(args: SaveSecretArgs) {
  const runtime = await load();
  return runtime.demoCapabilities.saveSecret(args);
}

function wrapApi(real: ChatApi): ChatApi {
  let wrapped: Promise<ChatApi> | null = null;
  const demo = () => {
    wrapped ??= load().then((runtime) => runtime.demoBackend.wrap(real));
    return wrapped;
  };
  return {
    ...real,
    createConversation: async (request) =>
      (await demo()).createConversation(request),
    listConversations: async (args) => (await demo()).listConversations(args),
    getConversation: async (id) => (await demo()).getConversation(id),
    getMessages: async (id) => (await demo()).getMessages(id),
    updateConversation: async (id, request) =>
      (await demo()).updateConversation(id, request),
    deleteConversation: async (id) => (await demo()).deleteConversation(id),
    deleteConversationOnExit: (id) => {
      if (!isDemoId(id)) real.deleteConversationOnExit(id);
    },
    sendMessage: async (request) => (await demo()).sendMessage(request),
    approveToolCall: async (request) => (await demo()).approveToolCall(request),
    cancelConversation: async (id) => (await demo()).cancelConversation(id),
    submitMessageFeedback: async (request) =>
      (await demo()).submitMessageFeedback(request),
    getPickerConnections: async (request) =>
      (await demo()).getPickerConnections(request),
    getPendingGate: async (id) => (await demo()).getPendingGate(id),
  };
}

function noop(): void {
  return undefined;
}

const DEMO_ID_PREFIX = 'demo-';
let loaded: DemoRuntime | null = null;

export const chatDemoGate = {
  DEMO_ID_PREFIX,
  isDemoId,
  onEvent,
  onPlay,
  attachmentsFor,
  saveSecret,
  wrapApi,
};

type DemoRuntime = typeof demoRuntime;
type SaveSecretArgs = Parameters<
  DemoRuntime['demoCapabilities']['saveSecret']
>[0];
