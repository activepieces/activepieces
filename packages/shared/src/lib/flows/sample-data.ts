import { Type, Static } from '@sinclair/typebox';
export const SampleDataSettingsObject = Type.Object({
  currentSelectedData: Type.Optional(Type.Unknown()),
});
export type SampleDataSettings = Static<typeof SampleDataSettingsObject>;