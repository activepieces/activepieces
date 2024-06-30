import {
  DynamicPropsValue,
  Property,
  createAction,
} from '@activepieces/pieces-framework';
import { ContentfulAuth, PropertyKeys, makeClient } from '../../common';
import { ContentfulProperty } from '../../properties';
import { FieldProcessors } from '../../properties/processors';

function keyBy<T>(array: T[], key: keyof T): { [key: string]: T } {
  return (array || []).reduce((result, item) => {
    const keyValue = key ? item[key] : (item as unknown as string);
    result[keyValue as unknown as string] = item;
    return result;
  }, {} as { [key: string]: T });
}

export const ContentfulCreateRecordAction = createAction({
  name: 'contentful_record_create',
  auth: ContentfulAuth,
  displayName: 'Create Record',
  description: 'Creates a new Contentful record for a given Content Model',
  props: {
    [PropertyKeys.LOCALE]: ContentfulProperty.Locale,
    [PropertyKeys.CONTENT_MODEL]: ContentfulProperty.ContentModel,
    [PropertyKeys.PUBLISH_ON_CREATE]: Property.Checkbox({
      displayName: 'Publish after Creating',
      required: true,
      description: 'Whether or not to publish this record after creating it.',
      defaultValue: false,
    }),
    [PropertyKeys.FIELDS]: ContentfulProperty.DynamicFields,
  },

  async run({ auth, propsValue }) {
    const { client } = makeClient(auth);
    const model = await client.contentType.get({
      contentTypeId: propsValue[PropertyKeys.CONTENT_MODEL] as string,
    });

    const fields = keyBy(model.fields, 'id');
    const values = propsValue[PropertyKeys.FIELDS] as DynamicPropsValue;
    // Remove empty fields
    for (const key in values) {
      if (
        values[key] === '' ||
        values[key] === null ||
        values[key] === undefined ||
        (Array.isArray(values[key]) && values[key].length === 0)
      ) {
        delete values[key];
        continue;
      }
      const fieldType = fields[key].type;
      const processor = FieldProcessors[fieldType] || FieldProcessors['Basic'];
      values[key] = {
        [propsValue[PropertyKeys.LOCALE] as string]: await processor(
          fields[key],
          values[key]
        ),
      };
    }
    console.debug('Creating record with values', values);
    const record = await client.entry.create(
      { contentTypeId: model.sys.id },
      { fields: values }
    );
    if (propsValue[PropertyKeys.PUBLISH_ON_CREATE]) {
      await client.entry.publish({ entryId: record.sys.id }, record);
    }
    return record;
  },
});
