import { OutputSchema, OutputSchemaField } from '@activepieces/pieces-framework';

const yearMonthFields: OutputSchemaField[] = [
  { key: 'year', label: 'Year', format: 'number' },
  { key: 'month', label: 'Month', format: 'number' },
];

const durationFields: OutputSchemaField[] = [
  { key: 'years', label: 'Years', format: 'number' },
  { key: 'months', label: 'Months', format: 'number' },
];

const startEndDateFields: OutputSchemaField[] = [
  { key: 'start_date', label: 'Start Date' },
  { key: 'end_date', label: 'End Date' },
];

const sectionReviewFields: OutputSchemaField[] = [
  { key: 'pros', label: 'Pros' },
  {
    key: 'cons',
    label: 'Cons',
    labelKey: 'message',
    listItems: [
      { key: 'message', label: 'Message' },
      { key: 'tips', label: 'Tips' },
    ],
  },
];

const matchFeedbackFields: OutputSchemaField[] = [
  { key: 'type', label: 'Type' },
  { key: 'message', label: 'Message' },
];

const matchSectionFields: OutputSchemaField[] = [
  { key: 'score', label: 'Score', format: 'number' },
  { key: 'summary', label: 'Summary' },
  { key: 'pros', label: 'Pros', labelKey: 'message', listItems: matchFeedbackFields },
  { key: 'cons', label: 'Cons', labelKey: 'message', listItems: matchFeedbackFields },
  { key: 'warns', label: 'Warnings', labelKey: 'message', listItems: matchFeedbackFields },
];

const textCategoryFields: OutputSchemaField[] = [
  { key: 'text', label: 'Text' },
  { key: 'category', label: 'Category' },
];

export const parseResumeOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'basic',
      label: 'Basic Info',
      children: [
        { key: 'first_name', label: 'First Name' },
        { key: 'last_name', label: 'Last Name' },
        { key: 'job_title', label: 'Job Title' },
        { key: 'email', label: 'Email', format: 'email' },
        { key: 'phone_number', label: 'Phone Number' },
        { key: 'location', label: 'Location' },
        { key: 'birthday', label: 'Birthday' },
        { key: 'portfolio_website_url', label: 'Portfolio Website', format: 'url' },
        { key: 'linkedin_url', label: 'LinkedIn URL', format: 'url' },
        { key: 'github_url', label: 'GitHub URL', format: 'url' },
        { key: 'university', label: 'University' },
        { key: 'graduation_year', label: 'Graduation Year' },
        { key: 'majors', label: 'Majors' },
      ],
    },
    { key: 'summary', label: 'Summary' },
    {
      key: 'work_experiences',
      label: 'Work Experiences',
      labelKey: 'title',
      listItems: [
        { key: 'title', label: 'Title' },
        { key: 'company', label: 'Company' },
        { key: 'location', label: 'Location' },
        { key: 'summary', label: 'Summary' },
        { key: 'achievements', label: 'Achievements' },
        { key: 'start', label: 'Start', children: yearMonthFields },
        { key: 'end', label: 'End', children: yearMonthFields },
        { key: 'duration', label: 'Duration', children: durationFields },
      ],
    },
    {
      key: 'project_experiences',
      label: 'Project Experiences',
      labelKey: 'title',
      listItems: [
        { key: 'title', label: 'Title' },
        { key: 'description', label: 'Description' },
      ],
    },
    {
      key: 'educations',
      label: 'Educations',
      labelKey: 'school',
      listItems: [
        { key: 'school', label: 'School' },
        { key: 'degree', label: 'Degree' },
        { key: 'field', label: 'Field of Study' },
        { key: 'start', label: 'Start', children: yearMonthFields },
        { key: 'end', label: 'End', children: yearMonthFields },
      ],
    },
    {
      key: 'certifications',
      label: 'Certifications',
      labelKey: 'title',
      listItems: [
        { key: 'title', label: 'Title' },
        { key: 'provider', label: 'Provider' },
      ],
    },
    { key: 'languages', label: 'Languages', labelKey: 'name', listItems: [{ key: 'name', label: 'Name' }] },
    { key: 'interests', label: 'Interests', labelKey: 'name', listItems: [{ key: 'name', label: 'Name' }] },
    { key: 'skills', label: 'Skills', labelKey: 'name', listItems: [{ key: 'name', label: 'Name' }] },
  ],
};

export const reviewResumeOutputSchema: OutputSchema = {
  fields: [
    { key: 'score', label: 'Score', format: 'number', description: 'Overall resume score out of 100.' },
    {
      key: 'result',
      label: 'Review',
      children: [
        { key: 'contact', label: 'Contact', children: sectionReviewFields },
        { key: 'experiences', label: 'Experiences', children: sectionReviewFields },
        { key: 'educations', label: 'Educations', children: sectionReviewFields },
        { key: 'skills', label: 'Skills', children: sectionReviewFields },
        { key: 'summary', label: 'Summary', children: sectionReviewFields },
        { key: 'format', label: 'Format', children: sectionReviewFields },
      ],
    },
    {
      key: 'suggested',
      label: 'Suggested Content',
      children: [
        { key: 'summary', label: 'Summary', value: 'summary.content' },
        { key: 'contact', label: 'Contact', value: 'contact.content' },
        { key: 'experiences', label: 'Experiences', value: 'experiences.content' },
        { key: 'educations', label: 'Educations', value: 'educations.content' },
      ],
    },
  ],
};

