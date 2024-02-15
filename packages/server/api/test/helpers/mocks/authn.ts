import { faker } from '@faker-js/faker'
import { SignInRequest, SignUpRequest } from '@activepieces/shared'

export const createMockSignUpRequest = (
    signUpRequest?: Partial<SignUpRequest>,
): SignUpRequest => {
    return {
        email: signUpRequest?.email ?? faker.internet.email(),
        password: signUpRequest?.password ?? faker.internet.password(),
        firstName: signUpRequest?.firstName ?? faker.person.firstName(),
        lastName: signUpRequest?.lastName ?? faker.person.lastName(),
        trackEvents: signUpRequest?.trackEvents ?? faker.datatype.boolean(),
        newsLetter: signUpRequest?.newsLetter ?? faker.datatype.boolean(),
        referringUserId: signUpRequest?.referringUserId,
    }
}

export const createMockSignInRequest = (
    signInRequest?: Partial<SignInRequest>,
): SignInRequest => {
    return {
        email: signInRequest?.email ?? faker.internet.email(),
        password: signInRequest?.password ?? faker.internet.password(),
    }
}
