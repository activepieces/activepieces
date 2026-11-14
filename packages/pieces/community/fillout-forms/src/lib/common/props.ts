import { DropdownOption, isNil, Property } from '@activepieces/pieces-framework';
import { makeRequest } from '.';
import { HttpMethod } from '@activepieces/pieces-common';
import { filloutFormsAuth } from '../auth';

export const formIdDropdown = Property.Dropdown({
  auth: filloutFormsAuth,
  displayName: 'Form',
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Connect your Fillout account first.',
        options: [],
      };
    }

    try {
      const forms: FormSummary[] = await makeRequest<FormSummary[]>(
        auth.secret_text,
        HttpMethod.GET,
        '/forms',
        undefined,
      );

      const options: DropdownOption<string>[] = forms.map((form) => ({
        label: form.name,
        value: form.formId,
      }));

      return {
        disabled: false,
        options,
        placeholder: options.length === 0 ? 'No forms yet.' : 'Select a form',
      };
    } catch (error) {
      return {
        disabled: true,
        placeholder: 'Could not load forms. Check your connection.',
        options: [],
      };
    }
  },
});

export const submissionIdDropdown = Property.Dropdown({
  auth: filloutFormsAuth,
  displayName: 'Response',
  description: 'One of the 50 most recent responses to the form.',
  required: true,
  refreshers: ['formId'],
  options: async ({ auth, formId }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Connect your Fillout account first.',
        options: [],
      };
    }

    if (!formId) {
      return {
        disabled: true,
        placeholder: 'Select a form first.',
        options: [],
      };
    }

    try {
      const response: SubmissionsPage = await makeRequest<SubmissionsPage>(
        auth.secret_text,
        HttpMethod.GET,
        `/forms/${formId}/submissions`,
        { limit: 50 },
      );

      const submissions = response.responses ?? [];

      const options: DropdownOption<string>[] = submissions.map((submission) => {
        const submissionTime = new Date(submission.submissionTime).toLocaleString();

        return {
          label: `${submissionTime} - ${formatAnswer(submission.questions?.[0]?.value)}`,
          value: submission.submissionId,
        };
      });

      return {
        disabled: false,
        options,
        placeholder: options.length === 0 ? 'No responses yet.' : 'Select a response',
      };
    } catch (error) {
      return {
        disabled: true,
        placeholder: 'Could not load responses. Check your connection.',
        options: [],
      };
    }
  },
});

function formatAnswer(value: unknown): string {
  if (isNil(value) || value === '') {
    return 'No answer';
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return JSON.stringify(value);
}

type FormSummary = { name: string; formId: string };

type SubmissionsPage = {
  responses?: Array<{
    submissionId: string;
    submissionTime: string;
    questions?: Array<{ value?: unknown }>;
  }>;
};
