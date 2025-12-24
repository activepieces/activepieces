import { Static } from '@sinclair/typebox';
export declare const ApId: import("@sinclair/typebox").TString;
export type ApId = Static<typeof ApId>;
export declare const apId: (size?: number) => string;
export declare const secureApId: (length: number) => string;
