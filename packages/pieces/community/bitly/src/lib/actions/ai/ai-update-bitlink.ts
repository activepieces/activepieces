import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { bitlyAuth } from '../../common/auth';
import { bitlinkPath, bitlyApiCall, normalizeBitlinkId } from '../../common/client';
import { optionalText, parseTriState, tristateOptions } from '../../common/props';
import { bitlinkOutputSchema } from '../../common/schemas';
import { buildUpdateBody } from '../update-bitlink';

export const aiUpdateBitlinkAction = createAction({
  auth: bitlyAuth,
  name: 'ai_update_bitlink',
  classification: 'WRITE',
  displayName: 'Update Bitlink',
  description: 'Change the title, tags or archive state of a Bitlink.',
  audience: 'ai',
  aiMetadata: {
    description: 'Updates a Bitlink by Bitlink ID (e.g. bit.ly/abc123): new title, tags (replace all existing tags), or archived yes (stops redirecting) / no (restores). Fields left empty are not changed. At least one field is required. Idempotent: the same values give the same final state.',
    idempotent: true,
  },
  outputSchema: bitlinkOutputSchema,
  props: {
    bitlink_id: Property.ShortText({ displayName: 'Bitlink ID', description: 'For example bit.ly/abc123.', required: true }),
    title: Property.ShortText({ displayName: 'Title', required: false }),
    tags: Property.ShortText({ displayName: 'Tags', description: 'Comma-separated; replaces all existing tags.', required: false }),
    archived: Property.StaticDropdown<string>({
      displayName: 'Archived',
      description: 'yes archives, no restores; leave empty to keep the current state.',
      required: false,
      options: tristateOptions,
    }),
  },
  async run(context) {
    const { propsValue } = context;
    const id = normalizeBitlinkId(propsValue.bitlink_id);
    const body = buildUpdateBody({
      title: propsValue.title,
      archived: parseTriState({ value: optionalText(propsValue.archived), label: 'Archived' }),
      tags: propsValue.tags,
    });
    if (Object.keys(body).length === 0) {
      throw new Error('Provide at least one of Title, Tags or Archived.');
    }
    return bitlyApiCall({
      method: HttpMethod.PATCH,
      auth: context.auth.props,
      resourceUri: `/bitlinks/${bitlinkPath(id)}`,
      body,
      operation: 'update Bitlink',
    });
  },
});
