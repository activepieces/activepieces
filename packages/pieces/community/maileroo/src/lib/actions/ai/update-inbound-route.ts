import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property, spreadIfDefined } from '@activepieces/pieces-framework';

import { mailerooAuth } from '../../auth';
import { mailerooClient } from '../../common/client';
import { mailerooInboundRouteOutputSchema } from '../../output-schemas';

export const mailerooUpdateInboundRoute = createAction({
  auth: mailerooAuth,
  name: 'maileroo_update_inbound_route',
  outputSchema: mailerooInboundRouteOutputSchema,
  displayName: 'Update Inbound Route',
  description: 'Updates an inbound route.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description: 'Changes an existing inbound route; only supplied fields change, the rest are read from the current route and re-sent because the vendor replaces the whole route. Get the route ID from maileroo_list_inbound_routes. Requires an Account Key connection.',
    idempotent: true,
  },
  props: {
    domain_id: Property.Number({
      displayName: 'Domain ID',
      description: 'Numeric domain ID. Get it from maileroo_list_domains.',
      required: true,
    }),
    route_id: Property.ShortText({
      displayName: 'Route ID',
      description: 'Route ID from maileroo_list_inbound_routes.',
      required: true,
    }),
    description: Property.ShortText({
      displayName: 'Description',
      description: '3 to 255 characters.',
      required: false,
    }),
    expression_type: Property.StaticDropdown({
      displayName: 'Match Type',
      description: 'How the route matches incoming mail.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Catch all', value: 'catch_all' },
          { label: 'Match recipient', value: 'match_recipient' },
          { label: 'Match header', value: 'match_header' },
          { label: 'Custom expression', value: 'custom' },
        ],
      },
    }),
    forward_list: Property.Array({
      displayName: 'Forward To',
      description: 'Replaces the whole forward list.',
      required: false,
    }),
    priority: Property.Number({
      displayName: 'Priority',
      description: '1 (highest) to 100 (lowest).',
      required: false,
    }),
    recipient: Property.ShortText({
      displayName: 'Recipient',
      description: 'Required for Match recipient.',
      required: false,
    }),
    header_name: Property.ShortText({
      displayName: 'Header Name',
      description: 'Required for Match header.',
      required: false,
    }),
    header_content: Property.ShortText({
      displayName: 'Header Content',
      description: 'Required for Match header.',
      required: false,
    }),
    custom_expression: Property.ShortText({
      displayName: 'Custom Expression',
      description: 'Required for Custom expression.',
      required: false,
    }),
    regex_enabled: Property.StaticDropdown({
      displayName: 'Regex',
      description: 'Treat the expression content as a regular expression.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Yes', value: 'true' },
          { label: 'No', value: 'false' },
        ],
      },
    }),
    dmarc_alignment: Property.StaticDropdown({
      displayName: 'Require DMARC Alignment',
      description: '',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Yes', value: 'true' },
          { label: 'No', value: 'false' },
        ],
      },
    }),
    require_spf: Property.StaticDropdown({
      displayName: 'Require SPF Pass',
      description: '',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Yes', value: 'true' },
          { label: 'No', value: 'false' },
        ],
      },
    }),
    require_dkim: Property.StaticDropdown({
      displayName: 'Require DKIM Pass',
      description: '',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Yes', value: 'true' },
          { label: 'No', value: 'false' },
        ],
      },
    }),
    skip_spam_check: Property.StaticDropdown({
      displayName: 'Skip Spam Check',
      description: '',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Yes', value: 'true' },
          { label: 'No', value: 'false' },
        ],
      },
    }),
    stop: Property.StaticDropdown({
      displayName: 'Stop Processing',
      description: 'Stop evaluating further routes when matched.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Yes', value: 'true' },
          { label: 'No', value: 'false' },
        ],
      },
    }),
  },
  async run(context) {
    const { domain_id, route_id, description, expression_type, forward_list, priority, recipient, header_name, header_content, custom_expression, regex_enabled, dmarc_alignment, require_spf, require_dkim, skip_spam_check, stop } = context.propsValue;
    const path = `/domains/${encodeURIComponent(domain_id)}/inbound-routes/${encodeURIComponent(route_id)}`;
    const current = await mailerooClient.accountRequest<Record<string, unknown>>({
      auth: context.auth,
      method: HttpMethod.GET,
      path,
    });
    const writable = mailerooClient.pickInboundRouteFields(current);
    const changes = {
      ...spreadIfDefined('description', description),
      ...spreadIfDefined('expression_type', expression_type),
      ...spreadIfDefined('forward_list', forward_list === undefined ? undefined : mailerooClient.toStrings(forward_list)),
      ...spreadIfDefined('priority', priority),
      ...spreadIfDefined('recipient', recipient),
      ...spreadIfDefined('header_name', header_name),
      ...spreadIfDefined('header_content', header_content),
      ...spreadIfDefined('custom_expression', custom_expression),
      ...spreadIfDefined('regex_enabled', mailerooClient.optionalBoolean(regex_enabled)),
      ...spreadIfDefined('dmarc_alignment', mailerooClient.optionalBoolean(dmarc_alignment)),
      ...spreadIfDefined('require_spf', mailerooClient.optionalBoolean(require_spf)),
      ...spreadIfDefined('require_dkim', mailerooClient.optionalBoolean(require_dkim)),
      ...spreadIfDefined('skip_spam_check', mailerooClient.optionalBoolean(skip_spam_check)),
      ...spreadIfDefined('stop', mailerooClient.optionalBoolean(stop)),
    };
    return await mailerooClient.accountRequest({
      auth: context.auth,
      method: HttpMethod.PUT,
      path,
      body: { ...writable, ...changes },
    });
  },
});
