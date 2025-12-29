// import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
// import { heymarketSmsAuth } from '../common/auth';
// import { instructionProp } from '../common/props';
// export const incommingPhoneCall = createTrigger({
//   auth: heymarketSmsAuth,
//   name: 'incommingPhoneCall',
//   displayName: 'Incomming Phone Call',
//   description: 'Triggered when an incoming phone call is received',
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
