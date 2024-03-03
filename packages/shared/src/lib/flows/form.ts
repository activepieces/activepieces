import { Static, Type } from '@sinclair/typebox'

export enum FormInputType {
    TEXT = 'text',
    FILE = 'file',
    TEXT_AREA = 'text_area',
    TOGGLE = 'toggle',
}

export const FormInput = Type.Object({
    displayName: Type.String(),
    required: Type.Boolean(),
    description: Type.String(),
    type: Type.Enum(FormInputType),
})

export type FormInput = Static<typeof FormInput>


export const FormProps = Type.Object({
    inputs: Type.Array(FormInput),
    waitForResponse: Type.Boolean(),
})

export type FormProps = Static<typeof FormProps>

export const FormResponse = Type.Object({
    id: Type.String(),
    title: Type.String(),
    props: FormProps,
    projectId: Type.String(),
})

export type FormResponse = Static<typeof FormResponse>