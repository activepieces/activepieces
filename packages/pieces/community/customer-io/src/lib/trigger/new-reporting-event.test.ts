/// <reference types="vitest/globals" />

import { newReportingEvent } from './new-reporting-event';

const EVENT = {
  event_id: '01E4C8AY5K21N2QNRBD9YXJ13Z',
  object_type: 'email',
  metric: 'delivered',
  timestamp: 1585254331,
  data: {
    action_id: 489,
    campaign_id: 20,
    recipient: 'user@odoo.com',
  },
};

const buildContext = ({
  propsValue,
  body,
}: {
  propsValue: unknown;
  body: unknown;
}) =>
  ({
    propsValue,
    payload: {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body,
      queryParams: {},
    },
  } as never);

describe('customer-io new-reporting-event run()', () => {
  test('returns the event when no filters are set', async () => {
    const output = await newReportingEvent.run(
      buildContext({ propsValue: { events: ['email_delivered'] }, body: EVENT })
    );

    expect(output).toEqual([EVENT]);
  });

  test('returns the event when campaign, action and domain all match', async () => {
    const output = await newReportingEvent.run(
      buildContext({ propsValue: {
          events: ['email_delivered'],
          campaign_id: 20,
          action_id: 489,
          recipient_domain: 'odoo.com',
        }, body: EVENT })
    );

    expect(output).toEqual([EVENT]);
  });

  test('drops the event when the campaign does not match', async () => {
    const output = await newReportingEvent.run(
      buildContext({ propsValue: { events: ['email_delivered'], campaign_id: 99 }, body: EVENT })
    );

    expect(output).toEqual([]);
  });

  test('drops the event when the action does not match', async () => {
    const output = await newReportingEvent.run(
      buildContext({ propsValue: { events: ['email_delivered'], action_id: 1 }, body: EVENT })
    );

    expect(output).toEqual([]);
  });

  test('drops the event when the recipient domain does not match', async () => {
    const output = await newReportingEvent.run(
      buildContext({ propsValue: { events: ['email_delivered'], recipient_domain: 'example.com' }, body: EVENT })
    );

    expect(output).toEqual([]);
  });

  test('matches the recipient domain case-insensitively and tolerates a leading @', async () => {
    const output = await newReportingEvent.run(
      buildContext({ propsValue: { events: ['email_delivered'], recipient_domain: '@ODOO.com' }, body: EVENT })
    );

    expect(output).toEqual([EVENT]);
  });

  test('matches on email_address when recipient is absent', async () => {
    const event = {
      ...EVENT,
      data: { action_id: 489, campaign_id: 20, email_address: 'user@odoo.com' },
    };
    const output = await newReportingEvent.run(
      buildContext({ propsValue: { events: ['email_delivered'], recipient_domain: 'odoo.com' }, body: event })
    );

    expect(output).toEqual([event]);
  });

  test('matches on identifiers.email even when recipient holds a non-email address', async () => {
    const event = {
      ...EVENT,
      object_type: 'sms',
      data: {
        action_id: 489,
        campaign_id: 20,
        recipient: '+15551234567',
        identifiers: { email: 'user@odoo.com' },
      },
    };
    const output = await newReportingEvent.run(
      buildContext({ propsValue: { events: ['sms_delivered'], recipient_domain: 'odoo.com' }, body: event })
    );

    expect(output).toEqual([event]);
  });

  test('matches on identifiers.email when recipient and email_address are absent', async () => {
    const event = {
      ...EVENT,
      data: {
        action_id: 489,
        campaign_id: 20,
        identifiers: { email: 'user@odoo.com' },
      },
    };
    const output = await newReportingEvent.run(
      buildContext({ propsValue: { events: ['email_delivered'], recipient_domain: 'odoo.com' }, body: event })
    );

    expect(output).toEqual([event]);
  });
});
