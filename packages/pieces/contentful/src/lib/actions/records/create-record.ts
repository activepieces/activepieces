import { Property, createAction } from '@activepieces/pieces-framework';
import { ContentfulAuth, PropertyKeys } from '../../common';
import { ContentModel, DynamicFields } from '../../properties';

export const ContentfulCreateRecordAction = createAction({
  name: 'contentful_record_create',
  auth: ContentfulAuth,
  displayName: 'Create Contentful Record',
  description: 'Creates a new Contentful record for a given Content Model',
  props: {
    [PropertyKeys.CONTENT_MODEL]: ContentModel,
    [PropertyKeys.PUBLISH_ON_CREATE]: Property.Checkbox({
      displayName: 'Publish after Creating',
      required: true,
      description: 'Whether or not to publish this record after creating it.',
      defaultValue: false,
    }),
    [PropertyKeys.FIELDS]: DynamicFields,
  },
  async run() {
    return true;
  },
});
