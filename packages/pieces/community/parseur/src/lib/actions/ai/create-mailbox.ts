import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { parseurAuth } from '../../auth';
import { parseurAiProps } from '../../common/ai-props';
import { parseurClient } from '../../common/client';
import { parseurUtils } from '../../common/utils';
import type { ParseurRecord } from '../../common/types';
import { mailboxOutputSchema } from '../../output-schemas';

const PRESETS = [
  'invoices',
  'statements',
  'job-application',
  'leads',
  'resume-cv',
  'food-delivery',
  'search-alerts',
  'real-estate',
  'work-order',
  'financial-statement',
  'utility',
  'contact-list',
  'delivery-notes',
  'property-bookings',
  'job-search',
  'travel',
  'automotive',
  'payslip',
  'event-ticketing',
].map((value) => ({ label: value, value }));

export const createMailboxAction = createAction({
  auth: parseurAuth,
  name: 'parseur_create_mailbox',
  outputSchema: mailboxOutputSchema,
  displayName: 'Create Mailbox',
  description: 'Creates a new mailbox (parser).',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Creates a Parseur mailbox (parser) and returns it with its ID and email_prefix. Start from a ready-made Preset (e.g. invoices) or define Fields yourself. Every call creates another mailbox.',
    idempotent: false,
  },
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Mailbox name.',
      required: true,
    }),
    preset: Property.StaticDropdown({
      displayName: 'Preset',
      description:
        'Ready-made mailbox type whose fields are set up for you, e.g. "invoices".',
      required: false,
      options: { disabled: false, options: PRESETS },
    }),
    aiEngine: parseurAiProps.aiEngine({ required: false }),
    aiInstructions: parseurAiProps.aiInstructions({ required: false }),
    emailPrefix: parseurAiProps.emailPrefix({ required: false }),
    fields: parseurAiProps.mailboxFields({ required: false }),
    additionalFields: parseurAiProps.additionalFields({ required: false }),
  },
  async run({ auth, propsValue }) {
    return await parseurClient.request<ParseurRecord>({
      auth,
      method: HttpMethod.POST,
      path: '/parser',
      body: parseurUtils.mailboxBody({
        additionalFields: propsValue.additionalFields,
        settings: {
          name: propsValue.name,
          master_parser_slug: propsValue.preset,
          ai_engine: propsValue.aiEngine,
          ai_instructions: propsValue.aiInstructions,
          email_prefix: propsValue.emailPrefix,
          parser_object_set: propsValue.fields,
        },
      }),
    });
  },
});
