import { JsonObject, KleapAuthValue, KLEAP_SOURCE, publishAndWait, waitForTask } from './client';

export interface TaskRunOptions {
  wait_for_completion?: boolean | null;
  timeout_minutes?: number | null;
  publish_when_done?: boolean | null;
}

export function taskBody(
  body: JsonObject,
  options: { idempotency_key?: string | null; webhook_url?: string | null; webhook_secret?: string | null },
  context: { flowId?: string; runId?: string },
): JsonObject {
  if (options.idempotency_key) body['idempotency_key'] = options.idempotency_key;
  if (options.webhook_url) body['webhook_url'] = options.webhook_url;
  if (options.webhook_secret) body['webhook_secret'] = options.webhook_secret;
  body['metadata'] = { source: KLEAP_SOURCE, flow_id: context.flowId ?? null, run_id: context.runId ?? null };
  return body;
}

/** Shared tail of Create App / Edit App With AI: optionally wait for the task, then optionally publish. */
export async function runTask(
  auth: KleapAuthValue,
  appId: string | undefined,
  started: JsonObject,
  options: TaskRunOptions,
): Promise<JsonObject> {
  if (options.wait_for_completion === false) return started;

  const task = await waitForTask(auth, started['task_id'] as string, options.timeout_minutes ?? 9);
  const output: JsonObject = { ...started, ...task };
  const result = (task['result'] as JsonObject | undefined) ?? {};
  output['production_url'] = result['production_url'] ?? null;
  output['preview_url'] = result['preview_url'] ?? started['preview_url'] ?? null;

  if (options.publish_when_done && task['status'] === 'completed') {
    const targetAppId = appId ?? String(task['app_id'] ?? started['app_id']);
    const publish = await publishAndWait(auth, targetAppId, true, 10);
    output['publish'] = publish;
    if (publish['production_url']) output['production_url'] = publish['production_url'];
  }
  return output;
}

export function runIds(context: { flows?: { current?: { id?: string } }; run?: { id?: string } }) {
  return { flowId: context.flows?.current?.id, runId: context.run?.id };
}
