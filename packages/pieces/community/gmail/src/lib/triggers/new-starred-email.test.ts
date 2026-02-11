import { gmailNewStarredEmailTrigger } from './new-starred-email';
import { google } from 'googleapis';

jest.mock('googleapis');

describe('New Starred Email Trigger', () => {
  it('should find new starred emails', async () => {
    const mockGmail = {
      users: {
        history: {
          list: jest.fn().mockResolvedValue({
            data: {
              history: [
                {
                  id: 'history-id',
                  labelsAdded: [
                    {
                      message: { id: 'msg-id' },
                      labelIds: ['STARRED'],
                    },
                  ],
                },
              ],
              historyId: 'new-history-id',
            },
          }),
        },
        messages: {
          get: jest.fn().mockResolvedValue({
            data: {
              id: 'msg-id',
              threadId: 'thread-id',
              raw: Buffer.from('From: test@test.com\nTo: me@me.com\nSubject: Test\n\nBody').toString('base64'),
            },
          }),
        },
        threads: {
          get: jest.fn().mockResolvedValue({
            data: {
              id: 'thread-id',
            },
          }),
        },
      },
    };
    (google.gmail as jest.Mock).mockReturnValue(mockGmail);

    const context = {
      auth: { access_token: 'test-token' },
      propsValue: {},
      store: {
        get: jest.fn().mockResolvedValue('old-history-id'),
        put: jest.fn(),
      },
      files: {},
    } as any;

    const result = await gmailNewStarredEmailTrigger.run(context);

    expect(result.length).toBe(1);
    expect(result[0].id).toBe('history-id');
    expect(result[0].data.message.subject).toBe('Test');
    expect(mockGmail.users.history.list).toHaveBeenCalledWith({
      userId: 'me',
      startHistoryId: 'old-history-id',
      labelId: 'STARRED',
      historyTypes: ['labelAdded', 'messageAdded'],
    });
  });
});
