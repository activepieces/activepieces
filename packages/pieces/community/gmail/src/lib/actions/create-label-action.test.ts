import { gmailCreateLabelAction } from './create-label-action';
import { google } from 'googleapis';

jest.mock('googleapis');

describe('Create Label Action', () => {
  it('should create a label', async () => {
    const mockGmail = {
      users: {
        labels: {
          create: jest.fn().mockResolvedValue({
            data: {
              id: 'label-id',
              name: 'My Label',
              labelListVisibility: 'labelShow',
              messageListVisibility: 'show',
            },
          }),
        },
      },
    };
    (google.gmail as jest.Mock).mockReturnValue(mockGmail);

    const context = {
      auth: { access_token: 'test-token' },
      propsValue: {
        name: 'My Label',
        labelListVisibility: 'labelShow',
        messageListVisibility: 'show',
      },
      files: {},
      tags: [],
      store: {},
      project: {},
      webhookUrl: 'test-url',
    } as any;

    const result = await gmailCreateLabelAction.run(context);

    expect(result).toEqual({
      id: 'label-id',
      name: 'My Label',
      labelListVisibility: 'labelShow',
      messageListVisibility: 'show',
    });
    expect(mockGmail.users.labels.create).toHaveBeenCalledWith({
      userId: 'me',
      requestBody: {
        name: 'My Label',
        labelListVisibility: 'labelShow',
        messageListVisibility: 'show',
      },
    });
  });
});
