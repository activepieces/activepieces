import { OAuth2PropertyValue } from '@activepieces/pieces-framework';

const textBodyHeaders: Record<string, string> = {
	Prefer: 'outlook.body-content-type="text"',
};

const messageSelect =
	'id,subject,bodyPreview,from,sender,toRecipients,ccRecipients,bccRecipients,replyTo,receivedDateTime,sentDateTime,createdDateTime,lastModifiedDateTime,hasAttachments,isRead,isDraft,importance,categories,flag,webLink,parentFolderId,conversationId,internetMessageId';

const mailFolderSelect =
	'id,displayName,parentFolderId,childFolderCount,unreadItemCount,totalItemCount,isHidden';

const attachmentSelect = 'id,name,contentType,size,isInline,lastModifiedDateTime';

const wellKnownFolderHint =
	'Accepts a mail folder ID or a well-known name such as inbox, drafts, sentitems, deleteditems, archive or junkemail.';

const messageIdHint =
	'Outlook message ID. Resolve one with List Messages, Search Messages or Get Message.';

function getConfiguredMailbox(auth: OAuth2PropertyValue): string {
	return ((auth.props?.['mailbox'] as string | undefined) ?? '').trim();
}

function isAppOnlyConnection(auth: OAuth2PropertyValue): boolean {
	return getConfiguredMailbox(auth).length > 0;
}

function encodeGraphId(id: string): string {
	return encodeURIComponent(id.trim());
}

function isGovernmentCloud(auth: OAuth2PropertyValue): boolean {
	return ((auth.props?.['cloud'] as string | undefined) ?? '').includes('.us');
}

function graphStatusCode(error: unknown): number | undefined {
	if (typeof error === 'object' && error !== null && 'statusCode' in error) {
		const statusCode = (error as { statusCode?: unknown }).statusCode;
		if (typeof statusCode === 'number') {
			return statusCode;
		}
	}
	return undefined;
}

function graphErrorCode(error: unknown): string | undefined {
	if (typeof error === 'object' && error !== null && 'code' in error) {
		const code = (error as { code?: unknown }).code;
		if (typeof code === 'string') {
			return code;
		}
	}
	return undefined;
}

function isUnsupportedMePathError(error: unknown): boolean {
	const code = graphErrorCode(error) ?? '';
	const unsupportedCodes = [
		'BadRequest',
		'RequestBroker--ParseUri',
		'ResourceNotFound',
		'ErrorInvalidUser',
		'MailboxNotEnabledForRESTAPI',
	];
	return unsupportedCodes.some((candidate) => code === candidate);
}

function withDeltaRemoval<T extends object>(
	change: T & { '@removed'?: { reason?: string } },
): Omit<T, '@removed'> & { removed: boolean; removedReason: string | null } {
	const { '@removed': removal, ...rest } = change;
	return {
		...rest,
		removed: removal !== undefined,
		removedReason: removal?.reason ?? null,
	};
}

function graphErrorDetail(error: unknown): string {
	if (typeof error === 'object' && error !== null) {
		const parts: string[] = [];
		const candidate = error as { code?: unknown; message?: unknown; body?: unknown };
		if (candidate.code) {
			parts.push(String(candidate.code));
		}
		if (candidate.message) {
			parts.push(String(candidate.message));
		}
		if (candidate.body) {
			const body = candidate.body;
			parts.push(typeof body === 'string' ? body.slice(0, 500) : JSON.stringify(body).slice(0, 500));
		}
		if (parts.length > 0) {
			return parts.join(' | ');
		}
	}
	if (error instanceof Error && error.message) {
		return error.message;
	}
	return 'No further detail was returned by Microsoft Graph.';
}

function graphError({ error, operation }: { error: unknown; operation: string }): Error {
	const status = graphStatusCode(error);
	const detail = graphErrorDetail(error);
	if (status === 401) {
		return new Error(
			`${operation} failed: the Outlook connection is not authenticated (HTTP 401). Reconnect the account. ${detail}`,
		);
	}
	if (status === 403) {
		return new Error(
			`${operation} failed: Microsoft Graph denied the request (HTTP 403). The connection may lack the permission this endpoint requires, or the mailbox may not be accessible in this access mode. ${detail}`,
		);
	}
	if (status === 404) {
		return new Error(
			`${operation} failed: the requested item was not found (HTTP 404). The ID may be wrong, or the item may have been moved or deleted. ${detail}`,
		);
	}
	if (status === 429) {
		return new Error(
			`${operation} failed: Microsoft Graph throttled the request (HTTP 429). Retry after a short delay. ${detail}`,
		);
	}
	return new Error(`${operation} failed. ${detail}`);
}

export const outlookAtomicCommon = {
	textBodyHeaders,
	messageSelect,
	mailFolderSelect,
	attachmentSelect,
	wellKnownFolderHint,
	messageIdHint,
	getConfiguredMailbox,
	isAppOnlyConnection,
	isGovernmentCloud,
	encodeGraphId,
	graphStatusCode,
	graphErrorCode,
	graphErrorDetail,
	isUnsupportedMePathError,
	withDeltaRemoval,
	graphError,
};
