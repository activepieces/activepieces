function transformReportToRows(report: SalesforceReportResponse): {
	reportName: string;
	reportId: string;
	totalRows: number;
	columns: string[];
	rows: Record<string, unknown>[];
} {
	const detailColumns = report.reportMetadata?.detailColumns ?? [];
	const detailColumnInfo = report.reportExtendedMetadata?.detailColumnInfo ?? {};
	const groupingsDown = report.reportMetadata?.groupingsDown ?? [];
	const groupingColumnInfo = report.reportExtendedMetadata?.groupingColumnInfo ?? {};
	const factMap = report.factMap ?? {};

	const columnLabels = detailColumns.map((col) => detailColumnInfo[col]?.label ?? col);
	const groupingLabels = groupingsDown.map((g) => groupingColumnInfo[g.name]?.label ?? g.name);
	const groupingValues = extractGroupingValues({ groupings: report.groupingsDown?.groupings ?? [], depth: 0 });

	const allRows = Object.entries(factMap).flatMap(([factMapKey, factMapEntry]) => {
		if (!factMapEntry?.rows) {
			return [];
		}
		const groupContext = resolveGroupingContext({ factMapKey, groupingValues, groupingLabels });
		return factMapEntry.rows.map((row) => ({
			...groupContext,
			...Object.fromEntries(
				(row.dataCells ?? []).map((cell, i) => {
					const value = cell.label ?? cell.value;
					return [columnLabels[i] ?? `Column_${i}`, value === '-' || value === '--' ? '' : value];
				}),
			),
		}));
	});

	return {
		reportName: report.attributes?.reportName ?? report.reportMetadata?.name ?? 'Unknown Report',
		reportId: report.attributes.reportId ?? 'Unknown Report',
		totalRows: allRows.length,
		columns: [...groupingLabels, ...columnLabels],
		rows: allRows,
	};
}

export const reportUtils = {
	transformReportToRows,
};

function extractGroupingValues({
	groupings,
	depth,
}: {
	groupings: ReportGrouping[];
	depth: number;
}): Record<string, { label: string; depth: number }> {
	return groupings.reduce<Record<string, { label: string; depth: number }>>(
		(acc, grouping) => ({
			...acc,
			[grouping.key]: { label: grouping.label, depth },
			...(grouping.groupings && grouping.groupings.length > 0
				? extractGroupingValues({ groupings: grouping.groupings, depth: depth + 1 })
				: {}),
		}),
		{},
	);
}

function resolveGroupingContext({
	factMapKey,
	groupingValues,
	groupingLabels,
}: {
	factMapKey: string;
	groupingValues: Record<string, { label: string; depth: number }>;
	groupingLabels: string[];
}): Record<string, string> {
	const [rowPart] = factMapKey.split('!');
	if (rowPart === 'T' || !rowPart) {
		return {};
	}
	const rowKeys = rowPart.split('_');
	const cumulativeKeys = rowKeys.map((_, depth) => rowKeys.slice(0, depth + 1).join('_'));
	return Object.fromEntries(
		cumulativeKeys.flatMap((key, depth) => {
			const groupInfo = groupingValues[key];
			return groupInfo ? [[groupingLabels[depth] ?? `Group_${depth}`, groupInfo.label]] : [];
		}),
	);
}

type ReportGrouping = {
	key: string;
	label: string;
	value: unknown;
	groupings?: ReportGrouping[];
};

export type SalesforceReportResponse = {
	attributes: {
		reportId: string;
		reportName: string;
		status?: string;
	};
	reportMetadata: {
		detailColumns: string[];
		name: string;
		reportFormat: string;
		aggregates: string[];
		groupingsDown: {
			name: string;
			sortOrder: string;
			dateGranularity: string;
			column: string;
		}[];
	};
	reportExtendedMetadata: {
		detailColumnInfo: Record<string, { label: string; dataType: string }>;
		groupingColumnInfo: Record<string, { label: string; dataType: string }>;
		aggregateColumnInfo: Record<string, { label: string; dataType: string }>;
	};
	factMap: Record<
		string,
		{
			rows: { dataCells: { label: string; value: unknown }[] }[];
			aggregates: { label: string; value: unknown }[];
		}
	>;
	groupingsDown: {
		groupings: ReportGrouping[];
	};
};
