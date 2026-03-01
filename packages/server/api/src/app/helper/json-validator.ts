import { TSchema } from '@sinclair/typebox'
import { TypeCompiler } from '@sinclair/typebox/compiler'


export function parseAndVerify<F>(schema: TSchema, data: unknown): F {
    const C = TypeCompiler.Compile(schema)
    const isValid = C.Check(data)
    if (isValid) {
        return data as F
    }
    throw new Error(
        JSON.stringify(
            [...C.Errors(data)].map(({ path, message }) => ({ path, message })),
        ),
    )
}


