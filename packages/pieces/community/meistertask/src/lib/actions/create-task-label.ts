// import { meistertaskAuth } from '../common/common';
// import { meisterTaskCommon } from '../common/common';
// import { createAction, Property } from '@activepieces/pieces-framework';

// import { HttpMethod } from '@activepieces/pieces-common';

// export const createTaskLabel = createAction({
//   auth: meistertaskAuth,
//   name: 'create_task_label',
//   displayName: 'Create Task Label',
//   description: 'Creates a new task label',
//   props: {
//     task_id: Property.ShortText({
//       displayName: 'Task ID',
//       required: true,
//     }),
//     label_id: Property.ShortText({
//       displayName: 'Label ID',
//       required: true,
//     }),
//   },
  
//   async run(context) {
//     const { task_id, label_id } = context.propsValue;
    
//     return await meisterTaskCommon.makeRequest(
//       HttpMethod.POST,
//       `/tasks/${task_id}/task_labels`,
//       context.auth.apiToken,
//       { label_id }
//     );
//   },
// });