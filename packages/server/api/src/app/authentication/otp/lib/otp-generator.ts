import { randomInt, randomUUID } from 'node:crypto'
import { OtpType } from '@activepieces/shared'

export const otpGenerator = {
    generate({ type }: GenerateParams): string {
        if (type !== OtpType.EMAIL_LOGIN) {
            return randomUUID()
        }
        const upperBound = 10 ** LOGIN_CODE_LENGTH
        return randomInt(0, upperBound).toString().padStart(LOGIN_CODE_LENGTH, '0')
    },
}

const LOGIN_CODE_LENGTH = 6

type GenerateParams = {
    type: OtpType
}
