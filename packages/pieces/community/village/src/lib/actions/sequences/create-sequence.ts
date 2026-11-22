import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { villageAuth } from '../../common/auth';
import { villageApi } from '../../common/client';
import { villageSchemas } from '../../common/schemas';

const DEFAULT_USE_CASE = 'sales';
const DEFAULT_OUTREACH_APPROACH = 'cold';

export const createSequence = createAction({
  auth: villageAuth,
  name: 'create_sequence',
  classification: 'WRITE',
  displayName: 'Create Sequence',
  description:
    'Create a new outreach sequence from the standard email templates for a use case (default: Sales, cold outreach). Village creates it as ACTIVE: once a mailbox is connected in Village, leads you add get their first email scheduled within minutes. Free.',
  audience: 'both',
  aiMetadata: {
    description:
      'Creates an outreach sequence with a name and optional description, AI instructions, use case (default sales) and outreach approach (default cold); Village builds the emails from the standard templates for that use case. The sequence is created ACTIVE, so leads added later can start receiving emails within minutes once the user has a mailbox connected in Village; confirm with the user before adding leads. Not idempotent: each call creates a new sequence.',
    idempotent: false,
  },
  outputSchema: villageSchemas.createSequence,
  props: {
    name: Property.ShortText({ displayName: 'Name', required: true }),
    description: Property.LongText({ displayName: 'Description', required: false }),
    ai_instructions: Property.LongText({
      displayName: 'AI Instructions',
      description: 'Guidance for the AI that writes the emails.',
      required: false,
    }),
    use_case: Property.StaticDropdown({
      displayName: 'Use Case',
      description: 'Build emails from the standard templates for this use case. Defaults to Sales.',
      required: false,
      defaultValue: 'sales',
      options: {
        options: [
          { label: 'Founder fundraising', value: 'founder_fundraising' },
          { label: 'VC fundraising', value: 'vc_fundraising' },
          { label: 'Recruiting', value: 'recruiting' },
          { label: 'Sales', value: 'sales' },
          { label: 'Sales (direct)', value: 'sales_direct' },
          { label: 'Job search', value: 'job_search' },
        ],
      },
    }),
    outreach_approach: Property.StaticDropdown({
      displayName: 'Outreach Approach',
      description: 'Where new leads start. Defaults to Cold.',
      required: false,
      defaultValue: 'cold',
      options: {
        options: [
          { label: 'Warm intro', value: 'warm_intro' },
          { label: 'Cold, naming a mutual', value: 'cold_warm_lever' },
          { label: 'Cold', value: 'cold' },
        ],
      },
    }),
  },
  async run(context) {
    const { name, description, ai_instructions, use_case, outreach_approach } = context.propsValue;
    const body: Record<string, unknown> = {
      name: villageApi.requireText({ value: name, field: 'Name' }),
      use_case: use_case || DEFAULT_USE_CASE,
      outreach_approach: outreach_approach || DEFAULT_OUTREACH_APPROACH,
    };
    if (description) {
      body['description'] = description;
    }
    if (ai_instructions) {
      body['ai_instructions'] = ai_instructions;
    }
    return villageApi.call({
      token: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/v2/sequences',
      body,
    });
  },
});
