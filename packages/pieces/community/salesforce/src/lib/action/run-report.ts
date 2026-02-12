import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { salesforceAuth } from '../..';
import { callSalesforceApi, salesforcesCommon } from '../common';

export const runReport = createAction({
    auth: salesforceAuth,
    name: 'run_report',
    displayName: 'Run Report',
    description: 'Execute a Salesforce analytics report and return the results as easy-to-use rows.',
    props: {
        report_id: salesforcesCommon.report,
        include_details: Property.Checkbox({
            displayName: 'Include Detail Rows',
            description: 'Whether to include individual record rows in the report results. If disabled, only aggregate/summary data is returned.',
            required: false,
            defaultValue: true,
        }),
        output_format: Property.StaticDropdown({
            displayName: 'Output Format',
            description: 'Choose how the report data is returned.',
            required: false,
            defaultValue: 'rows',
            options: {
                options: [
                    { label: 'Simplified Rows (recommended)', value: 'rows' },
                    { label: 'Raw API Response', value: 'raw' },
                ],
            },
        }),
        filters: Property.Json({
            displayName: 'Filters',
            description: 'Apply dynamic filters to the report run. Leave empty to use the report\'s saved filters.',
            required: false,
            defaultValue: [],
        }),
    },
    async run(context) {
        const { report_id, filters, include_details, output_format } = context.propsValue;

        let body = undefined;
        if (filters && Array.isArray(filters) && filters.length > 0) {
            body = {
                reportMetadata: {
                    reportFilters: filters,
                },
            };
        }

        const includeDetails = include_details !== false;
        const queryParam = includeDetails ? '?includeDetails=true' : '';

        const response = await callSalesforceApi<SalesforceReportResponse>(
            HttpMethod.POST,
            context.auth,
            `/services/data/v56.0/analytics/reports/${report_id}${queryParam}`,
            body
        );

        const reportData = response.body;

        if (output_format === 'raw') {
            return reportData;
        }

        return transformReportToRows(reportData);
    },
});

interface SalesforceReportResponse {
    attributes: {
        reportId: string;
        reportName: string;
    };
    reportMetadata: {
        detailColumns: string[];
        name: string;
        reportFormat: string;
        aggregates: string[];
        groupingsDown: { name: string; sortOrder: string; dateGranularity: string; column: string }[];
    };
    reportExtendedMetadata: {
        detailColumnInfo: Record<string, { label: string; dataType: string }>;
        groupingColumnInfo: Record<string, { label: string; dataType: string }>;
        aggregateColumnInfo: Record<string, { label: string; dataType: string }>;
    };
    factMap: Record<string, {
        rows: { dataCells: { label: string; value: unknown }[] }[];
        aggregates: { label: string; value: unknown }[];
    }>;
    groupingsDown: {
        groupings: { key: string; label: string; value: unknown }[];
    };
}

function transformReportToRows(report: SalesforceReportResponse): {
    reportName: string;
    totalRows: number;
    columns: string[];
    rows: Record<string, unknown>[];
} {
    const detailColumns = report.reportMetadata?.detailColumns ?? [];
    const detailColumnInfo = report.reportExtendedMetadata?.detailColumnInfo ?? {};
    const groupingsDown = report.reportMetadata?.groupingsDown ?? [];
    const groupingColumnInfo = report.reportExtendedMetadata?.groupingColumnInfo ?? {};
    const factMap = report.factMap ?? {};

    // Build ordered list of column labels for detail columns
    const columnLabels = detailColumns.map(
        (col) => detailColumnInfo[col]?.label ?? col
    );

    // Build grouping column labels
    const groupingLabels = groupingsDown.map(
        (g) => groupingColumnInfo[g.column]?.label ?? g.column
    );

    const allRows: Record<string, unknown>[] = [];

    // Collect grouping labels from groupingsDown for grouped/summary reports
    const groupingValues = extractGroupingValues(report.groupingsDown?.groupings ?? []);

    // Iterate over all factMap entries to collect rows
    // Keys: "T!T" (tabular/grand total), "0!T", "1!T" (summary groups), "0!0", "1!0" (matrix), etc.
    for (const [factMapKey, factMapEntry] of Object.entries(factMap)) {
        if (!factMapEntry?.rows) continue;

        // Determine grouping context from the factMap key
        const groupContext = resolveGroupingContext(factMapKey, groupingValues, groupingLabels);

        for (const row of factMapEntry.rows) {
            const rowObj: Record<string, unknown> = {};

            // Add grouping columns if present
            for (const [key, value] of Object.entries(groupContext)) {
                rowObj[key] = value;
            }

            // Map each data cell to its column label
            if (row.dataCells) {
                for (let i = 0; i < row.dataCells.length; i++) {
                    const label = columnLabels[i] ?? `Column_${i}`;
                    const cell = row.dataCells[i];
                    rowObj[label] = cell.label ?? cell.value;
                }
            }

            allRows.push(rowObj);
        }
    }

    return {
        reportName: report.attributes?.reportName ?? report.reportMetadata?.name ?? 'Unknown Report',
        totalRows: allRows.length,
        columns: [...groupingLabels, ...columnLabels],
        rows: allRows,
    };
}

function extractGroupingValues(
    groupings: { key: string; label: string; value: unknown; groupings?: { key: string; label: string; value: unknown }[] }[],
    depth = 0,
    result: Record<string, { label: string; depth: number }> = {}
): Record<string, { label: string; depth: number }> {
    for (const grouping of groupings) {
        result[grouping.key] = { label: grouping.label, depth };
        if (grouping.groupings && grouping.groupings.length > 0) {
            extractGroupingValues(grouping.groupings, depth + 1, result);
        }
    }
    return result;
}

function resolveGroupingContext(
    factMapKey: string,
    groupingValues: Record<string, { label: string; depth: number }>,
    groupingLabels: string[]
): Record<string, string> {
    const context: Record<string, string> = {};

    // factMap keys are like "0!T", "0_1!T", "T!T", etc.
    // The part before "!" represents row groupings, after "!" represents column groupings
    const [rowPart] = factMapKey.split('!');

    if (rowPart === 'T' || !rowPart) {
        return context; // Grand total or no grouping
    }

    // Row grouping keys can be like "0", "0_1" (nested groupings)
    const rowKeys = rowPart.split('_');
    for (let i = 0; i < rowKeys.length; i++) {
        const groupInfo = groupingValues[rowKeys[i]];
        if (groupInfo) {
            const columnLabel = groupingLabels[groupInfo.depth] ?? `Group_${groupInfo.depth}`;
            context[columnLabel] = groupInfo.label;
        }
    }

    return context;
}