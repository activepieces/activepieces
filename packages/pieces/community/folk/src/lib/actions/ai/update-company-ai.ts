import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { folkAi } from '../../common/ai-common';
import { folkAuth } from '../../common/auth';
import { folkClient } from '../../common/client';
import { folkFields } from '../../common/fields';
import { folkRecordBody } from '../../common/record-body';
import { folkOutputSchemas } from '../../output-schemas';

export const updateCompanyAi = createAction({
  auth: folkAuth,
  name: 'update_company_ai',
  displayName: 'Update Company',
  description: 'Update fields on a Folk company. Only the fields you give change.',
  audience: 'ai',
  classification: 'WRITE',
  outputSchema: folkOutputSchemas.company,
  aiMetadata: {
    description:
      'Updates a Folk company by ID (com_...). Only fields you give change; omitted fields stay as they are. Lists (emails, phones, URLs, addresses, groups) replace the whole current list, so read the company first with Get Company and include values to keep. To empty emails, phones, URLs or addresses, name them in Clear Fields; the Folk API does not blank company text or number fields once set, so overwrite them instead. Custom Field Values update only the named fields; their groups are added while the company keeps existing groups. Returns the updated company.',
    idempotent: false,
  },
  props: {
    companyId: folkAi.idProp({ displayName: 'Company ID', description: 'ID of the company to update (com_...).' }),
    name: Property.ShortText({ displayName: 'Name', description: 'New company name.', required: false }),
    ...folkRecordBody.companyProps({ forUpdate: true }),
    clearFields: folkRecordBody.clearFieldsProp({ options: folkRecordBody.COMPANY_CLEAR_FIELDS }),
  },
  async run(context) {
    const props = context.propsValue;
    const path = `/v1/companies/${folkClient.idSegment({ value: props.companyId, label: 'Company ID' })}`;
    const clear = folkRecordBody.clearList({ value: props.clearFields, allowed: folkRecordBody.COMPANY_CLEAR_FIELDS });
    const body = folkRecordBody.companyBody({ props, clear });
    const customFieldValues = folkFields.customFieldValues({ value: props.customFieldValues });
    const groupIds = folkFields.idList({ value: props.groupIds, label: 'Group IDs', prefix: 'grp_' });
    const currentGroupIds =
      groupIds === undefined && customFieldValues !== undefined
        ? await folkAi.currentGroupIdsOf({ auth: context.auth, path })
        : undefined;
    const groups = folkAi.mergedGroups({ groupIds, customFieldValues, currentGroupIds });
    const finalBody = {
      ...body,
      ...(groups !== undefined ? { groups: groups.map((id) => ({ id })) } : {}),
      ...(customFieldValues ? { customFieldValues } : {}),
    };
    if (Object.keys(finalBody).length === 0) {
      throw new Error('Nothing to update. Give at least one field to change or a field in Clear Fields.');
    }
    return folkClient.sendData<Record<string, unknown>>({
      auth: context.auth,
      method: HttpMethod.PATCH,
      path,
      body: finalBody,
    });
  },
});
