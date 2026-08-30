import { pollJob } from './poll-job';

export type ConductorSendMessageResult = {
  id: string;
  _data?: {
    Info?: {
      Chat?: string;
      Sender?: string;
      IsFromMe?: boolean;
      IsGroup?: boolean;
      ID?: string;
      Timestamp?: string;
    };
  };
};

export type ResolveSendResultParams = {
  apiKey: string;
  body: unknown;
};

export async function resolveSendResult({ apiKey, body }: ResolveSendResultParams) {
  const jobId = (body as { jobId?: string }).jobId;
  if (jobId) {
    return flattenSendMessageResult(
      (await pollJob(apiKey, jobId)) as ConductorSendMessageResult
    );
  }
  return flattenSendMessageResult(body as ConductorSendMessageResult);
}

export function flattenSendMessageResult(result: ConductorSendMessageResult) {
  const info = result._data?.Info;
  return {
    message_id: info?.ID ?? result.id ?? null,
    chat_id: info?.Chat ?? null,
    sender_id: info?.Sender ?? null,
    is_group: info?.IsGroup ?? null,
    is_from_me: info?.IsFromMe ?? null,
    sent_at: info?.Timestamp ?? null,
  };
}
