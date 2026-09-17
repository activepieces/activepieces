import { createAction, Property } from '@activepieces/pieces-framework';
import { clayAuth } from '../auth';
import { buildClayInClause, escapeClayQueryValue, runClayQueryModeSearch } from '../common';
import { clayPeopleSearchOptions } from '../common/people-search-options';

export const searchPeopleAction = createAction({
    auth: clayAuth,
    name: 'search_people',
    classification: 'SEARCH',
    displayName: 'Search People',
    description: 'Searches Clay\'s people database using structured filters.',
    audience: 'both',
    aiMetadata: {
        description:
            'Search Clay\'s proprietary GTM database for people matching structured filters (job title, seniority, employer, location, keyword). Use Search Companies instead when looking up companies rather than individuals. Safe to retry; results may change between calls.',
        idempotent: true,
    },
    props: {
        full_name_contains: Property.ShortText({
            displayName: 'Full Name Contains',
            required: false,
        }),
        job_titles: Property.Array({
            displayName: 'Job Title',
            description: 'Matches similar titles too (e.g. "VP of Sales" also matches "Head of Sales").',
            required: false,
        }),
        seniorities: Property.StaticMultiSelectDropdown({
            displayName: 'Seniority',
            required: false,
            options: { options: clayPeopleSearchOptions.experienceSeniority },
        }),
        tenure: Property.StaticDropdown({
            displayName: 'Employment Tenure',
            required: false,
            defaultValue: 'current',
            options: {
                options: [
                    { label: 'Current role', value: 'current' },
                    { label: 'Past role', value: 'past' },
                    { label: 'Any role (current or past)', value: 'any' },
                ],
            },
        }),
        company_identifiers: Property.Array({
            displayName: 'Employer (Domains or LinkedIn URLs)',
            description: 'Matches people at these exact companies. Scoped by Employment Tenure above.',
            required: false,
        }),
        company_name_contains: Property.ShortText({
            displayName: 'Employer Name Contains',
            description: 'Fuzzy employer name match, use when you don\'t have a domain. Scoped by Employment Tenure above.',
            required: false,
        }),
        location_cities: Property.Array({
            displayName: 'City',
            required: false,
        }),
        location_states: Property.Array({
            displayName: 'State / Province',
            required: false,
        }),
        location_countries: Property.StaticMultiSelectDropdown({
            displayName: 'Country',
            required: false,
            options: { options: clayPeopleSearchOptions.locationCountry },
        }),
        location_regions: Property.StaticMultiSelectDropdown({
            displayName: 'Region',
            required: false,
            options: { options: clayPeopleSearchOptions.locationRegion },
        }),
        languages: Property.Array({
            displayName: 'Languages',
            required: false,
        }),
        headline_contains: Property.ShortText({
            displayName: 'Headline Contains',
            required: false,
        }),
        about_contains: Property.ShortText({
            displayName: 'About Contains',
            required: false,
        }),
        advanced_filter: Property.LongText({
            displayName: 'Advanced Filter (Clay query syntax)',
            description:
                'Optional raw filter, ANDed onto the filters above. See Clay\'s advanced search query syntax: https://developers.clay.com/searches/advanced',
            required: false,
        }),
        limit: Property.Number({
            displayName: 'Max results',
            required: false,
            defaultValue: 20,
            display: 'stepper',
            min: 1,
            max: 500,
        }),
    },
    async run(context) {
        const {
            full_name_contains,
            job_titles,
            seniorities,
            tenure,
            company_identifiers,
            company_name_contains,
            location_cities,
            location_states,
            location_countries,
            location_regions,
            languages,
            headline_contains,
            about_contains,
            advanced_filter,
            limit,
        } = context.propsValue;

        const clauses = buildPeopleFilterClauses({
            fullNameContains: full_name_contains,
            jobTitles: (job_titles as string[] | undefined) ?? [],
            seniorities: seniorities ?? [],
            tenure: tenure ?? 'current',
            companyIdentifiers: (company_identifiers as string[] | undefined) ?? [],
            companyNameContains: company_name_contains,
            locationCities: (location_cities as string[] | undefined) ?? [],
            locationStates: (location_states as string[] | undefined) ?? [],
            locationCountries: location_countries ?? [],
            locationRegions: location_regions ?? [],
            languages: (languages as string[] | undefined) ?? [],
            headlineContains: headline_contains,
            aboutContains: about_contains,
            advancedFilter: advanced_filter,
        });

        if (clauses.length === 0) {
            throw new Error('Provide at least one filter to search people.');
        }

        return await runClayQueryModeSearch({
            apiKey: context.auth.secret_text,
            sourceType: 'people',
            query: `select from people where ${clauses.join(' and ')}`,
            limit: limit ?? 20,
        });
    },
});

function buildPeopleFilterClauses({
    fullNameContains,
    jobTitles,
    seniorities,
    tenure,
    companyIdentifiers,
    companyNameContains,
    locationCities,
    locationStates,
    locationCountries,
    locationRegions,
    languages,
    headlineContains,
    aboutContains,
    advancedFilter,
}: {
    fullNameContains: string | undefined;
    jobTitles: string[];
    seniorities: string[];
    tenure: string;
    companyIdentifiers: string[];
    companyNameContains: string | undefined;
    locationCities: string[];
    locationStates: string[];
    locationCountries: string[];
    locationRegions: string[];
    languages: string[];
    headlineContains: string | undefined;
    aboutContains: string | undefined;
    advancedFilter: string | undefined;
}): string[] {
    const experienceContentParts = [
        jobTitles.length > 0
            ? `job_title is_similar_to (${jobTitles.map((title) => `"${escapeClayQueryValue(title)}"`).join(', ')})`
            : undefined,
        buildClayInClause({ field: 'seniority', values: seniorities }),
        companyNameContains ? `company_name contains "${escapeClayQueryValue(companyNameContains)}"` : undefined,
        tenure !== 'current' ? buildClayInClause({ field: 'company.domain', values: companyIdentifiers }) : undefined,
    ].filter((part): part is string => part !== undefined);

    const experiencesClause =
        experienceContentParts.length > 0
            ? `experiences.any(${[
                  tenure === 'current' ? 'is_current = true' : tenure === 'past' ? 'is_current = false' : undefined,
                  ...experienceContentParts,
              ]
                  .filter((part): part is string => part !== undefined)
                  .join(' and ')})`
            : undefined;

    return [
        fullNameContains ? `full_name contains "${escapeClayQueryValue(fullNameContains)}"` : undefined,
        tenure === 'current' && companyIdentifiers.length > 0
            ? `clay.filter_to_companies((${companyIdentifiers
                  .map((identifier) => `"${escapeClayQueryValue(identifier)}"`)
                  .join(', ')}))`
            : undefined,
        buildClayInClause({ field: 'location_city', values: locationCities }),
        buildClayInClause({ field: 'location_state', values: locationStates }),
        buildClayInClause({ field: 'location_country', values: locationCountries }),
        buildClayInClause({ field: 'location_region', values: locationRegions }),
        buildClayInClause({ field: 'languages', values: languages }),
        headlineContains ? `headline contains "${escapeClayQueryValue(headlineContains)}"` : undefined,
        aboutContains ? `about contains "${escapeClayQueryValue(aboutContains)}"` : undefined,
        experiencesClause,
        advancedFilter ? `(${advancedFilter})` : undefined,
    ].filter((clause): clause is string => clause !== undefined);
}
