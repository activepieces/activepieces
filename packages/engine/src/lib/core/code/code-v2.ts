
import { PropertyType } from '@activepieces/pieces-framework'
import { z } from 'zod'

const baseProps = {
    displayName: z.string(),
    description: z.string(),
    required: z.boolean(),
}
const ShortTextSchema = z.object({
    type: z.literal(PropertyType.SHORT_TEXT),
    ...baseProps,
})
type ShortTextSchema = z.infer<typeof ShortTextSchema>

const LongTextSchema = z.object({
    type: z.literal(PropertyType.LONG_TEXT),
    ...baseProps,
})
type LongTextSchema = z.infer<typeof LongTextSchema>

type CodeV2Properties = {
    [key: string]: ShortTextSchema | LongTextSchema
}

type CodeV2PropertyValueSchema<T> =
    T extends { type: PropertyType.SHORT_TEXT }
    ? string
    : T extends { type: PropertyType.LONG_TEXT }
    ? string
    : never

type CodeV2PropertyValues<T extends Record<string, unknown>> = {
    [P in keyof T]: T[P] extends { required: true }
    ? CodeV2PropertyValueSchema<T[P]>
    : CodeV2PropertyValueSchema<T[P]> | undefined;
}

export type CodeV2Context<T extends CodeV2Properties = CodeV2Properties> = {
    inputs: CodeV2PropertyValues<T>
}

export type CodeV2Module<T extends CodeV2Properties = CodeV2Properties> = {
    code: {
        displayName: string
        description: string
        props: T
        run: (context: CodeV2Context<T>) => Promise<unknown>
    }
}
