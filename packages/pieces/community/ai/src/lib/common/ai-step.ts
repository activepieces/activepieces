import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';
import { ActionContext, ApFile, ExecutionType, InputPropertyMap, isNil, spreadIfDefined } from '@activepieces/pieces-framework';

export async function runOnWorker(params: {
  context: AiStepContext;
  request: AiStepRequest;
}): Promise<AiStepResult> {
  const { context, request } = params;

  if (context.executionType === ExecutionType.RESUME) {
    return readAnswer(context.resumePayload?.body);
  }

  if (!context.run.canPause) {
    const { body } = await sendToServer({ context, request });
    return readAnswer(body);
  }

  const waitpoint = await context.run.createWaitpoint({
    type: 'WEBHOOK',
    resumeDateTime: new Date(Date.now() + AI_STEP_TIMEOUT_MS).toUTCString(),
  });

  await sendToServer({ context, request, waitpointId: waitpoint.id });

  context.run.waitForWaitpoint(waitpoint.id);
  return { status: 'paused' };
}

export async function uploadAiFiles(params: {
  context: AiStepContext;
  files: (ApFile | undefined)[];
  mimeTypeOf: (file: ApFile) => string | undefined;
}): Promise<AiStepFile[]> {
  const present = params.files.filter((file): file is ApFile => !isNil(file));
  return Promise.all(
    present.map(async (file) => {
      const uploaded = await params.context.files.upload({
        fileName: file.filename,
        data: file.data,
      });
      return {
        fileId: uploaded.id,
        ...spreadIfDefined('mimeType', params.mimeTypeOf(file)),
        ...spreadIfDefined('filename', file.filename),
      };
    }),
  );
}

async function sendToServer(params: {
  context: AiStepContext;
  request: AiStepRequest;
  waitpointId?: string;
}): Promise<{ body: unknown }> {
  return httpClient.sendRequest({
    method: HttpMethod.POST,
    url: `${params.context.server.apiUrl}v1/ai/execute`,
    authentication: { type: AuthenticationType.BEARER_TOKEN, token: params.context.server.token },
    body: {
      ...params.request,
      flowId: params.context.flows.current.id,
      flowRunId: params.context.run.id,
      ...spreadIfDefined('waitpointId', params.waitpointId),
    },
  });
}

function readAnswer(body: unknown): AiStepResult {
  if (isNil(body) || typeof body !== 'object') {
    throw new Error(NOTHING_REPORTED);
  }
  const payload = body as Record<string, unknown>;
  if (typeof payload['failure'] === 'string') {
    throw new Error(payload['failure']);
  }
  const output = payload['output'];
  if (isNil(output) || typeof output !== 'object') {
    throw new Error(NOTHING_REPORTED);
  }
  return { status: 'done', output: output as AiStepOutput };
}

const AI_STEP_TIMEOUT_MS = 60 * 60 * 1000;
const NOTHING_REPORTED = 'The AI step did not report a result before it timed out';

export type AiStepContext = Pick<
  ActionContext<undefined, InputPropertyMap>,
  'server' | 'flows' | 'files' | 'run' | 'executionType'
> & { resumePayload?: { body?: unknown } };

export type AiStepAction =
  | 'ASK_AI'
  | 'SUMMARIZE_TEXT'
  | 'CLASSIFY_TEXT'
  | 'EXTRACT_STRUCTURED_DATA'
  | 'GENERATE_IMAGE';

export type AiStepFile = {
  fileId: string;
  mimeType?: string;
  filename?: string;
};

export type AiStepRequest = {
  action: AiStepAction;
  provider: string;
  providerConfigId?: string;
  modelId: string;
  prompt?: string;
  text?: string;
  categories?: string[];
  files?: AiStepFile[];
  schema?: { mode: 'simple' | 'advanced'; fields: unknown };
  advancedOptions?: Record<string, unknown>;
  conversation?: Record<string, unknown>[];
  maxOutputTokens?: number;
  temperature?: number;
  webSearch?: { enabled: boolean; options?: Record<string, unknown> };
};

export type AiStepOutput = {
  answer: unknown;
  conversation?: Record<string, unknown>[];
};

export type AiStepResult =
  | { status: 'paused' }
  | { status: 'done'; output: AiStepOutput };
