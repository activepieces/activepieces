// import { meistertaskAuth } from '../common/common';
// import { meisterTaskCommon } from '../common/common';
// import { createAction, Property } from '@activepieces/pieces-framework';
// import { HttpMethod } from '@activepieces/pieces-common';

// export const createAttachment = createAction({
//   auth: meistertaskAuth,
//   name: 'create_attachment',
//   displayName: 'Create Attachment',
//   description: 'Creates a new attachment',
//   props: {
//     task_id: Property.Number({
//       displayName: 'The ID of the task.',
//       required: true,
//     }),
//     name: Property.ShortText({
//       displayName: 'The name of the attachment',
//       required: false,
//     }),
//     local: Property.ShortText({
//       displayName: 'The file to upload to a task.',
//       required: true,
//     }),
//   },
  
//   async run(context) {
//     const { task_id, name, local } = context.propsValue;
    
//     return await meisterTaskCommon.makeRequest(
//       HttpMethod.POST,
//       `/tasks/${task_id}/attachments`,
//       context.auth.apiToken,
//       { name, local }
//     );
//   },
// });
