function plainText(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}

function findSentMessage({ messages, text, senderId, sentAfter }: FindSentMessageParams): Record<string, unknown> | null {
  const wanted = plainText(text);
  const candidates = messages.filter((message) => {
    if (senderId !== undefined && message['userID'] !== senderId) {
      return false;
    }
    if (typeof message['content'] !== 'string' || plainText(message['content']) !== wanted) {
      return false;
    }
    const createdAt = typeof message['createdAt'] === 'string' ? Date.parse(message['createdAt']) : Number.NaN;
    return Number.isNaN(createdAt) || createdAt >= sentAfter - CLOCK_SKEW_MS;
  });
  return candidates.reduce<Record<string, unknown> | null>((latest, message) => {
    if (latest === null) {
      return message;
    }
    return String(message['createdAt'] ?? '') > String(latest['createdAt'] ?? '') ? message : latest;
  }, null);
}

const CLOCK_SKEW_MS = 120_000;

export const heartbeatMessages = {
  plainText,
  findSentMessage,
};

type FindSentMessageParams = {
  messages: Record<string, unknown>[];
  text: string;
  senderId: string | undefined;
  sentAfter: number;
};
