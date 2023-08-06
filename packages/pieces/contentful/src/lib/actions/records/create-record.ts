import { Property, createAction } from '@activepieces/pieces-framework';
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
  async run({ auth, propsValue }) {
    const { client, defaultOptions } = makeClient(auth);
    return true;
  },
});
