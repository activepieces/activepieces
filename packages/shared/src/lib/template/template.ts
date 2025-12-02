import { FlowTemplate, FlowTemplateWithoutProjectInformation, TemplateCategory } from '@activepieces/ee-shared'
import { Omit, Static, Type } from '@sinclair/typebox'
import { BaseModelSchema, Metadata, Nullable } from '../common'
import { ColorName } from '../project'

export const TemplateTags = Type.Object({
    title: Type.String(),
    color: Type.Enum(ColorName),
    icon: Type.Optional(Type.String()),
})
export type TemplateTags = Static<typeof TemplateTags>

export const Template = Type.Object({
    ...BaseModelSchema,
    name: Type.String(),
    description: Type.String(),
    flowTemplateId: Nullable(Type.String()),
    tags: Type.Array(TemplateTags),
    blogUrl: Nullable(Type.String()),
    metadata: Nullable(Metadata),
    usageCount: Type.Number(),
    author: Type.String(),
    categories: Type.Array(Type.Enum(TemplateCategory)),
})
export type Template = Static<typeof Template>


export const PopulatedTemplate = Type.Composite([
    Template,
    Type.Object({
        flowTemplate: Type.Optional(FlowTemplate),
    }),
])
export type PopulatedTemplate = Static<typeof PopulatedTemplate>


export const PopulatedFlowTemplateMetadata = Type.Composite([
    Omit(Template, ['id']),
    Type.Object({
        flowTemplate: FlowTemplateWithoutProjectInformation,
    }),
])
export type PopulatedFlowTemplateMetadata = Static<typeof PopulatedFlowTemplateMetadata>