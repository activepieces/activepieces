import { Static } from '@sinclair/typebox';
export declare const SignUpRequest: import("@sinclair/typebox").TObject<{
    email: import("@sinclair/typebox").TString;
    password: import("@sinclair/typebox").TString;
    firstName: import("@sinclair/typebox").TString;
    lastName: import("@sinclair/typebox").TString;
    trackEvents: import("@sinclair/typebox").TBoolean;
    newsLetter: import("@sinclair/typebox").TBoolean;
}>;
export type SignUpRequest = Static<typeof SignUpRequest>;
export declare const SwitchPlatformRequest: import("@sinclair/typebox").TObject<{
    platformId: import("@sinclair/typebox").TString;
}>;
export type SwitchPlatformRequest = Static<typeof SwitchPlatformRequest>;
export declare const SwitchProjectRequest: import("@sinclair/typebox").TObject<{
    projectId: import("@sinclair/typebox").TString;
}>;
export type SwitchProjectRequest = Static<typeof SwitchProjectRequest>;
