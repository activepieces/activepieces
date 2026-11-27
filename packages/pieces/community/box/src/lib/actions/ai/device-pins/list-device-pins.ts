import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';
import { boxUtils } from '../../../common/utils';
import { boxListDevicePinsOutputSchema } from '../../../output-schemas';

const DIRECTIONS = ['ASC', 'DESC'];

export const listDevicePinsAction = createAction({
  auth: boxAuth,
  name: 'box_list_device_pins',
  outputSchema: boxListDevicePinsOutputSchema,
  displayName: 'List Device Pins',
  description: 'Lists the device pins in a Box enterprise.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists one page of the enterprise\'s device pins, each with its ID, owner and product name. Needs admin rights. Get the enterprise ID from Get Current User with Fields "enterprise"; page with Marker (next_marker).',
    idempotent: true,
  },
  props: {
    enterpriseId: boxAiProps.enterpriseId({ required: true }),
    limit: boxAiProps.limit({ required: false }),
    marker: boxAiProps.marker({ required: false }),
    direction: Property.StaticDropdown({
      displayName: 'Direction',
      description: '"ASC" or "DESC".',
      required: false,
      options: { options: DIRECTIONS.map((value) => ({ label: value, value })) },
    }),
  },
  async run({ auth, propsValue }) {
    if (propsValue.direction !== undefined && !DIRECTIONS.includes(propsValue.direction)) {
      throw new Error(`Direction must be one of: ${DIRECTIONS.join(', ')}.`);
    }
    return await boxClient.request({
      auth,
      method: HttpMethod.GET,
      path: `/enterprises/${encodeURIComponent(propsValue.enterpriseId)}/device_pinners`,
      query: {
        marker: propsValue.marker,
        limit: boxUtils.limitParam({ limit: propsValue.limit, max: 1000, fallback: 100 }),
        direction: propsValue.direction,
      },
    });
  },
});
