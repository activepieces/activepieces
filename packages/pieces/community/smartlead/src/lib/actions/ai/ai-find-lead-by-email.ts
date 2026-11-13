import { createAction, Property } from '@activepieces/pieces-framework';
import { smartleadAuth } from '../../auth';
import { smartleadOperations } from '../../common/operations';
import { smartleadOutputSchemas } from '../../common/output-schemas';

export const aiFindLeadByEmailAction = createAction({
  auth: smartleadAuth,
  name: 'ai_find_lead_by_email',
  classification: 'SEARCH',
  displayName: 'Find Lead by Email',
  description: 'Look up a SmartLead lead by email address.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Looks up a SmartLead lead by exact email address across the account. Returns found=true with the lead (id, name, company, custom_fields) or found=false with lead=null when no lead has that email. Use the lead id with the campaign lead tools. Read-only.',
    idempotent: true,
  },
  outputSchema: smartleadOutputSchemas.findLeadByEmail,
  props: {
    email: Property.ShortText({ displayName: 'Email', required: true }),
  },
  async run({ auth, propsValue }) {
    return smartleadOperations.findLeadByEmail({ apiKey: auth.secret_text, email: propsValue.email });
  },
});
