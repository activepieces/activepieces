// import { meistertaskAuth } from '../common/common';
// import { meisterTaskCommon } from '../common/common';
// import { createAction, Property } from '@activepieces/pieces-framework';
// import { HttpMethod } from '@activepieces/pieces-common';

// export const findOrCreateAttachment= createAction({
//   auth: meistertaskAuth,
//   name: 'find_or_create_attachment',
//   displayName: 'Find or Create Attachment',
//   description: 'Finds an attachment by searching, or creates one if it doesn\'t exist',
//   props: {
//     task_id: Property.ShortText({
//       displayName: 'Task ID',
//       required: true,
//     }),
//     name: Property.ShortText({
//       displayName: 'File Name',
//       required: true,
//     }),
//     local: Property.ShortText({
//       displayName: 'File URL',
//       required: true,
//     }),
//   },
  
//   async run(context) {
//     const { task_id, name, local } = context.propsValue;
    
//     // Try to find existing attachment
//     const attachments = await meisterTaskCommon.makeRequest<Array<any>>(
//       HttpMethod.GET,
//       `/tasks/${task_id}/attachments`,
//       context.auth.apiToken
//     );
    
//     const existingAttachment = attachments.find((att) => att.name === name);
    
//     if (existingAttachment) {
//       return existingAttachment;
//     }
    
//     // Create new attachment if not found
//     return await meisterTaskCommon.makeRequest(
//       HttpMethod.POST,
//       `/tasks/${task_id}/attachments`,
//       context.auth.apiToken,
//       { name, local }
//     );
//   },
// });
