import { Static } from '@sinclair/typebox';
import { Cursor } from '../../common/seek-page';
export declare const CreateFolderRequest: import("@sinclair/typebox").TObject<{
    displayName: import("@sinclair/typebox").TString;
    projectId: import("@sinclair/typebox").TString;
}>;
export type CreateFolderRequest = Static<typeof CreateFolderRequest>;
export declare const UpdateFolderRequest: import("@sinclair/typebox").TObject<{
    displayName: import("@sinclair/typebox").TString;
}>;
export type UpdateFolderRequest = Static<typeof UpdateFolderRequest>;
export declare const DeleteFolderRequest: import("@sinclair/typebox").TObject<{
    id: import("@sinclair/typebox").TString;
}>;
export type DeleteFlowRequest = Static<typeof DeleteFolderRequest>;
export declare const ListFolderRequest: import("@sinclair/typebox").TObject<{
    limit: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TNumber>;
    cursor: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    projectId: import("@sinclair/typebox").TString;
}>;
export type ListFolderRequest = Omit<Static<typeof ListFolderRequest>, 'cursor'> & {
    cursor: Cursor | undefined;
};
