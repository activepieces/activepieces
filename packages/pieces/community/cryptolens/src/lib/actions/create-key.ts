import { createAction, Property } from '@activepieces/pieces-framework';
import { makeRequest } from '../common/client';
import { cryptolensAuth } from '../common/auth';
import { HttpMethod } from '@activepieces/pieces-common';

export const createKey = createAction({
  auth: cryptolensAuth,
  name: 'createKey',
  displayName: 'Create Key',
  description: 'Create a new license key for a product',
  props: {
    productId: Property.Number({
      displayName: 'Product ID',
      description: 'The product ID',
      required: true,
    }),
    period: Property.Number({
      displayName: 'Validity Period (days)',
      description:
        'The number of days from today the license key should be valid. Default is 0 (no expiration).',
      required: false,
    }),
    f1: Property.Checkbox({
      displayName: 'Feature 1',
      description: 'Enable Feature 1',
      required: false,
    }),
    f2: Property.Checkbox({
      displayName: 'Feature 2',
      description: 'Enable Feature 2',
      required: false,
    }),
    f3: Property.Checkbox({
      displayName: 'Feature 3',
      description: 'Enable Feature 3',
      required: false,
    }),
    f4: Property.Checkbox({
      displayName: 'Feature 4',
      description: 'Enable Feature 4',
      required: false,
    }),
    f5: Property.Checkbox({
      displayName: 'Feature 5',
      description: 'Enable Feature 5',
      required: false,
    }),
    f6: Property.Checkbox({
      displayName: 'Feature 6',
      description: 'Enable Feature 6',
      required: false,
    }),
    f7: Property.Checkbox({
      displayName: 'Feature 7',
      description: 'Enable Feature 7',
      required: false,
    }),
    f8: Property.Checkbox({
      displayName: 'Feature 8',
      description: 'Enable Feature 8',
      required: false,
    }),
    notes: Property.LongText({
      displayName: 'Notes',
      description:
        'Additional notes about the license key (max 500 characters)',
      required: false,
    }),
    block: Property.Checkbox({
      displayName: 'Block Key',
      description: 'Block the key from being accessed by the Activation method',
      required: false,
    }),
    customerId: Property.Number({
      displayName: 'Customer ID',
      description: 'The ID of the customer to associate with this license key',
      required: false,
    }),
    trialActivation: Property.Checkbox({
      displayName: 'Enable Trial Activation',
      description: 'Enable or disable trial activation',
      required: false,
    }),
    maxNoOfMachines: Property.Number({
      displayName: 'Max Number of Machines',
      description:
        'The maximum number of computers that can activate the key. Default is 0 (unlimited).',
      required: false,
    }),
    allowedMachines: Property.LongText({
      displayName: 'Allowed Machines',
      description:
        'A list of machine codes (separated by new lines) that will be prioritized during activation',
      required: false,
    }),
    resellerId: Property.Number({
      displayName: 'Reseller ID',
      description: 'The ID of the reseller to associate with this license key',
      required: false,
    }),
    noOfKeys: Property.Number({
      displayName: 'Number of Keys',
      description:
        'The number of keys to generate. Default is 1. Maximum 1000 per request.',
      required: false,
    }),
  },
  async run(context) {
    const params = new URLSearchParams({
      ProductId: String(context.propsValue.productId),
    });

    if (
      context.propsValue.period !== undefined &&
      context.propsValue.period !== null
    ) {
      params.append('Period', String(context.propsValue.period));
    }

    if (context.propsValue.f1) params.append('F1', 'true');
    if (context.propsValue.f2) params.append('F2', 'true');
    if (context.propsValue.f3) params.append('F3', 'true');
    if (context.propsValue.f4) params.append('F4', 'true');
    if (context.propsValue.f5) params.append('F5', 'true');
    if (context.propsValue.f6) params.append('F6', 'true');
    if (context.propsValue.f7) params.append('F7', 'true');
    if (context.propsValue.f8) params.append('F8', 'true');

    if (context.propsValue.notes) {
      params.append('Notes', context.propsValue.notes);
    }

    if (context.propsValue.block) {
      params.append('Block', 'true');
    }

    if (
      context.propsValue.customerId !== undefined &&
      context.propsValue.customerId !== null
    ) {
      params.append('CustomerId', String(context.propsValue.customerId));
    }

    if (context.propsValue.trialActivation) {
      params.append('TrialActivation', 'true');
    }

    if (
      context.propsValue.maxNoOfMachines !== undefined &&
      context.propsValue.maxNoOfMachines !== null
    ) {
      params.append(
        'MaxNoOfMachines',
        String(context.propsValue.maxNoOfMachines)
      );
    }

    if (context.propsValue.allowedMachines) {
      params.append('AllowedMachines', context.propsValue.allowedMachines);
    }

    if (
      context.propsValue.resellerId !== undefined &&
      context.propsValue.resellerId !== null
    ) {
      params.append('ResellerId', String(context.propsValue.resellerId));
    }

    if (
      context.propsValue.noOfKeys !== undefined &&
      context.propsValue.noOfKeys !== null
    ) {
      params.append('NoOfKeys', String(context.propsValue.noOfKeys));
    }

    const response = await makeRequest(
      context.auth.secret_text,
      HttpMethod.POST,
      `/key/CreateKey?${params.toString()}`
    );

    return response;
  },
});
