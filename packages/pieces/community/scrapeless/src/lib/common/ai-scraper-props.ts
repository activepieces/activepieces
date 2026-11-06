import { DynamicPropsValue, Property } from '@activepieces/pieces-framework';

async function websiteProperties({
  operation,
}: Record<string, unknown>): Promise<DynamicPropsValue> {
  if (operation === 'create_task' || operation === 'create_and_wait') {
    return {
      engine: Property.StaticDropdown({
        displayName: 'Website',
        description: 'Choose the AI website to collect an answer from.',
        required: true,
        defaultValue: 'chatgpt',
        options: {
          options: Object.entries(engineLabels).map(([value, label]) => ({
            value,
            label,
          })),
        },
      }),
    };
  }
  return {};
}

async function requestProperties({
  operation,
  website,
}: Record<string, unknown>): Promise<DynamicPropsValue> {
  if (operation === 'get_task_result') {
    return {
      task_id: Property.ShortText({
        displayName: 'Task ID',
        description:
          'Select task_id from an earlier AI Scraper creation step or supply an existing AI Scraper v2 task ID. The website is not required for a query.',
        required: true,
      }),
    };
  }
  if ((operation !== 'create_task' && operation !== 'create_and_wait') || !isRecord(website)) {
    return {};
  }
  const engine = website['engine'];
  if (typeof engine !== 'string' || !Object.hasOwn(engineLabels, engine)) {
    return {};
  }
  const prompt = promptProperties({ engine: engineLabels[engine] });
  if (engine === 'chatgpt') {
    return {
      ...prompt,
      web_search: webSearchProperty(),
      shopping: shoppingProperty(),
      should_fetch_share_link: shareLinkProperty(),
    };
  }
  if (engine === 'perplexity') {
    return {
      ...prompt,
      web_search: webSearchProperty(),
      should_fetch_share_link: shareLinkProperty(),
    };
  }
  if (engine === 'copilot') {
    return {
      ...prompt,
      mode: Property.StaticDropdown({
        displayName: 'Mode',
        description: 'The selected Copilot mode is sent unchanged.',
        required: true,
        defaultValue: 'search',
        options: {
          options: [
            { label: 'Search', value: 'search' },
            { label: 'Smart', value: 'smart' },
            { label: 'Chat', value: 'chat' },
            { label: 'Reasoning', value: 'reasoning' },
            { label: 'Study', value: 'study' },
          ],
        },
      }),
      should_fetch_share_link: shareLinkProperty(),
    };
  }
  if (engine === 'gemini') {
    return { ...prompt, shopping: shoppingProperty() };
  }
  if (engine === 'aimode' || engine === 'overview') {
    return {
      ...prompt,
      shopping: shoppingProperty(),
      ...locationProperties(),
      should_fetch_share_link: shareLinkProperty(),
    };
  }
  if (engine === 'grok') {
    return {
      ...prompt,
      mode: Property.StaticDropdown({
        displayName: 'Mode',
        description:
          'Select the requested mode. Expert requests have returned Fast in testing. Inspect task_result.user_model before relying on the requested mode.',
        required: true,
        defaultValue: 'MODEL_MODE_FAST',
        options: {
          options: [
            { label: 'Fast', value: 'MODEL_MODE_FAST' },
            { label: 'Expert', value: 'MODEL_MODE_EXPERT' },
            { label: 'Auto', value: 'MODEL_MODE_AUTO' },
          ],
        },
      }),
      should_fetch_share_link: shareLinkProperty(),
    };
  }
  if (engine === 'alexa') {
    return prompt;
  }
  return {};
}

async function waitProperties({ operation }: Record<string, unknown>): Promise<DynamicPropsValue> {
  if (operation !== 'create_and_wait') return {};
  return {
    wait_timeout_seconds: Property.Number({ displayName: 'Wait Timeout (seconds)', description: 'Total waiting budget including creation, queries, and intervals. The platform may stop earlier. This does not cancel the provider task or an outstanding HTTP request.', required: true, defaultValue: 180, min: 30, max: 300, step: 1 }),
    poll_interval_seconds: Property.Number({ displayName: 'Poll Interval (seconds)', description: 'Wait between unfinished queries. The first query runs immediately after creation. Must not exceed Wait Timeout.', required: true, defaultValue: 10, min: 5, max: 60, step: 1 }),
    max_queries: Property.Number({ displayName: 'Maximum Queries', description: 'Maximum result queries. Creation is not counted. Stop when this limit or Wait Timeout is reached, whichever comes first.', required: true, defaultValue: 20, min: 1, max: 60, step: 1 }),
  };
}

function webSearchProperty() {
  return Property.Checkbox({
    displayName: 'Enable Web Search',
    description: 'Allow the selected website to search the web.',
    defaultValue: true,
    required: false,
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function promptProperties({ engine }: { engine: string }) {
  return {
    prompt: Property.LongText({
      displayName: 'Prompt',
      description: `The question or instructions to send to ${engine}.`,
      required: true,
    }),
    country: Property.ShortText({
      displayName: 'Country',
      description: 'Supported two-letter ISO country code, such as US or GB.',
      defaultValue: 'US',
      required: true,
    }),
  };
}

function shareLinkProperty() {
  return Property.Checkbox({
    displayName: 'Get Share Link',
    description:
      'Request a share link when the engine supports it. Availability depends on the response.',
    defaultValue: false,
    required: false,
  });
}

function shoppingProperty() {
  return Property.Checkbox({
    displayName: 'Include Shopping Data',
    description:
      'Request extra product information. Responses with this extra data may cost twice the base rate.',
    defaultValue: false,
    required: false,
  });
}

function locationProperties() {
  return {
    location: Property.ShortText({
      displayName: 'Location',
      description:
        'Google canonical location, such as New York,New York,United States. Do not combine with UULE.',
      required: false,
    }),
    uule: Property.ShortText({
      displayName: 'UULE',
      description:
        'Pre-encoded Google UULE location. Do not combine with Location.',
      required: false,
    }),
  };
}

const creationErrorHandling = {
  retryOnFailure: { defaultValue: false, hide: true },
  continueOnFailure: { defaultValue: false },
};

const engineLabels: Record<string, string> = {
  chatgpt: 'ChatGPT',
  perplexity: 'Perplexity',
  copilot: 'Microsoft Copilot',
  gemini: 'Gemini',
  aimode: 'Google AI Mode',
  overview: 'Google AI Overview',
  grok: 'Grok',
  alexa: 'Amazon Alexa',
};

export const aiScraperProps = {
  websiteProperties,
  waitProperties,
  requestProperties,
  promptProperties,
  shareLinkProperty,
  shoppingProperty,
  locationProperties,
  creationErrorHandling,
};
