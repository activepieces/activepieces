import { createAction, Property } from "@activepieces/pieces-framework";
import { copperAuth } from "../common/auth";
import { activityParentId, activityTypeCategory, activityTypeId, findActivityFullResultFlag, findActivityMaximumDate, findActivityMinimumDate } from "../common/activities";
import { makeCopperRequest } from "../common/request";
import { HttpMethod } from "@activepieces/pieces-common";
import { ACTIVITIES_API_ENDPOINT } from "../common/constants";

export const createActivity = createAction({
    auth: copperAuth,
    name: 'create_activity',
    displayName: 'Create Activity',
    description: 'Create a new Activity in Copper.',
    props: {
        parent: activityParentId,
        type: activityTypeCategory,
        typeId: activityTypeId
    },
    async run(context) {
        const payload: Record<string, unknown> = { name };

        for (const [key, value] of Object.entries(context.propsValue)) {
            const isNonEmptyArray = Array.isArray(value) && value.length > 0;
            const isPresentValue = !Array.isArray(value) && value !== undefined && value !== null;

            if (isNonEmptyArray || isPresentValue) {
                payload[key] = value;
            }
        }

        return await makeCopperRequest(
            HttpMethod.POST,
            ACTIVITIES_API_ENDPOINT,
            context.auth,
            payload
        );
    },
});

export const findActivity = createAction({
    auth: copperAuth,
    name: 'find_activity',
    displayName: 'Find Activity',
    description: 'Finds a single Copper Activity based on provided criteria. Returns the first matching activity found or null if none match.',
    props: {
      parent_resource_type: activityParentId,
      parent_resource_id: activityParentId,
  
      activity_type_category: activityTypeCategory,
      activity_type_id: activityTypeId,
  
      minimum_activity_date: findActivityMinimumDate,
      maximum_activity_date: findActivityMaximumDate,
  
      full_result: findActivityFullResultFlag,
    },
    async run(context) {
      const {
        parent_resource_type,
        parent_resource_id,
        activity_type_category,
        activity_type_id,
        minimum_activity_date,
        maximum_activity_date,
        full_result,
      } = context.propsValue;
  
      const requestBody: Record<string, any> = {
        page_size: 1,
      };
  
      const hasParentType = parent_resource_type !== undefined && parent_resource_type !== null;
      const hasParentId = parent_resource_id !== undefined && parent_resource_id !== null;
  
      if (hasParentType && hasParentId) {
        requestBody['parent'] = {
          type: parent_resource_type,
          id: parent_resource_id,
        };
      } else if (hasParentType !== hasParentId) {
        throw new Error('Both "Parent Resource Type" and "Parent Resource ID" must be provided together if used for filtering.');
      }
  
      const hasActivityTypeCategory = activity_type_category !== undefined && activity_type_category !== null;
      const hasActivityTypeId = activity_type_id !== undefined && activity_type_id !== null;
  
      if (hasActivityTypeCategory && hasActivityTypeId) {
        requestBody['activity_types'] = [{
          category: activity_type_category,
          id: activity_type_id,
        }];
      } else if (hasActivityTypeCategory !== hasActivityTypeId) {
        throw new Error('Both "Activity Type Category" and "Activity Type ID" must be provided together if used for filtering.');
      }
  
      if (minimum_activity_date) {
        requestBody['minimum_activity_date'] = Math.floor(new Date(minimum_activity_date).getTime() / 1000);
      }
      if (maximum_activity_date) {
        requestBody['maximum_activity_date'] = Math.floor(new Date(maximum_activity_date).getTime() / 1000);
      }
  
      if (full_result) {
        requestBody['full_result'] = true;
      }
  
      const response = await makeCopperRequest(
        HttpMethod.POST,
        `${ACTIVITIES_API_ENDPOINT}/search`,
        context.auth,
        requestBody
      );
  
      if (response && Array.isArray(response) && response.length > 0) {
        return response;
      } else {
        return null;
      }
    },
});
