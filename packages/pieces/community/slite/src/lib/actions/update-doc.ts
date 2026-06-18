import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { sliteAuth } from '../auth';
import { sliteApi } from '../common/client';
import { sliteProps } from '../common/props';
import { SliteTileUpdateResponse } from '../common/types';

export const sliteUpdateDocAction = createAction({
  auth: sliteAuth,
  name: 'update_doc',
  displayName: 'Update Doc',
  description:
    'Updates a specific part (tile) of a doc. Fields you leave blank are kept unchanged.',
  audience: 'both',
  aiMetadata: {
    description:
      'Edits a single tile (content block) within a Slite doc, identified by the note id plus the tile id, optionally setting its header, Markdown content, link, icon, and status badge; omitted fields stay unchanged. Choose this for a targeted block-level edit rather than rewriting the whole doc (see Replace Doc for that); the tile id must be copied from the block in Slite. Idempotent: applying the same input to the same tile yields the same final state.',
    idempotent: true,
  },
  props: {
    note_id: sliteProps.noteId({ required: true }),
    tile_id: Property.ShortText({
      displayName: 'Tile ID',
      description:
        'The block to update. In Slite, hover an empty line, open its menu, and choose "Copy block id".',
      required: true,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'New header text for the tile.',
      required: false,
    }),
    content: Property.LongText({
      displayName: 'Content',
      description: 'New Markdown content for the tile.',
      required: false,
    }),
    url: Property.ShortText({
      displayName: 'URL',
      description: 'An external link for the tile.',
      required: false,
    }),
    icon_url: Property.ShortText({
      displayName: 'Icon URL',
      description: 'An icon to display on the tile.',
      required: false,
    }),
    status_label: Property.ShortText({
      displayName: 'Status Label',
      description: 'Text for the tile status badge.',
      required: false,
    }),
    status_color: Property.ShortText({
      displayName: 'Status Color',
      description: 'Status badge color as a hex code, e.g. #2F80ED.',
      required: false,
    }),
  },
  async run(context) {
    const { note_id, tile_id, title, content, url, icon_url, status_label, status_color } =
      context.propsValue;
    const tile = await sliteApi.call<SliteTileUpdateResponse>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.PUT,
      resourceUri: `/notes/${note_id}/tiles/${tile_id}`,
      body: {
        title,
        content,
        url,
        iconURL: icon_url,
        status: status_label
          ? { label: status_label, ...(status_color ? { colorHex: status_color } : {}) }
          : undefined,
      },
    });
    return tile;
  },
});
