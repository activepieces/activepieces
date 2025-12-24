import { Static } from '@sinclair/typebox';
import { ProjectReleaseType } from './project-release.request';
export declare const ProjectRelease: import("@sinclair/typebox").TObject<{
    projectId: import("@sinclair/typebox").TString;
    name: import("@sinclair/typebox").TString;
    description: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<string>>;
    importedBy: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<string>>;
    fileId: import("@sinclair/typebox").TString;
    type: import("@sinclair/typebox").TEnum<typeof ProjectReleaseType>;
    importedByUser: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
        id: import("@sinclair/typebox").TString;
        email: import("@sinclair/typebox").TString;
        firstName: import("@sinclair/typebox").TString;
        status: import("@sinclair/typebox").TEnum<typeof import("../user").UserStatus>;
        externalId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<string>>;
        platformId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<string>>;
        platformRole: import("@sinclair/typebox").TEnum<typeof import("../user").PlatformRole>;
        lastName: import("@sinclair/typebox").TString;
        created: import("@sinclair/typebox").TString;
        updated: import("@sinclair/typebox").TString;
        lastActiveDate: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<string>>;
    }>>;
    id: import("@sinclair/typebox").TString;
    created: import("@sinclair/typebox").TString;
    updated: import("@sinclair/typebox").TString;
}>;
export type ProjectRelease = Static<typeof ProjectRelease>;
