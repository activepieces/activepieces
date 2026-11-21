import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { insightlyUtils } from '../../common/client';
import { insightlyAuth, insightlyCommon } from '../../common/common';
import { insightlyMappers, outputSchemas } from '../../common/output-schemas';
import { aiProps } from '../../common/props';

export const aiFindOrganisations = createAction({
  auth: insightlyAuth,
  name: 'ai_find_organisations',
  classification: 'SEARCH',
  displayName: 'Find Organizations',
  description: 'Find organizations by exact name.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Searches Insightly organizations (companies) by exact name, or lists them when no name is given. Returns organization IDs for Create Contact and Create Opportunity. Read-only and safe to repeat.',
    idempotent: true,
  },
  outputSchema: outputSchemas['organisationList'],
  props: {
    name: Property.ShortText({ displayName: 'Name', description: 'Exact organization name.', required: false }),
    limit: aiProps.limit(),
  },
  async run({ auth, propsValue }) {
    const name = insightlyUtils.optionalText(propsValue.name);
    const limit = insightlyUtils.clampLimit(propsValue.limit);
    const connection = await insightlyCommon.connect({ auth });
    const page = await insightlyCommon.findRecords({ connection, objectName: 'Organisations', filter: name ? { field: 'ORGANISATION_NAME', value: name } : undefined, limit });
    const organisations = page.records.map(insightlyMappers.organisation);
    return { count: organisations.length, hasMore: page.hasMore, organisations };
  },
});

export const aiCreateOrganisation = createAction({
  auth: insightlyAuth,
  name: 'ai_create_organisation',
  classification: 'WRITE',
  displayName: 'Create Organization',
  description: 'Create an organization.',
  audience: 'ai',
  aiMetadata: {
    description: 'Creates a new Insightly organization (company). Not idempotent: each call creates another organization, so run Find Organizations by name first.',
    idempotent: false,
  },
  outputSchema: outputSchemas['organisation'],
  props: {
    name: Property.ShortText({ displayName: 'Name', required: true }),
    website: Property.ShortText({ displayName: 'Website', required: false }),
    phone: Property.ShortText({ displayName: 'Phone', required: false }),
    background: Property.LongText({ displayName: 'Background', required: false }),
  },
  async run({ auth, propsValue }) {
    const connection = await insightlyCommon.connect({ auth });
    const record = insightlyUtils.sanitizeRecord(
      await insightlyCommon.call({
        connection,
        method: HttpMethod.POST,
        path: '/Organisations',
        body: insightlyUtils.compact({ ORGANISATION_NAME: propsValue.name, WEBSITE: propsValue.website, PHONE: propsValue.phone, BACKGROUND: propsValue.background }),
      }),
    );
    return insightlyMappers.organisation(record);
  },
});
