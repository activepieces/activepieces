import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { makeRequest } from '../common/client';
import { waitwhileAuth } from '../common/auth';
import { HttpMethod } from '@activepieces/pieces-common';
export const newOrUpdatedVisit = createTrigger({
  auth: waitwhileAuth,
  name: 'newOrUpdatedVisit',
  displayName: 'New Or Updated Visit',
  description: 'Triggers when a visit is created or updated',
  props: {},
  sampleData: {
    id: '0T6HwEtZs8ASfL52phLj',
    created: '2022-05-19T13:58:26.925Z',
    accountId: 'itiDKblwIrcJsAxO8kGz',
    type: 'visit.created',
    data: {
      id: '9QvKDkhrXIxNLdS9xMkf',
      locationId: 'P3HCgTiw7IjFhxM2qmjt',
      state: 'BOOKED',
      customerId: 'CsgoBO4eR1iNyg6PF2PSkt',
      date: '2022-05-19T10:00',
      duration: 1800,
      firstName: '',
      lastName: '',
      name: '',
      externalCustomerId: '',
      notes: '',
      publicId: '9QvSDk',
      isAnonymized: false,
      created: '2022-05-19T13:58:26.528Z',
      createdBy: 'RUlfUPgKD3NVd7YFIc8sYImlZIf1',
      updated: '2022-05-19T13:58:26.528Z',
      updatedBy: 'RUlfUPgKD3NVd7YFIc8sYImlZIf1',
      remoteIp: '',
      country: 'US',
      region: 'ny',
      city: 'city name',
      isBlock: false,
      source: 'WEB-APP',
      locale: null,
      partySize: 1,
      resourceIds: [],
      serviceIds: [],
      dataFields: [],
      tags: [],
      bookingTime: '2022-05-19T13:58:26.528Z',
      waitlistTime: null,
      serveTime: null,
      completedTime: null,
      ticket: 'A100',
      numVisits: 1,
    },
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const api_key = context.auth.secret_text;
    const webhookUrl = context.webhookUrl;

    const body = {
      url: webhookUrl,
      eventTypes: ['visit.created', 'visit.updated'],
    };

    const response = (await makeRequest(
      api_key,
      HttpMethod.POST,
      '/webhooks',
      body
    )) as any;
    await context.store.put('webhookId', response.id);
  },
  async onDisable(context) {
    const api_key = context.auth.secret_text;
    const webhookId = await context.store.get('webhookId');

    if (webhookId) {
      await makeRequest(api_key, HttpMethod.DELETE, `/webhooks/${webhookId}`);
    }
  },
  async run(context) {
    return [context.payload.body];
  },
});
