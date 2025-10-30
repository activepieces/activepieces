// import { meistertaskAuth } from '../common/common';
// import { meisterTaskCommon } from '../common/common';
// import { createAction, Property } from '@activepieces/pieces-framework';
// import { HttpMethod } from '@activepieces/pieces-common';

// export const findLabel = createAction({
//   auth: meistertaskAuth,
//   name: 'find_label',
//   displayName: 'Find Label',
//   description: 'Finds a label by searching',
//   props: {
//     project_id: Property.ShortText({
//       displayName: 'Project ID',
//       required: true,
//     }),
//   },
  
//   async run(context) {
//     const { project_id } = context.propsValue;
    
//     const labels = await meisterTaskCommon.makeRequest<Array<unknown>>(
//       HttpMethod.GET,
//       `/projects/${project_id}/labels`,
//       context.auth.apiToken
//     );
//     return labels;
//   },
// });