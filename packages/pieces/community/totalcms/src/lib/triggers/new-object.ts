import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { cmsAuth } from '../auth';
import { totalcmsPolling } from '../common/polling';
import { totalcmsProps } from '../common/props';
import { totalcmsSamples } from './samples';

export const newObjectTrigger = createTrigger({
  auth: cmsAuth,
  name: 'new_object',
  classification: 'READ',
  displayName: 'New Object',
  description: 'Triggers when an object is added to a collection.',
  aiMetadata: {
    description:
      'Fires once for each new object added to a Total CMS collection, with all its fields. Works only for collections whose schema records a created date (blog, feed and most custom schemas).',
  },
  type: TriggerStrategy.POLLING,
  props: {
    collection: totalcmsProps.collection({
      description: 'The collection to watch. Its schema must have a "created" date field.',
    }),
  },
  sampleData: totalcmsSamples.object,
  async onEnable(context) {
    await totalcmsPolling.enable({
      auth: context.auth,
      store: context.store,
      collection: context.propsValue.collection,
      field: 'created',
      isRepublish: context.isRepublish,
    });
  },
  async onDisable(context) {
    await totalcmsPolling.disable({ store: context.store });
  },
  async run(context) {
    return totalcmsPolling.poll({
      auth: context.auth,
      store: context.store,
      collection: context.propsValue.collection,
      field: 'created',
    });
  },
  async test(context) {
    return totalcmsPolling.sample({
      auth: context.auth,
      collection: context.propsValue.collection,
      field: 'created',
      keep: () => true,
    });
  },
});
