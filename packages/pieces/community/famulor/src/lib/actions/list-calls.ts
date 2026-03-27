import { createAction } from '@activepieces/pieces-framework';
import { propsValidation } from '@activepieces/pieces-common';
import { famulorAuth } from '../..';
import { famulorCommon } from '../common';
import type { CallDirectionType, CallStatusFilter } from '../common/types';

export const listCalls = createAction({
  auth: famulorAuth,
  name: 'listCalls',
  displayName: 'List Calls',
  description: 'List calls with optional filters.',
  props: famulorCommon.listCallsProperties(),
  async run({ auth, propsValue }) {
    await propsValidation.validateZod(propsValue, famulorCommon.listCallsSchema);

    const phone = propsValue.phone_number as string | undefined;
    const dateFrom = propsValue.date_from as string | undefined;
    const dateTo = propsValue.date_to as string | undefined;

    return await famulorCommon.listCalls({
      auth: auth.secret_text,
      status: propsValue.status as CallStatusFilter | undefined,
      type: propsValue.type as CallDirectionType | undefined,
      phone_number: phone?.trim() ? phone.trim() : undefined,
      assistant_id: propsValue.assistant_id as number | undefined,
      campaign_id: propsValue.campaign_id as number | undefined,
      date_from: dateFrom?.trim() ? dateFrom.trim() : undefined,
      date_to: dateTo?.trim() ? dateTo.trim() : undefined,
      per_page: propsValue.per_page as number | undefined,
      page: propsValue.page as number | undefined,
    });
  },
});
