import { DropdownOption, Property } from '@activepieces/pieces-framework';
import { makeRequest } from '.';
import { HttpMethod } from '@activepieces/pieces-common';

export const formIdDropdown = Property.Dropdown({
  displayName: 'Form',
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Please connect your Fillout Forms account.',
        options: [],
      };
    }

    const apiKey = auth as string;
    const forms = await makeRequest(apiKey, HttpMethod.GET, '/forms', undefined);

    const options: DropdownOption<string>[] = forms.map((form: any) => ({
      label: form.name,
      value: form.formId,
    }));

    return {
      disabled: false,
      options,
    };
  },
});

export const submissionIdDropdown = Property.Dropdown({
  displayName: 'Submission',
  description: 'Select from the 50 most recent submissions for the chosen form.',
  required: true,
  refreshers: ['formId'],
  options: async ({ auth, formId }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Please connect your Fillout Forms account',
        options: [],
      };
    }

    if (!formId) {
      return {
        disabled: true,
        placeholder: 'Please select a form first',
        options: [],
      };
    }

    try {
      const apiKey = auth as string;
      const response = await makeRequest(
        apiKey, 
        HttpMethod.GET, 
        `/forms/${formId}/submissions`, 
        { limit: 50 }
      );

      const submissions = response.responses || [];
      
      const options: DropdownOption<string>[] = submissions.map((submission: any) => {
        const firstQuestion = submission.questions && submission.questions[0];
        const firstValue = firstQuestion ? firstQuestion.value : 'No data';
        const submissionTime = new Date(submission.submissionTime).toLocaleString();
        
        return {
          label: `${submissionTime} - ${firstValue}`,
          value: submission.submissionId,
        };
      });

      return {
        disabled: false,
        options,
        placeholder: options.length === 0 ? 'No submissions found' : 'Select a submission',
      };
    } catch (error) {
      return {
        disabled: true,
        placeholder: 'Error loading submissions',
        options: [],
      };
    }
  },
});
