import { createAction, Property } from '@activepieces/pieces-framework';
import { senjaAuth } from '../../';
import { listSenjaLinks, LINK_TYPE_OPTIONS } from '../common';
import { listLinksActionOutputSchema } from '../output-schemas';

export const listLinksAction = createAction({
  auth: senjaAuth,
  name: 'list_links',
  classification: 'SEARCH',
  displayName: 'List Links',
  description:
    'Get the shareable links of your Senja project: forms, widgets, walls of love, case studies, quick links and sizzle reels.',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists the shareable links of the Senja project (forms, widgets, walls of love, case studies, quick links, sizzle reels), each with its ID, name and public URL, optionally narrowed to one link type. Use it to get the form ID that Send Form Invite needs, or a URL to share. Read-only.',
    idempotent: true,
  },
  outputSchema: listLinksActionOutputSchema,
  props: {
    link_type: Property.StaticDropdown({
      displayName: 'Link Type',
      description:
        'Only return links of this type. Leave empty to return all links.',
      required: false,
      options: {
        options: LINK_TYPE_OPTIONS,
      },
    }),
  },
  async run(context) {
    const { link_type } = context.propsValue;
    const links = await listSenjaLinks({ token: context.auth.secret_text });
    return link_type ? links.filter((link) => link.type === link_type) : links;
  },
});
