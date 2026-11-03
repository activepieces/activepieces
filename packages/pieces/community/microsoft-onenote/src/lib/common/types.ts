import type { AppConnectionType } from '@activepieces/pieces-framework';

export type {
  CopyNotebookModel,
  Notebook,
  OnenoteOperation,
  OnenotePage,
  OnenotePagePreview,
  OnenoteSection,
  RecentNotebook,
  SectionGroup,
} from '@microsoft/microsoft-graph-types';

export type MicrosoftOneNoteAuthValue = {
  type:
    | AppConnectionType.OAUTH2
    | AppConnectionType.CLOUD_OAUTH2
    | AppConnectionType.PLATFORM_OAUTH2;
  access_token: string;
  props?: { cloud?: string | null };
};

export type MicrosoftOneNoteList<T> = {
  value: T[];
  '@odata.nextLink'?: string;
};
