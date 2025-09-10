import {
  PiecePropValueSchema,
  Property,
  createAction,
} from '@activepieces/pieces-framework';
import { firstSeenAtFromField, firstSeenAtUntilField, lastSeenAtFromField, lastSeenAtUntilField, limitField, makeClient, pageField } from '../common';
import { PredictLeadsAuth } from '../../index';
import { prepareQuery } from '../common/client';

const categories = [
  { value: "administration", label: "Administration" },
  { value: "consulting", label: "Consulting" },
  { value: "data_analysis", label: "Data Analysis" },
  { value: "design", label: "Design" },
  { value: "directors", label: "Directors" },
  { value: "education", label: "Education" },
  { value: "engineering", label: "Engineering" },
  { value: "finance", label: "Finance" },
  { value: "healthcare_services", label: "Healthcare Services" },
  { value: "human_resources", label: "Human Resources" },
  { value: "information_technology", label: "Information Technology" },
  { value: "internship", label: "Internship" },
  { value: "legal", label: "Legal" },
  { value: "management", label: "Management" },
  { value: "marketing", label: "Marketing" },
  { value: "military_and_protective_services", label: "Military And Protective Services" },
  { value: "operations", label: "Operations" },
  { value: "purchasing", label: "Purchasing" },
  { value: "product_management", label: "Product Management" },
  { value: "quality_assurance", label: "Quality Assurance" },
  { value: "real_estate", label: "Real Estate" },
  { value: "research", label: "Research" },
  { value: "sales", label: "Sales" },
  { value: "software_development", label: "Software Development" },
  { value: "support", label: "Support" },
  { value: "manual_work", label: "Manual Work" },
  { value: "food", label: "Food" },
];

export const getCompanyJobOpeningsActions = createAction({
  auth: PredictLeadsAuth,
  name: 'predict-leads_find_company_job_openings',
  displayName: "List Company's Job Openings",
  description: 'Retrieves job openings by company domain.',
  props: {
    domain: Property.ShortText({
      displayName: "Domain",
      description: "Company's domain",
      required: true,
    }),
    active_only: Property.Checkbox({
      displayName: "Active Only",
      description: "Set to true if you'd like to receive JobOpenings that are not closed, have last_seen_at more recent than 5 days and were found in the last year",
      required: false,
    }),
    not_closed: Property.Checkbox({
      displayName: "Not Closed",
      description: "Similar to active_only, but without considering last_seen_at timestamp.",
      required: false,
    }),
    first_seen_at_from: firstSeenAtFromField,
    first_seen_at_until: firstSeenAtUntilField,
    last_seen_at_from: lastSeenAtFromField,
    last_seen_at_until: lastSeenAtUntilField,
    with_description_only: Property.Checkbox({
      displayName: "With Description Only",
      description: "Only return JobOpenings that have description",
      required: false,
    }),
    with_location_only: Property.Checkbox({
      displayName: "With Location Only",
      description: "Only return JobOpenings that have location",
      required: false,
    }),
    categories: Property.StaticMultiSelectDropdown({
      displayName: 'Categories',
      description: 'Select categories to filter job openings',
      required: false,
      options: {
        options: categories
      },
    }),
    page: pageField,
    limit: limitField,
  },
  async run(context) {
    const client = makeClient(
      context.auth as PiecePropValueSchema<typeof PredictLeadsAuth>
    );

    const domain = context.propsValue.domain;
    const active_only = context.propsValue.active_only;
    const not_closed = context.propsValue.not_closed;
    const first_seen_at_from = context.propsValue.first_seen_at_from;
    const first_seen_at_until = context.propsValue.first_seen_at_until;
    const last_seen_at_from = context.propsValue.last_seen_at_from;
    const last_seen_at_until = context.propsValue.last_seen_at_until;
    const with_description_only = context.propsValue.with_description_only;
    const with_location_only = context.propsValue.with_location_only;
    const categories = context.propsValue.categories;
    const page = context.propsValue.page ?? 1;
    const limit = context.propsValue.limit ?? 1000;

    try {
      const response = await client.findCompanyJobOpenings(
        domain,
        prepareQuery({
          active_only,
          not_closed,
          first_seen_at_from,
          first_seen_at_until,
          last_seen_at_from,
          last_seen_at_until,
          with_description_only,
          with_location_only,
          categories,
          page,
          limit,
        })
      );
      return response;
    } catch (error) {
      throw new Error(JSON.stringify(error, undefined, 2));
    }
  },
});

export const getAJobOpeningByIdAction = createAction({
  auth: PredictLeadsAuth,
  name: 'predict-leads_get_a_job_opening_by_id',
  displayName: 'Get Job Opening',
  description: 'Retrieves a single job opening by ID.',
  props: {
    jobOpeningId: Property.ShortText({
      displayName: "Job Opening ID",
      description: "The ID of the job opening to retrieve.",
      required: true,
    }),
  },
  async run(context) {
    const client = makeClient(
      context.auth as PiecePropValueSchema<typeof PredictLeadsAuth>
    );

    const jobOpeningId = context.propsValue.jobOpeningId;

    try {
      const response = await client.getAJobOpeningById(jobOpeningId);
      return response;
    } catch (error) {
      throw new Error(JSON.stringify(error, undefined, 2));
    }
  },
});

export const findJobOpeningsAction = createAction({
  auth: PredictLeadsAuth,
  name: 'predict-leads_find_job_openings',
  displayName: 'List Job Openings',
  description: 'Retrieves a list of job openings',
  props: {
    onet_codes: Property.Array({
      displayName: 'onet_codes',
      description: 'O*NET codes to filter by, such as "17-2071.00" for "Electrical Engineers" or "15-1254.00" for "Web Developers". For full list of possible codes see: https://www.onetonline.org/find/all',
      required: false,
    }),
    page: pageField,
    limit: limitField,
  },
  async run(context) {
    const client = makeClient(
      context.auth as PiecePropValueSchema<typeof PredictLeadsAuth>
    );
    const page = context.propsValue.page ?? 1;
    const limit = context.propsValue.limit ?? 1000;
    const onet_codes = context.propsValue.onet_codes ?? [];

    try {
      const response = await client.findJobOpenings(prepareQuery({
        page,
        limit,
        onet_codes
      }));
      return response;
    } catch (error) {
      throw new Error(JSON.stringify(error, undefined, 2));
    }
  },
});