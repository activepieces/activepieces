import {
  BedrockClient,
  ListFoundationModelsCommand,
  ListInferenceProfilesCommand,
  ModelModality,
} from '@aws-sdk/client-bedrock';
import {
  AudioFormat,
  BedrockRuntimeClient,
  ContentBlock,
  ConverseResponse,
  DocumentFormat,
  ImageFormat,
  VideoFormat,
} from '@aws-sdk/client-bedrock-runtime';
import { AssumeRoleWithWebIdentityCommand, STSClient } from '@aws-sdk/client-sts';
import { ApFile, ServerContext } from '@activepieces/pieces-framework';
import { BedrockAuthProps, BedrockOidcAuthProps } from './auth';

const AWS_STS_AUDIENCE = 'sts.amazonaws.com';

export async function createBedrockRuntimeClient({
  auth,
  server,
}: {
  auth: BedrockAuthProps;
  server: ServerContext;
}): Promise<BedrockRuntimeClient> {
  if (isOidcAuth(auth)) {
    const credentials = await getTemporaryCredentials({ auth, server });
    return new BedrockRuntimeClient({ credentials, region: auth.region });
  }
  return new BedrockRuntimeClient({
    credentials: { accessKeyId: auth.accessKeyId, secretAccessKey: auth.secretAccessKey },
    region: auth.region,
  });
}

export async function getBedrockModelOptions(
  auth: BedrockAuthProps | undefined,
  filters?: {
    inputModality?: ModelModality;
    outputModality?: ModelModality;
    showAll?: boolean;
    useInferenceProfiles?: boolean;
  },
  server?: ServerContext,
) {
  if (!auth) {
    return {
      disabled: true,
      placeholder: 'Connect your AWS account first',
      options: [],
    };
  }

  try {
    let client: BedrockClient;
    if (isOidcAuth(auth)) {
      if (!server) {
        return { disabled: true, options: [], placeholder: 'Unable to load models for IAM Role auth in this context.' };
      }
      const credentials = await getTemporaryCredentials({ auth, server });
      client = new BedrockClient({ credentials, region: auth.region });
    } else {
      client = new BedrockClient({
        credentials: { accessKeyId: auth.accessKeyId, secretAccessKey: auth.secretAccessKey },
        region: auth.region,
      });
    }

    if (filters?.useInferenceProfiles) {
      const [profileResponse, modelsResponse] = await Promise.all([
        client.send(
          new ListInferenceProfilesCommand({
            typeEquals: 'SYSTEM_DEFINED',
          })
        ),
        filters?.inputModality
          ? client.send(new ListFoundationModelsCommand({}))
          : Promise.resolve(undefined),
      ]);

      const profiles = profileResponse.inferenceProfileSummaries ?? [];

      let allowedModelIds: Set<string> | undefined;
      if (filters?.inputModality && modelsResponse) {
        const allModels = modelsResponse.modelSummaries ?? [];
        allowedModelIds = new Set(
          allModels
            .filter((m) =>
              m.inputModalities?.includes(filters.inputModality!)
            )
            .map((m) => m.modelId!)
            .filter(Boolean)
        );
      }

      const seen = new Set<string>();
      const deduped = profiles.filter((p) => {
        if (!p.inferenceProfileId || p.status !== 'ACTIVE') return false;
        if (seen.has(p.inferenceProfileId)) return false;
        if (allowedModelIds) {
          const profileModelId = p.models?.[0]?.modelArn?.split('/').pop();
          if (!profileModelId || !allowedModelIds.has(profileModelId)) {
            return false;
          }
        }
        seen.add(p.inferenceProfileId);
        return true;
      });

      return {
        disabled: false,
        options: deduped.map((p) => ({
          label: p.inferenceProfileName ?? p.inferenceProfileId!,
          value: p.inferenceProfileId!,
        })),
      };
    }

    const response = await client.send(
      new ListFoundationModelsCommand({
        byOutputModality: filters?.showAll
          ? undefined
          : (filters?.outputModality ?? ModelModality.TEXT),
      })
    );
    const models = response.modelSummaries ?? [];

    const filtered = filters?.inputModality
      ? models.filter((m) =>
          m.inputModalities?.includes(filters.inputModality!)
        )
      : models;

    const seen = new Set<string>();
    const deduped = filtered.filter((m) => {
      if (!m.modelId) return false;
      const baseId = m.modelId.replace(/:\d+:.*$/, '');
      if (seen.has(baseId)) return false;
      seen.add(baseId);
      return true;
    });

    return {
      disabled: false,
      options: deduped.map((m) => ({
        label: `${m.providerName} - ${m.modelName}`,
        value: m.modelId!,
      })),
    };
  } catch (error) {
    return {
      disabled: true,
      options: [],
      placeholder: 'Failed to load models. Check your credentials.',
    };
  }
}

