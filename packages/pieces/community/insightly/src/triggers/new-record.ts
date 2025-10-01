import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { makeInsightlyRequest , insightlyAuth, INSIGHTLY_OBJECTS } from '../common/common';


export const newRecordTrigger = createTrigger({
  auth: insightlyAuth,
  name: 'new_record',
  displayName: 'New Record',
  description: 'Fires when a new record is created in Insightly',
  type: TriggerStrategy.POLLING,
  props: {
    objectType: Property.StaticDropdown({
      displayName: 'Object Type',
      description: 'The type of Insightly object to monitor',
      required: true,
      options: {
        options: INSIGHTLY_OBJECTS.map(obj => ({
          label: obj,
          value: obj,
        })),
      },
    }),
  },
  async onEnable(context) {
    await context.store.put('lastPollTime', new Date().toISOString());
  },
  async onDisable(context) {
    await context.store.delete('lastPollTime');
  },
  async run(context) {
    const lastPollTime = await context.store.get<string>('lastPollTime');
    const objectType = context.propsValue.objectType;
    
    const lastPollDate = lastPollTime 
      ? new Date(lastPollTime) 
      : new Date(Date.now() - 24 * 60 * 60 * 1000);

    const response = await makeInsightlyRequest(
      context.auth,
      `/${objectType}?brief=false&count_total=false`
    );

    await context.store.put('lastPollTime', new Date().toISOString());

    const records = response.body || [];
    
    const newRecords = records.filter((record: any) => {
      const createdDate = new Date(record.DATE_CREATED_UTC || record.CREATED_DATE_UTC);
      return createdDate > lastPollDate;
    });

    return newRecords;
  },
  async test(context) {
    const objectType = context.propsValue.objectType;
    const response = await makeInsightlyRequest(
      context.auth,
      `/${objectType}?top=1`
    );
    return response.body || [];
  },
  sampleData: {},
});