import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { mollieAuth } from '../common/common';
import { MollieApi } from '../common/common';

export const newSettlementTrigger = createTrigger({
  auth: mollieAuth,
  name: 'new_settlement',
  displayName: 'New Settlement',
  description: 'Fires upon a new settlement event (e.g. payout)',
  props: {},
  sampleData: {
    resource: 'settlement',
    id: 'stl_jDk30akdN',
    reference: '1234567.1804.03',
    status: 'paidout',
    amount: {
      value: '39.75',
      currency: 'EUR'
    },
    periods: {
      '2018': {
        '04': {
          revenue: [
            {
              description: 'iDEAL',
              method: 'ideal',
              count: 6,
              amountNet: {
                value: '86.1000',
                currency: 'EUR'
              },
              amountVat: null,
              amountGross: {
                value: '86.1000',
                currency: 'EUR'
              }
            }
          ]
        }
      }
    },
    createdAt: '2018-04-06T06:00:01.000Z',
    settledAt: '2018-04-06T09:41:44.000Z'
  },
  type: TriggerStrategy.POLLING,
  async onEnable(context) {
    await context.store?.put('lastChecked', new Date().toISOString());
  },
  async onDisable(context) {
    await context.store?.delete('lastChecked');
  },

  async run(context) {
    const api = new MollieApi({ accessToken: context.auth.access_token });

    try {
      const storedLastChecked = await context.store?.get('lastChecked');
      const lastChecked = typeof storedLastChecked === 'string'
        ? storedLastChecked
        : new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      const response = await api.makeRequest('/settlements?limit=250');

      const settlements = (
        response &&
        typeof response === 'object' &&
        '_embedded' in response &&
        response._embedded &&
        typeof response._embedded === 'object' &&
        'settlements' in response._embedded &&
        Array.isArray(response._embedded.settlements)
      ) ? response._embedded.settlements : [];

      const newSettlements = settlements.filter((settlement: any) =>
        settlement.createdAt && new Date(settlement.createdAt) > new Date(lastChecked)
      );

      if (settlements.length > 0) {
        const latest = settlements.reduce((prev: any, current: any) =>
          new Date(current.createdAt) > new Date(prev.createdAt) ? current : prev
        );
        await context.store?.put('lastChecked', latest.createdAt);
      }

      return newSettlements;
    } catch (error) {
      console.error('Error fetching settlements:', error);
      return [];
    }
  }
});