export const scoreResumeOutputSchema: OutputSchema = {
  fields: [
    { key: 'score', label: 'Score', format: 'number', description: 'Match score 0-100; -1 if the resume is empty.' },
    { key: 'summary', label: 'Summary' },
    { key: 'strengths', label: 'Strengths', labelKey: 'text', listItems: textCategoryFields },
    { key: 'improvements', label: 'Improvements', labelKey: 'text', listItems: textCategoryFields },
    { key: 'job_match', label: 'Job Match', children: matchSectionFields },
    {
      key: 'skill_match',
      label: 'Skill Match',
      children: [
        { key: 'score', label: 'Score', format: 'number' },
        { key: 'summary', label: 'Summary' },
        { key: 'all_skills', label: 'All Job Skills', value: 'skills.all_skills' },
        {
          key: 'match_result',
          label: 'Match Result',
          children: [
            { key: 'strong_match', label: 'Strong Match' },
            { key: 'partial_match', label: 'Partial Match' },
            { key: 'miss_match', label: 'Missing' },
          ],
        },
      ],
    },
    { key: 'education_match', label: 'Education Match', children: matchSectionFields },
    {
      key: 'more_information',
      label: 'More Information',
      children: [
        { key: 'region', label: 'Region' },
        { key: 'overqualification_status', label: 'Overqualified', format: 'boolean' },
        { key: 'qualification_reason', label: 'Qualification Reason' },
      ],
    },
  ],
};

export const profileDataOutputSchema: OutputSchema = {
  fields: [
    { key: 'url', label: 'Profile URL', format: 'url' },
    { key: 'profile', label: 'Username' },
    { key: 'name', label: 'Name' },
    { key: 'headline', label: 'Headline' },
    { key: 'description', label: 'Bio' },
    { key: 'location', label: 'Location' },
    { key: 'followers', label: 'Followers' },
    { key: 'connections', label: 'Connections' },
    { key: 'crawled_at', label: 'Crawled At' },
    {
      key: 'experience',
      label: 'Experience',
      labelKey: 'title',
      listItems: [
        { key: 'title', label: 'Title' },
        { key: 'company_name', label: 'Company' },
        { key: 'company_link', label: 'Company Link', format: 'url' },
        { key: 'location', label: 'Location' },
        { key: 'description', label: 'Description' },
        {
          key: 'date',
          label: 'Date',
          children: [...startEndDateFields, { key: 'duration', label: 'Duration', children: durationFields }],
        },
      ],
    },
    {
      key: 'education',
      label: 'Education',
      labelKey: 'university_name',
      listItems: [
        { key: 'university_name', label: 'School' },
        { key: 'university_link', label: 'School Link', format: 'url' },
        { key: 'degree', label: 'Degree' },
        { key: 'major', label: 'Major' },
        { key: 'date', label: 'Date', children: startEndDateFields },
      ],
    },
    {
      key: 'certifications',
      label: 'Certifications',
      labelKey: 'title',
      listItems: [
        { key: 'title', label: 'Title' },
        { key: 'issuer', label: 'Issuer' },
        { key: 'issued_date', label: 'Issued Date' },
        { key: 'credential', label: 'Credential ID' },
        { key: 'course_link', label: 'Course Link', format: 'url' },
      ],
    },
    {
      key: 'languages',
      label: 'Languages',
      labelKey: 'name',
      listItems: [
        { key: 'name', label: 'Name' },
        { key: 'description', label: 'Proficiency' },
      ],
    },
    {
      key: 'honors_and_awards',
      label: 'Honors and Awards',
      labelKey: 'title',
      listItems: [
        { key: 'title', label: 'Title' },
        { key: 'issuer', label: 'Issuer' },
        { key: 'issued_date', label: 'Issued Date' },
      ],
    },
  ],
};

export const companyDataOutputSchema: OutputSchema = {
  fields: [
    { key: 'url', label: 'LinkedIn URL', format: 'url' },
    { key: 'company_name', label: 'LinkedIn Username' },
    { key: 'name', label: 'Name' },
    { key: 'tagline', label: 'Tagline' },
    { key: 'about', label: 'About' },
    { key: 'website', label: 'Website', format: 'url' },
    { key: 'industry', label: 'Industry' },
    { key: 'size', label: 'Company Size' },
    { key: 'employees', label: 'Employees on LinkedIn' },
    { key: 'followers', label: 'Followers' },
    { key: 'headquarters', label: 'Headquarters' },
    { key: 'organizationType', label: 'Organization Type' },
    { key: 'foundedOn', label: 'Founded' },
    { key: 'specialties', label: 'Specialties' },
    { key: 'logo_url', label: 'Logo', format: 'image' },
    { key: 'cover_image_url', label: 'Cover Image', format: 'image' },
    { key: 'crawled_at', label: 'Crawled At' },
    {
      key: 'funding',
      label: 'Funding',
      children: [
        {
          key: 'last_round',
          label: 'Last Round',
          children: [
            { key: 'date', label: 'Date' },
            { key: 'type', label: 'Type' },
            { key: 'raised_amount', label: 'Raised Amount' },
          ],
        },
        { key: 'rounds_count', label: 'Rounds Count', format: 'number' },
        { key: 'crunchbase_url', label: 'Crunchbase URL', format: 'url' },
      ],
    },
    {
      key: 'posts',
      label: 'Recent Posts',
      labelKey: 'text',
      listItems: [
        { key: 'text', label: 'Text' },
        { key: 'post_url', label: 'Post URL', format: 'url' },
        { key: 'time', label: 'Posted' },
        { key: 'likes_count', label: 'Likes', format: 'number' },
        { key: 'comments_count', label: 'Comments', format: 'number' },
      ],
    },
  ],
};

export const jobResultOutputSchema: OutputSchema = {
  fields: [
    { key: 'status', label: 'Status', description: '"ready" when the result is in data, "processing" otherwise.' },
    { key: 'request_id', label: 'Request ID' },
    { key: 'data', label: 'Result', description: 'The finished result; same shape as the action that started the job.' },
  ],
};
