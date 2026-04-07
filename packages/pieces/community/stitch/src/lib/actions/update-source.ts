import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { stitchAuth } from '../../';
import { makeConnectRequest, sourceIdDropdown, StitchSource } from '../common';

export const updateSourceAction = createAction({
  auth: stitchAuth,
  name: 'update_source',
  displayName: 'Update Source',
  description: "Updates an existing data source's display name or connection properties.",
  props: {
    source_id: sourceIdDropdown,
    display_name: Property.ShortText({
      displayName: 'New Display Name',
      description: 'Update the human-readable name for this source. Leave empty to keep the current name.',
      required: false,
    }),
    properties: Property.Json({
      displayName: 'Updated Connection Properties',
      description:
        'Updated source-specific configuration as a JSON object. ' +
        'Only include the fields you want to change. ' +
        'Example: {"host":"new-db.example.com","password":"newpassword"}.',
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
    const source = await makeConnectRequest<StitchSource>(
      auth,
      HttpMethod.PUT,
      `/v4/sources/${context.propsValue.source_id}`,
      body
    );
    return {
      id: source.id,
      display_name: source.display_name,
      type: source.type,
      stitch_client_id: source.stitch_client_id,
      updated_at: source.updated_at,
    };
  },
});
