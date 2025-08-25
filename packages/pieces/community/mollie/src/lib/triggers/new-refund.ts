// import {
//   createTrigger,
//   TriggerStrategy,
//   StaticPropsValue,
// } from '@activepieces/pieces-framework';
// import {
//   DedupeStrategy,
//   Polling,
//   pollingHelper,
// } from '@activepieces/pieces-common';
// import { HttpMethod } from '@activepieces/pieces-common';
// import { MollieAuth } from '../common/auth';
// import { makeRequest } from '../common/client';
// import dayjs from 'dayjs';
// import { paymentIdDropdown } from '../common/props';

// const props = {
//   paymentId: paymentIdDropdown,
// };

// const polling: Polling<string, StaticPropsValue<typeof props>> = {
//   strategy: DedupeStrategy.TIMEBASED,
//   items: async ({ auth, lastFetchEpochMS, propsValue }) => {
//     const items: any[] = [];
//     let hasMore = true;
//     let from: string | undefined;

//     while (hasMore) {
//       const queryParams: string[] = [];

//       if (from) {
//         queryParams.push(`from=${encodeURIComponent(from)}`);
//       }

//       queryParams.push('limit=50');

//       const queryString =
//         queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
//       const endpoint = `/payments/${propsValue.paymentId}/refunds${queryString}`;

//       try {
//         const response = await makeRequest(
//           auth as string,
//           HttpMethod.GET,
//           endpoint
//         );

//         if (response._embedded?.refunds) {
//           const refunds = response._embedded.refunds;

//           const newRefunds = refunds.filter((refund: any) => {
//             const createdAt = dayjs(refund.createdAt);
//             return createdAt.valueOf() > (lastFetchEpochMS || 0);
//           });

//           items.push(...newRefunds);

//           if (response._links?.next && refunds.length === 50) {
//             const lastRefund = refunds[refunds.length - 1];
//             from = lastRefund.id;

//             const allRefundsOld = refunds.every((refund: any) => {
//               return (
//                 dayjs(refund.createdAt).valueOf() <= (lastFetchEpochMS || 0)
//               );
//             });

//             if (allRefundsOld) {
//               hasMore = false;
//             }
//           } else {
//             hasMore = false;
//           }
//         } else {
//           hasMore = false;
//         }
//       } catch (error) {
//         console.error('Error fetching refunds:', error);
//         hasMore = false;
//       }
//     }

//     return items.map((refund) => ({
//       epochMilliSeconds: dayjs(refund.createdAt).valueOf(),
//       data: refund,
//     }));
//   },
// };

// export const newRefund = createTrigger({
//   auth: MollieAuth,
//   name: 'newRefund',
//   displayName: 'New Refund',
//   description: 'Fires when a payment refund is created',
//   props,
//   sampleData: {
//     resource: 'refund',
//     id: 're_4qqhO89gsT',
//     mode: 'live',
//     description: 'Order',
//     amount: {
//       currency: 'EUR',
//       value: '5.95',
//     },
//     status: 'pending',
//     metadata: {
//       bookkeeping_id: 12345,
//     },
//     paymentId: 'tr_5B8cwPMGnU6qLbRvo7qEZo',
//     createdAt: '2023-03-14T17:09:02.0Z',
//     _links: {
//       self: {
//         href: 'https://api.mollie.com/v2/refunds/re_4qqhO89gsT',
//         type: 'application/hal+json',
//       },
//       payment: {
//         href: 'https://api.mollie.com/v2/payments/tr_5B8cwPMGnU6qLbRvo7qEZo',
//         type: 'application/hal+json',
//       },
//       documentation: {
//         href: 'https://docs.mollie.com/reference/v2/refunds-api/get-refund',
//         type: 'text/html',
//       },
//     },
//   },
//   type: TriggerStrategy.POLLING,
//   async test(context) {
//     return await pollingHelper.test(polling, context);
//   },
//   async onEnable(context) {
//     const { store, auth, propsValue } = context;
//     await pollingHelper.onEnable(polling, { store, auth, propsValue });
//   },
//   async onDisable(context) {
//     const { store, auth, propsValue } = context;
//     await pollingHelper.onDisable(polling, { store, auth, propsValue });
//   },
//   async run(context) {
//     return await pollingHelper.poll(polling, context);
//   },
// });
