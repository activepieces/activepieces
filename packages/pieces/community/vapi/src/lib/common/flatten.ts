import { vapiUtils } from './vapi-api';

const { isRecord } = vapiUtils;

function child({ value, key }: { value: unknown; key: string }): Record<string, unknown> {
  if (!isRecord(value)) {
    return {};
  }
  const nested = value[key];
  return isRecord(nested) ? nested : {};
}

function str(value: unknown): string | null {
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return null;
}

function num(value: unknown): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function field({ record, key }: { record: Record<string, unknown>; key: string }): unknown {
  return record[key];
}

function durationSeconds({ startedAt, endedAt }: { startedAt: string | null; endedAt: string | null }): number | null {
  if (!startedAt || !endedAt) {
    return null;
  }
  const start = Date.parse(startedAt);
  const end = Date.parse(endedAt);
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) {
    return null;
  }
  return Math.round((end - start) / 1000);
}

function flattenPlacedCall(call: Record<string, unknown>) {
  return {
    id: str(field({ record: call, key: 'id' })),
    status: str(field({ record: call, key: 'status' })),
    assistantId: str(field({ record: call, key: 'assistantId' })),
    phoneNumberId: str(field({ record: call, key: 'phoneNumberId' })),
    customerNumber: str(field({ record: child({ value: call, key: 'customer' }), key: 'number' })),
    createdAt: str(field({ record: call, key: 'createdAt' })),
  };
}

function flattenCallResult(call: Record<string, unknown>) {
  const artifact = child({ value: call, key: 'artifact' });
  const analysis = child({ value: call, key: 'analysis' });
  const startedAt = str(field({ record: call, key: 'startedAt' }));
  const endedAt = str(field({ record: call, key: 'endedAt' }));
  return {
    id: str(field({ record: call, key: 'id' })),
    status: str(field({ record: call, key: 'status' })),
    endedReason: str(field({ record: call, key: 'endedReason' })),
    startedAt,
    endedAt,
    durationSeconds: durationSeconds({ startedAt, endedAt }),
    cost: num(field({ record: call, key: 'cost' })),
    summary: str(field({ record: analysis, key: 'summary' })) ?? str(field({ record: call, key: 'summary' })),
    transcript: str(field({ record: artifact, key: 'transcript' })) ?? str(field({ record: call, key: 'transcript' })),
    recordingUrl: str(field({ record: artifact, key: 'recordingUrl' })) ?? str(field({ record: call, key: 'recordingUrl' })),
    successEvaluation: str(field({ record: analysis, key: 'successEvaluation' })),
  };
}

function flattenCallSummary(call: Record<string, unknown>) {
  return {
    id: str(field({ record: call, key: 'id' })),
    status: str(field({ record: call, key: 'status' })),
    endedReason: str(field({ record: call, key: 'endedReason' })),
    customerNumber: str(field({ record: child({ value: call, key: 'customer' }), key: 'number' })),
    createdAt: str(field({ record: call, key: 'createdAt' })),
    cost: num(field({ record: call, key: 'cost' })),
  };
}

function systemPromptOf(model: Record<string, unknown>): string | null {
  const messages = field({ record: model, key: 'messages' });
  if (!Array.isArray(messages)) {
    return null;
  }
  const system = messages.find((message) => isRecord(message) && message['role'] === 'system');
  return isRecord(system) ? str(system['content']) : null;
}

function flattenAssistantSettings(assistant: Record<string, unknown>) {
  const model = child({ value: assistant, key: 'model' });
  return {
    id: str(field({ record: assistant, key: 'id' })),
    name: str(field({ record: assistant, key: 'name' })),
    firstMessage: str(field({ record: assistant, key: 'firstMessage' })),
    endCallMessage: str(field({ record: assistant, key: 'endCallMessage' })),
    model: str(field({ record: model, key: 'model' })),
    provider: str(field({ record: model, key: 'provider' })),
    systemPrompt: systemPromptOf(model),
  };
}

function flattenAssistantSummary(assistant: Record<string, unknown>) {
  return {
    id: str(field({ record: assistant, key: 'id' })),
    name: str(field({ record: assistant, key: 'name' })),
    createdAt: str(field({ record: assistant, key: 'createdAt' })),
  };
}

function flattenPhoneNumberSummary(phoneNumber: Record<string, unknown>) {
  return {
    id: str(field({ record: phoneNumber, key: 'id' })),
    number: str(field({ record: phoneNumber, key: 'number' })) ?? str(field({ record: phoneNumber, key: 'sipUri' })),
    name: str(field({ record: phoneNumber, key: 'name' })),
    provider: str(field({ record: phoneNumber, key: 'provider' })),
    assistantId: str(field({ record: phoneNumber, key: 'assistantId' })),
    squadId: str(field({ record: phoneNumber, key: 'squadId' })),
  };
}

function flattenToolSummary(tool: Record<string, unknown>) {
  const fn = child({ value: tool, key: 'function' });
  return {
    id: str(field({ record: tool, key: 'id' })),
    type: str(field({ record: tool, key: 'type' })),
    name: str(field({ record: fn, key: 'name' })) ?? str(field({ record: tool, key: 'name' })),
    description: str(field({ record: fn, key: 'description' })) ?? str(field({ record: tool, key: 'description' })),
  };
}

function flattenSquadSummary(squad: Record<string, unknown>) {
  const members = field({ record: squad, key: 'members' });
  const memberAssistantIds = Array.isArray(members)
    ? members
        .map((member) => (isRecord(member) ? str(member['assistantId']) : null))
        .filter((id): id is string => id !== null)
    : [];
  return {
    id: str(field({ record: squad, key: 'id' })),
    name: str(field({ record: squad, key: 'name' })),
    memberAssistantIds,
  };
}

function flattenFileSummary(file: Record<string, unknown>) {
  return {
    id: str(field({ record: file, key: 'id' })),
    name: str(field({ record: file, key: 'name' })) ?? str(field({ record: file, key: 'originalName' })),
    status: str(field({ record: file, key: 'status' })),
    bytes: num(field({ record: file, key: 'bytes' })),
    createdAt: str(field({ record: file, key: 'createdAt' })),
  };
}

export const vapiFlatten = {
  placedCall: flattenPlacedCall,
  callResult: flattenCallResult,
  callSummary: flattenCallSummary,
  assistantSettings: flattenAssistantSettings,
  assistantSummary: flattenAssistantSummary,
  phoneNumberSummary: flattenPhoneNumberSummary,
  toolSummary: flattenToolSummary,
  squadSummary: flattenSquadSummary,
  fileSummary: flattenFileSummary,
};
