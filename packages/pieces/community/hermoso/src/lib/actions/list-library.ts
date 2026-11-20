import { createAction, Property } from '@activepieces/pieces-framework';
import { hermosoAuth } from '../auth';
import { hermosoProps } from '../common/props';
import { hermosoLibrary } from '../common/library';

export const listLibraryAction = createAction({
  auth: hermosoAuth,
  name: 'list_library',
  classification: 'SEARCH',
  displayName: 'List Library Items',
  description: 'Lists the newest images and videos in the brand Library.',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists the images and videos a Hermoso brand has made, newest first, each with its public file URL. Use it to pick existing creative for a post instead of rendering a new one. Read-only; safe to retry.',
    idempotent: true,
  },
  props: {
    brand: hermosoProps.brand,
    type: hermosoLibrary.typeProp,
    limit: Property.Number({
      displayName: 'Limit',
      description: 'How many items to return, from 1 to 60.',
      required: false,
      defaultValue: 30,
    }),
  },
  async run(context) {
    return hermosoLibrary.list({
      apiKey: context.auth.secret_text,
      brand: context.propsValue.brand ?? undefined,
      type: context.propsValue.type ?? 'all',
      limit: context.propsValue.limit,
    });
  },
});
