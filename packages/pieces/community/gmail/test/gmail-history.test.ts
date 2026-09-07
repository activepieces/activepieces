import { gmailHistory } from '../src/lib/common/gmail-history';

describe('gmailHistory', () => {
  it('walks every history page before returning the checkpoint', async () => {
    const list = vi
      .fn()
      .mockResolvedValueOnce({
        data: {
          history: [{ id: '11', labelsAdded: [] }],
          nextPageToken: 'page-2',
          historyId: '11',
        },
      })
      .mockResolvedValueOnce({
        data: {
          history: [{ id: '12', labelsAdded: [] }],
          historyId: '12',
        },
      });

    const listed = await gmailHistory.listAllPages({
      gmail: {
        users: {
          history: { list },
        },
      },
      startHistoryId: '10',
      labelId: 'STARRED',
      historyTypes: ['labelAdded', 'messageAdded'],
    });

    expect(list).toHaveBeenCalledTimes(2);
    expect(listed.records).toHaveLength(2);
    expect(listed.historyId).toBe('12');
    expect(list.mock.calls[1][0].pageToken).toBe('page-2');
  });

  it('collects stars from labelsAdded and messagesAdded on the same record', () => {
    const starred = gmailHistory.collectStarredMessageIds({
      records: [
        {
          id: '20',
          labelsAdded: [
            {
              labelIds: ['STARRED'],
              message: { id: 'msg-starred' },
            },
          ],
          messagesAdded: [
            {
              message: {
                id: 'msg-arrived-starred',
                labelIds: ['INBOX', 'STARRED'],
              },
            },
            {
              message: {
                id: 'msg-inbox-only',
                labelIds: ['INBOX'],
              },
            },
          ],
        },
      ],
    });

    expect([...starred.keys()]).toEqual([
      'msg-starred',
      'msg-arrived-starred',
    ]);
  });

  it('treats a thread as new from the first message time, not the message count', () => {
    const now = Date.now();
    expect(
      gmailHistory.isFirstMessageWithinCutoff({
        firstMessageInternalDate: now,
        cutoffTime: now - 60_000,
      })
    ).toBe(true);
    expect(
      gmailHistory.isFirstMessageWithinCutoff({
        firstMessageInternalDate: now - 3_600_000,
        cutoffTime: now - 60_000,
      })
    ).toBe(false);
  });

  it('dedupes thread ids from messageAdded history', () => {
    expect(
      gmailHistory.collectAddedThreadIds({
        records: [
          {
            messagesAdded: [
              { message: { threadId: 't1' } },
              { message: { threadId: 't1' } },
              { message: { threadId: 't2' } },
            ],
          },
        ],
      })
    ).toEqual(['t1', 't2']);
  });
});
