import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { magicalApiAuth } from '../common/auth';
import { magicalApiCall } from '../common/client';

export const scoreResume = createAction({
  auth: magicalApiAuth,
  name: 'score_resume',
  displayName: 'Score Resume',
  description: 'Returns resume score based on various criteria and best practices.',
  props: {
    resume_file: Property.File({
      displayName: 'Resume File',
      description: 'The resume file to score (PDF, DOC, DOCX, TXT formats supported)',
      required: false,
    }),
    parsed_resume_data: Property.LongText({
      displayName: 'Parsed Resume Data',
      description: 'JSON data from a previously parsed resume (alternative to file upload)',
      required: false,
    }),
    job_description: Property.LongText({
      displayName: 'Job Description',
      description: 'Job description to score the resume against (optional but recommended)',
      required: false,
    }),
    scoring_criteria: Property.StaticMultiSelectDropdown({
      displayName: 'Scoring Criteria',
      description: 'Select the criteria to use for scoring the resume',
      required: false,
      options: {
        options: [
          { label: 'Skills Relevance', value: 'skills_relevance' },
          { label: 'Experience Quality', value: 'experience_quality' },
          { label: 'Education Match', value: 'education_match' },
          { label: 'Keywords Optimization', value: 'keywords_optimization' },
          { label: 'Format & Structure', value: 'format_structure' },
          { label: 'Grammar & Language', value: 'grammar_language' },
          { label: 'Achievement Quantification', value: 'achievement_quantification' },
          { label: 'Career Progression', value: 'career_progression' },
          { label: 'Industry Relevance', value: 'industry_relevance' },
          { label: 'ATS Compatibility', value: 'ats_compatibility' },
        ],
      },
      defaultValue: ['skills_relevance', 'experience_quality', 'format_structure'],
    }),
    weight_skills: Property.Number({
      displayName: 'Skills Weight',
      description: 'Weight for skills evaluation (0-100)',
      required: false,
      defaultValue: 30,
    }),
    weight_experience: Property.Number({
      displayName: 'Experience Weight',
      description: 'Weight for experience evaluation (0-100)',
      required: false,
      defaultValue: 40,
    }),
    weight_education: Property.Number({
      displayName: 'Education Weight',
      description: 'Weight for education evaluation (0-100)',
      required: false,
      defaultValue: 20,
    }),
    weight_format: Property.Number({
      displayName: 'Format Weight',
      description: 'Weight for format and presentation (0-100)',
      required: false,
      defaultValue: 10,
    }),
    include_detailed_feedback: Property.Checkbox({
      displayName: 'Include Detailed Feedback',
      description: 'Include detailed feedback and improvement suggestions',
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
      scoring_criteria,
      weight_skills,
      weight_experience,
      weight_education,
      weight_format,
      include_detailed_feedback,
    } = context.propsValue;

    if (!resume_file && !parsed_resume_data) {
      throw new Error('Either resume file or parsed resume data must be provided');
    }

    // Validate weights sum to 100
    const totalWeight = (weight_skills || 30) + (weight_experience || 40) + (weight_education || 20) + (weight_format || 10);
    if (totalWeight !== 100) {
      throw new Error('Weights must sum to 100');
    }

    const requestBody: any = {
      scoring_criteria: scoring_criteria || ['skills_relevance', 'experience_quality', 'format_structure'],
      weights: {
        skills: weight_skills || 30,
        experience: weight_experience || 40,
        education: weight_education || 20,
        format: weight_format || 10,
      },
      include_detailed_feedback,
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
      endpoint: '/resume/score',
      body: requestBody,
    });

    return result;
  },
});
