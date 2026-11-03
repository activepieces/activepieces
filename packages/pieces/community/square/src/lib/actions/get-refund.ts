import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { squareAuth } from '../auth';
import { squareClient } from '../common/client';
import { squareInputs } from '../common/inputs';
import { squareShape } from '../common/shape';
import { squareOutputSchemas } from '../output-schemas';

export const getRefundAction = createAction({
  name: 'get_refund',
  classification: 'READ',
  auth: squareAuth,
  displayName: 'Get Refund',
  description: 'Gets a refund and its status.',
  audience: 'both',
  aiMetadata: {
    description: 'Reads one Square refund by refund ID (from a payment\'s refund IDs or List Refunds): status (PENDING, COMPLETED, REJECTED, FAILED), amount and the refunded payment. Read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    refund_id: Property.ShortText({ displayName: 'Refund ID', required: true }),
  },
  outputSchema: squareOutputSchemas.refund,
  async run(context) {
    const refundId = squareInputs.requireId({ value: context.propsValue.refund_id, label: 'Refund ID' });
    const body = await squareClient.request<unknown>({ auth: context.auth, method: HttpMethod.GET, path: ['v2', 'refunds', refundId], operation: `read refund "${refundId}"` });
    return squareShape.refund(squareShape.requireObject({ body, key: 'refund', what: 'refund' }));
  },
});
