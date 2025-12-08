import { StoreScope } from "@activepieces/pieces-framework";

export interface MemoryMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface MemoryState {
  messages: MemoryMessage[];
}

const PREFIX = "langchain_ai_free_memory";

function key(k: string) {
  return `${PREFIX}:${k}`;
}

export async function loadMemory(context: any, memoryKey: string) {
  return (
    (await context.store.get(key(memoryKey), StoreScope.FLOW)) ??
    null
  );
}

export async function saveMemory(
  context: any,
  memoryKey: string,
  state: MemoryState
) {
  await context.store.put(
    key(memoryKey),
    state,
    StoreScope.FLOW
  );
}
