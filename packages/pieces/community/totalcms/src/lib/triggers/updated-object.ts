import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { cmsAuth } from '../auth';
import { totalcmsPolling } from '../common/polling';
import { totalcmsProps } from '../common/props';
import { totalcmsSamples } from './samples';

export const updatedObjectTrigger = createTrigger({
  auth: cmsAuth,
  name: 'updated_object',
  classification: 'READ',
  displayName: 'Updated Object',
  description: 'Triggers when an object in a collection is changed.',
  aiMetadata: {
    description:
      'Fires when an object in a Total CMS collection is saved with changes, once per object per check, with its current fields. Several saves between checks give one event. New objects are skipped unless Include New Objects is on. Needs a schema with an updated date field.',
  },
  type: TriggerStrategy.POLLING,
  props: {
    collection: totalcmsProps.collection({
      description: 'The collection to watch. Its schema must have an "updated" date field.',
    }),
    include_new: Property.Checkbox({
      displayName: 'Include New Objects',
      description: 'Also trigger when an object is created.',
      required: false,
      defaultValue: false,
    }),
  },
  sampleData: totalcmsSamples.object,
  async onEnable(context) {
    await totalcmsPolling.enable({
      auth: context.auth,
      store: context.store,
      collection: context.propsValue.collection,
      field: 'updated',
      isRepublish: context.isRepublish,
    });
  },
  async onDisable(context) {
    await totalcmsPolling.disable({ store: context.store });
  },
  async run(context) {
    const objects = await totalcmsPolling.poll({
      auth: context.auth,
      store: context.store,
      collection: context.propsValue.collection,
      field: 'updated',
    });
    return objects.filter((object) => keepObject({ object, includeNew: context.propsValue.include_new === true }));
  },
  async test(context) {
    return totalcmsPolling.sample({
      auth: context.auth,
      collection: context.propsValue.collection,
      field: 'updated',
      keep: (object) => keepObject({ object, includeNew: context.propsValue.include_new === true }),
    });
  },
});

function keepObject({ object, includeNew }: { object: Record<string, unknown>; includeNew: boolean }): boolean {
  return includeNew || object['created'] === undefined || object['created'] !== object['updated'];
}
