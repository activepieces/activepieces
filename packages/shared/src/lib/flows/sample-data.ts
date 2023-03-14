import { Type, Static } from '@sinclair/typebox';
export const SampleDataSettingsObject =Type.Object({
    historicalData:Type.Array(Type.Object({
      payload:Type.Unknown(),
      created:Type.String()
    })),
    currentSelectedData:Type.Unknown(),
  });
  export type SampleDataSettings = Static<typeof SampleDataSettingsObject>;