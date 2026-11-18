import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { reviewflowzAuth } from '../auth';
import { reviewflowzApi } from '../common/client';
import { reviewflowzProps } from '../common/props';

export const setSourceDimensionAction = createAction({
  auth: reviewflowzAuth,
  name: 'set_source_dimension',
  classification: 'WRITE',
  displayName: 'Set Source Dimension',
  description: "Sets a source's value for one of your dimensions, like its region or brand, for reports and filters.",
  audience: 'both',
  aiMetadata: {
    description:
      "Set a source's value for one of the account's existing custom dimensions (region, brand, manager...) used by Reviewflowz reports and filters. The dimension must already exist. Replaces the previous value, so retries are safe.",
    idempotent: true,
  },
  props: {
    source: reviewflowzProps.source(),
    key: reviewflowzProps.dimension(),
    value: Property.ShortText({ displayName: 'Value', description: 'Like Europe.', required: true }),
  },
  async run(context) {
    const { auth, propsValue: input } = context;
    return reviewflowzApi.call({
      auth,
      method: HttpMethod.PUT,
      path: `/sources/${encodeURIComponent(String(input.source))}/dimensions/${encodeURIComponent(input.key)}`,
      body: { value: input.value },
    });
  },
});
