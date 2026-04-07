import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { stitchAuth } from '../../';
import { makeConnectRequest, sourceIdDropdown, StitchStream } from '../common';

export const listStreamsAction = createAction({
  auth: stitchAuth,
  name: 'list_streams',
  displayName: 'List Streams',
  description:
    'Returns all available streams (tables) for a data source and their current replication selection status.',
  props: {
    source_id: sourceIdDropdown,
  },
  async run(context) {
    const auth = context.auth as unknown as {
      connect_api_token: string;
      import_api_token: string;
      client_id: string;
    };
    const streams = await makeConnectRequest<{ streams: StitchStream[] }>(
      auth,
      HttpMethod.GET,
      `/v4/sources/${context.propsValue.source_id}/streams`
    );
    return (streams.streams ?? []).map((s) => ({
      stream_id: s.stream_id,
      stream_name: s.stream_name,
      tap_stream_id: s.tap_stream_id,
      selected: s.metadata?.selected ?? false,
      replication_method: s.metadata?.replication_method ?? null,
      is_view: s.metadata?.is_view ?? null,
      row_count: s.metadata?.row_count ?? null,
    }));
  },
});
