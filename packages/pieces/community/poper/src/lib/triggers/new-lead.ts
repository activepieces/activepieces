
import { createTrigger, TriggerStrategy, PiecePropValueSchema, StaticPropsValue, DropdownProperty  } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper, HttpMethod, HttpRequest, httpClient } from '@activepieces/pieces-common';
import { poperAuth } from './../../';

import { Property } from '@activepieces/pieces-framework';

const buildEmptyList = ({ placeholder }: { placeholder: string }) => {
  return {
    disabled: true,
    options: [],
    placeholder,
  };
};

const popupsDropdown = Property.Dropdown<string>({
  displayName: 'Popup Name',
  refreshers: [],
  description: "Select the popup name to trigger the action",
  required: true,
  options: async ({ auth }) => {
    if (!auth) {
      return buildEmptyList({
        placeholder: 'Please select an authentication',
      });
    }

    const request: HttpRequest = {
        method: HttpMethod.POST,
        url: 'https://api.poper.ai/general/v1/popup/list',
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: {
          api_key: auth,
        }
      };

      try{
            
            const res = await httpClient.sendRequest(request);
    
            if(res.status === 200){
                const popups = res.body.popups;
                if (popups.length === 0) {
                    return buildEmptyList({
                        placeholder: 'No popups found! Please create a popup.',
                    });
                }
    
                const options = popups.map((p:any) => ({
                    label: p.name,
                    value: p.id,
                }));
    
                return {
                    disabled: false,
                    options,
                };
            }
    
            return buildEmptyList({
                placeholder: 'Not authorized.',
              });
      } catch(e){
        return buildEmptyList({
            placeholder: 'Not authorized.',
        });
      }

  },
});

// replace auth with piece auth variable
const polling: Polling< PiecePropValueSchema<typeof poperAuth>, StaticPropsValue<{ popup_id: DropdownProperty<string, false> | DropdownProperty<string, true>; }> > = {
    strategy: DedupeStrategy.LAST_ITEM,
    items: async ({ auth, propsValue }) => {
        // implement the logic to fetch the items
        const request: HttpRequest = {
            method: HttpMethod.POST,
            url: 'https://api.poper.ai/general/v1/popup/responses',
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: {
              api_key: auth,
              popup_id: propsValue.popup_id,
            }
          };
    
          try{
                
                const res = await httpClient.sendRequest(request);
        
                if(res.status === 200){
                    const responses = res.body.responses;
                    if (responses.length === 0) {
                        return [];
                    }
                
                    return responses.map((response:any) => ({
                        id: response.id,
                        data: response,
                    }));
                }
        
                return [];
          } catch(e){
            return [];
          }
        },

}

export const newLead = createTrigger({
auth: poperAuth,
name: 'newLead',
displayName: 'New Lead',
description: 'Triggers when a new lead is obtained from popup',
props: {
    popup_id: popupsDropdown,
},
sampleData: {},
type: TriggerStrategy.POLLING,
async test(context) {
    const { store, auth, propsValue } = context;
    return await pollingHelper.test(polling, { store, auth, propsValue });
},
async onEnable(context) {
    const { store, auth, propsValue } = context;
    await pollingHelper.onEnable(polling, { store, auth, propsValue });
},

async onDisable(context) {
    const { store, auth, propsValue } = context;
    await pollingHelper.onDisable(polling, { store, auth, propsValue });
},

async run(context) {
    const { store, auth, propsValue } = context;
    return await pollingHelper.poll(polling, { store, auth, propsValue });
},
});