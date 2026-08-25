import { Property } from '@activepieces/pieces-framework';
import { AuthenticationType, HttpMethod, httpClient } from '@activepieces/pieces-common';
import { resendAuth } from '../..';

const BASE_URL = 'https://api.resend.com';

const audienceIdProp = Property.Dropdown({
  displayName: 'Audience',
  required: true,
  auth: resendAuth,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return { disabled: true, placeholder: 'Connect your Resend account first', options: [] };
    }
    const response = await httpClient.sendRequest<{ data: { id: string; name: string }[] }>({
      method: HttpMethod.GET,
      url: `${BASE_URL}/audiences`,
      authentication: { type: AuthenticationType.BEARER_TOKEN, token: auth.secret_text },
    });
    return { options: response.body.data.map((a) => ({ label: a.name, value: a.id })) };
  },
});

const domainIdProp = Property.Dropdown({
  displayName: 'Domain',
  required: true,
  auth: resendAuth,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return { disabled: true, placeholder: 'Connect your Resend account first', options: [] };
    }
    const response = await httpClient.sendRequest<{ data: { id: string; name: string }[] }>({
      method: HttpMethod.GET,
      url: `${BASE_URL}/domains`,
      authentication: { type: AuthenticationType.BEARER_TOKEN, token: auth.secret_text },
    });
    return { options: response.body.data.map((d) => ({ label: d.name, value: d.id })) };
  },
});

const broadcastIdProp = Property.Dropdown({
  displayName: 'Broadcast',
  required: true,
  auth: resendAuth,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return { disabled: true, placeholder: 'Connect your Resend account first', options: [] };
    }
    const response = await httpClient.sendRequest<{
      data: { id: string; name: string; subject: string }[];
    }>({
      method: HttpMethod.GET,
      url: `${BASE_URL}/broadcasts`,
      authentication: { type: AuthenticationType.BEARER_TOKEN, token: auth.secret_text },
    });
    return {
      options: response.body.data.map((b) => ({
        label: b.name ? `${b.name} — ${b.subject}` : b.subject,
        value: b.id,
      })),
    };
  },
});

const contactIdProp = Property.Dropdown({
  displayName: 'Contact',
  required: true,
  auth: resendAuth,
  refreshers: ['audience_id'],
  options: async ({ auth, audience_id }) => {
    if (!auth || !audience_id) {
      return { disabled: true, placeholder: 'Select an audience first', options: [] };
    }
    const response = await httpClient.sendRequest<{
      data: { id: string; email: string; first_name: string; last_name: string }[];
    }>({
      method: HttpMethod.GET,
      url: `${BASE_URL}/audiences/${String(audience_id)}/contacts`,
      authentication: { type: AuthenticationType.BEARER_TOKEN, token: auth.secret_text },
    });
    return {
      options: response.body.data.map((c) => {
        const name = [c.first_name, c.last_name].filter(Boolean).join(' ');
        return { label: name ? `${name} <${c.email}>` : c.email, value: c.id };
      }),
    };
  },
});

export const resendProps = {
  audienceId: audienceIdProp,
  domainId: domainIdProp,
  broadcastId: broadcastIdProp,
  contactId: contactIdProp,
};
