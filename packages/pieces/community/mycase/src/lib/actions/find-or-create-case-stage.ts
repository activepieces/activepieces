import { createAction, Property } from '@activepieces/pieces-framework';
import { myCaseAuth } from '../common/auth';
import { myCaseApiService } from '../common/requests';

export const findOrCreateCaseStage = createAction({
  auth: myCaseAuth,
  name: 'findOrCreateCaseStage',
  displayName: 'Find or Create Case Stage',
  description: 'Finds or creates a case stage.',
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      description:
        'The name of the case. The case name gets validated so it must be unique.',
      required: true,
    }),
  },
  async run(context) {
    const { name } = context.propsValue;

    const response = await myCaseApiService.fetchCaseStages({
      accessToken: context.auth.access_token,
      queryParams: {
        page_size: '1000'
    }});

    const existingCaseStage = response.find(
      (c: any) => c.name && c.name.toLowerCase() === name.toLowerCase()
    );

    if(existingCaseStage) return existingCaseStage;

    return await myCaseApiService.createCaseStage({
      accessToken: context.auth.access_token,
      payload: {
        name,
      },
    });
  },
});
