import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { makeInsightlyRequest , insightlyAuth, INSIGHTLY_OBJECTS } from '../common/common';



export const deletedRecordTrigger = createTrigger({
  auth: insightlyAuth,
  name: 'deleted_record',
  displayName: 'Deleted Record',
  description: 'Fires when a record is deleted',
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
    const objectType = context.propsValue.objectType;
    const response = await makeInsightlyRequest(
      context.auth,
      `/${objectType}?brief=true`
    );
    const records = response.body || [];
    const recordIds = records.map((r: any) => {
      return r.CONTACT_ID || r.LEAD_ID || r.OPPORTUNITY_ID || 
             r.ORGANISATION_ID || r.PROJECT_ID || r.TASK_ID || 
             r.EVENT_ID || r.NOTE_ID || r.EMAIL_ID;
    });
    await context.store.put('knownRecordIds', recordIds);
  },
  async onDisable(context) {
    await context.store.delete('knownRecordIds');
  },
  async run(context) {
    const objectType = context.propsValue.objectType;
    const knownRecordIds = await context.store.get<number[]>('knownRecordIds') || [];
    
    const response = await makeInsightlyRequest(
      context.auth,
      `/${objectType}?brief=true`
    );
    
    const records = response.body || [];
    const currentRecordIds = records.map((r: any) => {
      return r.CONTACT_ID || r.LEAD_ID || r.OPPORTUNITY_ID || 
             r.ORGANISATION_ID || r.PROJECT_ID || r.TASK_ID || 
             r.EVENT_ID || r.NOTE_ID || r.EMAIL_ID;
    });
    const deletedIds = knownRecordIds.filter(id => !currentRecordIds.includes(id));
    
    await context.store.put('knownRecordIds', currentRecordIds);
    
    return deletedIds.map(id => ({
      id,
      objectType,
      deletedAt: new Date().toISOString(),
    }));
  },
  async test(context) {
    return [];
  },
  sampleData: {},
});
