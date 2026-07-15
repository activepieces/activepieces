import { createAction, Property } from '@activepieces/pieces-framework';
import { randomUUID } from 'crypto';
import { redditConversionsAuth } from '../auth';
import {
  ConversionApiResponse,
  ConversionEvent,
  redditConversionsClient,
} from '../common/client';
import { redditConversionEventUtils } from '../common/event-utils';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const FIVE_MINUTES_MS = 5 * 60 * 1000;

// Per Reddit's event-metadata support matrix, these fields are only accepted on
// certain event types (https://business.reddithelp.com/s/article/about-event-metadata).
const ITEM_COUNT_EVENTS = new Set([
  'PURCHASE',
  'ADD_TO_CART',
  'ADD_TO_WISHLIST',
  'CUSTOM',
]);
const VALUE_EVENTS = new Set([
  'PURCHASE',
  'ADD_TO_CART',
  'ADD_TO_WISHLIST',
  'LEAD',
  'SIGN_UP',
  'CUSTOM',
]);

export const sendConversionEvent = createAction({
  auth: redditConversionsAuth,
  name: 'send_conversion_event',
  displayName: 'Send Conversion Event',
  description:
    'Send a single web, app, or offline conversion event to Reddit via the Conversions API (v3).',
  audience: 'both',
  aiMetadata: {
    description:
      'Send one server-side conversion event (Purchase, Lead, Sign Up, etc.) to Reddit for the connected pixel using Conversions API v3. Customer identifiers such as email and phone are automatically normalized and SHA-256 hashed. At least one attribution signal is required (Click ID, Email, Phone, External ID, IP Address, Mobile Advertising ID, or Reddit UUID). Provide the same Conversion ID here as on the Reddit Pixel to deduplicate; each call otherwise records a new event, so retries with a fresh Conversion ID double-count. Set a Test ID (from the Event testing tab in Events Manager) to validate without recording live conversions.',
    idempotent: false,
  },
  props: {
    event_type: Property.StaticDropdown({
      displayName: 'Event Type',
      description: 'The type of conversion that occurred.',
      required: true,
      options: {
        options: [
          { label: 'Page Visit', value: 'PAGE_VISIT' },
          { label: 'View Content', value: 'VIEW_CONTENT' },
          { label: 'Search', value: 'SEARCH' },
          { label: 'Add to Cart', value: 'ADD_TO_CART' },
          { label: 'Add to Wishlist', value: 'ADD_TO_WISHLIST' },
          { label: 'Purchase', value: 'PURCHASE' },
          { label: 'Lead', value: 'LEAD' },
          { label: 'Sign Up', value: 'SIGN_UP' },
          { label: 'Custom', value: 'CUSTOM' },
        ],
      },
    }),
    custom_event_name: Property.ShortText({
      displayName: 'Custom Event Name',
      description:
        'Required when Event Type is "Custom". Your own event name, at most 64 characters.',
      required: false,
    }),
    action_source: Property.StaticDropdown({
      displayName: 'Action Source',
      description: 'Where the conversion happened.',
      required: true,
      defaultValue: 'WEBSITE',
      options: {
        options: [
          { label: 'Website', value: 'WEBSITE' },
          { label: 'App', value: 'APP' },
          { label: 'Physical Store', value: 'PHYSICAL_STORE' },
          { label: 'Other', value: 'OTHER' },
        ],
      },
    }),
    event_at: Property.DateTime({
      displayName: 'Event Time',
      description:
        'When the event happened. Must be within the last 7 days. Leave empty to use the current time.',
      required: false,
    }),
    event_source_url: Property.ShortText({
      displayName: 'Event Source URL',
      description:
        'The page URL where a website conversion happened (used for domain detection). Only sent for the Website action source. Append the Click ID to the URL for better attribution.',
      required: false,
    }),
    click_id: Property.ShortText({
      displayName: 'Click ID',
      description:
        'The Reddit click ID (the "rdt_cid" value) captured from the landing page URL. The strongest attribution signal.',
      required: false,
    }),
    conversion_id: Property.ShortText({
      displayName: 'Conversion ID',
      description:
        'Unique ID used to deduplicate this event against the Reddit Pixel. Use the same value on both sides. Leave empty to generate one automatically.',
      required: false,
    }),
    customer_info: Property.MarkDown({
      value:
        '### Customer Information\nProvide at least **one** attribution signal: Click ID, Email, Phone, External ID, IP Address, Mobile Advertising ID, or Reddit UUID. Email, phone, external ID, and mobile advertising IDs are automatically normalized and SHA-256 hashed before sending — enter the raw values. IP address, user agent, and Reddit UUID are sent unhashed, as Reddit requires.',
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Customer email address. Hashed automatically.',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone Number',
      description:
        'Customer phone number in E.164 format (e.g. "+14155552671"). Hashed automatically (symbols and spaces are stripped).',
      required: false,
    }),
    external_id: Property.ShortText({
      displayName: 'External ID',
      description:
        'Your own unique identifier for the user (e.g. loyalty or account ID). Hashed automatically.',
      required: false,
    }),
    ip_address: Property.ShortText({
      displayName: 'IP Address',
      description: "The user's IP address (IPv4 or IPv6). Sent unhashed.",
      required: false,
    }),
    user_agent: Property.ShortText({
      displayName: 'User Agent',
      description: "The user's browser user-agent string. Sent unhashed.",
      required: false,
    }),
    uuid: Property.ShortText({
      displayName: 'Reddit UUID',
      description:
        'The value of the first-party "_rdt_uuid" cookie set by the Reddit Pixel. Sent unhashed.',
      required: false,
    }),
    idfa: Property.ShortText({
      displayName: 'IDFA (iOS)',
      description: "The user's iOS advertising identifier. Hashed automatically.",
      required: false,
    }),
    aaid: Property.ShortText({
      displayName: 'AAID (Android)',
      description: "The user's Android advertising identifier. Hashed automatically.",
      required: false,
    }),
    privacy_info: Property.MarkDown({
      value: '### Privacy (optional)',
    }),
    limited_data_use: Property.Checkbox({
      displayName: 'Limited Data Use (LDU)',
      description:
        'Enable Limited Data Use for this event (e.g. for users in regions with data-processing restrictions).',
      required: false,
    }),
    dpo_country: Property.ShortText({
      displayName: 'Data Processing Country',
      description: 'Two-letter ISO-3166-1 alpha-2 country code (e.g. "US").',
      required: false,
    }),
    dpo_region: Property.ShortText({
      displayName: 'Data Processing Region',
      description: 'ISO-3166-2 region code (e.g. "US-CA").',
      required: false,
    }),
    event_details: Property.MarkDown({
      value: '### Event Details (optional)',
    }),
    currency: Property.ShortText({
      displayName: 'Currency',
      description:
        'ISO-4217 currency code (e.g. "USD"). Only set for revenue-related events.',
      required: false,
    }),
    value: Property.Number({
      displayName: 'Value',
      description:
        'Total value of the event in the base unit of the currency (e.g. 19.99 for $19.99). Only set for revenue-related events.',
      required: false,
    }),
    item_count: Property.Number({
      displayName: 'Item Count',
      description: 'Total number of items in the event.',
      required: false,
    }),
    products: Property.Array({
      displayName: 'Products',
      description: 'The products associated with the conversion event.',
      required: false,
      properties: {
        id: Property.ShortText({
          displayName: 'Product ID',
          description: 'The product ID from your catalog.',
          required: false,
        }),
        name: Property.ShortText({
          displayName: 'Product Name',
          required: false,
        }),
        category: Property.ShortText({
          displayName: 'Category',
          required: false,
        }),
        item_price: Property.Number({
          displayName: 'Item Price',
          required: false,
        }),
        quantity: Property.Number({
          displayName: 'Quantity',
          required: false,
        }),
      },
    }),
    advanced: Property.MarkDown({
      value: '### Advanced (optional)',
    }),
    screen_width: Property.Number({
      displayName: 'Screen Width',
      description: "The width of the user's screen in pixels.",
      required: false,
    }),
    screen_height: Property.Number({
      displayName: 'Screen Height',
      description: "The height of the user's screen in pixels.",
      required: false,
    }),
    test_id: Property.ShortText({
      displayName: 'Test ID',
      description:
        'When set, the event is sent as a test event using this ID and is NOT counted as a live conversion. Enter the Test ID from the Event testing tab in Events Manager, then watch events arrive there. Leave empty for live events.',
      required: false,
    }),
  },
  async run(context) {
    const props = context.propsValue;

    if (props.event_type === 'CUSTOM' && !notBlank(props.custom_event_name)) {
      throw new Error(
        'Custom Event Name is required when Event Type is "Custom".'
      );
    }

    if (notBlank(props.custom_event_name) && props.custom_event_name.trim().length > 64) {
      throw new Error('Custom Event Name must be at most 64 characters.');
    }

    const user = redditConversionEventUtils.buildUserData(props);
    if (!redditConversionEventUtils.hasAttributionSignal({ props, user })) {
      throw new Error(
        'At least one attribution signal is required: provide a Click ID, Email, Phone, External ID, IP Address, Mobile Advertising ID, or Reddit UUID.'
      );
    }

    const eventAt = resolveEventAt(props.event_at);
    const metadata = removeUnsupportedFields({
      eventType: props.event_type,
      metadata: buildMetadata(props),
    });

    const event: ConversionEvent = {
      event_at: eventAt,
      action_source: props.action_source,
      type: {
        tracking_type: props.event_type,
        ...(props.event_type === 'CUSTOM'
          ? { custom_event_name: props.custom_event_name?.trim() }
          : {}),
      },
      ...(props.action_source === 'WEBSITE' && notBlank(props.event_source_url)
        ? { event_source_url: props.event_source_url.trim() }
        : {}),
      ...(notBlank(props.click_id) ? { click_id: props.click_id.trim() } : {}),
      user,
      metadata,
    };

    const response = await redditConversionsClient.sendEvents({
      conversionToken: context.auth.props.conversion_token,
      pixelId: context.auth.props.pixel_id,
      events: [event],
      testId: notBlank(props.test_id) ? props.test_id.trim() : undefined,
    });

    const processed = extractProcessedCount(response);
    if (processed !== undefined && processed < 1) {
      throw new Error(
        'Reddit accepted the request but processed 0 conversion events. Check the event fields and identifiers, then retry.'
      );
    }

    return {
      delivered: true,
      events_sent: 1,
      events_processed: processed ?? 1,
      test_event: notBlank(props.test_id),
      event_type: event.type.tracking_type,
      conversion_id: metadata['conversion_id'],
      message: response.data?.message,
      response,
    };
  },
});

