import { createAction, Property } from '@activepieces/pieces-framework';
import { conversationIdDropdown, mailboxIdDropdown } from '../common/props';
import { helpScoutAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const addNote = createAction({
  auth: helpScoutAuth,
  name: 'addNote',
  displayName: 'Add Note',
  description: '',
  props: {
    mailboxId: mailboxIdDropdown,
    conversationId: conversationIdDropdown,
    text: Property.LongText({
      displayName: 'Note Text',
      description: 'The content of the note.',
      required: true,
    }),
    file: Property.File({
      displayName: 'attachements ',
      required: false,
    }),

    // attachments: Property.Array({
    //   displayName: 'Attachments',
    //   description: 'Optional list of attachments for the note.',
    //   required: false,
    //   item: Property.Object({
    //     displayName: 'Attachment',
    //     props: {
    //       fileName: Property.ShortText({
    //         displayName: 'File Name',
    //         required: true,
    //       }),
    //       mimeType: Property.ShortText({
    //         displayName: 'MIME Type',
    //         required: true,
    //       }),
    //       data: Property.LongText({
    //         displayName: 'Base64 Data',
    //         description: 'Base64-encoded file content.',
    //         required: true,
    //       }),
    //     },
    //   }),
    // }),
  },
  async run({ auth, propsValue }) {
    const { mailboxId, conversationId, text, file } = propsValue;

    let attachments = [];
    if (file) {
      attachments.push({
        fileName: file.filename,

        data: file.base64,
      });
    }

    const body = {
      text,
      attachments: attachments.length > 0 ? attachments : undefined,
    };

    const response = await makeRequest(
      auth.access_token,
      HttpMethod.POST,
      `/conversations/${conversationId}/notes`,
      body
    );
    return {
      success: true,
      message: `Note added to ${conversationId}`,
      data: response
    };
  },
});
