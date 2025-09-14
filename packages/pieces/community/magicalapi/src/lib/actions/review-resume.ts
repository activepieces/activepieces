import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { magicalApiAuth } from '../common/auth';
import { magicalApiCall } from '../common/client';

export const reviewResume = createAction({
  auth: magicalApiAuth,
  name: 'review_resume',
  displayName: 'Review Resume',
  description: 'Analyze parsed resume using predefined criteria and provide detailed feedback.',
  props: {
    resume_file: Property.File({
      displayName: 'Resume File',
      description: 'The resume file to review (PDF, DOC, DOCX, TXT formats supported)',
      required: false,
    }),
    parsed_resume_data: Property.LongText({
      displayName: 'Parsed Resume Data',
      description: 'JSON data from a previously parsed resume (alternative to file upload)',
      required: false,
    }),
    job_description: Property.LongText({
      displayName: 'Job Description',
      description: 'Job description to compare the resume against (optional)',
      required: false,
    }),
    review_criteria: Property.StaticMultiSelectDropdown({
      displayName: 'Review Criteria',
      description: 'Select the criteria to evaluate the resume against',
      required: false,
      options: {
        options: [
          { label: 'Skills Match', value: 'skills_match' },
          { label: 'Experience Relevance', value: 'experience_relevance' },
          { label: 'Education Requirements', value: 'education_requirements' },
          { label: 'Resume Format', value: 'resume_format' },
          { label: 'Grammar & Language', value: 'grammar_language' },
          { label: 'Keywords Optimization', value: 'keywords_optimization' },
          { label: 'Career Progression', value: 'career_progression' },
          { label: 'Achievements Quantification', value: 'achievements_quantification' },
        ],
      },
      defaultValue: ['skills_match', 'experience_relevance', 'resume_format'],
    }),
    provide_suggestions: Property.Checkbox({
      displayName: 'Provide Improvement Suggestions',
      description: 'Include suggestions for resume improvement in the review',
      required: false,
      defaultValue: true,
    }),
  },
  async run(context) {
    const { auth } = context;
    const {
      resume_file,
      parsed_resume_data,
      job_description,
      review_criteria,
      provide_suggestions,
    } = context.propsValue;

    if (!resume_file && !parsed_resume_data) {
      throw new Error('Either resume file or parsed resume data must be provided');
    }

    const requestBody: any = {
      review_criteria: review_criteria || ['skills_match', 'experience_relevance', 'resume_format'],
      provide_suggestions: provide_suggestions,
    };

    if (job_description) {
      requestBody.job_description = job_description;
    }

    if (parsed_resume_data) {
      // If parsed data is provided, use it directly
      try {
        requestBody.parsed_resume = JSON.parse(parsed_resume_data);
      } catch (e) {
        throw new Error('Invalid JSON format in parsed resume data');
      }
    }

    if (resume_file) {
      requestBody.file = resume_file;
    }

    const result = await magicalApiCall({
      apiKey: auth,
      method: HttpMethod.POST,
      endpoint: '/resume/review',
      body: requestBody,
    });

    return result;
  },
});
