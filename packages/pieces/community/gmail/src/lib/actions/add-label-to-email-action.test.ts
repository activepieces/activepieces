import { gmailAddLabelToEmailAction } from './add-label-to-email-action';
import { google } from 'googleapis';

jest.mock('googleapis');

describe('Add Label to Email Action', () => {
  it('should add a label to an email', async () => {
    const mockGmail = {
      users: {
        messages: {
          modify: jest.fn().mockResolvedValue({
            data: {
              id: 'msg-id',
              labelIds: ['LABEL_ID'],
            },
          }),
        },
      },
    };
    (google.gmail as jest.Mock).mockReturnValue(mockGmail);

    const context = {
      auth: { access_token: 'test-token' },
      propsValue: {
        message_id: 'msg-id',
        label: { id: 'LABEL_ID' },
      },
      files: {},
    } as any;

    const result = await gmailAddLabelToEmailAction.run(context);

    expect(result).toEqual({
      id: 'msg-id',
      labelIds: ['LABEL_ID'],
    });
    expect(mockGmail.users.messages.modify).toHaveBeenCalledWith({
      userId: 'me',
      id: 'msg-id',
      requestBody: {
        addLabelIds: ['LABEL_ID'],
      },
    });
  });
});
