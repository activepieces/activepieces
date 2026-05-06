import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { feedhiveAuth } from '../common/auth';
import { feedhiveCommon } from '../common';

export const createLabelAction = createAction({
  auth: feedhiveAuth,
  name: 'create_label',
  displayName: 'Create Label',
  description: 'Creates a new label in FeedHive for organising posts.',
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
      token: context.auth as unknown as string,
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
