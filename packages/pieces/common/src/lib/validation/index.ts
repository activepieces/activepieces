import * as z from "zod/mini"

export const propsValidation = {
    async validateZod<T extends Record<string, unknown>>(props: T, schema: Partial<Record<keyof T, z.core.$ZodType>>): Promise<void> {
        const schemaObj = z.object(
            Object.entries(schema).reduce((acc, [key, value]) => ({
                ...acc,
                [key]: value
            }), {})
        )

        const result = await z.safeParseAsync(schemaObj, props)
        if (!result.success) {
            const errors = result.error.issues.reduce<Record<string, string>>((acc, issue) => ({
                ...acc,
                [issue.path.join('.')]: issue.message
            }), {})
            throw new Error(JSON.stringify({ errors }, null, 2))
        }
    }
}
