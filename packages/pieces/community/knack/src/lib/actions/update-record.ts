import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { knackApiCall } from '../common/client';
import { knackAuth } from '../common/auth';
import {
  objectDropdown,
  recordIdDropdown,
  dynamicRecordFields,
} from '../common/props';

export const updateRecordAction = createAction({
  auth: knackAuth,
  name: 'update_record',
  displayName: 'Update Record',
  description:
    'Update fields of an existing record with an intuitive form interface.',
  props: {
    object: objectDropdown,
    recordId: recordIdDropdown,
    recordFields: dynamicRecordFields,
    advancedMode: Property.Checkbox({
      displayName: 'Advanced Mode',
      description: 'Use raw JSON input instead of the form interface',
      required: false,
      defaultValue: false,
    }),
    recordData: Property.Json({
      displayName: 'Data to Update (JSON)',
      description:
        'The data to update in JSON format. Only the fields you include will be changed (e.g., {"field_1": "New Value"}). This field is only used when Advanced Mode is enabled.',
      required: false,
    }),
  },
  async run({ propsValue, auth }) {
    const {
      object: objectKey,
      recordId,
      recordFields,
      advancedMode,
      recordData,
    } = propsValue;

    let updateData: any;

    if (advancedMode && recordData) {
      updateData = recordData;
    } else if (recordFields) {
      updateData = {};

      for (const [fieldKey, fieldValue] of Object.entries(recordFields)) {
        if (
          fieldValue === undefined ||
          fieldValue === null ||
          fieldValue === '' ||
          (typeof fieldValue === 'string' && fieldValue.trim() === '')
        ) {
          continue;
        }

        if (
          fieldKey.includes('_street') ||
          fieldKey.includes('_city') ||
          fieldKey.includes('_state') ||
          fieldKey.includes('_zip')
        ) {
          const baseFieldKey = fieldKey.replace(
            /_street|_city|_state|_zip/,
            ''
          );
          if (!updateData[baseFieldKey]) {
            updateData[baseFieldKey] = {};
          }

          if (fieldKey.endsWith('_street')) {
            updateData[baseFieldKey].street = fieldValue;
          } else if (fieldKey.endsWith('_city')) {
            updateData[baseFieldKey].city = fieldValue;
          } else if (fieldKey.endsWith('_state')) {
            updateData[baseFieldKey].state = fieldValue;
          } else if (fieldKey.endsWith('_zip')) {
            updateData[baseFieldKey].zip = fieldValue;
          }
        } else {
          if (typeof fieldValue === 'string') {
            if (fieldValue.startsWith('{') && fieldValue.endsWith('}')) {
              try {
                const parsed = JSON.parse(fieldValue);
                if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
                  continue;
                }
              } catch (e) {
              }
            }
            if (fieldValue === '[object Object]') {
              continue;
            }
          }
          
          updateData[fieldKey] = fieldValue;
        }
      }

      if (Object.keys(updateData).length === 0) {
        throw new Error(
          'No fields to update. Please fill in at least one field with a value.'
        );
      }
    } else {
      throw new Error(
        'No update data provided. Either enable Advanced Mode and provide JSON data, or fill out the form fields.'
      );
    }

    try {
      const response = await knackApiCall({
        method: HttpMethod.PUT,
        auth: auth,
        resourceUri: `/objects/${objectKey}/records/${recordId}`,
        body: updateData,
      });
      return response;
    } catch (error: any) {
      if (error.message.includes('404')) {
        throw new Error(
          'Not Found: The record ID was not found in the specified object. Please verify the ID is correct.'
        );
      }

      if (error.message.includes('409')) {
        throw new Error(
          'Conflict: The record could not be updated due to a conflict, such as a duplicate unique value.'
        );
      }

      if (error.message.includes('400')) {
        throw new Error(
          'Bad Request: Invalid request parameters. Please check your Data to Update JSON and field values.'
        );
      }

      if (error.message.includes('401') || error.message.includes('403')) {
        throw new Error(
          'Authentication Failed: Please check your API Key, Application ID, and user permissions.'
        );
      }

      if (error.message.includes('429')) {
        throw new Error(
          'Rate Limit Exceeded: Too many requests. Please wait a moment before trying again.'
        );
      }

      throw new Error(`Failed to update Knack record: ${error.message}`);
    }
  },
});
