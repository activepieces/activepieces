import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { pubrioAuth } from '../../index';
import { pubrioRequest } from '../common';

export const updateMonitor = createAction({
  auth: pubrioAuth,
  name: 'update_monitor',
  displayName: 'Update Monitor',
  description: 'Update an existing signal monitor',
  props: {
    monitor_id: Property.ShortText({
      displayName: 'Monitor ID',
      required: true,
    }),
    name: Property.ShortText({ displayName: 'Name', required: false }),
    detection_mode: Property.StaticDropdown({
      displayName: 'Detection Mode',
      required: false,
      options: {
        options: [
          { label: 'Company First', value: 'company_first' },
          { label: 'Signal First', value: 'signal_first' },
        ],
      },
    }),
    signal_types: Property.StaticMultiSelectDropdown({
      displayName: 'Signal Types',
      required: false,
      options: {
        options: [
          { label: 'Jobs', value: 'jobs' },
          { label: 'News', value: 'news' },
          { label: 'Advertisements', value: 'advertisements' },
        ],
      },
    }),
    destination_type: Property.StaticDropdown({
      displayName: 'Destination Type',
      required: false,
      options: {
        options: [
          { label: 'Webhook', value: 'webhook' },
          { label: 'Email', value: 'email' },
          { label: 'Sequences', value: 'sequences' },
        ],
      },
    }),
    webhook_url: Property.ShortText({
      displayName: 'Webhook URL',
      required: false,
    }),
    email: Property.ShortText({ displayName: 'Email', required: false }),
    sequence_identifier: Property.ShortText({
      displayName: 'Sequence Identifier',
      required: false,
    }),
    record_type: Property.ShortText({
      displayName: 'Record Type',
      required: false,
      description: 'Required when destination type is sequences',
    }),
    description: Property.LongText({
      displayName: 'Description',
      required: false,
    }),
    frequency_minute: Property.Number({
      displayName: 'Frequency (minutes)',
      required: false,
    }),
    max_daily_trigger: Property.Number({
      displayName: 'Max Daily Triggers',
      required: false,
    }),
    max_records_per_trigger: Property.Number({
      displayName: 'Max Records Per Trigger',
      required: false,
    }),
    companies: Property.Array({
      displayName: 'Companies',
      description: 'Company names',
      required: false,
    }),
    domains: Property.Array({
      displayName: 'Domains',
      required: false,
    }),
    linkedin_urls: Property.Array({
      displayName: 'LinkedIn URLs',
      required: false,
    }),
    company_filters: Property.LongText({
      displayName: 'Company Filters',
      description: 'Advanced company filters as JSON string',
      required: false,
    }),
    signal_filters: Property.LongText({
      displayName: 'Signal Filters',
      description: 'Signal-specific filters as JSON array string',
      required: false,
    }),
    people_enrichment_configs: Property.LongText({
      displayName: 'People Enrichment Configs',
      description: 'People enrichment configs as JSON array string',
      required: false,
    }),
    is_company_enrichment: Property.Checkbox({
      displayName: 'Company Enrichment',
      required: false,
      defaultValue: false,
    }),
    is_people_enrichment: Property.Checkbox({
      displayName: 'People Enrichment',
      required: false,
      defaultValue: false,
    }),
    is_active: Property.Checkbox({
      displayName: 'Is Active',
      required: false,
      defaultValue: false,
    }),
    is_paused: Property.Checkbox({
      displayName: 'Is Paused',
      required: false,
      defaultValue: false,
    }),
    max_failure_trigger: Property.Number({
      displayName: 'Max Failure Trigger',
      required: false,
    }),
    max_retry_per_trigger: Property.Number({
      displayName: 'Max Retry Per Trigger',
      required: false,
    }),
    retry_delay_second: Property.Number({
      displayName: 'Retry Delay (seconds)',
      required: false,
    }),
    notification_email: Property.ShortText({
      displayName: 'Notification Email',
      required: false,
    }),
  },
  async run(context) {
    const body: Record<string, unknown> = {
      monitor_id: context.propsValue.monitor_id,
    };
    if (context.propsValue.name) body['name'] = context.propsValue.name;
    if (context.propsValue.detection_mode)
      body['detection_mode'] = context.propsValue.detection_mode;
    if (
      context.propsValue.signal_types &&
      context.propsValue.signal_types.length > 0
    )
      body['signal_types'] = context.propsValue.signal_types;
    if (context.propsValue.destination_type)
      body['destination_type'] = context.propsValue.destination_type;
    const destConfig: Record<string, unknown> = {};
    if (context.propsValue.webhook_url)
      destConfig['webhook_url'] = context.propsValue.webhook_url;
    if (context.propsValue.email)
      destConfig['email'] = context.propsValue.email;
    if (context.propsValue.sequence_identifier)
      destConfig['sequence_identifier'] =
        context.propsValue.sequence_identifier;
    if (context.propsValue.record_type)
      destConfig['record_type'] = context.propsValue.record_type;
    if (Object.keys(destConfig).length > 0)
      body['destination_config'] = destConfig;
    if (context.propsValue.description)
      body['description'] = context.propsValue.description;
    if (context.propsValue.frequency_minute != null)
      body['frequency_minute'] = context.propsValue.frequency_minute;
    if (context.propsValue.max_daily_trigger != null)
      body['max_daily_trigger'] = context.propsValue.max_daily_trigger;
    if (context.propsValue.max_records_per_trigger != null)
      body['max_records_per_trigger'] =
        context.propsValue.max_records_per_trigger;
    if (context.propsValue.companies)
      body['companies'] = context.propsValue.companies;
    if (context.propsValue.domains)
      body['domains'] = context.propsValue.domains;
    if (context.propsValue.linkedin_urls)
      body['linkedin_urls'] = context.propsValue.linkedin_urls;
    if (context.propsValue.company_filters)
      body['company_filters'] = JSON.parse(context.propsValue.company_filters);
    if (context.propsValue.signal_filters)
      body['signal_filters'] = JSON.parse(context.propsValue.signal_filters);
    if (context.propsValue.people_enrichment_configs)
      body['people_enrichment_configs'] = JSON.parse(
        context.propsValue.people_enrichment_configs
      );
    if (context.propsValue.is_company_enrichment)
      body['is_company_enrichment'] = context.propsValue.is_company_enrichment;
    if (context.propsValue.is_people_enrichment)
      body['is_people_enrichment'] = context.propsValue.is_people_enrichment;
    if (context.propsValue.is_active)
      body['is_active'] = context.propsValue.is_active;
    if (context.propsValue.is_paused)
      body['is_paused'] = context.propsValue.is_paused;
    if (context.propsValue.max_failure_trigger != null)
      body['max_failure_trigger'] = context.propsValue.max_failure_trigger;
    if (context.propsValue.max_retry_per_trigger != null)
      body['max_retry_per_trigger'] = context.propsValue.max_retry_per_trigger;
    if (context.propsValue.retry_delay_second != null)
      body['retry_delay_second'] = context.propsValue.retry_delay_second;
    if (context.propsValue.notification_email)
      body['notification_email'] = context.propsValue.notification_email;
    return await pubrioRequest(
      context.auth.secret_text,
      HttpMethod.POST,
      '/monitors/update',
      body
    );
  },
});
