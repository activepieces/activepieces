/* eslint-disable @typescript-eslint/no-explicit-any */
import { Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient, AuthenticationType } from '@activepieces/pieces-common';
import { docs_v1, drive_v3 } from 'googleapis';

export const docsCommon = {
	baseUrl: 'https://docs.googleapis.com/v1',
	title: Property.ShortText({
		displayName: 'Document Title',
		required: true,
	}),
	body: Property.LongText({
		displayName: 'Document Content',
		description: 'Plain text content to insert into the new document.',
		required: true,
	}),

	createDocument: async (title: string, accessToken: string) => {
		const createRequest = await httpClient.sendRequest({
			url: `${docsCommon.baseUrl}/documents`,
			method: HttpMethod.POST,
			authentication: {
				type: AuthenticationType.BEARER_TOKEN,
				token: accessToken,
			},
			body: { title },
		});

		return createRequest.body;
	},

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
};

export const buildDocUrl = (documentId: string | null | undefined): string =>
	documentId ? `https://docs.google.com/document/d/${documentId}/edit` : '';

export const extractPlainText = (document: docs_v1.Schema$Document | undefined | null): string => {
	if (!document?.body?.content) return '';
	const parts: string[] = [];
	for (const element of document.body.content) {
		if (element.paragraph?.elements) {
			for (const inline of element.paragraph.elements) {
				if (inline.textRun?.content) {
					parts.push(inline.textRun.content);
				}
			}
		}
		if (element.table?.tableRows) {
			for (const row of element.table.tableRows) {
				for (const cell of row.tableCells ?? []) {
					for (const cellContent of cell.content ?? []) {
						for (const inline of cellContent.paragraph?.elements ?? []) {
							if (inline.textRun?.content) {
								parts.push(inline.textRun.content);
							}
						}
					}
				}
			}
		}
	}
	return parts.join('');
};

export const flattenDoc = (document: docs_v1.Schema$Document) => ({
	id: document.documentId,
	title: document.title,
	url: document.documentId ? buildDocUrl(document.documentId) : undefined,
	revisionId: document.revisionId,
	plainText: extractPlainText(document),
	raw: document,
});

export const flattenDriveFile = (file: drive_v3.Schema$File) => ({
	id: file.id,
	name: file.name,
	url: file.id ? buildDocUrl(file.id) : file.webViewLink,
	webViewLink: file.webViewLink,
	mimeType: file.mimeType,
	createdTime: file.createdTime,
	modifiedTime: file.modifiedTime,
	parents: file.parents,
	owners: file.owners,
	raw: file,
});

export const moveFileToFolder = async ({
	drive,
	fileId,
	folderId,
}: {
	drive: drive_v3.Drive;
	fileId: string;
	folderId: string;
}): Promise<void> => {
	const fileData = await drive.files.get({
		fileId,
		supportsAllDrives: true,
		fields: 'id, parents',
	});
	await drive.files.update({
		fileId,
		fields: 'id, name, parents',
		removeParents: fileData.data.parents?.join(','),
		addParents: folderId,
		supportsAllDrives: true,
	});
};

export const findTextLocation = ({
	document,
	searchText,
	mode,
	matchCase = false,
}: {
	document: docs_v1.Schema$Document;
	searchText: string;
	mode: 'before' | 'after';
	matchCase?: boolean;
}): number => {
	const runs: Array<{ text: string; startIndex: number }> = [];
	const walk = (content: docs_v1.Schema$StructuralElement[] | undefined | null): void => {
		if (!content) return;
		for (const element of content) {
			if (element.paragraph?.elements) {
				for (const inline of element.paragraph.elements) {
					if (inline.textRun?.content && typeof inline.startIndex === 'number') {
						runs.push({ text: inline.textRun.content, startIndex: inline.startIndex });
					}
				}
			}
			if (element.table?.tableRows) {
				for (const row of element.table.tableRows) {
					for (const cell of row.tableCells ?? []) {
						walk(cell.content);
					}
				}
			}
		}
	};
	walk(document.body?.content);

	let concat = '';
	const docIndex: number[] = [];
	for (const run of runs) {
		for (let i = 0; i < run.text.length; i++) {
			concat += run.text[i];
			docIndex.push(run.startIndex + i);
		}
	}

	const needle = matchCase ? searchText : searchText.toLowerCase();
	const haystack = matchCase ? concat : concat.toLowerCase();
	const matchAt = haystack.indexOf(needle);
	if (matchAt === -1) {
		throw new Error(`Could not find the anchor text "${searchText}" in the document.`);
	}
	if (mode === 'before') {
		return docIndex[matchAt];
	}
	return docIndex[matchAt + needle.length - 1] + 1;
};
