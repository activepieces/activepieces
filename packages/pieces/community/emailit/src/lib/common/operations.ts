import { HttpMethod } from '@activepieces/pieces-common';
import { EmailitApiError, EmailitAuthInput, emailitClient } from './client';
import { emailitValues } from './values';

async function addSubscriber({ auth, input }: { auth: EmailitAuthInput; input: SubscriberInput }): Promise<Record<string, unknown>> {
  const body = emailitValues.compact({
    email: emailitValues.requiredText({ value: input.email, label: 'Email' }),
    first_name: emailitValues.optionalText(input.firstName),
    last_name: emailitValues.optionalText(input.lastName),
    custom_fields: emailitValues.objectInput({ value: input.customFields, label: 'Custom Fields' }),
  });
  const audience = emailitClient.seg({ value: input.audience, label: 'Audience' });
  try {
    const created = await emailitClient.request({ auth, method: HttpMethod.POST, path: `/audiences/${audience}/subscribers`, body, redactBody: true, safeToRetry: true });
    return { ...record(created), alreadySubscribed: false };
  } catch (error) {
    if (error instanceof EmailitApiError && error.status === 409) {
      const existing = emailitClient.isRecord(error.responseBody) ? error.responseBody['existing'] : undefined;
      if (emailitClient.isRecord(existing) && typeof existing['id'] === 'string') {
        return { ...existing, alreadySubscribed: true };
      }
      const current = await emailitClient.request({
        auth,
        method: HttpMethod.GET,
        path: `/audiences/${audience}/subscribers/${emailitClient.seg({ value: body['email'], label: 'Email' })}`,
      });
      return { ...record(current), alreadySubscribed: true };
    }
    return emailitClient.rethrowWithHint({ error, hints: { 404: 'Audience not found.', 422: 'The audience is at your plan\'s subscriber limit.' } });
  }
}

async function updateSubscriber({ auth, input }: { auth: EmailitAuthInput; input: SubscriberUpdateInput }): Promise<unknown> {
  const body = emailitValues.compact({
    subscribed: input.subscribed === 'yes' ? true : input.subscribed === 'no' ? false : undefined,
    first_name: emailitValues.optionalText(input.firstName),
    last_name: emailitValues.optionalText(input.lastName),
  });
  if (Object.keys(body).length === 0) {
    throw new Error('Choose at least one change: Subscribed, First Name or Last Name.');
  }
  try {
    return await emailitClient.request({
      auth,
      method: HttpMethod.POST,
      path: `/audiences/${emailitClient.seg({ value: input.audience, label: 'Audience' })}/subscribers/${emailitClient.seg({ value: input.subscriber, label: 'Subscriber' })}`,
      body,
      redactBody: true,
      safeToRetry: true,
    });
  } catch (error) {
    return emailitClient.rethrowWithHint({ error, hints: { 404: 'Audience or subscriber not found.' } });
  }
}

async function removeSubscriber({ auth, input }: { auth: EmailitAuthInput; input: { audience: unknown; subscriber: unknown } }): Promise<Record<string, unknown>> {
  const audience = emailitClient.seg({ value: input.audience, label: 'Audience' });
  const subscriber = emailitClient.seg({ value: input.subscriber, label: 'Subscriber' });
  try {
    const body = await emailitClient.request({ auth, method: HttpMethod.DELETE, path: `/audiences/${audience}/subscribers/${subscriber}`, safeToRetry: true });
    return { ...record(body), deleted: true, alreadyRemoved: false };
  } catch (error) {
    if (emailitClient.statusOf(error) === 404 && (await audienceExists({ auth, audience }))) {
      return { id: decodeURIComponent(subscriber), deleted: false, alreadyRemoved: true };
    }
    return emailitClient.rethrowWithHint({ error, hints: { 404: 'Audience not found.' } });
  }
}

async function upsertContact({ auth, input }: { auth: EmailitAuthInput; input: ContactInput }): Promise<Record<string, unknown>> {
  const email = emailitValues.requiredText({ value: input.email, label: 'Email' });
  const audiences = (Array.isArray(input.audiences) ? input.audiences : [])
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter((item) => item !== '');
  const fields = emailitValues.compact({
    first_name: emailitValues.optionalText(input.firstName),
    last_name: emailitValues.optionalText(input.lastName),
    custom_fields: emailitValues.objectInput({ value: input.customFields, label: 'Custom Fields' }),
    unsubscribed: input.unsubscribed === 'yes' ? true : input.unsubscribed === 'no' ? false : undefined,
  });
  const existing = await lookupContact({ auth, email });
  if (existing === null) {
    try {
      const created = await emailitClient.request({
        auth,
        method: HttpMethod.POST,
        path: '/contacts',
        body: { email, ...fields, ...(audiences.length > 0 ? { audiences } : {}) },
        redactBody: true,
      });
      return { ...record(created), created: true };
    } catch (error) {
      if (!(error instanceof EmailitApiError && error.status === 409)) throw error;
    }
  }
  const current = existing ?? (await lookupContact({ auth, email }));
  const id = current && typeof current['id'] === 'string' ? current['id'] : email;
  const currentAudiences = Array.isArray(current?.['audiences'])
    ? current['audiences'].flatMap((item) => (emailitClient.isRecord(item) && typeof item['id'] === 'string' ? [item['id']] : []))
    : [];
  const merged = [...new Set([...currentAudiences, ...audiences])];
  const update = { ...fields, ...(merged.length > currentAudiences.length ? { audiences: merged } : {}) };
  if (Object.keys(update).length === 0) {
    return { ...(current ?? {}), created: false };
  }
  const updated = await emailitClient.request({
    auth,
    method: HttpMethod.POST,
    path: `/contacts/${emailitClient.seg({ value: id, label: 'Contact' })}`,
    body: update,
    redactBody: true,
    safeToRetry: true,
  });
  return { ...record(updated), created: false };
}

