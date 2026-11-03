import type { AppConnectionType } from '@activepieces/pieces-framework';

import type { NativeCreateIndexOptions } from '@pinecone-database/pinecone';

export type PineconeAuthValue = {
	type: AppConnectionType.CUSTOM_AUTH;
	props: { apiKey: string };
};

export type PineconeIndexDeployment = NativeCreateIndexOptions['deployment'];

export type {
	CreateIndexSchemaField,
	DocumentRecord,
	MessageModel,
	PineconeRecord,
	QueryOptions,
	ReadCapacity,
	RecordMetadata,
	RecordMetadataValue,
	RecordSparseValues,
	UpdateOptions,
} from '@pinecone-database/pinecone';

export type PineconeDeletionProtection = 'enabled' | 'disabled';

export type PineconeCloud = 'aws' | 'gcp' | 'azure';

export type PineconeMetric = 'cosine' | 'euclidean' | 'dotproduct';

export type PineconeNamespaceAlias = {
	name: string;
	target_namespace: string;
	created_at?: string;
	updated_at?: string;
};

export type PineconeNamespaceAliasList = {
	namespace_aliases?: PineconeNamespaceAlias[];
	pagination?: { next?: string };
	total_count?: number;
};

export type PineconeLegacyIndexSpec = {
	serverless?: { cloud: string; region: string; sourceCollection?: string };
	pod?: {
		environment: string;
		podType: string;
		replicas?: number;
		shards?: number;
		pods?: number;
		sourceCollection?: string;
	};
};

export type PineconeLegacyCreateIndexRequest = {
	name: string;
	dimension?: number;
	metric: string;
	vectorType?: string;
	deletionProtection?: PineconeDeletionProtection;
	tags?: Record<string, string>;
	spec: PineconeLegacyIndexSpec;
};

export type PineconeLegacyIndex = {
	name: string;
	dimension?: number;
	metric: string;
	host: string;
	privateHost?: string;
	deletionProtection?: string;
	tags?: Record<string, string>;
	embed?: {
		model: string;
		metric?: string;
		dimension?: number;
		vectorType?: string;
		fieldMap?: object;
		readParameters?: object;
		writeParameters?: object;
	};
	spec: {
		byoc?: { environment: string };
		pod?: {
			environment: string;
			replicas?: number;
			shards?: number;
			podType: string;
			pods?: number;
			metadataConfig?: { indexed?: string[] };
			sourceCollection?: string;
		};
		serverless?: { cloud: string; region: string; sourceCollection?: string };
	};
	status: { ready: boolean; state: string };
	vectorType: string;
};

export type PineconeLegacyIndexResponse = {
	name: string;
	dimension?: number;
	metric: string;
	host: string;
	private_host?: string;
	deletion_protection?: string;
	tags?: Record<string, string>;
	embed?: {
		model: string;
		metric?: string;
		dimension?: number;
		vector_type?: string;
		field_map?: object;
		read_parameters?: object;
		write_parameters?: object;
	};
	spec: {
		byoc?: { environment: string };
		pod?: {
			environment: string;
			replicas?: number;
			shards?: number;
			pod_type: string;
			pods?: number;
			metadata_config?: { indexed?: string[] };
			source_collection?: string;
		};
		serverless?: { cloud: string; region: string; source_collection?: string };
	};
	status: { ready: boolean; state: string };
	vector_type: string;
};
