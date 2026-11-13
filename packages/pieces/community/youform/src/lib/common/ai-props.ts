import { Property } from '@activepieces/pieces-framework';

import type { PropParams } from './props';

function formSlug<R extends boolean>({
  required,
  displayName = 'Form Slug',
  description = 'The form\'s slug, e.g. "kyir3qrg" (the `slug` field from List Forms, also the last part of the form\'s share link).',
}: PropParams<R>) {
  return Property.ShortText({ displayName, description, required });
}

function page<R extends boolean>({
  required,
  displayName = 'Page',
  description = 'Page number to return, starting at 1. Defaults to 1. Use the returned `current_page` and `last_page` to page through.',
}: PropParams<R>) {
  return Property.Number({ displayName, description, required });
}

export const youformAiProps = { formSlug, page };
