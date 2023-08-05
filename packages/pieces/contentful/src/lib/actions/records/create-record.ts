import { createAction } from '@activepieces/pieces-framework';
import { ContentfulAuth } from '../../common';
import { ContentModel } from '../../properties';

export const ContentfulCreateRecordAction = createAction({
  name: 'contentful_record_create',
  auth: ContentfulAuth,
  displayName: 'Create Contentful Record',
  description: 'Creates a new Contentful record for a given Content Model',
  props: {
    contentModel: ContentModel,
  },
  async run() {
    return true;
  },
});
