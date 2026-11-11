import { createAction, Property } from '@activepieces/pieces-framework';
import { jobspipeAuth } from '../auth';
import { makeJobsPipeRequest } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const searchJobsAction = createAction({
    auth: jobspipeAuth,
    name: 'search_jobs',
    classification: 'SEARCH',
    displayName: 'Search Jobs',
    description: 'Search live job postings from 30+ job boards and ATS platforms.',
    audience: 'both',
    aiMetadata: {
        description:
            'Search JobsPipe for live job postings matching filters (title, location, company, seniority, remote, posted date, salary, skills, etc). Returns normalized postings from 30+ sources including LinkedIn, Indeed, Greenhouse, Workday, and more. Safe to retry; results may change between calls.',
        idempotent: true,
    },
    props: {
        job_title_or: Property.Array({
            displayName: 'Job Titles',
            description: 'Match jobs whose title contains any of these terms, e.g. "data engineer", "senior developer".',
            required: false,
        }),
        company_name_partial_match_or: Property.Array({
            displayName: 'Company Names',
            description: 'Match any of these company names (partial match), e.g. "stripe", "google".',
            required: false,
        }),
        job_country_code_or: Property.Array({
            displayName: 'Country Codes',
            description: 'ISO alpha-2 country codes, e.g. "US", "GB", "DE".',
            required: false,
        }),
        city_or: Property.Array({
            displayName: 'Cities',
            description: 'Whole city names, e.g. "London", "San Francisco", "Berlin".',
            required: false,
        }),
        job_location_or: Property.Array({
            displayName: 'Locations',
            description: 'Match city or region names (partial match), e.g. "Seattle", "WA", "California".',
            required: false,
        }),
        remote: Property.Checkbox({
            displayName: 'Remote Only',
            description: 'true for remote-only jobs, false to exclude remote jobs.',
            required: false,
        }),
        job_seniority_or: Property.Array({
            displayName: 'Seniority Levels',
            description: 'Seniority levels: "entry", "junior", "mid", "senior", "lead", "staff", "principal", "director", "vp", "c-level", "intern".',
            required: false,
        }),
        posted_at_max_age_days: Property.Number({
            displayName: 'Posted Within (Days)',
            description: 'Only postings newer than this many days, at most 365.',
            required: false,
            display: 'stepper',
            min: 0,
            max: 365,
        }),
        min_salary_usd: Property.Number({
            displayName: 'Minimum Salary (USD)',
            description: 'Only jobs whose posted salary reaches this annual USD amount.',
            required: false,
        }),
        description_or: Property.Array({
            displayName: 'Description Keywords',
            description: 'Match jobs whose description contains every word of any one of these phrases.',
            required: false,
        }),
        skills_or: Property.Array({
            displayName: 'Skills',
            description: 'Skill slugs, e.g. "python", "kubernetes", "react".',
            required: false,
        }),
        source_or: Property.Array({
            displayName: 'Sources',
            description: 'Specific sources to search: "linkedin", "indeed", "greenhouse", "workday", "ashby", "lever", etc.',
            required: false,
        }),
        limit: Property.Number({
            displayName: 'Max Results',
            description: 'Maximum number of jobs to return.',
            required: false,
            defaultValue: 25,
            display: 'stepper',
            min: 1,
            max: 500,
        }),
    },
    async run(context) {
        const {
            job_title_or,
            company_name_partial_match_or,
            job_country_code_or,
            city_or,
            job_location_or,
            remote,
            job_seniority_or,
            posted_at_max_age_days,
            min_salary_usd,
            description_or,
            skills_or,
            source_or,
            limit,
        } = context.propsValue;

        const searchBody: Record<string, unknown> = {};

        if (job_title_or && (job_title_or as string[]).length > 0) {
            searchBody['job_title_or'] = job_title_or;
        }
        if (company_name_partial_match_or && (company_name_partial_match_or as string[]).length > 0) {
            searchBody['company_name_partial_match_or'] = company_name_partial_match_or;
        }
        if (job_country_code_or && (job_country_code_or as string[]).length > 0) {
            searchBody['job_country_code_or'] = job_country_code_or;
        }
        if (city_or && (city_or as string[]).length > 0) {
            searchBody['city_or'] = city_or;
        }
        if (job_location_or && (job_location_or as string[]).length > 0) {
            searchBody['job_location_or'] = job_location_or;
        }
        if (remote !== undefined && remote !== null) {
            searchBody['remote'] = remote;
        }
        if (job_seniority_or && (job_seniority_or as string[]).length > 0) {
            searchBody['job_seniority_or'] = job_seniority_or;
        }
        if (posted_at_max_age_days !== undefined && posted_at_max_age_days !== null) {
            searchBody['posted_at_max_age_days'] = posted_at_max_age_days;
        }
        if (min_salary_usd !== undefined && min_salary_usd !== null) {
            searchBody['min_salary_usd'] = min_salary_usd;
        }
        if (description_or && (description_or as string[]).length > 0) {
            searchBody['description_or'] = description_or;
        }
        if (skills_or && (skills_or as string[]).length > 0) {
            searchBody['skills_or'] = skills_or;
        }
        if (source_or && (source_or as string[]).length > 0) {
            searchBody['source_or'] = source_or;
        }
        if (limit !== undefined && limit !== null) {
            searchBody['limit'] = limit;
        }

        const response = await makeJobsPipeRequest<{
            metadata: {
                total_results: number;
                credits_charged: number;
                credits_remaining: number;
            };
            data: unknown[];
        }>({
            apiKey: context.auth.secret_text,
            method: HttpMethod.POST,
            path: '/v1/jobs/search',
            body: searchBody,
        });

        return response.data;
    },
});
