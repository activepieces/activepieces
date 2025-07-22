import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { wufooApiCall } from '../common/client';
import { wufooAuth } from '../../index';
import { formIdentifier, dynamicFormFields } from '../common/props';


export const createFormEntryAction = createAction({
  auth: wufooAuth,
  name: 'create-form-entry',
  displayName: 'Create Form Entry',
  description: 'Submit a new entry to a Wufoo form with dynamic field selection.',
  props: {
    formIdentifier: formIdentifier,
    format: Property.StaticDropdown({
      displayName: 'Response Format',
      description: 'Choose the format for the API response. JSON is recommended for most use cases.',
      required: true,
      defaultValue: 'json',
      options: {
        disabled: false,
        options: [
          { label: 'JSON', value: 'json' },
          { label: 'XML', value: 'xml' },
        ],
      },
    }),
    formFields: dynamicFormFields,
  },
  async run(context) {
    const { formIdentifier, format, formFields } = context.propsValue;

    try {
      const processedFields: Record<string, string> = {};
      
      for (const [fieldId, fieldValue] of Object.entries(formFields)) {
        if (fieldValue !== null && fieldValue !== undefined) {
          if (fieldId.includes('date') || fieldId.includes('Date')) {
            const dateValue = new Date(fieldValue as string);
            if (!isNaN(dateValue.getTime())) {
              const year = dateValue.getFullYear();
              const month = String(dateValue.getMonth() + 1).padStart(2, '0');
              const day = String(dateValue.getDate()).padStart(2, '0');
              processedFields[fieldId] = `${year}${month}${day}`;
            } else {
              processedFields[fieldId] = String(fieldValue);
            }
          } else if (Array.isArray(fieldValue)) {
            if (fieldValue.length > 0) {
              for (const selectedId of fieldValue) {
                processedFields[selectedId] = '1';
              }
            }
          } else if (typeof fieldValue === 'boolean') {
            processedFields[fieldId] = fieldValue ? '1' : '0';
          } else if (typeof fieldValue === 'number') {
            processedFields[fieldId] = String(fieldValue);
          } else if (fieldValue instanceof File) {
            processedFields[fieldId] = fieldValue.name || 'uploaded_file';
          } else {
            processedFields[fieldId] = String(fieldValue);
          }
        }
      }

      const response = await wufooApiCall<WufooSubmissionResponse>({
        method: HttpMethod.POST,
        auth: context.auth,
        resourceUri: `/forms/${formIdentifier}/entries.${format}`,
        body: new URLSearchParams(processedFields).toString(),
      });

      if (response.Success === 1) {
        return {
          success: true,
          message: 'Form entry submitted successfully!',
          entryId: response.EntryId,
          entryLink: response.EntryLink,
          redirectUrl: response.RedirectUrl,
          submittedFields: processedFields,
        };
      } else {
        const errorDetails = {
          success: false,
          message: response.ErrorText || 'Form submission failed',
          fieldErrors: response.FieldErrors || [],
          redirectUrl: response.RedirectUrl,
        };

        let errorMessage = 'Form submission failed';
        if (response.FieldErrors && response.FieldErrors.length > 0) {
          const fieldErrorMessages = response.FieldErrors.map(
            (error: WufooFieldError) => `${error.ID}: ${error.ErrorText}`
          );
          errorMessage += ` - Field errors: ${fieldErrorMessages.join(', ')}`;
        }

        throw new Error(errorMessage);
      }
    } catch (error: any) {
      if (error.response?.status === 429) {
        throw new Error(
          'Rate limit exceeded. Wufoo allows maximum 50 submissions per user in a 5-minute window. Please wait before trying again.'
        );
      }
      
      if (error.response?.status === 400) {
        throw new Error(
          `Bad request: ${error.response.data?.Text || error.message}. Please check your form field values.`
        );
      }

      if (error.response?.status === 401) {
        throw new Error(
          'Authentication failed. Please check your API key and subdomain.'
        );
      }

      if (error.response?.status === 404) {
        throw new Error(
          'Form not found. Please verify the form identifier is correct.'
        );
      }

      if (error.message.includes('Field errors:')) {
        throw error;
      }

      throw new Error(
        `Failed to submit form entry: ${error.message || 'Unknown error occurred'}`
      );
    }
  },
  
});

interface WufooSubmissionResponse {
  Success: number;
  EntryId?: number;
  EntryLink?: string;
  RedirectUrl?: string;
  ErrorText?: string;
  FieldErrors?: WufooFieldError[];
}

interface WufooFieldError {
  ID: string;
  ErrorText: string;
}
