import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from './client';
import { Property } from '@activepieces/pieces-framework';

export const agentIdDropdown = Property.Dropdown({
  displayName: 'Agent ID',
  description: 'Select the agent to use',
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please connect your account first',
      };
    }

    try {
      const agents = await makeRequest(
        auth as string,
        HttpMethod.GET,
        '/list-agents'
      );
      return {
        disabled: false,
        options: agents.map((agent: any) => ({
          label: agent.agent_name + ' ' + `(${agent.version})`,
          value: agent.agent_id,
        })),
      };
    } catch (error) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Error loading teams',
      };
    }
  },
});


//  export const agentVersionDropdown = Property.Dropdown({

//   displayName: 'Agent Version',
//   description: 'Select the version of the agent to use',
//   required: true,
//   refreshers: ['auth', 'inboundAgentId'],
//   options: async ({ auth ,inboundAgentId}) => {
//     if (!auth) {
//       return {
//         disabled: true,
//         options: [],
//         placeholder: 'Please connect your account first',
//       };
//     }
//     if(!inboundAgentId) {
//       return {
//         disabled: true,
//         options: [],
//         placeholder: 'Please select an inbound agent first',
//       };
//     }

//     try {
//       const agents = await makeRequest(
//         auth as string,
//         HttpMethod.GET,
//         `/get-agent-versions/${inboundAgentId}`
//       );
//       return {
//         disabled: false,
//         options: agents.map((agent: any) => ({
//           label: `Version ${agent.version}`,
//           value: agent.version,
//         })),
//       };
//     } catch (error) {
//       return {
//         disabled: true,
//         options: [],
//         placeholder: 'Error loading agent versions',
//       };
//     }
//   },
// });


export const callIdDropdown = Property.Dropdown({
  displayName: 'Call ID',
  description: 'Select the call ID to use',
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please connect your account first',
      };
    }

    try {
      const calls = await makeRequest(
        auth as string,
        HttpMethod.POST,
        '/list-calls'
      );
      return {
        disabled: false,
        options: calls.map((call: any) => ({
          label: `Call ${call.call_id}`,
          value: call.call_id,
        })),
      };
    } catch (error) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Error loading calls',
      };
    }
  },
}); 