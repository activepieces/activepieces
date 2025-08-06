import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sellsyAuth } from '../common/auth';
import { makeRequest } from '../common/client';

export const createAnnotation = createAction({
  name: 'create_annotation',
  displayName: 'Create Annotation',
  description: 'Creates a new annotation (note/comment) in Sellsy',
  auth: sellsyAuth,
  props: {
    content: Property.LongText({
      displayName: 'Content',
      description: 'Annotation content',
      required: true,
    }),
    entityType: Property.StaticDropdown({
      displayName: 'Entity Type',
      description: 'Type of entity to annotate',
      required: true,
      options: {
        disabled: false,
        options: [
          { label: 'Contact', value: 'contact' },
          { label: 'Company', value: 'company' },
          { label: 'Opportunity', value: 'opportunity' },
        ],
      },
    }),
    entityId: Property.ShortText({
      displayName: 'Entity ID',
      description: 'ID of the entity to annotate',
      required: true,
    }),
  },
  async run(context) {
    const { access_token } = context.auth as { access_token: string };

    const annotationData = {
      content: context.propsValue.content,
      entityType: context.propsValue.entityType,
      entityId: context.propsValue.entityId,
    };

    const response = await makeRequest(
      { access_token },
      HttpMethod.POST,
      '/comments',
      annotationData
    );
    return response;
  },
}); 