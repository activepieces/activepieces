// import { meistertaskAuth } from '../common/common';
// import { meisterTaskCommon } from '../common/common';
// import { createAction, Property } from '@activepieces/pieces-framework';
// import { HttpMethod } from '@activepieces/pieces-common';

// export const findAttachment = createAction({
//   auth: meistertaskAuth,
//   name: 'find_attachment',
//   displayName: 'Find Attachment',
//   description: 'Finds an attachment by searching',
//   props: {
//     task_id: Property.ShortText({
//       displayName: 'Task ID',
//       required: true,
//     }),
//   },
  
//   async run(context) {
//     const { task_id } = context.propsValue;
    
//     const attachments = await meisterTaskCommon.makeRequest<Array<unknown>>(
//       HttpMethod.GET,
//       `/tasks/${task_id}/attachments`,
//       context.auth.apiToken
//     );
//     return attachments;
//   },
// });
