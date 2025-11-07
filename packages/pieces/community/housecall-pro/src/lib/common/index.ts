import { PieceAuth } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod } from "@activepieces/pieces-common";

// Action imports
// Customer actions
export { createCustomer } from "../actions/create-customer";
export { getCustomers } from "../actions/get-customers";
export { getCustomer } from "../actions/get-customer";
export { updateCustomer } from "../actions/update-customer";
export { getCustomerAddresses } from "../actions/get-customer-addresses";
export { createCustomerAddress } from "../actions/create-customer-address";
export { getCustomerAddress } from "../actions/get-customer-address";

// Job actions
export { createJob } from "../actions/create-job";
export { getJobs } from "../actions/get-jobs";
export { getJob } from "../actions/get-job";
export { updateJobSchedule } from "../actions/update-job-schedule";
export { deleteJobSchedule } from "../actions/delete-job-schedule";


export const baseUrl = "https://api.housecallpro.com";

export const housecallProAuth = PieceAuth.SecretText({
  displayName: "API Key",
  description: "Your Housecall Pro API Key. You can find it in your Housecall Pro account settings under API.",
  required: true,
  validate: async ({ auth }) => {
    try {
      // Validate the API key by making a simple request to get customers
      const response = await httpClient.sendRequest({
        url: `${baseUrl}/customers`,
        method: HttpMethod.GET,
        headers: {
          "Authorization": `Token ${auth}`,
          "Content-Type": "application/json",
        },
        queryParams: {
          page_size: "1", // Just get one to validate
        },
      });

      if (response.status === 200) {
        return {
          valid: true,
        };
      } else {
        return {
          valid: false,
          error: "Invalid API key or insufficient permissions",
        };
      }
    } catch (error) {
      return {
        valid: false,
        error: "Unable to validate API key. Please check your API credentials.",
      };
    }
  },
});

// Common API functions
export async function makeHousecallProRequest(
  auth: string,
  endpoint: string,
  method: HttpMethod = HttpMethod.GET,
  body?: any,
  queryParams?: Record<string, string>
) {
  const fullUrl = `${baseUrl}${endpoint}`;

  return await httpClient.sendRequest({
    url: fullUrl,
    method,
    headers: {
      "Authorization": `Token ${auth}`,
      "Content-Type": "application/json",
    },
    body,
    queryParams,
  });
}

export interface HousecallProCustomer {
  id?: number;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  mobile?: string;
  company?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  notes?: string;
  tags?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface HousecallProJob {
  id?: number;
  customer_id: number;
  title: string;
  description?: string;
  work_status?: string;
  scheduled_date?: string;
  scheduled_time?: string;
  duration?: number;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface HousecallProEstimate {
  id?: number;
  customer_id: number;
  job_id?: number;
  title: string;
  description?: string;
  status?: string;
  total_amount?: number;
  valid_until?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}
