import { DynamicPropsValue, Property } from '@activepieces/pieces-framework';
import { ContentfulAuth, PropertyKeys, makeClient } from '../common';
import { FieldTransformers } from './transformers';
import { FieldType } from 'contentful-management';
import { isEmpty, isNil } from '@activepieces/shared';

const DynamicFields = Property.DynamicProperties({
  displayName: 'Fields',
  description: 'Fields for Content Model',
  required: true,
  refreshers: [PropertyKeys.CONTENT_MODEL, PropertyKeys.LOCALE],
  props: async ({
    auth,
    [PropertyKeys.CONTENT_MODEL]: model,
    [PropertyKeys.LOCALE]: locale,
  }) => {
    if (isEmpty(auth) || isNil(model)) return {};
    const dynamicFields: DynamicPropsValue = {};
    const { client } = makeClient(auth as ContentfulAuth);
    try {
      const contentModel = await client.contentType.get({
        contentTypeId: model as unknown as string,
      });
      // Remove fields that are disabled or omitted from the API
      contentModel.fields
        .filter((f) => !!f.id && !f.omitted && !f.disabled && !f.deleted)
        .map((f) => {
          const transformer = FieldTransformers[f.type as FieldType['type']];
          if (transformer) {
            const property = transformer(f);
            if (!property) return;
            dynamicFields[f.id] = {
              ...property,
              defaultValue: f.defaultValue?.[locale as unknown as string],
            };
            return;
          }
          dynamicFields[f.id] = Property.ShortText({
            displayName: f.name,
            required: f.required,
            description: 'Unsupported Field Type',
            defaultValue: f.defaultValue?.[locale as unknown as string],
          });
        });
    } catch (e) {
      console.debug(e);
    }
    return dynamicFields;
  },
});

export default DynamicFields;
