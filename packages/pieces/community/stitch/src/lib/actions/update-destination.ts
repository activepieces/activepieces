import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { stitchAuth } from '../../';
import {
  makeConnectRequest,
  destinationIdDropdown,
  StitchDestination,
} from '../common';

export const updateDestinationAction = createAction({
  auth: stitchAuth,
  name: 'update_destination',
  displayName: 'Update Destination',
  description: "Updates an existing destination's display name or connection properties.",
  props: {
    destination_id: destinationIdDropdown,
    display_name: Property.ShortText({
      displayName: 'New Display Name',
      description: 'Update the human-readable name for this destination. Leave empty to keep the current name.',
      required: false,
    }),
    properties: Property.Json({
      displayName: 'Updated Connection Properties',
      description:
        'Updated destination-specific connection fields as a JSON object. ' +
        'Only include the fields you want to change. ' +
        'Example: {"password":"newpassword","host":"new-db.example.com"}.',
      required: false,
      defaultValue: {},
    }),
  },
  async run(context) {
    const auth = context.auth as unknown as {
      connect_api_token: string;
      import_api_token: string;
      client_id: string;
    };
    const body: Record<string, unknown> = {};
    if (context.propsValue.display_name) {
      body['display_name'] = context.propsValue.display_name;
    }
    if (
      context.propsValue.properties &&
      Object.keys(context.propsValue.properties).length > 0
    ) {
      body['properties'] = context.propsValue.properties;
    }
    const destination = await makeConnectRequest<StitchDestination>(
      auth,
      HttpMethod.PUT,
      `/v4/destinations/${context.propsValue.destination_id}`,
      body
    );
    return {
      id: destination.id,
      display_name: destination.display_name,
      type: destination.type,
      stitch_client_id: destination.stitch_client_id,
      updated_at: destination.updated_at,
    };
  },
});
