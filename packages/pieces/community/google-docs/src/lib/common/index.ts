/* eslint-disable @typescript-eslint/no-explicit-any */
import { Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient, AuthenticationType } from '@activepieces/pieces-common';
import { docs_v1 } from '@googleapis/docs';

export const docsCommon = {
	baseUrl: 'https://docs.googleapis.com/v1',
	title: Property.ShortText({
		displayName: 'Document Title',
		required: true,
	}),
	body: Property.LongText({
		displayName: 'Document Content',
		required: true,
	}),

	// Creates an empty document with the title provided
	createDocument: async (title: string, accessToken: string) => {
		const createRequest = await httpClient.sendRequest({
			url: `${docsCommon.baseUrl}/documents`,
			method: HttpMethod.POST,
			authentication: {
				type: AuthenticationType.BEARER_TOKEN,
				token: accessToken,
			},
			body: {
				title: title,
			},
		});

		return createRequest.body;
	},

	// Writes provided content to the end of an existing document
	writeToDocument: async (documentId: string, body: string, accessToken: string) => {
		const writeRequest = await httpClient.sendRequest({
			url: `${docsCommon.baseUrl}/documents/${documentId}:batchUpdate`,
			method: HttpMethod.POST,
			authentication: {
				type: AuthenticationType.BEARER_TOKEN,
				token: accessToken,
			},
			body: {
				requests: [
					{
						insertText: {
							text: body,
							endOfSegmentLocation: {},
						},
					},
				],
			},
		});

		return writeRequest.body;
	},

	// Converts block-level Markdown into Google Docs batchUpdate requests.
	// Inserts each line left-to-right at a running cursor (starting at baseIndex)
	// so every index references the document state after the prior inserts in the
	// same batch (indices stay stable because each insert is at the prior insert's
	// end). Block-level only: headings and bullets; inline marks are left as literal
	// text. baseIndex defaults to 1 (start of body); pass a section start index to
	// insert markdown into a freshly-emptied range mid-document.
	markdownToBatchRequests: (markdown: string, baseIndex = 1): docs_v1.Schema$Request[] => {
		const lines = markdown.replace(/\r\n/g, '\n').split('\n');
		const requests: docs_v1.Schema$Request[] = [];
		const bulletRanges: Array<{ startIndex: number; endIndex: number }> = [];
		let cursor = baseIndex;

		for (const line of lines) {
			const headingMatch = /^(#{1,3})\s+(.*)$/.exec(line);
			const bulletMatch = /^\s*[-*+]\s+(.*)$/.exec(line);

			let textToInsert = line;
			let headingLevel = 0;
			let isBullet = false;
			if (headingMatch) {
				headingLevel = headingMatch[1].length;
				textToInsert = headingMatch[2];
			} else if (bulletMatch) {
				isBullet = true;
				textToInsert = bulletMatch[1];
			}

			requests.push({ insertText: { text: textToInsert + '\n', location: { index: cursor } } });
			const paragraphStart = cursor;
			const paragraphEnd = cursor + textToInsert.length + 1;

			if (headingLevel > 0) {
				requests.push({
					updateParagraphStyle: {
						range: { startIndex: paragraphStart, endIndex: paragraphEnd },
						paragraphStyle: { namedStyleType: `HEADING_${headingLevel}` },
						fields: 'namedStyleType',
					},
				});
			}
			if (isBullet) {
				bulletRanges.push({ startIndex: paragraphStart, endIndex: paragraphEnd });
			}

			cursor = paragraphEnd;
		}

		for (const range of bulletRanges) {
			requests.push({
				createParagraphBullets: { range, bulletPreset: 'BULLET_DISC_CIRCLE_SQUARE' },
			});
		}

		return requests;
	},

	// Maps a Google API (Gaxios) error to a concise, agent-readable message.
	formatError: (error: any, action: string): string => {
		const status = error?.response?.status ?? error?.code;
		const apiMessage = error?.response?.data?.error?.message ?? error?.message;
		const suffix = apiMessage ? ` ${apiMessage}` : '';
		if (status === 400) return `Invalid request trying to ${action} the document (400) — often a bad index or range.${suffix}`;
		if (status === 403) return `Permission denied trying to ${action} the document (403) — check the connection has access.${suffix}`;
		if (status === 404) return `Document not found trying to ${action} (404) — verify the document ID.${suffix}`;
		if (status === 429) return `Rate limit exceeded trying to ${action} the document (429) — retry later.${suffix}`;
		return `Failed to ${action} the document${status ? ` (${status})` : ''}:${suffix || ' unknown error'}`;
	},
};
