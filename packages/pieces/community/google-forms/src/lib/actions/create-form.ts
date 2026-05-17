import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { callFormsApi, googleFormsAuth } from '../common/common';

export const createFormAction = createAction({
  auth: googleFormsAuth,
  name: 'create_form',
  displayName: 'Create Form',
  description: 'Creates a new blank Google Form with the given title.',
  props: {
    title: Property.ShortText({
      displayName: 'Title',
      description: 'The title of the new form.',
      required: true,
    }),
    document_title: Property.ShortText({
      displayName: 'Document Title',
      description: 'Optional. The title shown in Google Drive. Defaults to the form title.',
      required: false,
    }),
  },
  async run(context) {
    const { title, document_title } = context.propsValue;
    return await callFormsApi({
      auth: context.auth,
      method: HttpMethod.POST,
      path: `/forms`,
      body: {
        info: {
          title,
          ...(document_title && document_title.length > 0
            ? { documentTitle: document_title }
            : {}),
        },
      },
    });
  },
});
