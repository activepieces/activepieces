import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { freshserviceAuth } from '../../';
import { freshserviceApiCall } from '../common/client';

export const updateSolutionArticle = createAction({
  auth: freshserviceAuth,
  name: 'update_solution_article',
  displayName: 'Update Solution Article',
  description: 'Updates an existing solution article in Freshservice.',
  props: {
    article_id: Property.Number({
      displayName: 'Article ID',
      description: 'The ID of the solution article to update.',
      required: true,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'The new title of the article.',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'The new content of the article in HTML format.',
      required: false,
    }),
    folder_id: Property.Number({
      displayName: 'Folder ID',
      description: 'The ID of the folder to move the article to.',
      required: false,
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

    const body: Record<string, unknown> = {};

    if (props.title) body['title'] = props.title;
    if (props.description) body['description'] = props.description;
    if (props.folder_id) body['folder_id'] = props.folder_id;
    if (props.status) body['status'] = props.status;
    if (props.tags && props.tags.length > 0) body['tags'] = props.tags;

    const response = await freshserviceApiCall<{ article: Record<string, unknown> }>({
      method: HttpMethod.PUT,
      endpoint: `solutions/articles/${props.article_id}`,
      auth: context.auth,
      body,
    });

    return response.body.article;
  },
});
