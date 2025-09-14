import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { magicalApiAuth } from '../common/auth';
import { magicalApiCall } from '../common/client';

export const parseResume = createAction({
  auth: magicalApiAuth,
  name: 'parse_resume',
  displayName: 'Parse Resume',
  description: 'Extract structured data (name, email, experience, skills, etc.) from a resume file.',
  props: {
    resume_file: Property.File({
      displayName: 'Resume File',
      description: 'The resume file to parse (PDF, DOC, DOCX, TXT formats supported)',
      required: true,
    }),
    extract_skills: Property.Checkbox({
      displayName: 'Extract Skills',
      description: 'Extract skills from the resume',
      required: false,
      defaultValue: true,
    }),
    extract_experience: Property.Checkbox({
      displayName: 'Extract Experience',
      description: 'Extract work experience from the resume',
      required: false,
      defaultValue: true,
    }),
    extract_education: Property.Checkbox({
      displayName: 'Extract Education',
      description: 'Extract education information from the resume',
      required: false,
      defaultValue: true,
    }),
    extract_certifications: Property.Checkbox({
      displayName: 'Extract Certifications',
      description: 'Extract certifications from the resume',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { auth } = context;
    const {
      resume_file,
      extract_skills,
      extract_experience,
      extract_education,
      extract_certifications,
    } = context.propsValue;

    const requestBody = {
      file: resume_file,
      extract_skills,
      extract_experience,
      extract_education,
      extract_certifications,
    };

    const result = await magicalApiCall({
      apiKey: auth,
      method: HttpMethod.POST,
      endpoint: '/resume/parse',
      body: requestBody,
    });

    return result;
  },
});
