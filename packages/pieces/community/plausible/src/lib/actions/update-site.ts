import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { plausibleAuth } from '../..';
import { plausibleApiCall, siteIdDropdown } from '../common';

export const updateSite = createAction({
  auth: plausibleAuth,
  name: 'update_site',
  displayName: 'Update Site',
  description: 'Update an existing site in your Plausible account',
  props: {
    site_id: siteIdDropdown,
    new_domain: Property.ShortText({
      displayName: 'New Domain',
      description: 'New domain name for the site (leave empty to keep current)',
      required: false,
    }),
    track_404_pages: Property.Checkbox({
      displayName: 'Track 404 Pages',
      description: 'Enable tracking of 404 error pages',
      required: false,
    }),
    hash_based_routing: Property.Checkbox({
      displayName: 'Hash-Based Routing',
      description: 'Enable hash-based routing for single-page applications',
      required: false,
    }),
    outbound_links: Property.Checkbox({
      displayName: 'Outbound Links',
      description: 'Track clicks on outbound links',
      required: false,
    }),
    file_downloads: Property.Checkbox({
      displayName: 'File Downloads',
      description: 'Track file downloads',
      required: false,
    }),
    form_submissions: Property.Checkbox({
      displayName: 'Form Submissions',
      description: 'Track form submissions',
      required: false,
    }),
  },
  async run(context) {
    const site_id = context.propsValue['site_id'];
    const new_domain = context.propsValue['new_domain'];
    const track_404_pages = context.propsValue['track_404_pages'];
    const hash_based_routing = context.propsValue['hash_based_routing'];
    const outbound_links = context.propsValue['outbound_links'];
    const file_downloads = context.propsValue['file_downloads'];
    const form_submissions = context.propsValue['form_submissions'];

    const body: Record<string, unknown> = {};

    if (new_domain) {
      body['domain'] = new_domain;
    }

    const trackerConfig: Record<string, boolean> = {};
    if (track_404_pages !== undefined && track_404_pages !== null) {
      trackerConfig['track_404_pages'] = track_404_pages;
    }
    if (hash_based_routing !== undefined && hash_based_routing !== null) {
      trackerConfig['hash_based_routing'] = hash_based_routing;
    }
    if (outbound_links !== undefined && outbound_links !== null) {
      trackerConfig['outbound_links'] = outbound_links;
    }
    if (file_downloads !== undefined && file_downloads !== null) {
      trackerConfig['file_downloads'] = file_downloads;
    }
    if (form_submissions !== undefined && form_submissions !== null) {
      trackerConfig['form_submissions'] = form_submissions;
    }

    if (Object.keys(trackerConfig).length > 0) {
      body['tracker_script_configuration'] = trackerConfig;
    }

    const response = await plausibleApiCall({
      apiKey: context.auth.secret_text,
      method: HttpMethod.PUT,
      endpoint: `/sites/${encodeURIComponent(site_id as string)}`,
      body,
    });
    return response;
  },
});