async function getDomain({ auth, domain }: { auth: EmailitAuthInput; domain: unknown }): Promise<unknown> {
  try {
    return await emailitClient.request({ auth, method: HttpMethod.GET, path: `/domains/${emailitClient.seg({ value: domain, label: 'Domain' })}` });
  } catch (error) {
    return emailitClient.rethrowWithHint({ error, hints: { 404: 'Domain not found in this workspace.' } });
  }
}

async function verifyDomain({ auth, domain }: { auth: EmailitAuthInput; domain: unknown }): Promise<unknown> {
  try {
    return await emailitClient.request({
      auth,
      method: HttpMethod.POST,
      path: `/domains/${emailitClient.seg({ value: domain, label: 'Domain' })}/verify`,
      safeToRetry: true,
    });
  } catch (error) {
    return emailitClient.rethrowWithHint({ error, hints: { 404: 'Domain not found in this workspace.' } });
  }
}

async function cancelEmail({ auth, emailId }: { auth: EmailitAuthInput; emailId: unknown }): Promise<Record<string, unknown>> {
  const id = emailitClient.seg({ value: emailId, label: 'Email ID' });
  try {
    const body = await emailitClient.request({ auth, method: HttpMethod.POST, path: `/emails/${id}/cancel`, safeToRetry: true });
    return { ...record(body), alreadyCanceled: false };
  } catch (error) {
    if (emailitClient.statusOf(error) === 422 && (await emailStatus({ auth, id })) === 'canceled') {
      return { id: decodeURIComponent(id), status: 'canceled', in_flight: false, alreadyCanceled: true, message: 'The email was already canceled.' };
    }
    return emailitClient.rethrowWithHint({
      error,
      hints: { 404: 'Email not found.', 422: 'The email can no longer be canceled (already sent, failed, or due within 3 minutes).' },
    });
  }
}

async function emailStatus({ auth, id }: { auth: EmailitAuthInput; id: string }): Promise<string | undefined> {
  try {
    const body = await emailitClient.request({ auth, method: HttpMethod.GET, path: `/email/${id}` });
    const status = emailitClient.isRecord(body) ? body['status'] : undefined;
    return typeof status === 'string' ? status : undefined;
  } catch (error) {
    if (emailitClient.statusOf(error) === 403 || emailitClient.statusOf(error) === 404) return undefined;
    throw error;
  }
}

async function audienceExists({ auth, audience }: { auth: EmailitAuthInput; audience: string }): Promise<boolean> {
  try {
    await emailitClient.request({ auth, method: HttpMethod.GET, path: `/audiences/${audience}` });
    return true;
  } catch (error) {
    if (emailitClient.statusOf(error) === 404) return false;
    throw error;
  }
}

async function lookupContact({ auth, email }: { auth: EmailitAuthInput; email: string }): Promise<Record<string, unknown> | null> {
  try {
    const body = await emailitClient.request({ auth, method: HttpMethod.GET, path: `/contacts/${emailitClient.seg({ value: email, label: 'Email' })}` });
    return emailitClient.isRecord(body) ? body : null;
  } catch (error) {
    if (emailitClient.statusOf(error) === 404) return null;
    throw error;
  }
}

function record(value: unknown): Record<string, unknown> {
  return emailitClient.isRecord(value) ? value : {};
}

export const emailitOperations = { cancelEmail, addSubscriber, updateSubscriber, removeSubscriber, upsertContact, getDomain, verifyDomain };

type SubscriberInput = { audience: unknown; email: unknown; firstName?: unknown; lastName?: unknown; customFields?: unknown };
type SubscriberUpdateInput = { audience: unknown; subscriber: unknown; subscribed?: unknown; firstName?: unknown; lastName?: unknown };
type ContactInput = { email: unknown; firstName?: unknown; lastName?: unknown; customFields?: unknown; audiences?: unknown; unsubscribed?: unknown };
