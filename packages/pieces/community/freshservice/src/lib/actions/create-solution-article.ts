import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { freshserviceAuth } from '../../';
import { freshserviceApiCall } from '../common/client';

export const createSolutionArticle = createAction({
  auth: freshserviceAuth,
  name: 'create_solution_article',
  displayName: 'Create Solution Article',
  description: 'Creates a new solution article in Freshservice.',
  props: {
    title: Property.ShortText({
      displayName: 'Title',
      description: 'The title of the solution article.',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'The content of the solution article in HTML format.',
      required: true,
    }),
    folder_id: Property.Number({
      displayName: 'Folder ID',
      description: 'The ID of the folder to place the article in.',
      required: true,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      required: false,
      options: {
        options: [
          { label: 'Draft', value: 1 },
          { label: 'Published', value: 2 },
        ],
      },
    }),
    tags: Property.Array({
      displayName: 'Tags',
      description: 'Tags for the article.',
      required: false,
    }),
  },
  async run(context) {
    const props = context.propsValue;

    const body: Record<string, unknown> = {
      title: props.title,
      description: props.description,
      folder_id: props.folder_id,
    };

    if (props.status) body['status'] = props.status;
    if (props.tags && props.tags.length > 0) body['tags'] = props.tags;

    const response = await freshserviceApiCall<{ article: Record<string, unknown> }>({
      method: HttpMethod.POST,
      endpoint: 'solutions/articles',
      auth: context.auth,
      body,
    });

    return response.body.article;
  },
});
