import { Property } from '@activepieces/pieces-framework';

export const ghostProps = {
  filter: (example: string) =>
    Property.ShortText({
      displayName: 'Filter',
      description: `A Ghost NQL filter, e.g. ${example}. Quote values that contain spaces or special characters with single quotes.`,
      required: false,
    }),
  limit: Property.Number({
    displayName: 'Limit',
    description: 'How many records to return per page, from 1 to 100. Defaults to 15.',
    required: false,
    defaultValue: 15,
  }),
  page: Property.Number({
    displayName: 'Page',
    description: 'The page number to return. Defaults to 1.',
    required: false,
    defaultValue: 1,
  }),
  order: (example: string) =>
    Property.ShortText({
      displayName: 'Order',
      description: `Sort order as "<field> asc|desc", e.g. ${example}.`,
      required: false,
    }),
  id: (displayName: string, description: string) =>
    Property.ShortText({
      displayName,
      description,
      required: true,
    }),
  slug: (description: string) =>
    Property.ShortText({
      displayName: 'Slug',
      description,
      required: true,
    }),
  triState: (displayName: string, description: string) =>
    Property.StaticDropdown({
      displayName,
      description: `${description} Leave empty to keep the current value.`,
      required: false,
      options: {
        options: [
          { label: 'Yes', value: 'true' },
          { label: 'No', value: 'false' },
        ],
      },
    }),
  newsletterSlug: Property.ShortText({
    displayName: 'Newsletter Slug',
    description:
      'Send the post by email to this newsletter, e.g. "default-newsletter". Get slugs from List Newsletters. Leave empty to publish on the site only.',
    required: false,
  }),
  emailSegment: Property.ShortText({
    displayName: 'Email Segment',
    description:
      'Which members receive the email: "all", "status:free", "status:-free" (paid) or another member NQL filter. Only used with Newsletter Slug. Defaults to all.',
    required: false,
  }),
  emailOnly: Property.Checkbox({
    displayName: 'Email Only',
    description:
      'Send the post as an email to the newsletter without publishing it on the site. Requires Newsletter Slug.',
    required: false,
    defaultValue: false,
  }),
  newsletterIds: (displayName: string, description: string, required: boolean) =>
    Property.Array({
      displayName,
      description,
      required,
    }),
};
