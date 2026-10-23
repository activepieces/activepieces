import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { folkAi } from '../../common/ai-common';
import { folkAuth } from '../../common/auth';
import { folkClient } from '../../common/client';
import { folkFields } from '../../common/fields';
import { folkObjectFields } from '../../common/object-fields';
import { folkOutputSchemas } from '../../output-schemas';

export const createGroupObject = createAction({
  auth: folkAuth,
  name: 'create_group_object',
  displayName: 'Create Group Object (Deal)',
  description: 'Create an object, such as a deal, in a Folk group.',
  audience: 'ai',
  classification: 'WRITE',
  outputSchema: folkOutputSchemas.object,
  aiMetadata: {
    description:
      'Creates an object (for example a deal) of the given type in a Folk group, with a name, linked people and companies, and custom field values such as Status or Amount. Each call adds an object; pass an Idempotency Key so a retry returns the first one. Returns the object with its ID.',
    idempotent: false,
  },
  props: {
    ...folkObjectFields.objectProps(),
    name: Property.ShortText({ displayName: 'Name', description: 'Object name, e.g. the deal title.', required: true }),
    ...folkObjectFields.objectBodyProps({ forUpdate: false }),
    idempotencyKey: folkAi.idempotencyKeyProp(),
  },
  async run(context) {
    const p = context.propsValue;
    const body = folkObjectFields.objectBody({ props: p });
    if (body['name'] === undefined) {
      throw new Error('Name is required.');
    }
    return folkClient.sendData<Record<string, unknown>>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: folkObjectFields.objectPath({ groupId: p.groupId, objectType: p.objectType }),
      body,
      idempotencyKey: folkFields.idempotencyKeyValue({ value: p.idempotencyKey }),
    });
  },
});
