import { createAction, Property } from '@activepieces/pieces-framework';
import { cmsAuth } from '../auth';
import { totalcmsApi } from '../common/client';
import { totalcmsProps } from '../common/props';
import { totalcmsShape } from '../common/shape';
import { totalcmsOutputSchemas } from '../output-schemas';

export const saveDateAction = createAction({
  name: 'save_date',
  classification: 'WRITE',
  auth: cmsAuth,
  displayName: 'Save Date',
  description: 'Creates or replaces a date object.',
  audience: 'both',
  aiMetadata: {
    description:
      'Sets the date and time stored in a Total CMS date object, creating the object if the ID is new. Use for countdowns or event dates shown on the site. Takes an ISO 8601 date; repeating the call is safe.',
    idempotent: true,
  },
  props: {
    collection: totalcmsProps.collectionForSchema({ schema: 'date', label: 'Date' }),
    object_id: totalcmsProps.objectIdText({
      description: 'The ID of the date object. A new ID creates the object.',
    }),
    date: Property.DateTime({
      displayName: 'Date',
      description: 'The date and time to store, for example 2026-12-31T18:00:00Z.',
      required: true,
    }),
  },
  outputSchema: totalcmsOutputSchemas.date,
  async run(context) {
    const collection = totalcmsShape.requireId({ value: context.propsValue.collection, label: 'Collection ID' });
    const id = totalcmsShape.requireId({ value: context.propsValue.object_id, label: 'Object ID' });
    const date = new Date(String(context.propsValue.date));
    if (Number.isNaN(date.getTime())) {
      throw new Error('Date is not a valid date. Use a format such as 2026-12-31T18:00:00Z.');
    }
    const object = await totalcmsApi.replaceObject({
      auth: context.auth,
      collection,
      id,
      fields: { date: date.toISOString() },
    });
    return totalcmsShape.typed({ collection, object });
  },
});
