import { Type, Static } from '@sinclair/typebox';
export const SampleDataSettingsObject =Type.Object({
    currentSelectedData:Type.Unknown(),
  });
  export type SampleDataSettings = Static<typeof SampleDataSettingsObject>;