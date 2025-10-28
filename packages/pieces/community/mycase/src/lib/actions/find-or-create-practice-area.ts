import { createAction, Property } from '@activepieces/pieces-framework';
import { myCaseAuth } from '../common/auth';
import { myCaseApiService } from '../common/requests';

export const findOrCreatePracticeArea = createAction({
  auth: myCaseAuth,
  name: 'findOrCreatePracticeArea',
  displayName: 'Find or Create Practice Area',
  description: 'Finds or creates a practice area',
  props: {
    name: Property.ShortText({
      displayName: 'Practice Area Name',
      description: 'The name of the practice area',
      required: true,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;

    const response = await myCaseApiService.fetchClients({
      accessToken: context.auth.access_token,
      queryParams: {
        page_size: '1000',
      },
    });

    const existingPracticeArea = response.find(
      (c: any) =>
        c.name && c.name.toLowerCase() === propsValue.name.toLowerCase()
    );

    if (existingPracticeArea) return existingPracticeArea;


    const payload = {
      name: propsValue.name,
    };

    return await myCaseApiService.createPracticeArea({
      accessToken: auth.access_token,
      payload,
    });
  },
});
