import {
  DEFAULT_JMAP_USING,
  readOpsFile,
  runJmapRequest,
  type AgentSession,
  type JmapAttachmentInput,
} from '@atomicmail/agentic-core';

export async function executePreset(
  session: AgentSession,
  opsFile: string,
  vars?: Record<string, string>,
  options: {
    dryRun?: boolean;
    attachments?: JmapAttachmentInput[];
    attachmentPathBase?: string;
  } = {},
): Promise<{ ok: boolean; status: number; body: unknown }> {
  const opsJson = await readOpsFile(session.credentialDir, opsFile);
  const { ok, status, bodyText } = await runJmapRequest({
    session,
    opsJson,
    defaultUsing: [...DEFAULT_JMAP_USING],
    sourceLabel: `ops_file '${opsFile}'`,
    vars,
    dryRun: options.dryRun,
    attachments: options.attachments,
    attachmentPathBase: options.attachmentPathBase,
  });

  let body: unknown = bodyText;
  try {
    body = JSON.parse(bodyText);
  } catch {
    // keep raw text
  }

  if (!ok) {
    throw new Error(`JMAP request failed (HTTP ${status}): ${bodyText}`);
  }

  return { ok, status, body };
}

export async function executeOpsJson(
  session: AgentSession,
  opsJson: string,
  vars?: Record<string, string>,
  dryRun?: boolean,
): Promise<{ ok: boolean; status: number; body: unknown }> {
  const { ok, status, bodyText } = await runJmapRequest({
    session,
    opsJson,
    defaultUsing: [...DEFAULT_JMAP_USING],
    sourceLabel: 'ops',
    vars,
    dryRun,
  });

  let body: unknown = bodyText;
  try {
    body = JSON.parse(bodyText);
  } catch {
    // keep raw text
  }

  if (!ok) {
    throw new Error(`JMAP request failed (HTTP ${status}): ${bodyText}`);
  }

  return { ok, status, body };
}

export function parseVarsJson(raw: unknown): Record<string, string> | undefined {
  if (raw === undefined || raw === null || raw === '') {
    return undefined;
  }
  let value: unknown = raw;
  if (typeof raw === 'string') {
    value = JSON.parse(raw);
  }
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error('vars must be a JSON object of string values.');
  }
  const out: Record<string, string> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry !== 'string') {
      throw new Error('vars must be a JSON object of string values.');
    }
    out[key] = entry;
  }
  return out;
}
