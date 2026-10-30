function buildMessageBody({
  content,
  contentType,
  subject,
  mentions,
}: {
  content: string;
  contentType: string;
  subject?: string;
  mentions: unknown[];
}) {
  const type = CONTENT_TYPES.find((value) => value === contentType);
  if (!type) {
    throw new Error(`Content Type must be one of: ${CONTENT_TYPES.join(', ')}.`);
  }
  const parsed = mentions.map((item, index) => toMention({ item, index }));
  if (parsed.length > 0 && type !== 'html') {
    throw new Error('Mentions need Content Type html, with mention N written as <at id="N">displayName</at> in Content.');
  }
  const missing = parsed.map((_, index) => index).filter((index) => !content.includes(`<at id="${index}">`));
  if (missing.length > 0) {
    throw new Error(
      `Content is missing the mention tag for Mentions index ${missing.join(', ')}; write <at id="N">displayName</at> for each mention N.`,
    );
  }
  return {
    body: { content, contentType: type },
    ...(subject ? { subject } : {}),
    ...(parsed.length > 0
      ? {
          mentions: parsed.map((mention, index) => ({
            id: index,
            mentionText: mention.displayName,
            mentioned: {
              user: { id: mention.userId, displayName: mention.displayName, userIdentityType: 'aadUser' },
            },
          })),
        }
      : {}),
  };
}

function toMention({ item, index }: { item: unknown; index: number }): { userId: string; displayName: string } {
  if (
    typeof item !== 'object' ||
    item === null ||
    !('userId' in item) ||
    !('displayName' in item) ||
    typeof item.userId !== 'string' ||
    typeof item.displayName !== 'string' ||
    !item.userId ||
    !item.displayName
  ) {
    throw new Error(`Mentions item ${index} needs both a User ID and a Display Name.`);
  }
  return { userId: item.userId, displayName: item.displayName };
}

export const microsoftTeamsUtils = { buildMessageBody };

const CONTENT_TYPES = ['text', 'html'] as const;
