import { Property } from '@activepieces/pieces-framework';

import type { PineconeCloud, PineconeDeletionProtection, PineconeMetric } from './types';

function indexName<R extends boolean>({
	required,
	displayName = 'Index Name',
	description = 'Name of the index, from List Indexes. The action looks up the index host itself.',
}: PropParams<R>) {
	return Property.ShortText({ displayName, description, required });
}

function namespace<R extends boolean>({
	required,
	displayName = 'Namespace',
	description = 'Namespace inside the index, from List Namespaces. Leave empty for the default namespace ("__default__").',
}: PropParams<R>) {
	return Property.ShortText({ displayName, description, required });
}

function limit<R extends boolean>({
	required,
	displayName = 'Limit',
	description = 'Maximum number of items to return in this page.',
}: PropParams<R>) {
	return Property.Number({ displayName, description, required });
}

function paginationToken<R extends boolean>({
	required,
	displayName = 'Pagination Token',
	description = 'The `next` token from the previous page of this same list, to fetch the following page.',
}: PropParams<R>) {
	return Property.ShortText({ displayName, description, required });
}

function cloud<R extends boolean>({
	required,
	displayName = 'Cloud',
	description = 'Public cloud that hosts the index: aws, gcp or azure.',
}: PropParams<R>) {
	return Property.StaticDropdown<PineconeCloud, R>({
		displayName,
		description,
		required,
		options: {
			options: [
				{ label: 'AWS', value: 'aws' },
				{ label: 'GCP', value: 'gcp' },
				{ label: 'Azure', value: 'azure' },
			],
		},
	});
}

function region<R extends boolean>({
	required,
	displayName = 'Region',
	description = 'Cloud region for the index, e.g. "us-east-1" on aws, "us-central1" on gcp, "eastus2" on azure.',
}: PropParams<R>) {
	return Property.ShortText({ displayName, description, required });
}

function deletionProtection<R extends boolean>({
	required,
	displayName = 'Deletion Protection',
	description = 'Set to "enabled" to block deleting the index until it is set back to "disabled". Leave empty to keep the default (disabled) or the current value.',
}: PropParams<R>) {
	return Property.StaticDropdown<PineconeDeletionProtection, R>({
		displayName,
		description,
		required,
		options: {
			options: [
				{ label: 'Enabled', value: 'enabled' },
				{ label: 'Disabled', value: 'disabled' },
			],
		},
	});
}

function tags<R extends boolean>({
	required,
	displayName = 'Tags',
	description = 'Index tags as a JSON object of string values, e.g. {"team": "search"}. At most 20 tags; set a value to "" to remove that tag.',
}: PropParams<R>) {
	return Property.Json({ displayName, description, required });
}

function readNodeType<R extends boolean>({
	required,
	displayName = 'Dedicated Node Type',
	description = 'Set to use dedicated read nodes instead of on-demand reads: "b1" (balanced) or "t1" (higher throughput). Needs Read Replicas and Read Shards too.',
}: PropParams<R>) {
	return Property.StaticDropdown<'b1' | 't1', R>({
		displayName,
		description,
		required,
		options: {
			options: [
				{ label: 'b1', value: 'b1' },
				{ label: 't1', value: 't1' },
			],
		},
	});
}

function readReplicas<R extends boolean>({
	required,
	displayName = 'Read Replicas',
	description = 'Number of dedicated read replicas. Used only with Dedicated Node Type.',
}: PropParams<R>) {
	return Property.Number({ displayName, description, required });
}

function readShards<R extends boolean>({
	required,
	displayName = 'Read Shards',
	description = 'Number of dedicated read shards. Used only with Dedicated Node Type.',
}: PropParams<R>) {
	return Property.Number({ displayName, description, required });
}

function metric<R extends boolean>({
	required,
	displayName = 'Metric',
	description = 'Distance metric for similarity search: cosine, euclidean or dotproduct.',
}: PropParams<R>) {
	return Property.StaticDropdown<PineconeMetric, R>({
		displayName,
		description,
		required,
		options: {
			options: [
				{ label: 'Cosine', value: 'cosine' },
				{ label: 'Euclidean', value: 'euclidean' },
				{ label: 'Dot Product', value: 'dotproduct' },
			],
		},
	});
}

export const pineconeAiProps = {
	indexName,
	namespace,
	limit,
	paginationToken,
	cloud,
	region,
	deletionProtection,
	tags,
	readNodeType,
	readReplicas,
	readShards,
	metric,
};

export type PropParams<R extends boolean> = {
	required: R;
	displayName?: string;
	description?: string;
};
