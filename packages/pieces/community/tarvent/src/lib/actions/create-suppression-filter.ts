import { propsValidation } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { z } from 'zod';
import { tarventAuth } from '../auth';
import { makeClient } from '../common';

export const createSuppressionFilter = createAction({
  auth: tarventAuth,
  name: 'tarvent_create_suppression_filter',
  displayName: 'Add Contact To Suppression List',
  description: 'Creates a suppression filter in your account to suppress a contact.',
  audience: 'both',
  aiMetadata: { description: 'Adds an email address to the Tarvent account-level suppression list so it is blocked from future sends, with an optional reason. Use to permanently stop messaging a specific address. Not idempotent: each call creates another suppression filter record.', idempotent: false },
  props: {
    email: Property.ShortText({
      displayName: 'Email address',
      description: 'Enter the email to add to the suppression list.',
      required: true,
      defaultValue: '',
    }),
    reason: Property.LongText({
      displayName: 'Suppression reason',
      description: 'Use the description to describe why this contact is being suppressed.',
      required: false,
      defaultValue: '',
    })
  },
  async run(context) {
    const { email, reason } = context.propsValue;

    await propsValidation.validateZod(context.propsValue, {
      email: z.string().min(1).max(100, 'Email has no more than 100 characters.'),
      reason: z.string().min(0).max(255, 'Suppression reason has no more than 255 characters.'),
    });

    const client = makeClient(context.auth);
    return await client.createSuppressionFilter(email, reason);
  },
});
