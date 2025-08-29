import { z, ZodError, ZodIssue } from 'zod';

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
            if (error instanceof ZodError) {
                const errors: Record<string, string> = error.issues.reduce((acc: Record<string, string>, err: ZodIssue) => {
                    const path = err.path.join('.');
                    acc[path] = err.message;
                    return acc;
                }, {} as Record<string, string>);
                throw new Error(JSON.stringify({ errors }, null, 2));
            }
            throw error
        }
    }
}