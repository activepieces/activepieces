import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { folkAi } from '../../common/ai-common';
import { folkAuth } from '../../common/auth';
import { folkClient } from '../../common/client';
import { folkFields } from '../../common/fields';
import { folkRecordBody } from '../../common/record-body';
import { folkOutputSchemas } from '../../output-schemas';

export const createPersonAi = createAction({
  auth: folkAuth,
  name: 'create_person_ai',
  displayName: 'Create Person',
  description: 'Create a person (contact) in Folk.',
  audience: 'ai',
  classification: 'WRITE',
  outputSchema: folkOutputSchemas.person,
  aiMetadata: {
    description:
      'Creates a person in Folk with any of: name, job title, description, birthday, gender, emails, phones, URLs, addresses, company links (by ID or by name, which creates the company if missing), groups and group custom field values. Give at least a name or an email. Folk does not de-duplicate: search with Search People first. Pass an Idempotency Key to make a retry return the first result instead of a duplicate. Returns the created person with its ID.',
    idempotent: false,
  },
  props: {
    ...folkRecordBody.personProps({ forUpdate: false }),
    idempotencyKey: folkAi.idempotencyKeyProp(),
  },
  async run(context) {
    const props = context.propsValue;
    const body = folkRecordBody.personBody({ props, clear: [] });
    if (body['firstName'] === undefined && body['lastName'] === undefined && body['fullName'] === undefined && body['emails'] === undefined) {
      throw new Error('Give at least a first name, last name, full name or email for the new person.');
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
      path: '/v1/people',
      body: {
        ...body,
        ...(groups && groups.length > 0 ? { groups: groups.map((id) => ({ id })) } : {}),
        ...(customFieldValues ? { customFieldValues } : {}),
      },
      idempotencyKey: folkFields.idempotencyKeyValue({ value: props.idempotencyKey }),
    });
  },
});
