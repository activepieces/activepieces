import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, isNil, Property } from '@activepieces/pieces-framework';
import { googleAuth } from '../..';
import { gmbApi } from '../common/client';
import { updateLocationActionOutputSchema } from '../output-schemas';

export const updateLocation = createAction({
  name: 'update-location',
  outputSchema: updateLocationActionOutputSchema,
  classification: 'WRITE',
  displayName: 'Update Location',
  description: 'Updates the website, labels or store code of a business location.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Updates selected fields of a Google Business Profile location; only the fields you supply are changed and everything else is left untouched. Website is public and appears on Google Maps and Search, so change it only when the user explicitly asks. Labels replaces the whole label set, so include every label you want to keep; an empty list is ignored and cannot clear them. Store Code is internal. Empty text fields are ignored. Description, phone, hours, address and categories cannot be edited here. Safe to repeat with the same values.',
    idempotent: true,
  },
  auth: googleAuth,
  props: {
    location_id: gmbApi.props.locationId(),
    website_uri: Property.ShortText({
      displayName: 'Website',
      description: 'The public website URL of the business.',
      required: false,
    }),
    labels: Property.Array({
      displayName: 'Labels',
      description: 'Internal labels for the location. Replaces the existing labels. Leave empty to keep the current labels; this action cannot clear them.',
      required: false,
    }),
    store_code: Property.ShortText({
      displayName: 'Store Code',
      description: 'Your internal identifier for the location.',
      required: false,
    }),
  },
  async run(ctx) {
    const { location_id, website_uri, labels, store_code } = ctx.propsValue;
    const websiteValue = nonBlank(website_uri);
    const storeCodeValue = nonBlank(store_code);
    const suppliedLabels = isNil(labels)
      ? []
      : labels.filter((label): label is string => typeof label === 'string' && label.trim().length > 0);
    const labelValues = suppliedLabels.length === 0 ? undefined : suppliedLabels;
    const patches: Patch[] = [
      ...(isNil(websiteValue) ? [] : [{ mask: 'websiteUri', body: { websiteUri: websiteValue } }]),
      ...(isNil(labelValues) ? [] : [{ mask: 'labels', body: { labels: labelValues } }]),
      ...(isNil(storeCodeValue) ? [] : [{ mask: 'storeCode', body: { storeCode: storeCodeValue } }]),
    ];
    if (patches.length === 0) {
      throw new Error('Provide at least one field to update: website_uri, labels or store_code.');
    }
    const location = gmbApi.resourceNames.v1Location(location_id);
    return gmbApi.request<Record<string, unknown>>({
      accessToken: ctx.auth.access_token,
      method: HttpMethod.PATCH,
      url: `${gmbApi.hosts.businessInformation}/${location}`,
      query: new URLSearchParams({ updateMask: patches.map((patch) => patch.mask).join(',') }),
      body: patches.reduce<Record<string, unknown>>((acc, patch) => ({ ...acc, ...patch.body }), {}),
    });
  },
});

function nonBlank(value: string | undefined): string | undefined {
  return isNil(value) || value.trim().length === 0 ? undefined : value;
}

type Patch = {
  mask: string;
  body: Record<string, unknown>;
};
