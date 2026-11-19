import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, OutputSchema, Property } from '@activepieces/pieces-framework';
import { isRecord, normalizeEmail, parseMailingListId, sendpulseApiCall } from '../common/client';
import { sendpulseAuth } from '../common/auth';
import { mailingListDropdown } from '../common/props';

function toTagIds(tags: unknown[] | undefined): number[] {
  return (tags ?? []).map((tag) => {
    const num = Number(tag);
    if (tag === '' || tag === null || !Number.isInteger(num)) {
      throw new Error(`Invalid tag ID: ${String(tag)}. Tag IDs must be numbers.`);
    }
    return num;
  });
}

const outputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'message', label: 'Message' },
    { key: 'email', label: 'Email', format: 'email' },
    { key: 'mailingListId', label: 'Mailing List ID' },
    { key: 'variables', label: 'Variables', dynamicKey: true },
    { key: 'tags', label: 'Tag IDs' },
  ],
};

export const addSubscriberAction = createAction({
  auth: sendpulseAuth,
  name: 'add-subscriber',
  classification: 'WRITE',
  displayName: 'Add Subscriber',
  description: 'Add subscriber to mailing list',
  audience: 'both',
  aiMetadata: { description: 'Adds an email contact to a specific SendPulse mailing list (address book), optionally attaching subscriber variables (e.g. name, phone) and numeric tag IDs. Use to enroll a new contact into a list; requires the numeric mailing list ID (from List Mailing Lists) and a valid email. Not idempotent — each call re-submits the contact to the list.', idempotent: false },
  props: {
    mailingListId: mailingListDropdown,
    email: Property.ShortText({
      displayName: 'Email Address',
      description: 'Subscriber email address',
      required: true,
    }),
    variables: Property.Object({
      displayName: 'Variables',
      description: 'Optional subscriber variables (e.g., name, phone)',
      required: false,
    }),
    tags: Property.Array({
      displayName: 'Tag IDs',
      description: 'Optional tag IDs to assign',
      required: false,
    }),
  },
  outputSchema,
  async run(context) {
    const { mailingListId, variables, tags } = context.propsValue;
    const listId = parseMailingListId(mailingListId);
    const email = normalizeEmail(context.propsValue.email);
    const tagIds = toTagIds(tags);
    const hasVariables = isRecord(variables) && Object.keys(variables).length > 0;

    const result = await sendpulseApiCall<unknown>({
      method: HttpMethod.POST,
      auth: context.auth.props,
      resourceUri: `/addressbooks/${listId}/emails`,
      operation: 'add subscriber',
      body: {
        emails: [hasVariables ? { email, variables } : { email }],
        ...(tagIds.length > 0 ? { tags: tagIds } : {}),
      },
    });

    if (!isRecord(result) || result['result'] !== true) {
      throw new Error(`SendPulse add subscriber failed: unexpected response ${JSON.stringify(result)}`);
    }
    return {
      success: true,
      message: 'Subscriber added successfully',
      email,
      variables: hasVariables ? variables : {},
      mailingListId,
      tags: tagIds,
    };
  },
});
