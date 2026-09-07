/// <reference types="vitest/globals" />

import { createMockActionContext } from '@activepieces/pieces-framework';

const modifyMock = vi.fn();
const trashMock = vi.fn();
const createLabelMock = vi.fn();
const modifyThreadMock = vi.fn();

vi.mock('@googleapis/gmail', () => ({
  gmail: () => ({
    users: {
      messages: {
        modify: modifyMock,
        trash: trashMock,
      },
      labels: {
        create: createLabelMock,
      },
      threads: {
        modify: modifyThreadMock,
      },
    },
  }),
}));

vi.mock('../src/lib/auth', () => ({
  gmailAuth: {},
  createGoogleClient: vi.fn().mockResolvedValue({}),
}));

import { gmailAddLabelToEmailAction } from '../src/lib/actions/add-label-to-email-action';
import { gmailRemoveLabelFromEmailAction } from '../src/lib/actions/remove-label-from-email-action';
import { gmailCreateLabelAction } from '../src/lib/actions/create-label-action';
import { gmailArchiveEmailAction } from '../src/lib/actions/archive-email-action';
import { gmailDeleteEmailAction } from '../src/lib/actions/delete-email-action';
import { gmailRemoveLabelFromThreadAction } from '../src/lib/actions/remove-label-from-thread-action';

describe('gmail write actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('adds a label from either a dropdown object or a raw id', async () => {
    modifyMock.mockResolvedValue({
      data: { id: 'm1', labelIds: ['Label_1'] },
    });

    const fromObject = await gmailAddLabelToEmailAction.run(
      createMockActionContext({
        propsValue: {
          message_id: 'm1',
          label: { id: 'Label_1', name: 'Work' },
        },
      })
    );
    expect(modifyMock).toHaveBeenCalledWith({
      userId: 'me',
      id: 'm1',
      requestBody: { addLabelIds: ['Label_1'] },
    });
    expect(fromObject).toEqual({ id: 'm1', labelIds: ['Label_1'] });

    await gmailAddLabelToEmailAction.run(
      createMockActionContext({
        propsValue: {
          message_id: 'm1',
          label: 'INBOX',
        },
      })
    );
    expect(modifyMock).toHaveBeenLastCalledWith({
      userId: 'me',
      id: 'm1',
      requestBody: { addLabelIds: ['INBOX'] },
    });
  });

  it('removes a label, archives by dropping INBOX, and trashes a message', async () => {
    modifyMock.mockResolvedValue({ data: { id: 'm1', labelIds: [] } });
    trashMock.mockResolvedValue({
      data: { id: 'm1', labelIds: ['TRASH'] },
    });

    await gmailRemoveLabelFromEmailAction.run(
      createMockActionContext({
        propsValue: {
          message_id: 'm1',
          label: { id: 'Label_1', name: 'Work' },
        },
      })
    );
    expect(modifyMock).toHaveBeenCalledWith({
      userId: 'me',
      id: 'm1',
      requestBody: { removeLabelIds: ['Label_1'] },
    });

    await gmailArchiveEmailAction.run(
      createMockActionContext({
        propsValue: { message_id: 'm1' },
      })
    );
    expect(modifyMock).toHaveBeenLastCalledWith({
      userId: 'me',
      id: 'm1',
      requestBody: { removeLabelIds: ['INBOX'] },
    });

    await gmailDeleteEmailAction.run(
      createMockActionContext({
        propsValue: { message_id: 'm1' },
      })
    );
    expect(trashMock).toHaveBeenCalledWith({
      userId: 'me',
      id: 'm1',
    });
  });

  it('creates a user label and strips a label from a whole thread', async () => {
    createLabelMock.mockResolvedValue({
      data: { id: 'Label_9', name: 'Clients/Acme' },
    });
    modifyThreadMock.mockResolvedValue({
      data: { id: 't1', messages: [] },
    });

    const created = await gmailCreateLabelAction.run(
      createMockActionContext({
        propsValue: {
          name: 'Clients/Acme',
          label_list_visibility: 'labelShowIfUnread',
          message_list_visibility: 'hide',
        },
      })
    );
    expect(createLabelMock).toHaveBeenCalledWith({
      userId: 'me',
      requestBody: {
        name: 'Clients/Acme',
        labelListVisibility: 'labelShowIfUnread',
        messageListVisibility: 'hide',
      },
    });
    expect(created).toEqual({ id: 'Label_9', name: 'Clients/Acme' });

    await gmailRemoveLabelFromThreadAction.run(
      createMockActionContext({
        propsValue: {
          thread_id: 't1',
          label: { id: 'Label_9', name: 'Clients/Acme' },
        },
      })
    );
    expect(modifyThreadMock).toHaveBeenCalledWith({
      userId: 'me',
      id: 't1',
      requestBody: { removeLabelIds: ['Label_9'] },
    });
  });

  it('asks the user to reconnect when modify is forbidden', async () => {
    modifyMock.mockRejectedValue({ code: 403 });

    await expect(
      gmailArchiveEmailAction.run(
        createMockActionContext({
          propsValue: { message_id: 'm1' },
        })
      )
    ).rejects.toThrow(/gmail.modify/);
  });
});
