import { AuthenticationType, httpClient, HttpMethod } from "@activepieces/pieces-common";
import { Property } from "@activepieces/pieces-framework";
import { baseUrlv0 } from "./common";
import { straicoAuth } from "../..";

export const agentIdDropdown =(displayName:string, desc:string)=> Property.Dropdown({
  auth: straicoAuth,

      displayName,
      required: true,
      description: desc,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Please authenticate first',
            options: [],
          };
        }

        const response = await httpClient.sendRequest<{
          success: boolean;
          data: Array<{
            _id: string;
            name: string;
          }>;
        }>({
          url: `${baseUrlv0}/agent`,
          method: HttpMethod.GET,
          authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: auth.secret_text,
          },
        });

        if (response.body.success && response.body.data) {
          return {
            options: response.body.data.map((agent) => {
              return {
                label: agent.name,
                value: agent._id,
              };
            }),
          };
        }

        return {
          disabled: true,
          placeholder: 'No agents found',
          options: [],
        };
      },
    })