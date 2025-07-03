import { createAction, Property } from '@activepieces/pieces-framework';
//import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { aminosAuth } from '../..';
export const createUser = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  auth: aminosAuth,
  name: 'createUser',
  displayName: 'Create User on Aminos One',
  description: 'Create a user and plan in Aminos One Panel',
  props: {
   useremail: Property.ShortText({
      displayName: 'Username (e-mail)',
      description: 'Username, should be an e-mail address',
      required:true,
    }),
    userfriendlyname: Property.ShortText({
      displayName: 'Name of user',
      description: 'The name of the user',
      required:true,
    }),
    userplanid: Property.Number({
      displayName: 'Plan ID',
      description: 'Plan ID number from the plans in your Aminos One panel',
      required:true,
    })
  },
  async run(context) {
    // the below need to be passed with the JSON
    // context.auth.access_token
    // context.auth.base_url
    const baseUrl = context.auth.base_url.replace(/\/$/, '');
    const headers = {
      'Content-Type': 'application/json',
    };
    const createAminosRequestBody = {
      api_key: context.auth.access_token,
      name: context.propsValue.userfriendlyname,
      email: context.propsValue.useremail,
      price_plan_id: context.propsValue.userplanid,
    };
    // console.log("AMINOS:" + JSON.stringify(createAminosRequestBody));
    const createAminosResponse = await fetch(`${baseUrl}/api/users`, {
      method: 'POST',
      headers,
      body: JSON.stringify(createAminosRequestBody),
    });
    // 400 status is returned on failure, possibly because user exists already
    if (!createAminosResponse.ok) {
      throw new Error(`Failed to create user. Status: ${createAminosResponse.status}`);
    }
    const createAminosResponseBody = await createAminosResponse.json();
    // if creation was ok, then user and status are returned, user is the user id on aminos, status will just be success
    return createAminosResponseBody; 
  },
});
