import { ChatUIMessage, chatPartUtils } from '../chat-types';

import { ResourceOp, ResourceRef, resourceRegistry } from './registry';

function fromParts(parts: readonly ChatUIMessage['parts'][number][]): Change[] {
  const changes = new Map<string, Change>();
  for (const part of parts) {
    if (!chatPartUtils.isAnyToolPart(part)) continue;
    if (part.state !== 'output-available') continue;
    const resolved = resourceRegistry.resolve(part.output);
    if (!resolved) continue;
    const key = resourceRegistry.keyOf(resolved.ref);
    const kind = combine({ previous: changes.get(key)?.kind, op: resolved.op });
    if (kind) {
      changes.set(key, { key, ref: resolved.ref, kind });
    } else {
      changes.delete(key);
    }
  }
  return [...changes.values()];
}

function fromMessages(messages: readonly ChatUIMessage[]): Change[] {
  return fromParts(
    messages
      .filter((message) => message.role === 'assistant')
      .flatMap((message) => message.parts),
  );
}

function combine({
  previous,
  op,
}: {
  previous: ChangeKind | undefined;
  op: ResourceOp;
}): ChangeKind | null {
  if (op === 'delete') return previous === 'created' ? null : 'deleted';
  if (op === 'create' || previous === 'created') return 'created';
  return 'updated';
}

export const changeSummary = { fromParts, fromMessages };

export type ChangeKind = 'created' | 'updated' | 'deleted';

export type Change = {
  key: string;
  ref: ResourceRef;
  kind: ChangeKind;
};
