import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { feedhiveAuth } from '../common/auth';
import { feedhiveCommon } from '../common';

export const createLabelAction = createAction({
  auth: feedhiveAuth,
  name: 'create_label',
  displayName: 'Create Label',
  description: 'Creates a new label in FeedHive for organising posts.',
  audience: 'both',
  aiMetadata: { description: 'Creates a new label in FeedHive that can later be attached to posts for organisation. Use when a label an agent needs does not yet exist. Not idempotent: each call creates a new label even if one with the same title already exists.', idempotent: false },
  props: {
    title: Property.ShortText({
      displayName: 'Label Name',
      description: 'The name of the label (e.g. "Campaign Q1", "Evergreen Content").',
      required: true,
    }),
  },
  async run(context) {
    const response = await feedhiveCommon.apiCall<{
      data: { id: string; title: string };
    }>({
      token: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/labels',
      body: { title: context.propsValue.title },
    });

    return {
      id: response.body.data?.id ?? null,
      title: response.body.data?.title ?? null,
    };
  },
});