export async function getTemporaryCredentials({
  auth,
  server,
  durationSeconds = DEFAULT_STS_DURATION_SECONDS,
}: {
  auth: BedrockOidcAuthProps;
  server: ServerContext;
  durationSeconds?: number;
}): Promise<{ accessKeyId: string; secretAccessKey: string; sessionToken: string | undefined }> {
  if (!auth.roleArn) {
    throw new Error('Role ARN is required for IAM Role authentication');
  }
  const clampedDuration = Math.min(Math.max(durationSeconds, MIN_STS_DURATION_SECONDS), MAX_STS_DURATION_SECONDS);

  // Scoped by server.token (unique per flow execution) so credentials are never reused
  // across projects/tenants, only across steps within the same run.
  const cacheKey = `${server.token}:${auth.roleArn}:${auth.region}:${clampedDuration}`;
  const cached = credentialsCache.get(cacheKey);
  if (cached && cached.expiresAtMS - Date.now() > CREDENTIALS_EXPIRY_MARGIN_MS) {
    return cached.credentials;
  }

  const response = await fetch(`${server.apiUrl}v1/worker/oidc-token`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${server.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ audience: AWS_STS_AUDIENCE }),
  });
  if (!response.ok) {
    throw new Error(`Failed to get OIDC token: ${response.statusText}`);
  }
  const { token } = (await response.json()) as { token: string };

  const sts = new STSClient({ region: auth.region });
  const { Credentials } = await sts.send(
    new AssumeRoleWithWebIdentityCommand({
      RoleArn: auth.roleArn,
      RoleSessionName: 'activepieces-execution',
      WebIdentityToken: token,
      DurationSeconds: clampedDuration,
    }),
  );
  if (!Credentials?.AccessKeyId || !Credentials.SecretAccessKey) {
    throw new Error('Failed to assume role: no credentials returned');
  }
  const credentials = {
    accessKeyId: Credentials.AccessKeyId,
    secretAccessKey: Credentials.SecretAccessKey,
    sessionToken: Credentials.SessionToken,
  };
  const expiresAtMS = Credentials.Expiration?.getTime() ?? Date.now() + clampedDuration * 1000;
  sweepExpiredCredentials();
  credentialsCache.set(cacheKey, { credentials, expiresAtMS });
  return credentials;
}

function sweepExpiredCredentials() {
  const now = Date.now();
  for (const [key, value] of credentialsCache) {
    if (value.expiresAtMS <= now) {
      credentialsCache.delete(key);
    }
  }
}

const IMAGE_EXT_MAP: Record<string, ImageFormat> = {
  png: ImageFormat.PNG,
  jpg: ImageFormat.JPEG,
  jpeg: ImageFormat.JPEG,
  gif: ImageFormat.GIF,
  webp: ImageFormat.WEBP,
};

const DOCUMENT_EXT_MAP: Record<string, DocumentFormat> = {
  pdf: DocumentFormat.PDF,
  csv: DocumentFormat.CSV,
  doc: DocumentFormat.DOC,
  docx: DocumentFormat.DOCX,
  xls: DocumentFormat.XLS,
  xlsx: DocumentFormat.XLSX,
  html: DocumentFormat.HTML,
  htm: DocumentFormat.HTML,
  txt: DocumentFormat.TXT,
  md: DocumentFormat.MD,
};

const VIDEO_EXT_MAP: Record<string, VideoFormat> = {
  mkv: VideoFormat.MKV,
  mov: VideoFormat.MOV,
  mp4: VideoFormat.MP4,
  webm: VideoFormat.WEBM,
  flv: VideoFormat.FLV,
  mpeg: VideoFormat.MPEG,
  mpg: VideoFormat.MPG,
  wmv: VideoFormat.WMV,
  '3gp': VideoFormat.THREE_GP,
};

const AUDIO_EXT_MAP: Record<string, AudioFormat> = {
  mp3: AudioFormat.MP3,
  opus: AudioFormat.OPUS,
  wav: AudioFormat.WAV,
  aac: AudioFormat.AAC,
  flac: AudioFormat.FLAC,
  ogg: AudioFormat.OGG,
  mka: AudioFormat.MKA,
  m4a: AudioFormat.M4A,
  pcm: AudioFormat.PCM,
};

