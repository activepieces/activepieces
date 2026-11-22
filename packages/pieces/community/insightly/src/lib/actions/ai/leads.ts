import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { insightlyUtils } from '../../common/client';
import { insightlyAuth, insightlyCommon } from '../../common/common';
import { insightlyMappers, outputSchemas } from '../../common/output-schemas';
import { aiProps } from '../../common/props';

export const aiFindLeads = createAction({
  auth: insightlyAuth,
  name: 'ai_find_leads',
  classification: 'SEARCH',
  displayName: 'Find Leads',
  description: 'Find leads by email or last name.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Searches Insightly leads by exact email, or by exact last name when no email is given; lists leads when neither is given. Returns lead IDs, status IDs and whether the lead was converted. Read-only and safe to repeat.',
    idempotent: true,
  },
  outputSchema: outputSchemas['leadList'],
  props: {
    email: Property.ShortText({ displayName: 'Email', required: false }),
    lastName: Property.ShortText({ displayName: 'Last Name', required: false }),
    limit: aiProps.limit(),
  },
  async run({ auth, propsValue }) {
    const email = insightlyUtils.optionalText(propsValue.email);
    const lastName = insightlyUtils.optionalText(propsValue.lastName);
    const limit = insightlyUtils.clampLimit(propsValue.limit);
    const filter = email ? { field: 'EMAIL', value: email } : lastName ? { field: 'LAST_NAME', value: lastName } : undefined;
    const connection = await insightlyCommon.connect({ auth });
    const page = await insightlyCommon.findRecords({ connection, objectName: 'Leads', filter, limit });
    const leads = page.records.map(insightlyMappers.lead);
    return { count: leads.length, hasMore: page.hasMore, leads };
  },
});

export const aiCreateLead = createAction({
  auth: insightlyAuth,
  name: 'ai_create_lead',
  classification: 'WRITE',
  displayName: 'Create Lead',
  description: 'Create a lead.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a new Insightly lead. Not idempotent: each call creates another lead, so run Find Leads by email first. Lead source and status IDs come from List Lead Sources and Statuses.',
    idempotent: false,
  },
  outputSchema: outputSchemas['lead'],
  props: {
    firstName: Property.ShortText({ displayName: 'First Name', required: false }),
    lastName: Property.ShortText({ displayName: 'Last Name', required: true }),
    email: Property.ShortText({ displayName: 'Email', required: false }),
    phone: Property.ShortText({ displayName: 'Phone', required: false }),
    organisationName: Property.ShortText({ displayName: 'Organization Name', required: false }),
    leadSourceId: Property.Number({ displayName: 'Lead Source ID', required: false }),
    leadStatusId: Property.Number({ displayName: 'Lead Status ID', required: false }),
  },
  async run({ auth, propsValue }) {
    const connection = await insightlyCommon.connect({ auth });
    const record = insightlyUtils.sanitizeRecord(
      await insightlyCommon.call({
        connection,
        method: HttpMethod.POST,
        path: '/Leads',
        body: insightlyUtils.compact({
          FIRST_NAME: propsValue.firstName,
          LAST_NAME: propsValue.lastName,
          EMAIL: propsValue.email,
          PHONE: propsValue.phone,
          ORGANISATION_NAME: propsValue.organisationName,
          LEAD_SOURCE_ID: propsValue.leadSourceId,
          LEAD_STATUS_ID: propsValue.leadStatusId,
        }),
      }),
    );
    return insightlyMappers.lead(record);
  },
});
