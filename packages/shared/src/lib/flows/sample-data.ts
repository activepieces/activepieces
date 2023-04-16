import { Type, Static } from '@sinclair/typebox';

export const SampleDataSettingsObject = Type.Object(
  {
    currentSelectedData: Type.Optional(Type.Unknown()),
    currentTestSampleData: Type.Optional(Type.Unknown()),
    customizedInputs: Type.Optional(Type.Record(Type.String(), Type.Unknown())),
  },
  {
    additionalProperties: true
  }
)

export type SampleDataSettings = Static<typeof SampleDataSettingsObject>;
