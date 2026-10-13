import { Property } from '@activepieces/pieces-framework';

export const aiProps = {
  campaignId: (required = true) =>
    Property.ShortText({
      displayName: 'Campaign ID',
      description: 'lemlist campaign ID (starts with cam_). Use List Campaigns to find it.',
      required,
    }),
  leadId: () =>
    Property.ShortText({
      displayName: 'Lead ID',
      description: 'lemlist lead ID (starts with lea_), as returned by Create Lead in Campaign or Get Lead by Email.',
      required: true,
    }),
  leadIdOrEmail: () =>
    Property.ShortText({
      displayName: 'Lead ID or Email',
      description: 'The lead ID (lea_...) or the lead email address.',
      required: true,
    }),
  leadEmail: () =>
    Property.ShortText({
      displayName: 'Lead Email',
      description: 'Email address of the lead.',
      required: true,
    }),
  limit: ({ max, fallback }: { max: number; fallback: number }) =>
    Property.Number({
      displayName: 'Limit',
      description: `How many items to return (1-${max}). Default ${fallback}.`,
      required: false,
    }),
  offset: () =>
    Property.Number({
      displayName: 'Offset',
      description: 'How many items to skip, for paging. Default 0.',
      required: false,
    }),
};