export function buildS3ContentBlock(s3Bucket: string, s3Key: string): ContentBlock {
  const ext = (s3Key.split('.').pop() ?? '').toLowerCase();
  const s3Location = { uri: `s3://${s3Bucket}/${s3Key}` };

  if (IMAGE_EXT_MAP[ext]) {
    return { image: { format: IMAGE_EXT_MAP[ext], source: { s3Location } } };
  }
  if (DOCUMENT_EXT_MAP[ext]) {
    const name = (s3Key.split('/').pop() ?? 'document').replace(/\.[^.]+$/, '');
    return { document: { format: DOCUMENT_EXT_MAP[ext], name, source: { s3Location } } };
  }
  if (VIDEO_EXT_MAP[ext]) {
    return { video: { format: VIDEO_EXT_MAP[ext], source: { s3Location } } };
  }
  if (AUDIO_EXT_MAP[ext]) {
    return { audio: { format: AUDIO_EXT_MAP[ext], source: { s3Location } } };
  }
  throw new Error(
    `Unsupported file type ".${ext}". Supported: images (png, jpg, gif, webp), documents (pdf, csv, doc, docx, xls, xlsx, html, txt, md), videos (mp4, mov, mkv, webm, flv, mpeg, mpg, wmv, 3gp), audio (mp3, wav, aac, flac, ogg, opus, mka, m4a, pcm).`
  );
}

export function buildFileContentBlock(file: ApFile): ContentBlock {
  const ext = (file.extension ?? '').toLowerCase();
  const bytes = new Uint8Array(file.data);

  if (IMAGE_EXT_MAP[ext]) {
    return { image: { format: IMAGE_EXT_MAP[ext], source: { bytes } } };
  }
  if (DOCUMENT_EXT_MAP[ext]) {
    const name = file.filename?.replace(/\.[^.]+$/, '') || 'document';
    return { document: { format: DOCUMENT_EXT_MAP[ext], name, source: { bytes } } };
  }
  if (VIDEO_EXT_MAP[ext]) {
    return { video: { format: VIDEO_EXT_MAP[ext], source: { bytes } } };
  }
  if (AUDIO_EXT_MAP[ext]) {
    return { audio: { format: AUDIO_EXT_MAP[ext], source: { bytes } } };
  }
  throw new Error(
    `Unsupported file type ".${ext}". Supported: images (png, jpg, gif, webp), documents (pdf, csv, doc, docx, xls, xlsx, html, txt, md), videos (mp4, mov, mkv, webm, flv, mpeg, mpg, wmv, 3gp), audio (mp3, wav, aac, flac, ogg, opus, mka, m4a, pcm).`
  );
}

export function extractConverseTextResponse(response: ConverseResponse) {
  const outputMessage = response.output?.message;
  const textContent = outputMessage?.content
    ?.filter((block) => 'text' in block)
    .map((block) => block.text)
    .join('');

  return {
    text: textContent ?? '',
    stopReason: response.stopReason,
    usage: response.usage,
    latencyMs: response.metrics?.latencyMs,
  };
}

export function formatBedrockError(error: unknown): string {
  const err = error as { name?: string; message?: string };
  const name = err.name ?? 'UnknownError';

  switch (name) {
    case 'ThrottlingException':
      return 'Request was throttled by AWS Bedrock. Please try again in a moment.';
    case 'ModelNotReadyException':
      return 'The model is not ready. It may still be loading — please try again shortly.';
    case 'ModelTimeoutException':
      return 'The model timed out while processing your request. Try a shorter prompt or a different model.';
    case 'ModelErrorException':
      return 'The model encountered an internal error. Try again or use a different model.';
    case 'AccessDeniedException':
      return 'Access denied. Ensure your AWS credentials have permission to invoke this model and that the model is enabled in your region.';
    case 'ValidationException':
      return `Validation error: ${err.message ?? 'Check your input parameters.'}`;
    case 'ServiceUnavailableException':
      return 'AWS Bedrock is temporarily unavailable. Please try again later.';
    case 'ServiceQuotaExceededException':
      return 'You have exceeded your AWS Bedrock service quota.';
    default:
      return err.message ?? 'An unexpected error occurred.';
  }
}

const DEFAULT_STS_DURATION_SECONDS = 3600;
const CREDENTIALS_EXPIRY_MARGIN_MS = 5 * 60 * 1000;
const credentialsCache = new Map<string, CachedCredentials>();

export const MIN_STS_DURATION_SECONDS = 900;
export const MAX_STS_DURATION_SECONDS = 43200;

export function isOidcAuth(auth: BedrockAuthProps): auth is BedrockOidcAuthProps {
  return 'roleArn' in auth;
}

type TemporaryCredentials = {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken: string | undefined;
};

type CachedCredentials = {
  credentials: TemporaryCredentials;
  expiresAtMS: number;
};

