import { createAction, Property } from '@activepieces/pieces-framework';

import { twentyAuth } from '../../auth';
import { twentyAiProps } from '../../common/ai-props';
import { twentyApi } from '../../common/api';
import { twentyGroupRecordsOutputSchema } from '../../output-schemas';

export const groupRecordsAction = createAction({
	auth: twentyAuth,
	name: 'twenty_group_records',
	outputSchema: twentyGroupRecordsOutputSchema,
	displayName: 'Group Records',
	description: 'Groups records by fields and computes aggregates per group.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Groups the records of one object by one or more fields and returns aggregate values per group, e.g. the number of opportunities and total amount per stage, or people created per month. Use it for counts and totals instead of paging through List Records. Returns up to 50 groups by default; each group lists its group-by values in groupByDimensionValues and each aggregate under its name, as a string (e.g. "countNotEmptyId": "3").',
		idempotent: true,
	},
	props: {
		objectNamePlural: twentyAiProps.objectNamePlural({ required: true }),
		groupBy: Property.Array({
			displayName: 'Group By',
			description:
				'Fields to group by, as an array of JSON objects, e.g. [{"stage": true}], [{"address": {"addressCity": true}}] for a composite sub-field, or [{"createdAt": {"granularity": "MONTH"}}] for dates (DAY, WEEK, MONTH, QUARTER, YEAR).',
			required: true,
		}),
		aggregate: Property.Array({
			displayName: 'Aggregates',
			description:
				'Aggregate names to compute per group, e.g. ["countNotEmptyId"] for a count, ["sumAmountAmountMicros"] or ["maxCreatedAt"]. Pattern: count/countEmpty/countNotEmpty/countUniqueValues/percentageEmpty/min/max/avg/sum + capitalised field name. Omit to get only the group values, without counts.',
			required: false,
		}),
		filter: twentyAiProps.filter({ required: false }),
		orderBy: twentyAiProps.orderBy({
			required: false,
			description:
				'Order of the groups, as a JSON array, e.g. [{"stage": "AscNullsLast"}] or [{"aggregate": {"countNotEmptyId": "DescNullsLast"}}].',
		}),
		limit: twentyAiProps.limit({
			required: false,
			description: 'Maximum number of groups to return. Defaults to 50.',
		}),
	},
	async run(context) {
		const { objectNamePlural, groupBy, aggregate, filter, orderBy, limit } = context.propsValue;
		if (
			groupBy.length === 0 ||
			!groupBy.every(
				(item): item is Record<string, unknown> =>
					typeof item === 'object' && item !== null && !Array.isArray(item),
			)
		) {
			throw new Error(
				'Group By must be a non-empty array of JSON objects, e.g. [{"stage": true}].',
			);
		}
		if (
			aggregate !== undefined &&
			!aggregate.every((name): name is string => typeof name === 'string' && name !== '')
		) {
			throw new Error(
				'Every item in Aggregates must be a non-empty string, e.g. "countNotEmptyId".',
			);
		}
		return await twentyApi.groupRecords({
			auth: context.auth,
			objectNamePlural,
			groupBy,
			aggregate: aggregate !== undefined && aggregate.length > 0 ? aggregate : undefined,
			filter,
			orderBy,
			limit,
		});
	},
});
