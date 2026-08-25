import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { sliteAuth } from '../auth';
import { sliteApi } from '../common/client';
import { SliteIndexResponse } from '../common/types';

export const sliteIndexAskxObjectAction = createAction({
  auth: sliteAuth,
  name: 'index_askx_object',
  displayName: 'Index AskX Object',
  description:
    'Sends an object to be indexed by AskX for your custom source. Note: Slite has deprecated this endpoint.',
  audience: 'both',
  aiMetadata: {
    description:
      "Upserts a single object (title plus Markdown or HTML content) into a custom AskX data source so it becomes searchable by Ask Question, keyed by the source's root id and the object's own id. Note: Slite has deprecated this endpoint. Idempotent: re-sending the same root id and object id overwrites that indexed entry rather than adding a duplicate.",
    idempotent: true,
  },
  props: {
    root_id: Property.ShortText({
      displayName: 'Root ID',
      description: 'The root ID of your custom data source (created in Slite).',
      required: true,
    }),
    object_id: Property.ShortText({
      displayName: 'Object ID',
      description: 'A unique identifier for this object within the source.',
      required: true,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'The title of the object.',
      required: true,
    }),
    content: Property.LongText({
      displayName: 'Content',
      description: 'The content of the object.',
      required: true,
    }),
    type: Property.StaticDropdown({
      displayName: 'Content Format',
      description: 'How the content above is written.',
      required: true,
      defaultValue: 'markdown',
      options: {
        options: [
          { label: 'Markdown', value: 'markdown' },
          { label: 'HTML', value: 'html' },
        ],
      },
    }),
    updated_at: Property.DateTime({
      displayName: 'Updated At',
      description: 'When the object was last modified.',
      required: true,
    }),
    url: Property.ShortText({
      displayName: 'URL',
      description: 'The redirect URL for the object.',
      required: true,
    }),
  },
  async run(context) {
    const { root_id, object_id, title, content, type, updated_at, url } =
      context.propsValue;
    const response = await sliteApi.call<SliteIndexResponse>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      resourceUri: '/ask/index',
      body: {
        rootId: root_id,
        id: object_id,
        title,
        content,
        type,
        updatedAt: updated_at,
        url,
      },
    });
    return response;
  },
});
