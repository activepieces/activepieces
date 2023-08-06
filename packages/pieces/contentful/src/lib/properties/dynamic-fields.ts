import { DynamicPropsValue, Property } from '@activepieces/pieces-framework';
import { ContentfulAuth, PropertyKeys, makeClient } from '../common';
import _ from 'lodash';
import { FieldTransformers } from './transformers';
import { FieldType } from 'contentful-management';

const DynamicFields = Property.DynamicProperties({
  displayName: 'Fields',
  description: 'Fields for Content Model',
  required: true,
  refreshers: [PropertyKeys.CONTENT_MODEL],
  props: async ({ auth, [PropertyKeys.CONTENT_MODEL]: model }) => {
    if (_.isEmpty(auth) || _.isNil(model)) return {};
    const dynamicFields: DynamicPropsValue = {};
    const { client, defaultOptions } = makeClient(auth as ContentfulAuth);
    try {
      const contentModel = await client.contentType.get({
        ...defaultOptions,
        contentTypeId: model as unknown as string,
      });
      // Remove fields that are disabled or omitted from the API
      contentModel.fields
        .filter((f) => !!f.id && !f.omitted && !f.disabled && !f.deleted)
        .map((f) => {
          const transformer = FieldTransformers[f.type as FieldType['type']];
          if (transformer) {
            dynamicFields[f.id] = transformer(f);
            return;
          }
          dynamicFields[f.id] = Property.ShortText({
            displayName: f.name,
            required: f.required,
            description: 'Unsupported Field Type',
          });
        });
    } catch (e) {
      console.debug(e);
    }
    return dynamicFields;
  },
});

export default DynamicFields;
