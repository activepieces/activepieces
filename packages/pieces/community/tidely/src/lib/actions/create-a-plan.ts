import { createAction, Property } from '@activepieces/pieces-framework';
import { makeRequest } from '../common/client';
import { tidelyAuth } from '../common/auth';
import { HttpMethod } from '@activepieces/pieces-common';

export const createAPlan = createAction({
  auth: tidelyAuth,
  name: 'createAPlan',
  displayName: 'Create a Plan',
  description: 'Create a new financial plan in Tidely',
  props: {
    name: Property.ShortText({
      displayName: 'Plan Name',
      description: 'Name of the plan',
      required: true,
    }),
    amount: Property.Number({
      displayName: 'Amount',
      description: 'Plan amount',
      required: true,
    }),
    period: Property.StaticDropdown({
      displayName: 'Period',
      description: 'Frequency of the plan',
      required: true,
      options: {
        options: [
          { label: 'Daily', value: 'DAILY' },
          { label: 'Weekly', value: 'WEEKLY' },
          { label: 'Monthly', value: 'MONTHLY' },
        ],
      },
    }),
    type: Property.StaticDropdown({
      displayName: 'Plan Type',
      description: 'Type of plan',
      required: true,
      options: {
        options: [
          { label: 'One Time', value: 'ONE_TIME' },
          { label: 'Recurring', value: 'RECURRING' },
        ],
      },
    }),
    date: Property.ShortText({
      displayName: 'Date',
      description: 'Plan date (format: dd/MM/yy, M/dd/yy, or yyyy-MM-dd)',
      required: true,
    }),
    categoryId: Property.Number({
      displayName: 'Category ID',
      description: 'ID of the plan category',
      required: false,
    }),
    categoryName: Property.ShortText({
      displayName: 'Category Name',
      description: 'Name of the plan category',
      required: false,
    }),
    scenarioId: Property.Number({
      displayName: 'Scenario ID',
      description: 'ID of the scenario',
      required: false,
    }),
    scenarioName: Property.ShortText({
      displayName: 'Scenario Name',
      description: 'Name of the scenario',
      required: false,
    }),
    replaceCurrentValuesForThePeriod: Property.Checkbox({
      displayName: 'Replace Current Values for the Period',
      description: 'Whether to replace current values for the period',
      required: false,
    }),
  },
  async run(context) {
    const body: Record<string, unknown> = {
      name: context.propsValue.name,
      amount: context.propsValue.amount,
      period: context.propsValue.period,
      type: context.propsValue.type,
      date: context.propsValue.date,
    };

    if (
      context.propsValue.categoryId !== undefined &&
      context.propsValue.categoryId !== null
    ) {
      body['categoryId'] = context.propsValue.categoryId;
    }
    if (context.propsValue.categoryName) {
      body['categoryName'] = context.propsValue.categoryName;
    }
    if (
      context.propsValue.scenarioId !== undefined &&
      context.propsValue.scenarioId !== null
    ) {
      body['scenarioId'] = context.propsValue.scenarioId;
    }
    if (context.propsValue.scenarioName) {
      body['scenarioName'] = context.propsValue.scenarioName;
    }
    if (context.propsValue.replaceCurrentValuesForThePeriod !== undefined) {
      body['replaceCurrentValuesForThePeriod'] =
        context.propsValue.replaceCurrentValuesForThePeriod;
    }

    const response = await makeRequest(
      context.auth.secret_text,
      HttpMethod.POST,
      '/open-api/plans',
      body
    );

    return response;
  },
});
