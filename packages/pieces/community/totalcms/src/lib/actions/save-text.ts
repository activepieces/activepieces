import { createAction, Property } from '@activepieces/pieces-framework';
import { cmsAuth } from '../auth';
import { totalcmsApi } from '../common/client';
import { totalcmsProps } from '../common/props';
import { totalcmsShape } from '../common/shape';
import { totalcmsOutputSchemas } from '../output-schemas';

export const saveTextAction = createAction({
  name: 'save_text',
  classification: 'WRITE',
  auth: cmsAuth,
  displayName: 'Save Text',
  description: 'Creates or replaces a text object.',
  audience: 'both',
  aiMetadata: {
    description:
      'Sets the text of a Total CMS text object, creating the object if the ID is new and replacing its text otherwise. Use for site snippets such as headlines. Repeating the call with the same values leaves the same result, so it is safe to retry.',
    idempotent: true,
  },
  props: {
    collection: totalcmsProps.collectionForSchema({ schema: 'text', label: 'Text' }),
    object_id: totalcmsProps.objectIdText({
      description: 'The ID of the text object, for example headline. A new ID creates the object.',
    }),
    text: Property.LongText({
      displayName: 'Text',
      required: true,
    }),
  },
  outputSchema: totalcmsOutputSchemas.text,
  async run(context) {
    const collection = totalcmsShape.requireId({ value: context.propsValue.collection, label: 'Collection ID' });
    const id = totalcmsShape.requireId({ value: context.propsValue.object_id, label: 'Object ID' });
    const object = await totalcmsApi.replaceObject({
      auth: context.auth,
      collection,
      id,
      fields: { text: context.propsValue.text },
    });
    return totalcmsShape.typed({ collection, object });
  },
});
