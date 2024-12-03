import { z } from "zod"

export const propsValidation = {
    async validateZod<T extends Record<string, unknown>>(props: T, schema: Partial<Record<keyof T, z.ZodType>>): Promise<void> {
        const schemaObj = z.object(
            Object.entries(schema).reduce((acc, [key, value]) => ({
                ...acc,
                [key]: value
            }), {})
        )

        try {
            await schemaObj.parseAsync(props)
        } catch (error) {
            if (error instanceof z.ZodError) {
                const errors = error.errors.reduce((acc, err) => {
                    const path = err.path.join('.')
                    return {
                        ...acc,
                        [path]: err.message
                    }
                }, {})
                throw new Error(JSON.stringify({ errors }, null, 2))
            }
            throw error
        }
    }
}