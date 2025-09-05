import { createAction, Property } from '@activepieces/pieces-framework';
import { Client, PageCollection } from '@microsoft/microsoft-graph-client';
import { Message } from '@microsoft/microsoft-graph-types';
import { microsoftOutlookAuth } from '../common/auth';

export const findEmailAction = createAction({
	auth: microsoftOutlookAuth,
	name: 'find-email',
	displayName: 'Find Email',
	description: 'Search for emails in Microsoft Outlook using advanced search criteria and filters.',
	props: {
		searchQuery: Property.LongText({
			displayName: 'Search Query',
			description: 'Full-text search query to find emails. Searches across subject, body, and sender (e.g., "project meeting")',
			required: false,
		}),
		fromEmail: Property.ShortText({
			displayName: 'From Email',
			description: 'Search for emails from a specific sender (e.g., "user@company.com")',
			required: false,
		}),
		toEmail: Property.ShortText({
			displayName: 'To Email',
			description: 'Search for emails sent to a specific recipient (e.g., "recipient@company.com")',
			required: false,
		}),
		subject: Property.ShortText({
			displayName: 'Subject Contains',
			description: 'Search for emails with subject containing this text (e.g., "quarterly report")',
			required: false,
		}),
		bodyContains: Property.ShortText({
			displayName: 'Body Contains',
			description: 'Search for emails with body containing this text',
			required: false,
		}),
		hasAttachments: Property.Checkbox({
			displayName: 'Has Attachments',
			description: 'Filter emails that have file attachments',
			required: false,
			defaultValue: false,
		}),
		isRead: Property.StaticDropdown({
			displayName: 'Read Status',
			description: 'Filter by read/unread status',
			required: false,
			defaultValue: 'all',
			options: {
				disabled: false,
				options: [
					{ label: 'All', value: 'all' },
					{ label: 'Read', value: 'true' },
					{ label: 'Unread', value: 'false' },
				],
			},
		}),
		importance: Property.StaticDropdown({
			displayName: 'Importance',
			description: 'Filter by email importance level',
			required: false,
			defaultValue: 'all',
			options: {
				disabled: false,
				options: [
					{ label: 'All', value: 'all' },
					{ label: 'Low', value: 'low' },
					{ label: 'Normal', value: 'normal' },
					{ label: 'High', value: 'high' },
				],
			},
		}),
		categories: Property.Array({
			displayName: 'Categories',
			description: 'Search for emails with specific categories/labels (e.g., ["Important", "Follow up"])',
			required: false,
			defaultValue: [],
		}),
		folderId: Property.ShortText({
			displayName: 'Folder ID',
			description: 'Search within a specific folder. Use "inbox", "sentitems", "drafts", "deleteditems" for well-known folders, or provide a specific folder ID. Leave empty to search all folders.',
			required: false,
			defaultValue: 'inbox',
		}),
		dateFrom: Property.DateTime({
			displayName: 'Date From',
			description: 'Search for emails received after this date',
			required: false,
		}),
		dateTo: Property.DateTime({
			displayName: 'Date To',
			description: 'Search for emails received before this date',
			required: false,
		}),
		isDraft: Property.StaticDropdown({
			displayName: 'Draft Status',
			description: 'Filter by draft status',
			required: false,
			defaultValue: 'all',
			options: {
				disabled: false,
				options: [
					{ label: 'All', value: 'all' },
					{ label: 'Draft', value: 'true' },
					{ label: 'Not Draft', value: 'false' },
				],
			},
		}),
		ccEmail: Property.ShortText({
			displayName: 'CC Email',
			description: 'Search for emails that have a specific email in CC',
			required: false,
		}),
		bccEmail: Property.ShortText({
			displayName: 'BCC Email',
			description: 'Search for emails that have a specific email in BCC',
			required: false,
		}),
		maxResults: Property.Number({
			displayName: 'Max Results',
			description: 'Maximum number of emails to return (1-1000)',
			required: false,
			defaultValue: 50,
		}),
	},
	async run(context) {
		const { 
			searchQuery, 
			fromEmail, 
			toEmail,
			ccEmail,
			bccEmail,
			subject, 
			bodyContains,
			hasAttachments, 
			isRead, 
			isDraft,
			importance,
			categories,
			folderId, 
			dateFrom,
			dateTo,
			maxResults 
		} = context.propsValue;

		if (maxResults && (maxResults < 1 || maxResults > 1000)) {
			throw new Error('Max Results must be between 1 and 1000.');
		}

		const client = Client.initWithMiddleware({
			authProvider: {
				getAccessToken: () => Promise.resolve(context.auth.access_token),
			},
		});

		try {
			const filters = [];
			
			if (fromEmail) {
				filters.push(`from/emailAddress/address eq '${fromEmail.trim()}'`);
			}
			
			if (toEmail) {
				filters.push(`toRecipients/any(t: t/emailAddress/address eq '${toEmail.trim()}')`);
			}
			
			if (ccEmail) {
				filters.push(`ccRecipients/any(c: c/emailAddress/address eq '${ccEmail.trim()}')`);
			}
			
			if (bccEmail) {
				filters.push(`bccRecipients/any(b: b/emailAddress/address eq '${bccEmail.trim()}')`);
			}
			
			if (subject) {
				filters.push(`contains(subject,'${subject.replace(/'/g, "''")}')`);
			}
			
			if (bodyContains) {
				filters.push(`contains(body/content,'${bodyContains.replace(/'/g, "''")}')`);
			}
			
			if (hasAttachments) {
				filters.push('hasAttachments eq true');
			}
			
			if (isRead && isRead !== 'all') {
				filters.push(`isRead eq ${isRead}`);
			}

			if (isDraft && isDraft !== 'all') {
				filters.push(`isDraft eq ${isDraft}`);
			}

			if (importance && importance !== 'all') {
				filters.push(`importance eq '${importance}'`);
			}

			if (categories && categories.length > 0) {
				const categoryFilters = (categories as string[]).map(cat => `categories/any(c: c eq '${cat.replace(/'/g, "''")}')`);
				filters.push(`(${categoryFilters.join(' or ')})`);
			}

			if (dateFrom) {
				filters.push(`receivedDateTime ge ${new Date(dateFrom).toISOString()}`);
			}

			if (dateTo) {
				filters.push(`receivedDateTime le ${new Date(dateTo).toISOString()}`);
			}

			const queryParams = [];
			
			if (filters.length > 0) {
				queryParams.push(`$filter=${encodeURIComponent(filters.join(' and '))}`);
			}
			
			if (searchQuery) {
				queryParams.push(`$search="${encodeURIComponent(searchQuery.trim())}"`);
			}
			
			queryParams.push(`$top=${maxResults || 50}`);
			queryParams.push('$orderby=receivedDateTime desc');
			queryParams.push('$select=id,subject,from,toRecipients,ccRecipients,bccRecipients,receivedDateTime,sentDateTime,hasAttachments,isRead,isDraft,importance,categories,bodyPreview,webLink,parentFolderId');

			let folderPath = '/me/messages';
			if (folderId && folderId.trim() !== '') {
				const wellKnownFolders = ['inbox', 'sentitems', 'drafts', 'deleteditems', 'outbox', 'junkemail'];
				if (wellKnownFolders.includes(folderId.toLowerCase())) {
					folderPath = `/me/mailFolders/${folderId}/messages`;
				} else {
					folderPath = `/me/mailFolders/${folderId}/messages`;
				}
			}

			const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
			const apiUrl = `${folderPath}${queryString}`;

			const response: PageCollection = await client.api(apiUrl).get();
			const emails = response.value as Message[];
			return {
				success: true,
				message: `Found ${emails.length} email(s) matching the search criteria.`,
				totalResults: emails.length,
				hasMoreResults: !!response['@odata.nextLink'],
				nextLink: response['@odata.nextLink'] || null,
				emails: emails.map(email => ({
					id: email.id,
					subject: email.subject,
					from: email.from,
					toRecipients: email.toRecipients,
					ccRecipients: email.ccRecipients,
					bccRecipients: email.bccRecipients,
					receivedDateTime: email.receivedDateTime,
					sentDateTime: email.sentDateTime,
					hasAttachments: email.hasAttachments,
					isRead: email.isRead,
					isDraft: email.isDraft,
					importance: email.importance,
					categories: email.categories,
					bodyPreview: email.bodyPreview,
					webLink: email.webLink,
					parentFolderId: email.parentFolderId,
				})),
				searchCriteria: {
					searchQuery,
					fromEmail,
					toEmail,
					ccEmail,
					bccEmail,
					subject,
					bodyContains,
					hasAttachments,
					isRead,
					isDraft,
					importance,
					categories,
					folderId,
					dateFrom,
					dateTo,
					maxResults,
				},
				queryUsed: apiUrl,
			};
		} catch (error: any) {
			console.error('Find Email Error:', error);
			
			if (error.status === 400) {
				throw new Error('Invalid search query or filter parameters. Please check your search criteria.');
			} else if (error.status === 401) {
				throw new Error('Authentication failed. Please check your Microsoft Outlook connection.');
			} else if (error.status === 403) {
				throw new Error('Access denied. Please ensure you have permission to read emails in the specified folder.');
			} else if (error.status === 404) {
				throw new Error('Folder not found. Please verify the folder ID or use a valid folder name.');
			} else if (error.status === 429) {
				throw new Error('Rate limit exceeded. Please wait a moment and try again.');
			} else if (error.status === 500) {
				throw new Error('Microsoft Graph service error. Please try again later.');
			}

			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			throw new Error(`Failed to search emails: ${errorMessage}`);
		}
	},
});
