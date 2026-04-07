import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { stitchAuth } from '../../';
import { makeConnectRequest, sourceIdDropdown } from '../common';

export const updateStreamMetadataAction = createAction({
  auth: stitchAuth,
  name: 'update_stream_metadata',
  displayName: 'Update Stream Selection',
  description:
    'Selects or deselects streams (tables) and fields for replication in a data source.',
  props: {
    source_id: sourceIdDropdown,
    streams: Property.Json({
      displayName: 'Stream Selections',
      description:
        'A JSON array describing which streams (tables) to select for replication. ' +
        'Each item needs a tap_stream_id and metadata.selected flag. Example:\n' +
        '```json\n' +
        '[\n' +
        '  {\n' +
        '    "tap_stream_id": "public-orders",\n' +
        '    "metadata": [\n' +
        '      {"breadcrumb": [], "metadata": {"selected": true, "replication-method": "FULL_TABLE"}}\n' +
        '    ]\n' +
        '  }\n' +
        ']\n' +
        '```\n' +
        'Use the "List Streams" action to discover available tap_stream_id values.',
      required: true,
    }),
  },
  async run(context) {
    const auth = context.auth as unknown as {
      connect_api_token: string;
      import_api_token: string;
      client_id: string;
    };
    const result = await makeConnectRequest<unknown>(
      auth,
      HttpMethod.PUT,
      `/v4/sources/${context.propsValue.source_id}/streams/metadata`,
      { streams: context.propsValue.streams }
    );
    return result;
  },
});
