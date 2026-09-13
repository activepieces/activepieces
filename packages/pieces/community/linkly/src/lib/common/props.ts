import { Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { linklyAuth } from '../auth';
import {
  authToken,
  linklyApiCall,
  LinklyDomain,
  LinklyLinkList,
  LinklyWorkspace,
} from './client';

export const workspaceDropdown = Property.Dropdown({
  auth: linklyAuth,
  displayName: 'Workspace',
  description: 'The Linkly workspace to act on.',
  required: true,
  refreshers: ['auth'],
  options: async ({ auth }) => {
    if (!auth) {
      return { disabled: true, options: [], placeholder: 'Connect your Linkly account first' };
    }
    try {
      const workspaces = await linklyApiCall<LinklyWorkspace[]>({
        token: authToken(auth),
        method: HttpMethod.GET,
        path: '/workspaces',
      });
      return {
        disabled: false,
        options: workspaces.map((workspace) => ({
          label: workspace.name,
          value: workspace.id,
        })),
        placeholder: workspaces.length === 0 ? 'No workspaces found' : 'Select a workspace',
      };
    } catch (e: unknown) {
      return { disabled: true, options: [], placeholder: `Error loading workspaces: ${errorMessage(e)}` };
    }
  },
});

export const domainDropdown = Property.Dropdown({
  auth: linklyAuth,
  displayName: 'Domain',
  description: 'Branded domain for the short link. Leave empty to use the default Linkly domain.',
  required: false,
  refreshers: ['auth', 'workspace_id'],
  options: async ({ auth, workspace_id }) => {
    if (!auth) {
      return { disabled: true, options: [], placeholder: 'Connect your Linkly account first' };
    }
    if (!workspace_id) {
      return { disabled: true, options: [], placeholder: 'Select a workspace first' };
    }
    try {
      const domains = await linklyApiCall<LinklyDomain[]>({
        token: authToken(auth),
        method: HttpMethod.GET,
        path: `/workspace/${workspace_id}/domains`,
      });
      return {
        disabled: false,
        options: domains.map((domain) => ({ label: domain.name, value: domain.name })),
        placeholder: domains.length === 0 ? 'No custom domains in this workspace' : 'Select a domain',
      };
    } catch (e: unknown) {
      return { disabled: true, options: [], placeholder: `Error loading domains: ${errorMessage(e)}` };
    }
  },
});

export const linkDropdown = Property.Dropdown({
  auth: linklyAuth,
  displayName: 'Link',
  description: 'Pick one of the 100 most recent links, or map a link ID from a previous step.',
  required: true,
  refreshers: ['auth', 'workspace_id'],
  options: async ({ auth, workspace_id }) => {
    if (!auth) {
      return { disabled: true, options: [], placeholder: 'Connect your Linkly account first' };
    }
    if (!workspace_id) {
      return { disabled: true, options: [], placeholder: 'Select a workspace first' };
    }
    try {
      const result = await linklyApiCall<LinklyLinkList>({
        token: authToken(auth),
        method: HttpMethod.GET,
        path: `/workspace/${workspace_id}/list_links`,
        query: { page_size: 100, sort_by: 'id', sort_dir: 'desc' },
      });
      return {
        disabled: false,
        options: result.links.map((link) => ({
          label: `${link.name ?? link.full_url} (${link.full_url})`,
          value: link.id,
        })),
        placeholder: result.links.length === 0 ? 'No links in this workspace' : 'Select a link',
      };
    } catch (e: unknown) {
      return { disabled: true, options: [], placeholder: `Error loading links: ${errorMessage(e)}` };
    }
  },
});

export const linkFieldProps = {
  name: Property.ShortText({
    displayName: 'Name',
    description: 'A nickname shown in the Linkly dashboard.',
    required: false,
  }),
  slug: Property.ShortText({
    displayName: 'Custom slug',
    description: 'The path after the domain, e.g. `summer-sale`. Leave empty for a random slug.',
    required: false,
  }),
  domain: domainDropdown,
  note: Property.LongText({
    displayName: 'Note',
    description: 'Private note stored with the link.',
    required: false,
  }),
  utm_source: Property.ShortText({ displayName: 'UTM Source', required: false }),
  utm_medium: Property.ShortText({ displayName: 'UTM Medium', required: false }),
  utm_campaign: Property.ShortText({ displayName: 'UTM Campaign', required: false }),
  utm_term: Property.ShortText({ displayName: 'UTM Term', required: false }),
  utm_content: Property.ShortText({ displayName: 'UTM Content', required: false }),
  forward_params: Property.Checkbox({
    displayName: 'Forward query parameters',
    description: 'Pass query-string parameters on the short link through to the destination.',
    required: false,
  }),
  cloaking: Property.Checkbox({
    displayName: 'Cloak destination',
    description: 'Keep the short URL in the address bar (iframe cloaking).',
    required: false,
  }),
  hide_referrer: Property.Checkbox({
    displayName: 'Hide referrer',
    required: false,
  }),
  block_bots: Property.Checkbox({
    displayName: 'Block bots',
    description: 'Do not redirect known bots and crawlers.',
    required: false,
  }),
  expiry_datetime: Property.DateTime({
    displayName: 'Expires at',
    description: 'Stop redirecting after this date and time.',
    required: false,
  }),
  expiry_destination: Property.ShortText({
    displayName: 'Expired destination',
    description: 'Where to send visitors after the link expires.',
    required: false,
  }),
  og_title: Property.ShortText({ displayName: 'Open Graph title', required: false }),
  og_description: Property.LongText({ displayName: 'Open Graph description', required: false }),
  og_image: Property.ShortText({ displayName: 'Open Graph image URL', required: false }),
  fb_pixel_id: Property.ShortText({ displayName: 'Meta (Facebook) Pixel ID', required: false }),
  ga4_tag_id: Property.ShortText({ displayName: 'Google Analytics 4 tag ID', required: false }),
  gtm_id: Property.ShortText({ displayName: 'Google Tag Manager container ID', required: false }),
  tiktok_pixel_id: Property.ShortText({ displayName: 'TikTok Pixel ID', required: false }),
};

function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}
