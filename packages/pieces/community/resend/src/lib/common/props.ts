import { Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { resendAuth } from '../..';
import { resendClient } from './client';

const audienceIdProp = Property.Dropdown({
  displayName: 'Audience',
  required: true,
  auth: resendAuth,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return { disabled: true, placeholder: 'Connect your Resend account first', options: [] };
    }
    const response = await resendClient.sendRequest<{ data: { id: string; name: string }[] }>({
      auth: auth.secret_text,
      method: HttpMethod.GET,
      path: '/audiences',
    });
    return { options: response.data.map((a) => ({ label: a.name, value: a.id })) };
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
    const response = await resendClient.sendRequest<{ data: { id: string; name: string }[] }>({
      auth: auth.secret_text,
      method: HttpMethod.GET,
      path: '/domains',
    });
    return { options: response.data.map((d) => ({ label: d.name, value: d.id })) };
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
    const response = await resendClient.sendRequest<{
      data: { id: string; name: string; subject: string }[];
    }>({
      auth: auth.secret_text,
      method: HttpMethod.GET,
      path: '/broadcasts',
    });
    return {
      options: response.data.map((b) => ({
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
    const response = await resendClient.sendRequest<{
      data: { id: string; email: string; first_name: string; last_name: string }[];
    }>({
      auth: auth.secret_text,
      method: HttpMethod.GET,
      path: `/audiences/${String(audience_id)}/contacts`,
    });
    return {
      options: response.data.map((c) => {
        const name = [c.first_name, c.last_name].filter(Boolean).join(' ');
        return { label: name ? `${name} <${c.email}>` : c.email, value: c.id };
      }),
    };
  },
});

const segmentIdProp = Property.Dropdown({
  displayName: 'Segment',
  required: true,
  auth: resendAuth,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return { disabled: true, placeholder: 'Connect your Resend account first', options: [] };
    }
    const response = await resendClient.sendRequest<{ data: { id: string; name: string }[] }>({
      auth: auth.secret_text,
      method: HttpMethod.GET,
      path: '/segments',
    });
    return { options: response.data.map((s) => ({ label: s.name, value: s.id })) };
  },
});

const topicIdProp = Property.Dropdown({
  displayName: 'Topic',
  required: true,
  auth: resendAuth,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return { disabled: true, placeholder: 'Connect your Resend account first', options: [] };
    }
    const response = await resendClient.sendRequest<{ data: { id: string; name: string }[] }>({
      auth: auth.secret_text,
      method: HttpMethod.GET,
      path: '/topics',
    });
    return { options: response.data.map((t) => ({ label: t.name, value: t.id })) };
  },
});

const templateIdProp = Property.Dropdown({
  displayName: 'Template',
  required: true,
  auth: resendAuth,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return { disabled: true, placeholder: 'Connect your Resend account first', options: [] };
    }
    const response = await resendClient.sendRequest<{ data: { id: string; name: string; alias?: string }[] }>({
      auth: auth.secret_text,
      method: HttpMethod.GET,
      path: '/templates',
    });
    return {
      options: response.data.map((t) => ({
        label: t.alias ? `${t.name} (${t.alias})` : t.name,
        value: t.id,
      })),
    };
  },
});

const webhookIdProp = Property.Dropdown({
  displayName: 'Webhook',
  required: true,
  auth: resendAuth,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return { disabled: true, placeholder: 'Connect your Resend account first', options: [] };
    }
    const response = await resendClient.sendRequest<{ data: { id: string; endpoint: string }[] }>({
      auth: auth.secret_text,
      method: HttpMethod.GET,
      path: '/webhooks',
    });
    return { options: response.data.map((w) => ({ label: w.endpoint, value: w.id })) };
  },
});

const contactPropertyIdProp = Property.Dropdown({
  displayName: 'Contact Property',
  required: true,
  auth: resendAuth,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return { disabled: true, placeholder: 'Connect your Resend account first', options: [] };
    }
    const response = await resendClient.sendRequest<{ data: { id: string; key: string }[] }>({
      auth: auth.secret_text,
      method: HttpMethod.GET,
      path: '/contact-properties',
    });
    return { options: response.data.map((p) => ({ label: p.key, value: p.id })) };
  },
});

const contactIdentifierProp = Property.ShortText({
  displayName: 'Contact ID or Email',
  description: "The contact's Resend ID, or their email address.",
  required: true,
});

export const resendProps = {
  audienceId: audienceIdProp,
  domainId: domainIdProp,
  broadcastId: broadcastIdProp,
  contactId: contactIdProp,
  segmentId: segmentIdProp,
  topicId: topicIdProp,
  templateId: templateIdProp,
  webhookId: webhookIdProp,
  contactPropertyId: contactPropertyIdProp,
  contactIdentifier: contactIdentifierProp,
};
