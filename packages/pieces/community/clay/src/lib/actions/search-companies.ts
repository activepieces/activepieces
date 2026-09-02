import { createAction, Property } from '@activepieces/pieces-framework';
import { clayAuth } from '../auth';
import { buildClayInClause, escapeClayQueryValue, runClayQueryModeSearch } from '../common';
import { clayCompanySearchOptions } from '../common/company-search-options';

export const searchCompaniesAction = createAction({
    auth: clayAuth,
    name: 'search_companies',
    classification: 'SEARCH',
    displayName: 'Search Companies',
    description: 'Searches Clay\'s company database using structured filters.',
    audience: 'both',
    aiMetadata: {
        description:
            'Search Clay\'s proprietary GTM database for companies matching structured filters (identifiers, industry, size, revenue, type, headquarters country, keyword). Use Search People instead when looking up individuals. Safe to retry; results may change between calls.',
        idempotent: true,
    },
    props: {
        company_identifiers: Property.Array({
            displayName: 'Company Identifiers',
            description: 'Domains or LinkedIn company URLs to match exactly, e.g. "stripe.com".',
            required: false,
        }),
        industries: Property.StaticMultiSelectDropdown({
            displayName: 'Industry',
            required: false,
            options: { options: clayCompanySearchOptions.industry },
        }),
        company_sizes: Property.StaticMultiSelectDropdown({
            displayName: 'Company Size',
            required: false,
            options: { options: clayCompanySearchOptions.companySize },
        }),
        annual_revenues: Property.StaticMultiSelectDropdown({
            displayName: 'Annual Revenue',
            required: false,
            options: { options: clayCompanySearchOptions.annualRevenue },
        }),
        company_types: Property.StaticMultiSelectDropdown({
            displayName: 'Company Type',
            required: false,
            options: { options: clayCompanySearchOptions.companyType },
        }),
        headquarters_countries: Property.StaticMultiSelectDropdown({
            displayName: 'Headquarters Country',
            required: false,
            options: { options: clayCompanySearchOptions.locationCountry },
        }),
        headquarters_only: Property.Checkbox({
            displayName: 'Match headquarters location only',
            description: 'Only match the office marked as the company headquarters, not any office.',
            required: false,
            defaultValue: false,
        }),
        keyword: Property.ShortText({
            displayName: 'Description Keyword',
            description: 'Matches companies whose description contains this word or phrase.',
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
            company_identifiers,
            industries,
            company_sizes,
            annual_revenues,
            company_types,
            headquarters_countries,
            headquarters_only,
            keyword,
            advanced_filter,
            limit,
        } = context.propsValue;

        const clauses = buildCompanyFilterClauses({
            companyIdentifiers: (company_identifiers as string[] | undefined) ?? [],
            industries: industries ?? [],
            companySizes: company_sizes ?? [],
            annualRevenues: annual_revenues ?? [],
            companyTypes: company_types ?? [],
            headquartersCountries: headquarters_countries ?? [],
            headquartersOnly: headquarters_only ?? false,
            keyword,
            advancedFilter: advanced_filter,
        });

        if (clauses.length === 0) {
            throw new Error('Provide at least one filter to search companies.');
        }

        return await runClayQueryModeSearch({
            apiKey: context.auth.secret_text,
            sourceType: 'companies',
            query: `select from companies where ${clauses.join(' and ')}`,
            limit: limit ?? 20,
        });
    },
});

function buildCompanyFilterClauses({
    companyIdentifiers,
    industries,
    companySizes,
    annualRevenues,
    companyTypes,
    headquartersCountries,
    headquartersOnly,
    keyword,
    advancedFilter,
}: {
    companyIdentifiers: string[];
    industries: string[];
    companySizes: string[];
    annualRevenues: string[];
    companyTypes: string[];
    headquartersCountries: string[];
    headquartersOnly: boolean;
    keyword: string | undefined;
    advancedFilter: string | undefined;
}): string[] {
    const locationParts = [
        buildClayInClause({ field: 'country_name', values: headquartersCountries }),
        headquartersOnly ? 'is_headquarters = true' : undefined,
    ].filter((part): part is string => part !== undefined);

    return [
        companyIdentifiers.length > 0
            ? `clay.include_company_identifiers((${companyIdentifiers
                  .map((identifier) => `"${escapeClayQueryValue(identifier)}"`)
                  .join(', ')}))`
            : undefined,
        buildClayInClause({ field: 'industry', values: industries }),
        buildClayInClause({ field: 'company_size', values: companySizes }),
        buildClayInClause({ field: 'annual_revenue', values: annualRevenues }),
        buildClayInClause({ field: 'company_type', values: companyTypes }),
        locationParts.length > 0 ? `locations.any(${locationParts.join(' and ')})` : undefined,
        keyword ? `description contains "${escapeClayQueryValue(keyword)}"` : undefined,
        advancedFilter ? `(${advancedFilter})` : undefined,
    ].filter((clause): clause is string => clause !== undefined);
}
