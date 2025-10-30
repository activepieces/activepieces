// import { meistertaskAuth } from '../common/common';
// import { meisterTaskCommon } from '../common/common';
// import { createAction, Property } from '@activepieces/pieces-framework';
// import { HttpMethod } from '@activepieces/pieces-common';

// export const findOrCreateLabel = createAction({
//   auth: meistertaskAuth,
//   name: 'find_or_create_label',
//   displayName: 'Find or Create Label',
//   description: 'Finds a label by searching, or creates one if it doesn\'t exist',
//   props: {
//     project_id: Property.ShortText({
//       displayName: 'Project ID',
//       required: true,
//     }),
//     name: Property.ShortText({
//       displayName: 'Label Name',
//       required: true,
//     }),
//     color: Property.ShortText({
//       displayName: 'Color',
//       description: 'Hex color code (e.g., #FF0000)',
//       required: false,
//     }),
//   },
  
//   async run(context) {
//     const { project_id, name, color } = context.propsValue;
    
//     // Try to find existing label
//     const labels = await meisterTaskCommon.makeRequest<Array<any>>(
//       HttpMethod.GET,
//       `/projects/${project_id}/labels`,
//       context.auth.apiToken
//     );
    
//     const existingLabel = labels.find((label) => label.name === name);
    
//     if (existingLabel) {
//       return existingLabel;
//     }
    
//     // Create new label if not found
//     return await meisterTaskCommon.makeRequest(
//       HttpMethod.POST,
//       `/projects/${project_id}/labels`,
//       context.auth.apiToken,
//       { name, color }
//     );
//   },
// });