function notBlank(value: string | undefined | null): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function passthrough(value: string | undefined): string | undefined {
  return notBlank(value) ? value.trim() : undefined;
}

// Reddit's Conversions API v3 expects event_at as an int64 Unix epoch in milliseconds.
function resolveEventAt(input: string | undefined): number {
  if (!notBlank(input)) {
    return Date.now();
  }
  const parsed = new Date(input).getTime();
  if (Number.isNaN(parsed)) {
    throw new Error('Event Time is not a valid date.');
  }
  const now = Date.now();
  if (now - parsed > SEVEN_DAYS_MS) {
    throw new Error('Event Time must be within the last 7 days.');
  }
  if (parsed - now > FIVE_MINUTES_MS) {
    throw new Error('Event Time cannot be more than 5 minutes in the future.');
  }
  return parsed;
}

function buildMetadata(props: ActionProps): Record<string, unknown> {
  const products = buildProducts(props.products);
  const metadata: Record<string, unknown> = {
    conversion_id: notBlank(props.conversion_id)
      ? props.conversion_id.trim()
      : randomUUID(),
    currency: passthrough(props.currency),
    value: props.value,
    item_count: props.item_count,
    ...(products.length > 0 ? { products } : {}),
  };
  return compact(metadata);
}

function buildProducts(products: unknown[] | undefined): Record<string, unknown>[] {
  if (!Array.isArray(products)) {
    return [];
  }
  return products
    .filter(
      (product): product is Record<string, unknown> =>
        typeof product === 'object' && product !== null
    )
    .map((product) =>
      compact({
        id: passthrough(readString(product['id'])),
        name: passthrough(readString(product['name'])),
        category: passthrough(readString(product['category'])),
        item_price: readNumber(product['item_price']),
        quantity: readNumber(product['quantity']),
      })
    )
    .filter((product) => Object.keys(product).length > 0);
}

