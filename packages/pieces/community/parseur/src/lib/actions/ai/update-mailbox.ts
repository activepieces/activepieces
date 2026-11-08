import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { parseurAuth } from '../../auth';
import { parseurAiProps } from '../../common/ai-props';
import { parseurClient } from '../../common/client';
import { parseurUtils } from '../../common/utils';
import type { ParseurRecord } from '../../common/types';
import { mailboxOutputSchema } from '../../output-schemas';

export const updateMailboxAction = createAction({
  auth: parseurAuth,
  name: 'parseur_update_mailbox',
  outputSchema: mailboxOutputSchema,
  displayName: 'Update Mailbox',
  description: 'Changes a mailbox\'s name, AI settings or fields.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Changes the settings you set on a Parseur mailbox and leaves the rest as they are. Fields replaces the whole field list, so read the current list with Get Mailbox first and include every field to keep. Returns the updated mailbox.',
    idempotent: true,
  },
  props: {
    mailboxId: parseurAiProps.mailboxId({ required: true }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'New mailbox name.',
      required: false,
    }),
    aiEngine: parseurAiProps.aiEngine({ required: false }),
    aiInstructions: parseurAiProps.aiInstructions({ required: false }),
    emailPrefix: parseurAiProps.emailPrefix({ required: false }),
    fields: parseurAiProps.mailboxFields({ required: false }),
    additionalFields: parseurAiProps.additionalFields({ required: false }),
  },
  async run({ auth, propsValue }) {
    const body = parseurUtils.mailboxBody({
      additionalFields: propsValue.additionalFields,
      settings: {
        name: propsValue.name,
        ai_engine: propsValue.aiEngine,
        ai_instructions: propsValue.aiInstructions,
        email_prefix: propsValue.emailPrefix,
        parser_object_set: propsValue.fields,
      },
    });
    if (Object.keys(body).length === 0) {
      throw new Error('Set at least one setting to change.');
    }
    return await parseurClient.request<ParseurRecord>({
      auth,
      method: HttpMethod.PUT,
      path: `/parser/${encodeURIComponent(propsValue.mailboxId)}`,
      body,
    });
  },
});
