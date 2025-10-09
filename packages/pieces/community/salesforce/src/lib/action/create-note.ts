import { Property, createAction } from '@activepieces/pieces-framework';
import { callSalesforceApi } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { salesforceAuth } from '../..';

export const createNote = createAction({
  auth: salesforceAuth,
  name: 'create_note',
  displayName: 'Create Note',
  description: 'Creates a Note in Salesforce',
  props: {
    title: Property.ShortText({
      displayName: 'Title',
      description: 'Title of the note',
      required: true,
    }),
    parentId: Property.ShortText({
      displayName: 'Parent ID',
      description: 'ID of the parent record (Account, Contact, Opportunity, etc.)',
      required: true,
    }),
    body: Property.LongText({
      displayName: 'Body',
      description: 'Content of the note',
      required: false,
    }),
    isPrivate: Property.Checkbox({
      displayName: 'Is Private',
      description: 'Whether the note is private',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { title, parentId, body, isPrivate } = context.propsValue;

    const noteData: Record<string, unknown> = {
      Title: title,
      ParentId: parentId,
      ...(body && { Body: body }),
      ...(isPrivate !== undefined && { IsPrivate: isPrivate }),
    };

    const response = await callSalesforceApi(
      HttpMethod.POST,
      context.auth,
      '/services/data/v56.0/sobjects/Note',
      noteData
    );
    return response.body;
  },
});

