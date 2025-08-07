export interface OneNotePage {
  id?: string;
  title: string;
  contentUrl: string;
  lastModifiedDateTime: string;
  createdByAppId: string;
  links: {
    oneNoteClientUrl: {
      href: string;
    };
    oneNoteWebUrl: {
      href: string;
    };
  };
}

export interface OneNoteSection {
  id: string;
  displayName: string;
  createdBy: {
    user: {
      id: string;
      displayName: string;
    };
  };
  lastModifiedBy: {
    user: {
      id: string;
      displayName: string;
    };
  };
  lastModifiedDateTime: string;
  createdDateTime: string;
  pagesUrl: string;
}

export interface OneNoteNotebook {
  id: string;
  displayName: string;
  createdBy: {
    user: {
      id: string;
      displayName: string;
    };
  };
  lastModifiedBy: {
    user: {
      id: string;
      displayName: string;
    };
  };
  lastModifiedDateTime: string;
  createdDateTime: string;
  sectionsUrl: string;
}

export interface CreatePageRequest {
  title?: string;
  content: string;
}

export interface CreateSectionRequest {
  displayName: string;
}

export interface CreateNotebookRequest {
  displayName: string;
}

export interface ListSectionsResponse {
  value: OneNoteSection[];
}

export interface ListNotebooksResponse {
  value: OneNoteNotebook[];
}

export interface ListPagesResponse {
  value: OneNotePage[];
} 