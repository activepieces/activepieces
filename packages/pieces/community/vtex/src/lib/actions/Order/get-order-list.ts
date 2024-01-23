import { Property, createAction } from '@activepieces/pieces-framework';
import { Order } from '../../common/Order';
import { vtexAuth } from '../../..';

const year = new Date().getFullYear().toString();

export const getOrderList = createAction({
  auth: vtexAuth,
  name: 'get-order-list',
  displayName: 'Get Orders List',
  description: 'Find Orders',
  props: {
    fromYear: Property.Number({
      displayName: 'From (Year)',
      required: true,
    }),
    toYear: Property.ShortText({
      displayName: 'To (Year)',
      defaultValue: year,
      required: true,
    }),
    fromMonth: Property.ShortText({
      displayName: 'From (Month)',
      defaultValue: '01',
      required: false,
    }),
    toMonth: Property.ShortText({
      displayName: 'To (Month)',
      defaultValue: '12',
      required: false,
    }),
    fromDay: Property.ShortText({
      displayName: 'From (Day)',
      defaultValue: '01',
      required: false,
    }),
    toDay: Property.ShortText({
      displayName: 'To (Day)',
      defaultValue: '28',
      required: false,
    }),
  },
  async run(context) {
    const { hostUrl, appKey, appToken } = context.auth;
    const { fromYear, toYear, fromMonth, toMonth, fromDay, toDay } =
      context.propsValue;

    const order = new Order(hostUrl, appKey, appToken);

    const fromDate = new Date(
      `${fromYear}-${fromMonth || '01'}-${fromDay || '01'}`
    );
    const toDate = new Date(`${toYear}-${toMonth || '12'}-${toDay || '28'}`);

    return await order.getOrderList(fromDate, toDate);
  },
});
