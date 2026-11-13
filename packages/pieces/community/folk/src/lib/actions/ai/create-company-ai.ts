import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { folkAi } from '../../common/ai-common';
import { folkAuth } from '../../common/auth';
import { folkClient } from '../../common/client';
import { folkFields } from '../../common/fields';
import { folkRecordBody } from '../../common/record-body';
import { folkOutputSchemas } from '../../output-schemas';

export const createCompanyAi = createAction({
  auth: folkAuth,
  name: 'create_company_ai',
  displayName: 'Create Company',
  description: 'Create a company in Folk.',
  audience: 'ai',
  classification: 'WRITE',
  outputSchema: folkOutputSchemas.company,
  aiMetadata: {
    description:
      'Creates a company in Folk with a name and any of: description, industry, employee range, foundation year, funding, emails, phones, URLs, addresses, groups and group custom field values. Folk does not de-duplicate: check with Search Companies first. Pass an Idempotency Key to make a retry return the first result instead of a duplicate. Returns the created company with its ID.',
    idempotent: false,
  },
  props: {
    name: Property.ShortText({ displayName: 'Name', description: 'Company name.', required: true }),
    ...folkRecordBody.companyProps({ forUpdate: false }),
    idempotencyKey: folkAi.idempotencyKeyProp(),
  },
  async run(context) {
    const props = context.propsValue;
    const body = folkRecordBody.companyBody({ props, clear: [] });
    if (body['name'] === undefined) {
      throw new Error('Name is required.');
    }
    const customFieldValues = folkFields.customFieldValues({ value: props.customFieldValues });
    const groups = folkAi.mergedGroups({
      groupIds: folkFields.idList({ value: props.groupIds, label: 'Group IDs', prefix: 'grp_' }),
      customFieldValues,
      currentGroupIds: undefined,
    });
    return folkClient.sendData<Record<string, unknown>>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: '/v1/companies',
      body: {
        ...body,
        ...(groups && groups.length > 0 ? { groups: groups.map((id) => ({ id })) } : {}),
        ...(customFieldValues ? { customFieldValues } : {}),
      },
      idempotencyKey: folkFields.idempotencyKeyValue({ value: props.idempotencyKey }),
    });
  },
});
