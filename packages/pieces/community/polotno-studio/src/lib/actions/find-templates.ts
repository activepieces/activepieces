import { Property, createAction } from '@activepieces/pieces-framework';
import { polotnoStudioAuth } from '../auth';
import { createClient } from '../common/client';
import { polotnoConstants } from '../common/constants';
import { sharedProps } from '../common/props';

export const findTemplates = createAction({
  auth: polotnoStudioAuth,
  name: 'find_templates',
  displayName: 'Find Templates',
  description: 'List templates in the project, optionally filtered by name or tag.',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists Polotno Studio templates in the connected project, optionally filtered by name substring or tag, returning a flat array of template records with their ids and names. Choose this to discover which templates exist before rendering. Results stop at Max Results. Read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    name: Property.ShortText({
      displayName: 'Name Contains',
      description: 'Only return templates whose name contains this text.',
      required: false,
    }),
    tag: Property.ShortText({
      displayName: 'Tag',
      required: false,
    }),
    archived: Property.Checkbox({
      displayName: 'Include Archived',
      required: false,
    }),
    max_results: Property.Number({
      displayName: 'Max Results',
      description: `Stop after this many templates. Maximum ${polotnoConstants.MAX_TEMPLATE_RESULTS}.`,
      required: false,
      defaultValue: polotnoConstants.DEFAULT_MAX_TEMPLATE_RESULTS,
    }),
  },
  async run(context) {
    const client = createClient({ apiKey: context.auth.secret_text });
    const props = context.propsValue;
    return sharedProps.fetchAllTemplates({
      client,
      filters: {
        ...(props.name ? { name: props.name } : {}),
        ...(props.tag ? { tag: props.tag } : {}),
        ...(props.archived === true ? { archived: true } : {}),
        maxResults: props.max_results ?? polotnoConstants.DEFAULT_MAX_TEMPLATE_RESULTS,
      },
    });
  },
});
