import { Static, Type } from '@sinclair/typebox'

export const SampleDataSettingsObject = Type.Object(
    {
        currentSelectedData: Type.Optional(Type.Unknown()),
        customizedInputs: Type.Optional(Type.Record(Type.String(), Type.Unknown())),
        lastTestDate: Type.Optional(Type.String()),
    },
    {
        additionalProperties: true,
    },
)

export type SampleDataSettings = Static<typeof SampleDataSettingsObject>

export const DEFAULT_SAMPLE_DATA_SETTINGS: SampleDataSettings = {
    currentSelectedData: undefined,
    customizedInputs: undefined,
    lastTestDate: undefined,
}