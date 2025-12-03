import { Property } from '@activepieces/pieces-framework';
import { makeRequest } from './client';
import { HttpMethod } from '@activepieces/pieces-common';
import { appfollowAuth } from './auth';

export function formatDate(epochMS: any) {
  const d = new Date(epochMS);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
export const collection_idDropdown = Property.Dropdown({
  auth: appfollowAuth,
  displayName: 'Collection Name',
  description: 'Select the collection name',
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled:true,
        options: [],
        placeholder: 'Please configure the auth first',
      };
    }

    try {
      const response = await makeRequest(
        auth.secret_text,
        HttpMethod.GET,
        `/account/apps`
      );
      const apps = response.apps;
      return {
        disabled:false,
        options: apps.map((app: any) => ({
          label: app.title,
          value: app.id,
        })),
      };
    } catch (error) {
      return {
        disabled:true,
        options: [],
        placeholder: 'Error fetching collections',
      };
    }
  },
});

export const application_ext_idDropdown = Property.Dropdown({
  auth: appfollowAuth,
  displayName: 'Application',
  description: 'Select the application',
  required: true,
  refreshers: ['collection_id'],
  options: async ({ auth, collection_id }) => {
    if (!auth) {
      return {
        disabled:true,
        options: [],
        placeholder: 'Please configure the auth first',
      };
    }
    if (!collection_id) {
      return {
        disabled:true,
        options: [],
        placeholder: 'Please select application first',
      };
    }
    try {
      const response = await makeRequest(
        auth.secret_text,
        HttpMethod.GET,
        `/account/apps/app?apps_id=${collection_id}`
      );
      console.debug("dsdsdsdsdsdsdssdss",response);
      const apps = response.apps_app;
      return {
        disabled:false,
        options: apps.map((app: any) => ({
          label: app.app.title,
          value: app.app.ext_id,
        })),
      };
    } catch (error) {
      return {
        disabled:true,
        options: [],
        placeholder: 'Error fetching applications',
      };
    }
  },
});

export const review_ID_Dropdown = Property.Dropdown({
  auth: appfollowAuth,
  displayName: 'Review ID',
  description: 'Select the Review ID',
  required: true,
  refreshers: ['app_ext_id', 'toDate', 'fromDate'],
  options: async ({ auth, app_ext_id, toDate, fromDate }) => {
    if (!auth) {
      return {
        disabled:true,
        options: [],
        placeholder: 'Please configure the auth first',
      };
    }
    if (!app_ext_id || !toDate || !fromDate) {
      return {
        disabled:true,
        options: [],
        placeholder: 'Please select application and date range first',
      };
    }
    try {
      const response = await makeRequest(
        auth.secret_text,
        HttpMethod.GET,
        `/reviews?ext_id=${app_ext_id}&from=${fromDate}&to=${toDate}`
      );
      const reviews = response.reviews.list;
      return {
        disabled:false,
        options: reviews.map((review: any) => ({
          label: `ID: ${review.review_id} - ${review.content.substring(
            0,
            30
          )}...`,
          value: review.review_id,
        })),
      };
    } catch (error) {
      return {
        disabled:true,
        options: [],
        placeholder: 'Error fetching Review IDs',
      };
    }
  },
});


