import slugify from 'slugify';
import { Property, createAction } from '@activepieces/pieces-framework';

export const slugifyAction = createAction({
  audience: 'both',
  description: 'Slugifies strings.',
  aiMetadata: {
    description:
      'Turns a text into a slug by transliterating non-ASCII characters to ASCII, stripping characters outside a small allowed set, and collapsing whitespace runs into hyphens. Use it to derive a path segment or stable identifier from a title; it exposes no options, so use Replace for arbitrary custom character substitution. Case is preserved and some punctuation survives, so the output is not guaranteed to be URL- or filename-safe; deterministic and idempotent.',
    idempotent: true,
  },
  displayName: 'Slugify',
  name: 'slugify',
  props: {
    text: Property.ShortText({
      displayName: 'Text',
      required: true,
    }),
  },
  run: async ({ propsValue }) => {
    return slugify(propsValue.text);
  },
});
