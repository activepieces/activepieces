import { greet } from 'hello-world-npm'

export const code = async (params) => {
    return { message: greet(params.name) }
}
