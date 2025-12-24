import { Static } from '@sinclair/typebox';
export type FolderId = string;
export declare const Folder: import("@sinclair/typebox").TObject<{
    id: import("@sinclair/typebox").TString;
    projectId: import("@sinclair/typebox").TString;
    displayName: import("@sinclair/typebox").TString;
    displayOrder: import("@sinclair/typebox").TNumber;
    created: import("@sinclair/typebox").TString;
    updated: import("@sinclair/typebox").TString;
}>;
export declare const UncategorizedFolderId = "NULL";
export type Folder = Static<typeof Folder>;
export type FolderDto = Folder & {
    numberOfFlows: number;
};
