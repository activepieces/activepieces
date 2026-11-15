import { Readable } from 'node:stream';

import { createAction, Property } from '@activepieces/pieces-framework';

import { s3AiCommon } from './ai-common';
import { amazonS3CombinedAuth, S3AuthProps } from '../../auth';
import { resolveS3Client } from '../../common';
import { amazonS3ReadFileOutputSchema } from '../../output-schemas';

export const amazonS3ReadFileAi = createAction({
	auth: amazonS3CombinedAuth,
	name: 'amazon_s3_read_file',
	outputSchema: amazonS3ReadFileOutputSchema,
	displayName: 'Read File',
	description: 'Reads a file, returning text content inline and the file itself for later steps.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Downloads a file by key and returns it as a stored file for later steps. For text files (text/*, JSON, CSV, XML, YAML) up to 10 MB it also returns the text in "content", decoded with the declared charset (UTF-8 when none) and cut at 100,000 characters with "truncated" set; binary files, larger files and unsupported charsets return content null. Pass a version id from List File Versions to read an older version.',
		idempotent: true,
	},
	props: {
		key: Property.ShortText({
			displayName: 'File Key',
			description:
				'The full key (path) of the file, e.g. "reports/2024/q1.csv", as returned by List Files.',
			required: true,
		}),
		versionId: Property.ShortText({
			displayName: 'Version ID',
			description: 'A version id from List File Versions. Leave empty for the current version.',
			required: false,
		}),
	},
	async run(context) {
		const authProps: S3AuthProps = context.auth.props;
		const { bucket } = authProps;
		const s3 = await resolveS3Client({ authProps, server: context.server });
		const { key, versionId } = context.propsValue;

		const response = await s3AiCommon.call({
			key,
			request: () => s3.getObject({ Bucket: bucket, Key: key, VersionId: versionId || undefined }),
		});
		if (!response.Body) {
			throw new Error(`File "${key}" returned no content.`);
		}

		const fileName = key.split('/').pop() || key;
		const size = response.ContentLength ?? null;
		const isText = s3AiCommon.isTextContentType(response.ContentType);
		const inlineText = isText && size !== null && size <= MAX_INLINE_BYTES;

		const { content, truncated, data } = inlineText
			? readText({
					bytes: await response.Body.transformToByteArray(),
					contentType: response.ContentType,
			  })
			: { content: null, truncated: isText, data: response.Body };

		if (!(data instanceof Buffer) && !(data instanceof Readable)) {
			throw new Error(`Could not read file "${key}" from S3.`);
		}
		const file = await context.files.write({ fileName, data });

		return {
			key,
			versionId: response.VersionId ?? null,
			contentType: response.ContentType ?? null,
			size,
			lastModified: s3AiCommon.toIso(response.LastModified),
			etag: response.ETag ?? null,
			content,
			truncated,
			file,
		};
	},
});

function readText({ bytes, contentType }: { bytes: Uint8Array; contentType: string | undefined }) {
	const data = Buffer.from(bytes);
	const decoder = textDecoder({ contentType });
	if (!decoder) {
		return { content: null, truncated: false, data };
	}
	const text = decoder.decode(data);
	return {
		content: text.slice(0, MAX_INLINE_CHARS),
		truncated: text.length > MAX_INLINE_CHARS,
		data,
	};
}

function textDecoder({ contentType }: { contentType: string | undefined }): TextDecoder | null {
	const charset = /charset=["']?([^;"'\s]+)/i.exec(contentType ?? '')?.[1] ?? 'utf-8';
	try {
		return new TextDecoder(charset);
	} catch {
		return null;
	}
}

const MAX_INLINE_BYTES = 10 * 1024 * 1024;
const MAX_INLINE_CHARS = 100_000;
