import { createAction, Property } from '@activepieces/pieces-framework';
import { drive as googleDrive } from '@googleapis/drive';
import { createGoogleClient, googleSlidesAuth } from '../auth';
import { slidesApi } from '../commons/common';
import { slidesIds } from '../commons/ids';
import { slidesProps } from '../commons/props';
import { slidesRequests } from '../commons/requests';
import { findPresentationsOutputSchema } from '../output-schemas';

const MAX_LIMIT = 1000;

export const findPresentations = createAction({
  auth: googleSlidesAuth,
  name: 'find_presentations',
  classification: 'SEARCH',
  displayName: 'Find Presentations',
  description: 'Search Google Drive for presentations by name and/or folder.',
  audience: 'both',
  aiMetadata: {
    description:
      'Search Google Drive for Google Slides presentations whose name contains some text and/or that sit in a given folder, most recently modified first. Use it to turn a deck name into a presentation ID before calling the other Slides actions. Returns at most Limit results; when hasMore is true pass nextPageToken as Page Token to continue. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: findPresentationsOutputSchema,
  props: {
    name_contains: Property.ShortText({
      displayName: 'Name Contains',
      description: 'Return presentations whose name contains this text (case-insensitive). Leave empty to list all.',
      required: false,
    }),
    folder_id: slidesProps.folderIdProp(
      'Only presentations directly in this Drive folder: its ID or URL (https://drive.google.com/drive/folders/<id>). Leave empty to search all of Drive.'
    ),
    limit: Property.Number({
      displayName: 'Limit',
      description: `Maximum number of presentations to return (1-${MAX_LIMIT}). Default 50.`,
      required: false,
      defaultValue: 50,
    }),
    page_token: Property.ShortText({
      displayName: 'Page Token',
      description: 'The nextPageToken of a previous call, to get the next results. Leave empty for the first page.',
      required: false,
    }),
  },
  async run(context) {
    const nameContains = context.propsValue.name_contains?.trim() || undefined;
    const folderId = slidesIds.parseFolderId(context.propsValue.folder_id);
    const rawLimit = context.propsValue.limit ?? 50;
    const limit = Number(rawLimit);
    if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) {
      throw new Error(`Limit must be a whole number between 1 and ${MAX_LIMIT}, got "${String(rawLimit)}".`);
    }
    const drive = googleDrive({ version: 'v3', auth: await createGoogleClient(context.auth) });
    const q = slidesRequests.buildFindQuery({ nameContains, folderId });

    const presentations: PresentationListItem[] = [];
    let pageToken: string | undefined = context.propsValue.page_token?.trim() || undefined;
    do {
      const response = await drive.files
        .list({
          q,
          pageSize: limit - presentations.length,
          pageToken,
          orderBy: 'modifiedTime desc',
          supportsAllDrives: true,
          includeItemsFromAllDrives: true,
          corpora: 'allDrives',
          fields:
            'nextPageToken, files(id, name, webViewLink, createdTime, modifiedTime, owners(displayName, emailAddress), parents)',
        })
        .catch((error: unknown) => {
          throw slidesApi.googleApiError({ error, action: 'search for presentations' });
        });
      presentations.push(
        ...(response.data.files ?? []).map((file) => ({
          id: file.id ?? null,
          name: file.name ?? null,
          webViewLink: file.webViewLink ?? null,
          createdTime: file.createdTime ?? null,
          modifiedTime: file.modifiedTime ?? null,
          ownerName: file.owners?.[0]?.displayName ?? null,
          ownerEmail: file.owners?.[0]?.emailAddress ?? null,
          folderId: file.parents?.[0] ?? null,
        }))
      );
      pageToken = response.data.nextPageToken ?? undefined;
    } while (pageToken && presentations.length < limit);

    return {
      presentations,
      count: presentations.length,
      hasMore: pageToken !== undefined,
      nextPageToken: pageToken ?? null,
    };
  },
});


type PresentationListItem = {
  id: string | null;
  name: string | null;
  webViewLink: string | null;
  createdTime: string | null;
  modifiedTime: string | null;
  ownerName: string | null;
  ownerEmail: string | null;
  folderId: string | null;
};
