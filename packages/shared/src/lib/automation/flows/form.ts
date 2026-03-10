import { z } from 'zod'

export enum FormInputType {
    TEXT = 'text',
    FILE = 'file',
    TEXT_AREA = 'text_area',
    TOGGLE = 'toggle',
}

export const FormInput = z.object({
    displayName: z.string(),
    required: z.boolean(),
    description: z.string(),
    type: z.nativeEnum(FormInputType),
})

export type FormInput = z.infer<typeof FormInput>


export const FormProps = z.object({
    inputs: z.array(FormInput),
    waitForResponse: z.boolean(),
})

export type FormProps = z.infer<typeof FormProps>

export const FormResponse = z.object({
    id: z.string(),
    title: z.string(),
    props: FormProps,
    projectId: z.string(),
    version: z.string(),
})

export type FormResponse = z.infer<typeof FormResponse>

export const ChatUIProps = z.object({
    botName: z.string(),
})

export type ChatUIProps = z.infer<typeof ChatUIProps>

export const ChatUIResponse = z.object({
    id: z.string(),
    title: z.string(),
    props: ChatUIProps,
    projectId: z.string(),
    platformLogoUrl: z.string(),
    platformName: z.string(),
})

export type ChatUIResponse = z.infer<typeof ChatUIResponse>

export const USE_DRAFT_QUERY_PARAM_NAME = 'useDraft'
