import { randomUUID } from 'node:crypto'

export const otpGenerator = {
    generate(): string {
        return randomUUID()
    },
}
