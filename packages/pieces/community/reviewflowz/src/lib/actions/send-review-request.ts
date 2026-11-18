import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, DynamicPropsValue, Property } from '@activepieces/pieces-framework';
import { reviewflowzAuth } from '../auth';
import { reviewflowzCampaigns } from '../common/campaigns';
import { reviewflowzApi } from '../common/client';
import { reviewflowzContacts } from '../common/contacts';
import { reviewflowzProps } from '../common/props';

export const sendReviewRequestAction = createAction({
  auth: reviewflowzAuth,
  name: 'send_review_request',
  classification: 'WRITE',
  displayName: 'Send Review Request',
  description: 'Adds a customer to a review-request campaign, which sends them its request on its schedule.',
  audience: 'both',
  aiMetadata: {
    description:
      "Add one customer to a Reviewflowz review-request campaign; the campaign then sends its email or text on its own schedule, with Reviewflowz's send checks, credits and opt-outs applied. Needs the customer's email for email campaigns or phone for text campaigns. A customer already in the campaign is not asked twice, so a retry does not send a second request.",
    idempotent: true,
  },
  props: {
    campaign: reviewflowzProps.campaign(
      'The campaign that asks this customer for a review. Its channel, message, timing and review page apply.',
    ),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Where the request goes for email campaigns, like maya.chen@example.com. Email or phone is needed.',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone number',
      description: 'Where the request goes for text campaigns. International format is safest, like +14155550100.',
      required: false,
    }),
    first_name: Property.ShortText({
      displayName: 'First name',
      description: 'Fills {{first_name}} in the message.',
      required: false,
    }),
    last_name: Property.ShortText({ displayName: 'Last name', required: false }),
    location: reviewflowzProps.optionalLocation(
      'Where the customer came in: it decides which listing they are asked to review. Needed when your account has several locations.',
    ),
    contact_fields: Property.DynamicProperties({
      auth: reviewflowzAuth,
      displayName: 'Contact fields',
      description: 'Your custom contact fields (staff name, visit type...), used as merge fields in the message.',
      required: false,
      refreshers: ['campaign'],
      props: async ({ auth, campaign }): Promise<DynamicPropsValue> => {
        if (!auth) {
          return {};
        }
        const attributes = await reviewflowzContacts.customAttributes({
          auth,
          exclude: ['first_name', 'last_name', 'email', 'phone', 'phone_number'],
        });
        const fields = Object.fromEntries(
          attributes.map((attribute) => [
            attribute.name,
            attribute.data_type === 'number'
              ? Property.Number({ displayName: attribute.name, description: `Fills {{${attribute.name}}} in the message.`, required: false })
              : attribute.data_type === 'boolean'
                ? Property.Checkbox({ displayName: attribute.name, description: `Fills {{${attribute.name}}} in the message.`, required: false })
                : Property.ShortText({ displayName: attribute.name, description: `Fills {{${attribute.name}}} in the message.`, required: false }),
          ]),
        );
        if (typeof campaign !== 'string' || campaign === '') {
          return fields;
        }
        const chosen = await reviewflowzCampaigns.getCampaign({ auth, id: campaign });
        if (chosen.state === 'active') {
          return fields;
        }
        return {
          campaign_off_notice: Property.MarkDown({
            value: `**${chosen.name} is off.** People added while a campaign is off never get its request. Turn it on in Reviewflowz (or with the Turn on Campaign action) before this flow runs.`,
          }),
          ...fields,
        };
      },
    }),
    when_already_in: Property.StaticDropdown({
      displayName: 'If they are already in this campaign',
      required: false,
      defaultValue: 'skip',
      options: {
        options: [
          { label: 'Carry on (they had their request)', value: 'skip' },
          { label: 'Stop the flow with an error', value: 'error' },
        ],
      },
    }),
    when_off: Property.StaticDropdown({
      displayName: 'If the campaign is off',
      description: 'People added while a campaign is off never get its request.',
      required: false,
      defaultValue: 'error',
      options: {
        options: [
          { label: 'Stop the flow with an error', value: 'error' },
          { label: 'Add them anyway (no request is sent)', value: 'add' },
        ],
      },
    }),
  },
  async run(context) {
    const { auth, propsValue: input } = context;
    const campaign = await reviewflowzCampaigns.getCampaign({ auth, id: input.campaign });
    const texting = campaign.channel === 'sms' || campaign.channel === 'whatsapp';
    if (texting ? !input.phone : !input.email) {
      throw new Error(
        texting
          ? `${campaign.name} sends texts, and this customer has no phone number. Map the customer's phone into "Phone number".`
          : `${campaign.name} sends emails, and this customer has no email. Map the customer's email into "Email".`,
      );
    }
    if (campaign.state !== 'active' && input.when_off !== 'add') {
      throw new Error(
        `${campaign.name} is off, so ${input.email || input.phone || 'this customer'} would never get its request. Turn the campaign on in Reviewflowz, or set "If the campaign is off" to add them anyway.`,
      );
    }

    const attributes = reviewflowzContacts.attributesFrom(
      Object.fromEntries(Object.entries(input.contact_fields ?? {}).filter(([key]) => key !== 'campaign_off_notice')),
    );
    const contact = Object.fromEntries(
      Object.entries({
        email: input.email,
        phone: input.phone,
        first_name: input.first_name,
        last_name: input.last_name,
        location: input.location,
        ...(Object.keys(attributes).length > 0 ? { attributes } : {}),
      }).filter(([, value]) => value !== undefined && value !== null && value !== ''),
    );

    const response = await reviewflowzApi.send<{ data: { contact?: string; sends?: boolean; unreachable?: string }[] }>({
      auth,
      method: HttpMethod.POST,
      path: `/campaigns/${encodeURIComponent(String(input.campaign))}/contacts`,
      body: { contacts: [contact], confirm: true },
    });

    const base = {
      campaign: campaign.id,
      campaign_name: campaign.name,
      channel: campaign.channel,
      email: input.email || null,
      phone: input.phone || null,
    };

    if (!response.ok) {
      if (response.status === 422 && input.when_already_in !== 'error' && alreadyInCampaign(response.body)) {
        return {
          result: 'already_in_campaign',
          sent: false,
          message: "Already in this campaign: they don't get a second request.",
          reason: 'already_in_campaign',
          contact_id: null,
          ...base,
        };
      }
      throw new Error(reviewflowzApi.errorMessage({ status: response.status, body: response.body }));
    }

    const row = response.body.data?.[0] ?? {};
    const reason = row.unreachable;
    const whyNot =
      (reason ? reviewflowzContacts.UNREACHABLE_REASONS[reason] : undefined) ||
      (campaign.state !== 'active' ? 'the campaign is off.' : reason || 'see the contact in Reviewflowz.');
    return {
      result: row.sends ? 'request_on_its_way' : 'added_without_request',
      sent: Boolean(row.sends),
      message: row.sends
        ? `Added to ${campaign.name}. The request goes out on the campaign's schedule.`
        : `Added to ${campaign.name}, but no request goes out: ${whyNot}`,
      reason: reason || (row.sends ? null : campaign.state !== 'active' ? 'campaign_off' : null),
      contact_id: row.contact ?? null,
      ...base,
    };
  },
});

function alreadyInCampaign(body: unknown): boolean {
  if (typeof body !== 'object' || body === null || !('errors' in body) || !Array.isArray(body.errors)) {
    return false;
  }
  const errors: unknown[] = body.errors;
  return (
    errors.length > 0 &&
    errors.every(
      (error) =>
        typeof error === 'object' &&
        error !== null &&
        'detail' in error &&
        /already in this campaign/i.test(String(error.detail)),
    )
  );
}
