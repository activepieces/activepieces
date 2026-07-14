import { createAction, Property } from '@activepieces/pieces-framework';
import { randomUUID } from 'crypto';
import { pinterestConversionsAuth } from '../common/auth';
import {
  ConversionEvent,
  pinterestConversionsClient,
} from '../common/client';
import { identityHashing } from '../common/hashing';

export const sendConversionEvent = createAction({
  auth: pinterestConversionsAuth,
  name: 'send_conversion_event',
  displayName: 'Send Conversion Event',
  description:
    'Send a single web, app, or offline conversion event to Pinterest via the Conversions API.',
  audience: 'both',
  aiMetadata: {
    description:
      'Send one server-side conversion event (checkout, lead, page_visit, etc.) to Pinterest for the connected ad account. Customer identifiers such as email and phone are automatically normalized and SHA-256 hashed. Provide the same event_id here as on the Pinterest tag to deduplicate; each call otherwise records a new event, so retries with a fresh event_id double-count. Use Test Mode to validate the payload without recording.',
    idempotent: false,
  },
  props: {
    event_name: Property.StaticDropdown({
      displayName: 'Event Name',
      description: 'The type of conversion that occurred.',
      required: true,
      options: {
        options: [
          { label: 'Page Visit', value: 'page_visit' },
          { label: 'View Category', value: 'view_category' },
          { label: 'Search', value: 'search' },
          { label: 'Add to Cart', value: 'add_to_cart' },
          { label: 'Checkout', value: 'checkout' },
          { label: 'Lead', value: 'lead' },
          { label: 'Sign Up', value: 'signup' },
          { label: 'Watch Video', value: 'watch_video' },
          { label: 'Custom', value: 'custom' },
        ],
      },
    }),
    custom_event_name: Property.ShortText({
      displayName: 'Custom Event Name',
      description:
        'Required when Event Name is "Custom". Use 1–100 letters, numbers, underscores, or hyphens.',
      required: false,
    }),
    action_source: Property.StaticDropdown({
      displayName: 'Action Source',
      description: 'Where the conversion happened.',
      required: true,
      options: {
        options: [
          { label: 'Web', value: 'web' },
          { label: 'Offline', value: 'offline' },
          { label: 'Android App', value: 'app_android' },
          { label: 'iOS App', value: 'app_ios' },
        ],
      },
    }),
    event_time: Property.Number({
      displayName: 'Event Time',
      description:
        'Unix timestamp in seconds of when the event happened. Leave empty to use the current time.',
      required: false,
    }),
    event_id: Property.ShortText({
      displayName: 'Event ID',
      description:
        'Unique ID used to deduplicate this event against the Pinterest tag. Use the same value on both sides. Leave empty to generate one automatically.',
      required: false,
    }),
    event_source_url: Property.ShortText({
      displayName: 'Event Source URL',
      description: 'The URL where a web conversion happened.',
      required: false,
    }),
    opt_out: Property.Checkbox({
      displayName: 'Opt Out',
      description:
        'Whether the user opted out of tracking / ad personalization for this event.',
      required: false,
    }),
    customer_info: Property.MarkDown({
      value:
        '### Customer Information\nProvide at least **one** of: Email, Mobile Advertising ID, or both Client IP Address **and** Client User Agent. Personal identifiers are automatically normalized and SHA-256 hashed before sending — enter the raw values.',
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Customer email address. Hashed automatically.',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone Number',
      description:
        'Customer phone number including country code. Hashed automatically (symbols and spaces are stripped).',
      required: false,
    }),
    first_name: Property.ShortText({
      displayName: 'First Name',
      required: false,
    }),
    last_name: Property.ShortText({
      displayName: 'Last Name',
      required: false,
    }),
    city: Property.ShortText({
      displayName: 'City',
      required: false,
    }),
    state: Property.ShortText({
      displayName: 'State',
      description: 'Two-letter state/region code (e.g. "ca").',
      required: false,
    }),
    zip: Property.ShortText({
      displayName: 'ZIP Code',
      description:
        'Numeric ZIP code. Pinterest accepts digits only; symbols and spaces are removed before hashing.',
      required: false,
    }),
    country: Property.ShortText({
      displayName: 'Country',
      description: 'Two-letter ISO-3166 country code (e.g. "us").',
      required: false,
    }),
    gender: Property.StaticDropdown({
      displayName: 'Gender',
      required: false,
      options: {
        options: [
          { label: 'Female', value: 'f' },
          { label: 'Male', value: 'm' },
          { label: 'Non-binary', value: 'n' },
        ],
      },
    }),
    date_of_birth: Property.ShortText({
      displayName: 'Date of Birth',
      description: 'Format YYYYMMDD (e.g. "19901225"). Hashed automatically.',
      required: false,
    }),
    external_id: Property.ShortText({
      displayName: 'External ID',
      description:
        'Your own unique identifier for the user (e.g. loyalty or account ID). Hashed automatically.',
      required: false,
    }),
    maid: Property.ShortText({
      displayName: 'Mobile Advertising ID (MAID)',
      description:
        "The user's GAID (Android) or IDFA (iOS). Hashed automatically.",
      required: false,
    }),
    client_ip_address: Property.ShortText({
      displayName: 'Client IP Address',
      description: "The user's IP address (IPv4 or IPv6). Sent unhashed.",
      required: false,
    }),
    client_user_agent: Property.ShortText({
      displayName: 'Client User Agent',
      description: "The user's browser user-agent string. Sent unhashed.",
      required: false,
    }),
    click_id: Property.ShortText({
      displayName: 'Click ID',
      description:
        'The value of the _epik cookie or the epik query parameter from the landing URL.',
      required: false,
    }),
    partner_id: Property.ShortText({
      displayName: 'Partner ID',
      description: 'A third-party partner identifier (e.g. RampID).',
      required: false,
    }),
    event_details: Property.MarkDown({
      value: '### Event Details (optional)',
    }),
    currency: Property.ShortText({
      displayName: 'Currency',
      description: 'ISO-4217 currency code (e.g. "USD"). Defaults to the ad account currency.',
      required: false,
    }),
    value: Property.Number({
      displayName: 'Value',
      description: 'Total value of the event (e.g. order total). Recommend pre-tax, pre-shipping.',
      required: false,
    }),
    content_ids: Property.Array({
      displayName: 'Content IDs',
      description: 'Product IDs associated with the event.',
      required: false,
    }),
    content_name: Property.ShortText({
      displayName: 'Content Name',
      required: false,
    }),
    content_category: Property.ShortText({
      displayName: 'Content Category',
      required: false,
    }),
    content_brand: Property.ShortText({
      displayName: 'Content Brand',
      required: false,
    }),
    num_items: Property.Number({
      displayName: 'Number of Items',
      description: 'Total number of products in the event.',
      required: false,
    }),
    order_id: Property.ShortText({
      displayName: 'Order ID',
      description: 'Helps Pinterest deduplicate events. Recommended for checkouts.',
      required: false,
    }),
    search_string: Property.ShortText({
      displayName: 'Search String',
      description: 'The search term for a search event.',
      required: false,
    }),
    advanced: Property.MarkDown({
      value: '### Advanced (optional)',
    }),
    partner_name: Property.ShortText({
      displayName: 'Partner Name',
      description:
        'For third parties sending on behalf of an advertiser. Lowercase "ss-partnername".',
      required: false,
    }),
    test_mode: Property.Checkbox({
      displayName: 'Test Mode',
      description:
        'When enabled, the event is validated but NOT recorded. Use to verify your setup, then turn off for live events.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const props = context.propsValue;
    const eventName = resolveEventName({
      eventName: props.event_name,
      customEventName: props.custom_event_name,
    });

    const userData = buildUserData(props);
    if (!hasRequiredMatchKey(userData)) {
      throw new Error(
        'At least one customer identifier is required: provide Email, a Mobile Advertising ID, or both Client IP Address and Client User Agent.'
      );
    }

    const customData = buildCustomData(props);

    const event: ConversionEvent = {
      event_name: eventName,
      action_source: props.action_source,
      event_time: props.event_time ?? Math.floor(Date.now() / 1000),
      event_id: notBlank(props.event_id) ? props.event_id.trim() : randomUUID(),
      ...(notBlank(props.event_source_url)
        ? { event_source_url: props.event_source_url.trim() }
        : {}),
      ...(props.opt_out == null ? {} : { opt_out: props.opt_out }),
      ...(notBlank(props.partner_name)
        ? { partner_name: props.partner_name.trim() }
        : {}),
      user_data: userData,
      ...(Object.keys(customData).length > 0 ? { custom_data: customData } : {}),
    };

    const response = await pinterestConversionsClient.sendEvents({
      conversionToken: context.auth.props.conversion_token,
      adAccountId: context.auth.props.ad_account_id,
      events: [event],
      test: props.test_mode ?? false,
    });

    if (response.num_events_processed < response.num_events_received) {
      const reasons = response.events
        .filter((e) => e.status === 'failed')
        .map((e) => e.error_message)
        .filter(notBlank);
      throw new Error(
        reasons.length > 0
          ? `Pinterest did not process the event: ${reasons.join('; ')}`
          : 'Pinterest did not process the event. Check the ad account, token, and event fields.'
      );
    }

    return response;
  },
});

function resolveEventName(params: {
  eventName: string;
  customEventName?: string;
}): string {
  const { eventName, customEventName } = params;
  if (eventName !== 'custom') {
    return eventName;
  }
  if (!notBlank(customEventName)) {
    throw new Error(
      'Custom Event Name is required when Event Name is "Custom".'
    );
  }
  const trimmedName = customEventName.trim();
  if (!/^[A-Za-z0-9_-]{1,100}$/.test(trimmedName)) {
    throw new Error(
      'Custom Event Name must be 1–100 characters and contain only letters, numbers, underscores, or hyphens.'
    );
  }
  return trimmedName;
}

function notBlank(value: string | undefined | null): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function passthrough(value: string | undefined): string | undefined {
  return notBlank(value) ? value.trim() : undefined;
}

function buildUserData(props: ActionProps): Record<string, unknown> {
  const hashedArray = (value: string | undefined): string[] | undefined => {
    return undefined === value ? undefined : wrap(value);
  };
  const userData: Record<string, unknown> = {
    em: hashedArray(identityHashing.email(props.email)),
    ph: hashedArray(identityHashing.phone(props.phone)),
    fn: hashedArray(identityHashing.firstName(props.first_name)),
    ln: hashedArray(identityHashing.lastName(props.last_name)),
    ct: hashedArray(identityHashing.city(props.city)),
    st: hashedArray(identityHashing.state(props.state)),
    zp: hashedArray(identityHashing.zip(props.zip)),
    country: hashedArray(identityHashing.country(props.country)),
    ge: hashedArray(identityHashing.gender(props.gender)),
    db: hashedArray(identityHashing.dateOfBirth(props.date_of_birth)),
    external_id: hashedArray(identityHashing.externalId(props.external_id)),
    hashed_maids: hashedArray(identityHashing.maid(props.maid)),
    client_ip_address: passthrough(props.client_ip_address),
    client_user_agent: passthrough(props.client_user_agent),
    click_id: passthrough(props.click_id),
    partner_id: passthrough(props.partner_id),
  };
  return compact(userData);
}

function buildCustomData(props: ActionProps): Record<string, unknown> {
  const contentIds = (props.content_ids ?? [])
    .map((id) => String(id).trim())
    .filter((id) => id.length > 0);
  const customData: Record<string, unknown> = {
    currency: passthrough(props.currency),
    value: props.value == null ? undefined : String(props.value),
    content_ids: contentIds.length > 0 ? contentIds : undefined,
    content_name: passthrough(props.content_name),
    content_category: passthrough(props.content_category),
    content_brand: passthrough(props.content_brand),
    num_items: props.num_items,
    order_id: passthrough(props.order_id),
    search_string: passthrough(props.search_string),
  };
  return compact(customData);
}

function hasRequiredMatchKey(userData: Record<string, unknown>): boolean {
  const hasEmail = Array.isArray(userData['em']);
  const hasMaid = Array.isArray(userData['hashed_maids']);
  const hasIpAndUa =
    userData['client_ip_address'] !== undefined &&
    userData['client_user_agent'] !== undefined;
  return hasEmail || hasMaid || hasIpAndUa;
}

function wrap(value: string): string[] {
  return [value];
}

function compact(record: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(record).filter(
      ([, value]) => value !== undefined && value !== null && value !== ''
    )
  );
}

type ActionProps = {
  email?: string;
  phone?: string;
  first_name?: string;
  last_name?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  gender?: string;
  date_of_birth?: string;
  external_id?: string;
  maid?: string;
  client_ip_address?: string;
  client_user_agent?: string;
  click_id?: string;
  partner_id?: string;
  currency?: string;
  value?: number;
  content_ids?: unknown[];
  content_name?: string;
  content_category?: string;
  content_brand?: string;
  num_items?: number;
  order_id?: string;
  search_string?: string;
};
