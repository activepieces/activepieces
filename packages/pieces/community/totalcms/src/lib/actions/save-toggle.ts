import { createAction, Property } from '@activepieces/pieces-framework';
import { cmsAuth } from '../auth';
import { totalcmsApi } from '../common/client';
import { totalcmsProps } from '../common/props';
import { totalcmsShape } from '../common/shape';
import { totalcmsOutputSchemas } from '../output-schemas';

export const saveToggleAction = createAction({
  name: 'save_toggle',
  classification: 'WRITE',
  auth: cmsAuth,
  displayName: 'Save Toggle',
  description: 'Turns a toggle object on or off.',
  audience: 'both',
  aiMetadata: {
    description:
      'Sets a Total CMS toggle object on or off, creating the object if the ID is new. Use to switch site features such as a banner. Setting the same state again changes nothing, so it is safe to retry.',
    idempotent: true,
  },
  props: {
    collection: totalcmsProps.collectionForSchema({ schema: 'toggle', label: 'Toggle' }),
    object_id: totalcmsProps.objectIdText({
      description: 'The ID of the toggle object. A new ID creates the object.',
    }),
    status: Property.Checkbox({
      displayName: 'On',
      description: 'Checked turns the toggle on, unchecked turns it off.',
      required: true,
      defaultValue: true,
    }),
  },
  outputSchema: totalcmsOutputSchemas.toggle,
  async run(context) {
    const collection = totalcmsShape.requireId({ value: context.propsValue.collection, label: 'Collection ID' });
    const id = totalcmsShape.requireId({ value: context.propsValue.object_id, label: 'Object ID' });
    const object = await totalcmsApi.replaceObject({
      auth: context.auth,
      collection,
      id,
      fields: { status: context.propsValue.status === true },
    });
    return totalcmsShape.typed({ collection, object });
  },
});
