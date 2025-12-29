// import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
// import { instructionProp } from '../common/props';
// import { heymarketSmsAuth } from '../common/auth';
// export const newOrUpdatedContact = createTrigger({
//   auth: heymarketSmsAuth,
//   name: 'newOrUpdatedContact',
//   displayName: 'New or Updated Contact',
//   description: 'Triggered when a contact is created or updated',
//   props: { instruction: instructionProp },
//   sampleData: {},
//   type: TriggerStrategy.WEBHOOK,
//   async onEnable(context) {
//     // implement webhook creation logic
//   },
//   async onDisable(context) {
//     // implement webhook deletion logic
//   },
//   async run(context) {
//     return [context.payload.body];
//   },
// });
