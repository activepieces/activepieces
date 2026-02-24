import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { plausibleAuth } from '../..';
import { plausibleApiCall, teamIdDropdown } from '../common';

export const createSite = createAction({
  auth: plausibleAuth,
  name: 'create_site',
  displayName: 'Create Site',
  description: 'Create a new site in your Plausible account',
  props: {
    domain: Property.ShortText({
      displayName: 'Domain',
      description: 'Domain of the site (must be globally unique)',
      required: true,
    }),
    timezone: Property.ShortText({
      displayName: 'Timezone',
      description: 'Timezone name according to IANA database (e.g., Europe/London). Defaults to Etc/UTC',
      required: false,
    }),
    team_id: teamIdDropdown,
    track_404_pages: Property.Checkbox({
      displayName: 'Track 404 Pages',
      description: 'Enable tracking of 404 error pages',
      required: false,
      defaultValue: false,
    }),
    hash_based_routing: Property.Checkbox({
      displayName: 'Hash-Based Routing',
      description: 'Enable hash-based routing for single-page applications',
      required: false,
      defaultValue: false,
    }),
    outbound_links: Property.Checkbox({
      displayName: 'Outbound Links',
      description: 'Track clicks on outbound links',
      required: false,
      defaultValue: false,
    }),
    file_downloads: Property.Checkbox({
      displayName: 'File Downloads',
      description: 'Track file downloads',
      required: false,
      defaultValue: false,
    }),
    form_submissions: Property.Checkbox({
      displayName: 'Form Submissions',
      description: 'Track form submissions',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const domain = context.propsValue['domain'];
    const timezone = context.propsValue['timezone'];
    const team_id = context.propsValue['team_id'];
    const track_404_pages = context.propsValue['track_404_pages'];
    const hash_based_routing = context.propsValue['hash_based_routing'];
    const outbound_links = context.propsValue['outbound_links'];
    const file_downloads = context.propsValue['file_downloads'];
    const form_submissions = context.propsValue['form_submissions'];

    const body: Record<string, unknown> = {
      domain,
    };

    if (timezone) {
      body['timezone'] = timezone;
    }

    if (team_id) {
      body['team_id'] = team_id;
    }

    const trackerConfig: Record<string, boolean> = {};
    if (track_404_pages) trackerConfig['track_404_pages'] = true;
    if (hash_based_routing) trackerConfig['hash_based_routing'] = true;
    if (outbound_links) trackerConfig['outbound_links'] = true;
    if (file_downloads) trackerConfig['file_downloads'] = true;
    if (form_submissions) trackerConfig['form_submissions'] = true;

    if (Object.keys(trackerConfig).length > 0) {
      body['tracker_script_configuration'] = trackerConfig;
    }

    const response = await plausibleApiCall({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      endpoint: '/sites',
      body,
    });
    return response;
  },
});
