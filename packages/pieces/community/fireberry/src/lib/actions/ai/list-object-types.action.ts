import { createAction } from '@activepieces/pieces-framework';
import { fireberryAuth } from '../../auth';
import { FireberryClient } from '../../common/client';
import { fireberryOutputSchemas } from '../../common/output-schemas';

export const aiListObjectTypesAction = createAction({
  auth: fireberryAuth,
  name: 'ai_list_object_types',
  displayName: 'List Object Types',
  description: 'Lists the object types (Account, Contact, custom objects...) available in the Fireberry account.',
  audience: 'ai',
  classification: 'READ',
  outputSchema: fireberryOutputSchemas['listObjectTypes'],
  aiMetadata: {
    description: 'Lists every Fireberry object type the token can see, with its display name, systemName and numeric objectType. Call this first to learn the systemName that every other Fireberry tool expects (e.g. Account, Contact, CustomObject1001).',
    idempotent: true,
  },
  props: {},
  async run({ auth }) {
    const objects = await new FireberryClient(auth.secret_text).getObjectsMetadata();
    const objectTypes = objects.map((obj) => ({
      name: obj.name,
      systemName: obj.systemName,
      objectType: Number(obj.objectType),
    }));
    return { objectTypes, count: objectTypes.length };
  },
});
