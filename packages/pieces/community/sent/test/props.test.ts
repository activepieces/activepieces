import { describe, expect, it } from 'vitest';
import {
  AppConnectionType,
  PropertyType,
} from '@activepieces/pieces-framework';
import { sentProps } from '../src/lib/common/props';
import { sentEvents } from '../src/lib/common/events';
import { API_KEY, failure, propertyContext, respond } from './helpers';

describe('Sender Profiles and templates', () => {
  const auth: { type: AppConnectionType.SECRET_TEXT; secret_text: string } = {
    type: AppConnectionType.SECRET_TEXT,
    secret_text: API_KEY,
  };
  it.each(['user', 'profile'])(
    'does not require a Sender Profile for a %s account',
    async (type) => {
      const http = respond({ data: { type } });
      expect(
        (await sentProps.profile.options({ auth }, propertyContext)).options
      ).toEqual([]);
      expect(http).toHaveBeenCalledTimes(1);
    }
  );
  it('uses the current sender-profiles API and follows all pages for the selector', async () => {
    const http = respond({ data: { type: 'organization' } });
    http.mockResolvedValueOnce({
      status: 200,
      headers: {},
      body: { success: true, data: { type: 'organization' } },
    });
    http.mockResolvedValueOnce({
      status: 200,
      headers: {},
      body: {
        success: true,
        data: {
          sender_profiles: [{ id: 'p1', name: 'Marketing' }],
          pagination: { has_more: true },
        },
      },
    });
    http.mockResolvedValueOnce({
      status: 200,
      headers: {},
      body: {
        success: true,
        data: {
          sender_profiles: [{ id: 'p2', name: 'Support' }],
          pagination: { has_more: false },
        },
      },
    });
    const result = await sentProps.profile.options({ auth }, propertyContext);
    expect(result.options).toEqual([
      { label: 'Marketing', value: 'p1' },
      { label: 'Support', value: 'p2' },
    ]);
    expect(http.mock.calls[2][0]).toMatchObject({
      url: 'https://api.sent.dm/v3/sender-profiles',
      queryParams: { page: '2', page_size: '100' },
    });
  });
  it('exposes a connection error rather than silently pretending no profiles exist', async () => {
    const http = respond({ data: {} });
    http.mockRejectedValueOnce(failure({ status: 403 }));
    const result = await sentProps.profile.options({ auth }, propertyContext);
    expect(result.disabled).toBe(true);
    expect(result.placeholder).toContain('Permission denied');
  });
  it('shows only text in text mode and makes no template API calls', async () => {
    const http = respond({ data: {} });
    const props = await sentProps.content.props(
      { auth, message_type: 'text' },
      propertyContext
    );
    expect(Object.keys(props)).toEqual(['text']);
    expect(http).not.toHaveBeenCalled();
  });
  it('loads templates for the selected profile and returns serializable nested fields', async () => {
    const http = respond({
      data: {
        templates: [{ id: 't1', name: 'Order ready', language: 'en_US' }],
        pagination: { has_more: false },
      },
    });
    const props = await sentProps.content.props(
      { auth, message_type: 'template', profile_id: 'p1' },
      propertyContext
    );
    expect(Object.keys(props)).toEqual(['template_id', 'parameters']);
    expect(props['template_id'].type).toBe(PropertyType.STATIC_DROPDOWN);
    expect(JSON.stringify(props)).toContain('Order ready (en_US)');
    expect(http.mock.calls[0][0]).toMatchObject({
      url: 'https://api.sent.dm/v3/templates',
      headers: { 'x-profile-id': 'p1' },
      queryParams: { page: '1', page_size: '100', status: 'APPROVED' },
    });
  });
});

describe('live event catalog and subscriptions', () => {
  it('supports qualified flat entries and grouped subtype catalogs', () => {
    expect(
      sentEvents.options({
        events: [
          {
            name: 'message.delivered',
            display_name: 'Delivered',
            is_active: true,
            event_type: 'message',
          },
          {
            name: 'message',
            display_name: 'All messages',
            is_active: true,
            sub_types: [
              { name: 'received', display_name: 'Received', is_active: true },
            ],
          },
          { name: 'templates', display_name: 'Templates', is_active: true },
          { name: 'retired', display_name: 'Retired', is_active: false },
        ],
      })
    ).toEqual([
      { label: 'Delivered', value: 'message.delivered' },
      { label: 'All messages', value: 'message' },
      { label: 'Received', value: 'message.received' },
      { label: 'Templates', value: 'templates' },
    ]);
  });
  it('maps qualified events to canonical parent subscriptions and suffix filters', () => {
    expect(
      sentEvents.subscription([
        'message.delivered',
        'message.failed',
        'templates',
      ])
    ).toEqual({
      event_types: ['message', 'templates'],
      event_filters: { message: ['delivered', 'failed'] },
    });
    expect(sentEvents.subscription(['message.received'])).toEqual({
      event_types: ['message'],
      event_filters: { message: ['received'] },
    });
  });
  it('a selected parent includes all subtypes without an accidental narrow filter', () => {
    expect(
      sentEvents.subscription([
        'message.delivered',
        'message',
        'message.delivered',
      ])
    ).toEqual({ event_types: ['message'] });
  });
  it('loads the event selector from the API, including a new future subtype', async () => {
    const http = respond({
      data: {
        event_types: [
          {
            name: 'message.future_status',
            display_name: 'Future status',
            is_active: true,
          },
        ],
      },
    });
    const result = await sentEvents.selector.options(
      {
        auth: { type: AppConnectionType.SECRET_TEXT, secret_text: API_KEY },
        profile_id: 'p1',
      },
      propertyContext
    );
    expect(result.options).toEqual([
      { label: 'Future status', value: 'message.future_status' },
    ]);
    expect(http.mock.calls[0][0]).toMatchObject({
      url: 'https://api.sent.dm/v3/webhooks/event-types',
      headers: { 'x-profile-id': 'p1' },
    });
  });
});
