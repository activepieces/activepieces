import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';

import {
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';

import { zioniteAuth } from '../common/auth';

interface User {
  id: number;
  firstName: string;
  lastName: string;
  fullName: string;
  emailId: string;
  mobileNumber?: string;
  department?: {
    id: number;
    name: string;
  };
  designation?: {
    id: number;
    name: string;
  };
  role?: {
    roleId: number;
    roleName: string;
  };
}

interface UsersResponse {
  data: User[];
}

export const getDailyTask = createAction({
  auth: zioniteAuth,

  name: 'getDailyTask',

  displayName: 'Get Daily Tasks',

  description:
    'Find a Zioteam user by email and fetch their assigned tasks',

  props: {
    email: Property.ShortText({
      displayName: 'User Email',
      description:
        'Enter the email address of the Zioteam user whose tasks you want to fetch',
      required: true,
    }),
  },

  async run(context) {
    const { auth, propsValue } = context;

    const baseUrl = 'https://zioteams.zionit.in';

    // 1. Get all users
  
    const usersResponse =
      await httpClient.sendRequest<UsersResponse>({
        method: HttpMethod.GET,

        url: `${baseUrl}/user/getAllUsers`,

        headers: {
          Authorization: auth.access_token,
          'Content-Type': 'application/json',
        },
      });

      //return usersResponse.body?.data ?? [];

    const users = usersResponse.body?.data ?? [];

    //2. Find user by email
    
    const email = propsValue.email.trim().toLowerCase();

    const user = users.find(
      (item) => item.emailId?.toLowerCase() === email,
    );

    
    // // 3. User not found
  

    if (!user) {
      throw new Error(
        `No Zioteam user found with email: ${propsValue.email}`,
      );
    }

    return {
      user: {
        id: user.id,
      }
    }

  
    // // 4. Get user's assigned tasks
  

    // const tasksResponse = await httpClient.sendRequest({
    //   method: HttpMethod.GET,

    //   url: `${baseUrl}/task/getAssignedTasksForUsers`,

    //   queryParams: {
    //     userIds: String(user.id),
    //   },

    //   headers: {
    //     Authorization: auth.access_token,
    //     'Content-Type': 'application/json',
    //   },
    // });

  
    // 5. Return useful result
    

    // return tasksResponse.body;

    // return {
    //   user: {
    //     id: user.id,
    //     name: user.fullName || `${user.firstName} ${user.lastName}`,
    //     email: user.emailId,
    //     mobileNumber: user.mobileNumber,
    //     department: user.department?.name,
    //     designation: user.designation?.name,
    //     role: user.role?.roleName,
    //   },

    //   tasks: tasksResponse.body,
    // };
  },
});