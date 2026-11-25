import { createAction, Property } from '@activepieces/pieces-framework';
import { captainDataAuth } from '../auth';
import { captainDataClient, captainDataUtils } from '../common';

export const enrichPerson = createAction({
  name: 'enrich_person',
  classification: 'READ',
  displayName: 'Enrich Person',
  description:
    'Gets the full LinkedIn profile of a person from their profile URL. Costs 1 credit, or 2 credits with Full Enrichment.',
  audience: 'both',
  aiMetadata: {
    description:
      'Returns the LinkedIn profile of one person from li_profile_url (/in/, /pub/, /sales/people/ or /sales/lead/ URLs): identity, headline/summary, location, current company, education, languages and open-to-work status. full_enrich=true adds a preview of up to 5 experiences and 2 skills (no licenses or certifications) in experiences and skills, with has_more_experiences/has_more_skills; those fields are absent without full_enrich. Any field may be null or missing when LinkedIn has no value. Costs 1 credit, 2 with full_enrich=true. Get li_profile_url from Find Person or Search People.',
    idempotent: true,
  },
  auth: captainDataAuth,
  props: {
    li_profile_url: Property.ShortText({
      displayName: 'LinkedIn Profile URL',
      description: 'e.g. https://www.linkedin.com/in/jane-doe',
      required: true,
    }),
    full_enrich: Property.Checkbox({
      displayName: 'Full Enrichment',
      description:
        'Adds a preview of up to 5 experiences and 2 skills (no licenses or certifications). Costs 2 credits instead of 1.',
      required: false,
      defaultValue: false,
    }),
  },
  outputSchema: {
    fields: [
      { key: 'uid', label: 'Person UID' },
      { key: 'li_profile_handle', label: 'LinkedIn Handle' },
      { key: 'li_profile_id', label: 'LinkedIn Profile ID', format: 'number' },
      { key: 'li_profile_url', label: 'LinkedIn Profile URL', format: 'url' },
      { key: 'full_name', label: 'Full Name' },
      { key: 'first_name', label: 'First Name' },
      { key: 'last_name', label: 'Last Name' },
      { key: 'headline', label: 'Headline' },
      { key: 'summary', label: 'Summary' },
      { key: 'job_title', label: 'Job Title' },
      { key: 'location', label: 'Location' },
      { key: 'li_profile_country', label: 'Profile Country' },
      { key: 'li_profile_language', label: 'Profile Language' },
      { key: 'languages', label: 'Languages' },
      { key: 'li_profile_image_url', label: 'Profile Image', format: 'image' },
      { key: 'company_name', label: 'Company Name' },
      { key: 'li_company_id', label: 'LinkedIn Company ID' },
      { key: 'li_company_url', label: 'LinkedIn Company URL', format: 'url' },
      { key: 'school_name', label: 'School' },
      { key: 'li_school_url', label: 'LinkedIn School URL', format: 'url' },
      {
        key: 'education',
        label: 'Education',
        labelKey: 'school_name',
        listItems: [
          { key: 'school_uid', label: 'School UID' },
          { key: 'school_name', label: 'School' },
          { key: 'li_school_url', label: 'LinkedIn School URL', format: 'url' },
          {
            key: 'li_school_id',
            label: 'LinkedIn School ID',
            format: 'number',
          },
          { key: 'degree_name', label: 'Degree' },
          { key: 'date', label: 'Date' },
        ],
      },
      { key: 'volunteer_experiences', label: 'Volunteer Experiences' },
      {
        key: 'li_people_post_search_url',
        label: 'LinkedIn Posts Search URL',
        format: 'url',
      },
      { key: 'open_to_work', label: 'Open to Work', format: 'boolean' },
      {
        key: 'li_number_connections',
        label: 'LinkedIn Connections',
        format: 'number',
      },
      {
        key: 'li_number_followers',
        label: 'LinkedIn Followers',
        format: 'number',
      },
      { key: 'past_job_title', label: 'Past Job Title' },
      { key: 'past_company_name', label: 'Past Company Name' },
      { key: 'past_li_company_id', label: 'Past LinkedIn Company ID' },
      {
        key: 'past_li_company_url',
        label: 'Past LinkedIn Company URL',
        format: 'url',
      },
      {
        key: 'experiences',
        label: 'Experiences (Full Enrichment)',
        labelKey: 'title',
        listItems: [
          { key: 'title', label: 'Title' },
          { key: 'company_name', label: 'Company Name' },
          { key: 'company_uid', label: 'Company UID' },
          {
            key: 'li_company_url',
            label: 'LinkedIn Company URL',
            format: 'url',
          },
          { key: 'li_company_id', label: 'LinkedIn Company ID' },
          { key: 'location', label: 'Location' },
          { key: 'date', label: 'Date' },
          { key: 'job_time_period', label: 'Time Period' },
          { key: 'company_description', label: 'Company Description' },
          {
            key: 'company_logo_url',
            label: 'Company Logo URL',
            format: 'url',
          },
        ],
      },
      {
        key: 'has_more_experiences',
        label: 'Has More Experiences',
        format: 'boolean',
      },
      {
        key: 'skills',
        label: 'Skills (Full Enrichment)',
        labelKey: 'name',
        listItems: [{ key: 'name', label: 'Skill' }],
      },
      { key: 'has_more_skills', label: 'Has More Skills', format: 'boolean' },
      { key: 'extracted_at', label: 'Extracted At', format: 'datetime' },
    ],
  },
  async run({ auth, propsValue }) {
    return captainDataClient.getObject({
      apiKey: auth.props.apiKey,
      path: '/people/enrich',
      operation: 'enrich person',
      retryTransientNotFound: true,
      queryParams: {
        li_profile_url: captainDataUtils.requireText({
          value: propsValue.li_profile_url,
          field: 'LinkedIn Profile URL',
        }),
        full_enrich: propsValue.full_enrich === true,
      },
    });
  },
});
