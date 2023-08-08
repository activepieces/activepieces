import {
  DynamicProperties,
  DynamicPropsValue,
  Property,
  createAction,
} from '@activepieces/pieces-framework';
import { ContentfulAuth, PropertyKeys, makeClient } from '../../common';
import { ContentfulProperty } from '../../properties';

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
  async run({ auth, propsValue, store }) {
    const { client, defaultOptions } = makeClient(auth);
    const model = await client.contentType.get({
      contentTypeId: propsValue[PropertyKeys.CONTENT_MODEL] as string,
      ...defaultOptions,
    });

    const entryLinks = model.fields.filter(
      (f) => f.type === 'Link' && f.linkType === 'Entry'
    );
    const assetLinks = [];

    const fields = propsValue[PropertyKeys.FIELDS] as DynamicPropsValue;
    // Remove empty fields
    Object.keys(fields).forEach((key) => {
      if (
        fields[key] === '' ||
        fields[key] === null ||
        fields[key] === undefined
      ) {
        delete fields[key];
      } else {
        fields[key] = {
          [propsValue[PropertyKeys.LOCALE] as string]: fields[key],
        };
      }
    });

    console.log(fields);
    return true;
  },
});
