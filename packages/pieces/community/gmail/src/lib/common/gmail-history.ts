import { gmail_v1 } from '@googleapis/gmail';

const STARRED_LABEL_ID = 'STARRED';

async function listAllPages({
  gmail,
  startHistoryId,
  labelId,
  historyTypes,
}: {
  gmail: GmailHistoryClient;
  startHistoryId: string;
  labelId?: string;
  historyTypes: GmailHistoryType[];
}): Promise<ListedGmailHistory> {
  const records: gmail_v1.Schema$History[] = [];
  let pageToken: string | undefined;
  let historyId: string | null | undefined;

  do {
    const response = await gmail.users.history.list({
      userId: 'me',
      startHistoryId,
      maxResults: 500,
      historyTypes,
      pageToken,
      ...(labelId ? { labelId } : {}),
    });
    if (response.data.history) {
      records.push(...response.data.history);
    }
    historyId = response.data.historyId;
    pageToken = response.data.nextPageToken ?? undefined;
  } while (pageToken);

  return {
    records,
    historyId,
  };
}

function collectStarredMessageIds({
  records,
}: {
  records: gmail_v1.Schema$History[];
}): Map<string, string> {
  const starredMessages = new Map<string, string>();

  for (const history of records) {
    const historyId = history.id?.toString() ?? '';
    for (const labelAdded of history.labelsAdded ?? []) {
      if (
        labelAdded.labelIds?.includes(STARRED_LABEL_ID) &&
        labelAdded.message?.id
      ) {
        starredMessages.set(labelAdded.message.id, historyId);
      }
    }
    for (const messageAdded of history.messagesAdded ?? []) {
      if (
        messageAdded.message?.id &&
        messageAdded.message.labelIds?.includes(STARRED_LABEL_ID)
      ) {
        starredMessages.set(messageAdded.message.id, historyId);
      }
    }
  }

  return starredMessages;
}

function collectAddedThreadIds({
  records,
}: {
  records: gmail_v1.Schema$History[];
}): string[] {
  const threadIds = new Set<string>();
  for (const history of records) {
    for (const added of history.messagesAdded ?? []) {
      const threadId = added.message?.threadId;
      if (threadId) {
        threadIds.add(threadId);
      }
    }
  }
  return [...threadIds];
}

function isFirstMessageWithinCutoff({
  firstMessageInternalDate,
  cutoffTime,
}: {
  firstMessageInternalDate: number;
  cutoffTime: number;
}): boolean {
  return firstMessageInternalDate >= cutoffTime;
}

export const gmailHistory = {
  STARRED_LABEL_ID,
  listAllPages,
  collectStarredMessageIds,
  collectAddedThreadIds,
  isFirstMessageWithinCutoff,
};

type GmailHistoryType =
  | 'messageAdded'
  | 'messageDeleted'
  | 'labelAdded'
  | 'labelRemoved';

type ListedGmailHistory = {
  records: gmail_v1.Schema$History[];
  historyId?: string | null;
};

type GmailHistoryClient = {
  users: {
    history: {
      list: (params: {
        userId: string;
        startHistoryId: string;
        maxResults?: number;
        historyTypes?: string[];
        pageToken?: string;
        labelId?: string;
      }) => Promise<{
        data: {
          history?: gmail_v1.Schema$History[];
          historyId?: string | null;
          nextPageToken?: string | null;
        };
      }>;
    };
  };
};
