import { createAction, Property } from '@activepieces/pieces-framework';
import { ninetyAuth } from '../auth';
import { ninetyCommon } from '../common/client';
import { ninetyProps } from '../common/props';
import { measurableScoreOutputSchema } from '../common/output-schemas';

export const setMeasurableScore = createAction({
  auth: ninetyAuth,
  name: 'set_measurable_score',
  classification: 'WRITE',
  displayName: 'Set Measurable Score',
  description: 'Record the number for one scorecard period',
  audience: 'both',
  aiMetadata: {
    description:
      'Writes the score for one Ninety measurable in one period. The period start date identifies the cell, so calling it again with the same date overwrites that score rather than adding another. Use Find Measurables to get the measurable id. Safe to retry.',
    idempotent: true,
  },
  outputSchema: measurableScoreOutputSchema,
  props: {
    teamId: ninetyProps.teamIdOptional,
    measurableId: ninetyProps.measurableId,
    value: Property.Number({
      displayName: 'Value',
      description: 'The number to record for this period',
      required: true,
    }),
    periodStartDate: Property.DateTime({
      displayName: 'Period Start Date',
      description:
        'The first day of the period being scored. Ninety keys the score on this, so the same date overwrites.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const periodStartDate = ninetyCommon.toIsoDate({
      value: propsValue.periodStartDate,
      field: 'Period Start Date',
    });

    const response = await ninetyCommon.setMeasurableScore({
      token: auth.secret_text,
      measurableId: propsValue.measurableId,
      value: propsValue.value,
      periodStartDate,
    });

    return {
      measurableId: propsValue.measurableId,
      value: propsValue.value,
      periodStartDate,
      response,
    };
  },
});
