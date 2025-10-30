// import { meistertaskAuth } from '../common/common';
// import { meisterTaskCommon } from '../common/common';
// import { createAction, Property } from '@activepieces/pieces-framework';
// import { HttpMethod } from '@activepieces/pieces-common';

// export const updateTask = createAction({
//   auth: meistertaskAuth,
//   name: 'update_task',
//   displayName: 'Update Task',
//   description: 'Updates an existing task',
//   props: {
//     id: Property.ShortText({
//       displayName: 'Task ID',
//       required: true,
//     }),
//     name: Property.ShortText({
//       displayName: 'Task Name',
//       required: false,
//     }),
//     notes: Property.LongText({
//       displayName: 'Notes',
//       required: false,
//     }),
//     assigned_to_id: Property.ShortText({
//       displayName: 'Assigned To ID',
//       required: false,
//     }),
//     section_id: Property.ShortText({
//       displayName: 'The ID of the parent section',
//       required: false,
//     }),
//     status: Property.Number({
//       displayName: 'Status',
//       description: '1 = Open, 2 = Completed',
//       required: false,
//     }),
//     due: Property.DateTime({
//       displayName: 'Due Date',
//       description: 'ISO 8601 format (e.g., 2025-12-31)',
//       required: false,
//     }),
//   },
  
//   async run(context) {
//     const { id, name, notes, assigned_to_id, status, due, section_id } = context.propsValue;
    
//     const updateData: Record<string, unknown> = {};
//     if (name) updateData[name] = name;
//     if (notes) updateData[notes] = notes;
//     if (assigned_to_id) updateData[assigned_to_id] = assigned_to_id;
//     if (status) updateData[status] = status;
//     if (due) updateData[due] = due;
//     if(section_id) updateData[section_id] = section_id;
    
//     return await meisterTaskCommon.makeRequest(
//       HttpMethod.PUT,
//       `/tasks/${id}`,
//       context.auth.apiToken,
//       updateData
//     );
//   },
// });