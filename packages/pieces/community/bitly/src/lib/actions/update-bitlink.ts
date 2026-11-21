import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { bitlinkPath, bitlyApiCall, normalizeBitlinkId } from '../common/client';
import { bitlyAuth } from '../common/auth';
import { bitlinkDropdown, groupGuid, optionalText, parseTriState, toStringList, tristateOptions } from '../common/props';
import { bitlinkOutputSchema } from '../common/schemas';

export const updateBitlinkAction = createAction({
  auth: bitlyAuth,
  name: 'update_bitlink',
  classification: 'WRITE',
  displayName: 'Update Bitlink',
  description: 'Modify properties of an existing Bitlink.',
  audience: 'human',
  outputSchema: bitlinkOutputSchema,
  aiMetadata: { description: 'Updates properties of an existing Bitlink identified by its Bitlink ID, including title, archive status (unchanged unless set), tags (overwrites existing), and mobile app deeplinks. Use to edit or re-tag a known short link; at least one field must be provided. Idempotent: applying the same values repeatedly yields the same final state.', idempotent: true },
  props: {
    group_guid: groupGuid,
    bitlink: bitlinkDropdown,
    title: Property.ShortText({
      displayName: 'Title',
      description: 'New title for the Bitlink.',
      required: false,
    }),
    archived: Property.StaticDropdown<string>({
      displayName: 'Archived',
      description: 'Yes archives the Bitlink, No restores it. Leave empty to keep the current state.',
      required: false,
      options: tristateOptions,
    }),
    tags: Property.Array({
      displayName: 'Tags',
      description: 'Tags to apply (overwrites existing tags).',
      required: false,
    }),
    app_uri_path: Property.ShortText({
      displayName: 'App URI Path',
      description: 'Path within the mobile app (e.g., /product/123).',
      required: false,
    }),
    install_url: Property.LongText({
      displayName: 'App Install URL',
      description: 'URL where users can install the mobile app.',
      required: false,
    }),
    os: Property.StaticDropdown({
      displayName: 'Mobile OS',
      description: 'Target mobile operating system.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'iOS', value: 'ios' },
          { label: 'Android', value: 'android' },
        ],
      },
    }),
    install_type: Property.StaticDropdown({
      displayName: 'Install Type',
      description: 'How to handle app installation.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'No Install', value: 'no_install' },
          { label: 'Auto Install', value: 'auto_install' },
          { label: 'Promote Install', value: 'promote_install' },
        ],
      },
    }),
  },
  async run(context) {
    const { bitlink, title, archived, tags, app_uri_path, install_url, os, install_type } = context.propsValue;
    const id = normalizeBitlinkId(bitlink);
    const deeplink = {
      ...(optionalText(app_uri_path) ? { app_uri_path: optionalText(app_uri_path) } : {}),
      ...(optionalText(install_url) ? { install_url: optionalText(install_url) } : {}),
      ...(optionalText(os) ? { os: optionalText(os) } : {}),
      ...(optionalText(install_type) ? { install_type: optionalText(install_type) } : {}),
    };
    const archivedRaw: unknown = archived;
    const archivedValue = archivedRaw === false ? undefined : parseTriState({ value: archivedRaw, label: 'Archived' });
    const body = buildUpdateBody({ title, archived: archivedValue, tags });
    const fullBody = Object.keys(deeplink).length > 0 ? { ...body, deeplinks: [deeplink] } : body;
    if (Object.keys(fullBody).length === 0) {
      throw new Error('No fields were provided to update. Please provide a title, tags, archive status, or deeplinks.');
    }
    return bitlyApiCall({
      method: HttpMethod.PATCH,
      auth: context.auth.props,
      resourceUri: `/bitlinks/${bitlinkPath(id)}`,
      body: fullBody,
      operation: 'update Bitlink',
    });
  },
});

export function buildUpdateBody({
  title,
  archived,
  tags,
}: {
  title: unknown;
  archived: boolean | undefined;
  tags: unknown;
}): Record<string, unknown> {
  const titleText = optionalText(title);
  const cleanedTags = toStringList(tags);
  const tagList = cleanedTags !== undefined && cleanedTags.length > 0 ? cleanedTags : undefined;
  return {
    ...(titleText !== undefined ? { title: titleText } : {}),
    ...(archived !== undefined ? { archived } : {}),
    ...(tagList !== undefined ? { tags: tagList } : {}),
  };
}
