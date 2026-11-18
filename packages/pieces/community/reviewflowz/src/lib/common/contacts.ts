import { HttpMethod } from '@activepieces/pieces-common';
import { DynamicPropsValue, Property } from '@activepieces/pieces-framework';
import { reviewflowzAuth } from '../auth';
import { reviewflowzApi, ReviewflowzAuthValue } from './client';
import { ReviewflowzContactAttribute } from './types';

async function customAttributes({
  auth,
  exclude,
}: {
  auth: ReviewflowzAuthValue;
  exclude: string[];
}): Promise<ReviewflowzContactAttribute[]> {
  try {
    const attributes = await reviewflowzApi.listAll<ReviewflowzContactAttribute>({ auth, path: '/contact-attributes', max: 200 });
    return attributes.filter((attribute) => !exclude.includes(normalized(attribute.name)));
  } catch {
    return [];
  }
}

function attributesProp() {
  return Property.DynamicProperties({
    auth: reviewflowzAuth,
    displayName: 'Contact fields',
    description: 'Your custom contact fields, like staff name or visit type.',
    required: false,
    refreshers: [],
    props: async ({ auth }): Promise<DynamicPropsValue> => {
      if (!auth) {
        return {};
      }
      const attributes = await customAttributes({ auth, exclude: ['first_name', 'last_name'] });
      return Object.fromEntries(
        attributes.map((attribute) => [
          attribute.name,
          Property.ShortText({ displayName: attribute.name, required: false }),
        ]),
      );
    },
  });
}

function attributesFrom(values: DynamicPropsValue | undefined): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(values ?? {}).filter(([, value]) => value !== undefined && value !== null && value !== ''),
  );
}

async function upsertContact({
  auth,
  contact,
}: {
  auth: ReviewflowzAuthValue;
  contact: ContactInput;
}): Promise<Record<string, unknown>> {
  const row = Object.fromEntries(
    Object.entries({
      email: contact.email,
      phone: contact.phone,
      first_name: contact.first_name,
      last_name: contact.last_name,
    }).filter(([, value]) => Boolean(value)),
  );
  const attributes = contact.attributes ?? {};
  const body = { contacts: [{ ...row, ...(Object.keys(attributes).length > 0 ? { attributes } : {}) }] };
  const answer = await reviewflowzApi.call<{ data: BatchResult[] }>({
    auth,
    method: HttpMethod.POST,
    path: '/contacts/batch',
    body,
  });
  const result = answer.data?.[0];
  if (!result || result.status === 'failed') {
    const detail = (result?.errors ?? []).map((error) => (error.field ? `${error.field}: ${error.detail}` : error.detail)).join(' ');
    throw new Error(detail || 'Reviewflowz could not save this contact.');
  }
  const saved = await reviewflowzApi.call<Record<string, unknown>>({ auth, method: HttpMethod.GET, path: `/contacts/${encodeURIComponent(String(result.id))}` });
  return { ...saved, status: result.status };
}

function normalized(name: string): string {
  return String(name).toLowerCase().replace(/\s+/g, '_');
}

const UNREACHABLE_REASONS: Record<string, string> = {
  invalid_email: 'Their email address failed our check.',
  already_invited: "They already had this campaign's request.",
  no_location: 'They have no location, and this campaign needs one to pick where to send them.',
  channel_unavailable: "This campaign's channel isn't set up on your account yet (Settings > Request sending).",
  no_email: 'They have no email address, and this campaign sends emails.',
  no_phone: 'They have no phone number, and this campaign sends texts.',
  unsubscribed: 'They unsubscribed from review requests on this channel.',
  low_reputation: 'Email sending is paused while your sender reputation recovers.',
  quota_exceeded: 'Your plan has no review requests left this month.',
  subscription_required: 'Review requests need a paid plan.',
  no_credit: 'Your account has no credits left for this channel. Buy credits in the app, or turn on auto-recharge.',
};

export const reviewflowzContacts = {
  customAttributes,
  attributesProp,
  attributesFrom,
  upsertContact,
  UNREACHABLE_REASONS,
};

export type ContactInput = {
  email?: string;
  phone?: string;
  first_name?: string;
  last_name?: string;
  attributes?: Record<string, unknown>;
};

type BatchResult = {
  id: string;
  status: string;
  errors?: { field?: string; detail?: string }[];
};
