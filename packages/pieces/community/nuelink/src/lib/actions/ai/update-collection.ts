import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { nuelinkAuths } from '../../auth';
import { nuelinkAiProps } from '../../common/ai-props';
import { nuelinkOutputSchemas } from '../../output-schemas';
import { nuelinkClient } from '../../common/client';
import { nuelinkInputs } from '../../common/inputs';

export const aiUpdateCollection = createAction({
  name: 'nuelink_update_collection',
  classification: 'WRITE',
  auth: nuelinkAuths,
  displayName: 'Update Collection',
  description: 'Renames a collection, changes its description or evergreen interval, or pauses or resumes it.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Changes only the fields you set on a collection: title, description (or clearDescription to empty it), status ACTIVE/PAUSED, maxRepublish (evergreen interval in weeks, 0 = off). Setting status PAUSED is the safe way to stop a collection from publishing, since collections cannot be deleted through the API. Do not copy a maxRepublish of -1 read from nuelink_list_collections back; it is read-only. The response lists no queue slots while paused, but the slots are kept. Re-sending the same values changes nothing.',
    idempotent: true,
  },
  props: {
    brandId: nuelinkAiProps.brandId(),
    collectionId: nuelinkAiProps.collectionId({ required: true, description: 'The numeric collection ID from nuelink_list_collections.' }),
    title: Property.ShortText({ displayName: 'New Title', description: '1 to 255 characters. Empty keeps the current title.', required: false }),
    description: Property.LongText({ displayName: 'New Description', description: 'Up to 1,000 characters. Empty keeps the current one.', required: false }),
    clearDescription: Property.Checkbox({ displayName: 'Clear Description', description: 'Remove the description. Do not combine with New Description.', required: false }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'PAUSED stops publishing from this collection; ACTIVE resumes it. Empty keeps it.',
      required: false,
      options: { options: [{ label: 'Active', value: 'ACTIVE' }, { label: 'Paused', value: 'PAUSED' }] },
    }),
    maxRepublish: Property.Number({ displayName: 'Evergreen Republish Interval (weeks)', description: '0 turns evergreen off. Empty keeps it.', required: false }),
  },
  outputSchema: nuelinkOutputSchemas.collection,
  async run(context) {
    const apiKey = nuelinkClient.apiKeyOf({ auth: context.auth });
    const props = context.propsValue;
    const brandId = nuelinkClient.numericId({ value: props.brandId, label: 'Brand ID' });
    const collectionId = nuelinkClient.numericId({ value: props.collectionId, label: 'Collection ID' });
    const title = nuelinkInputs.optionalText({ value: props.title, label: 'New Title', max: 255 })?.trim();
    const description = nuelinkInputs.optionalText({ value: props.description, label: 'New Description', max: 1000 });
    const clearDescription = nuelinkInputs.isChecked({ value: props.clearDescription });
    const status = nuelinkInputs.oneOf({ value: props.status, label: 'Status', allowed: ['ACTIVE', 'PAUSED'] as const });
    const maxRepublish = nuelinkInputs.optionalInteger({ value: props.maxRepublish, label: 'Evergreen Republish Interval (weeks)', min: 0, max: 10000 });
    if (clearDescription && description !== undefined) {
      throw new Error('Set either New Description or Clear Description, not both.');
    }
    const body = {
      ...(title === undefined ? {} : { title }),
      ...(description === undefined ? {} : { description }),
      ...(clearDescription ? { description: null } : {}),
      ...(status === undefined ? {} : { status }),
      ...(maxRepublish === undefined ? {} : { maxRepublish }),
    };
    if (Object.keys(body).length === 0) {
      throw new Error('Nothing to update. Set New Title, New Description, Clear Description, Status or Evergreen Republish Interval.');
    }
    return nuelinkClient.request({ apiKey, method: HttpMethod.PATCH, path: ['brands', brandId, 'collections', collectionId], body });
  },
});
