import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioGetAvailableSeatsOutputSchema } from '../../../output-schemas';

export const getAvailableSeatsAction = createAction({
  auth: podioAuth,
  name: 'podio_get_available_seats',
  outputSchema: podioGetAvailableSeatsOutputSchema,
  displayName: 'Get Available Seats',
  description: 'Gets the free employee and external seats of a workspace.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Reads how many employee and external seats are still free in a workspace; null means unlimited. The space id comes from List Organization Spaces, List Organizations or Get Top Spaces.',
    idempotent: true,
  },
  props: {
    spaceId: podioAiProps.id({ required: true, displayName: 'Space ID', description: 'The id of the workspace, from List Organization Spaces, List Organizations or Get Top Spaces.' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({ auth, method: HttpMethod.GET, path: `/space/${propsValue.spaceId}/available` });
  },
});
