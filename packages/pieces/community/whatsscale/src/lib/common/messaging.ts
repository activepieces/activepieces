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