function readString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function readNumber(value: unknown): number | undefined {
  return typeof value === 'number' ? value : undefined;
}

function removeUnsupportedFields(params: {
  eventType: string;
  metadata: Record<string, unknown>;
}): Record<string, unknown> {
  const { eventType, metadata } = params;
  return Object.fromEntries(
    Object.entries(metadata).filter(([key]) => {
      if (key === 'item_count') {
        return ITEM_COUNT_EVENTS.has(eventType);
      }
      if (key === 'value' || key === 'currency') {
        return VALUE_EVENTS.has(eventType);
      }
      return true;
    })
  );
}

function extractProcessedCount(response: ConversionApiResponse): number | undefined {
  const message = response.data?.message;
  if (typeof message !== 'string') {
    return undefined;
  }
  const match = message.match(/processed\s+(\d+)/i);
  return match ? Number(match[1]) : undefined;
}

function compact(record: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(record).filter(
      ([, value]) => value !== undefined && value !== null && value !== ''
    )
  );
}

type ActionProps = {
  custom_event_name?: string;
  event_source_url?: string;
  click_id?: string;
  conversion_id?: string;
  email?: string;
  phone?: string;
  external_id?: string;
  ip_address?: string;
  user_agent?: string;
  uuid?: string;
  idfa?: string;
  aaid?: string;
  limited_data_use?: boolean;
  dpo_country?: string;
  dpo_region?: string;
  screen_width?: number;
  screen_height?: number;
  currency?: string;
  value?: number;
  item_count?: number;
  products?: unknown[];
  test_id?: string;
};
