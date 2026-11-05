import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { folkAi } from '../../common/ai-common';
import { folkAuth } from '../../common/auth';
import { folkClient } from '../../common/client';
import { folkFields } from '../../common/fields';
import { folkRecordBody } from '../../common/record-body';
import { folkOutputSchemas } from '../../output-schemas';

export const updatePersonAi = createAction({
  auth: folkAuth,
  name: 'update_person_ai',
  displayName: 'Update Person',
  description: 'Update fields on a Folk person. Only the fields you give change.',
  audience: 'ai',
  classification: 'WRITE',
  outputSchema: folkOutputSchemas.person,
  aiMetadata: {
    description:
      'Updates a Folk person by ID (per_...). Only fields you give change; omitted fields stay as they are. Lists (emails, phones, URLs, addresses, companies, groups) replace the whole current list, so read the person first with Get Person and include values to keep. An empty list keeps the current values. To empty a field or remove all groups, name it in Clear Fields; leaving a group deletes its custom field values. Custom Field Values update only the named fields; their groups are added while the person keeps existing groups. Returns the updated person.',
    idempotent: false,
  },
  props: {
    personId: folkAi.idProp({ displayName: 'Person ID', description: 'ID of the person to update (per_...).' }),
    ...folkRecordBody.personProps({ forUpdate: true }),
    clearFields: folkRecordBody.clearFieldsProp({ options: folkRecordBody.PERSON_CLEAR_FIELDS }),
  },
  async run(context) {
    const props = context.propsValue;
    const path = `/v1/people/${folkClient.idSegment({ value: props.personId, label: 'Person ID' })}`;
    const clear = folkRecordBody.clearList({ value: props.clearFields, allowed: folkRecordBody.PERSON_CLEAR_FIELDS });
    const body = folkRecordBody.personBody({ props, clear });
    const customFieldValues = folkFields.customFieldValues({ value: props.customFieldValues });
    const groupIds = folkFields.idList({ value: props.groupIds, label: 'Group IDs', prefix: 'grp_' });
    const groups = await folkAi.groupsForUpdate({
      auth: context.auth,
      path,
      groupIds,
      clearGroups: clear.includes('groups'),
      customFieldValues,
    });
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
