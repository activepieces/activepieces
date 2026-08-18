import { isNil } from '@activepieces/core-utils'

const MAX_NAME_PART_LENGTH = 50
const FALLBACK_FIRST_NAME = 'there'
const PLATFORM_NAME_NOUN = 'Platform'
const FALLBACK_PLATFORM_NAME = 'My Platform'
const SAFE_STRING_CHARS = /[./]/g

function localPartTokens(email: string): string[] {
    const at = email.indexOf('@')
    const localPart = at >= 0 ? email.slice(0, at) : email
    return localPart
        .split(/[._+-]+/)
        .map((token) => token.replace(/[^a-zA-Z0-9]/g, ''))
        .filter((token) => token.length > 0)
        .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
}

function firstNameFromEmail(email: string): string {
    const [first] = localPartTokens(email)
    return first ?? FALLBACK_FIRST_NAME
}

function platformNameFromPerson({ firstName, email }: PlatformNameFromPersonParams): string {
    const [given] = firstName.replace(SAFE_STRING_CHARS, '').trim().split(/\s+/)
    if (isNil(given) || given.length === 0) {
        const [fromEmail] = localPartTokens(email)
        return isNil(fromEmail) ? FALLBACK_PLATFORM_NAME : platformNameFor(fromEmail)
    }
    return platformNameFor(given)
}

function platformNameFor(name: string): string {
    return `${possessive(name.slice(0, MAX_NAME_PART_LENGTH))} ${PLATFORM_NAME_NOUN}`
}

function possessive(name: string): string {
    return /['’]s$/.test(name) ? name : `${name}'s`
}

function splitFullName({ fullName, email }: SplitFullNameParams): SplitName {
    const tokens = fullName
        .split(/\s+/)
        .map((token) => token.replace(SAFE_STRING_CHARS, ''))
        .filter((token) => token.length > 0)
    const [first, ...rest] = tokens
    if (isNil(first)) {
        return { firstName: firstNameFromEmail(email), lastName: '' }
    }
    return {
        firstName: first.slice(0, MAX_NAME_PART_LENGTH),
        lastName: rest.join(' ').slice(0, MAX_NAME_PART_LENGTH),
    }
}

export const signupNames = {
    firstNameFromEmail,
    platformNameFromPerson,
    splitFullName,
}

type PlatformNameFromPersonParams = {
    firstName: string
    email: string
}

type SplitFullNameParams = {
    fullName: string
    email: string
}

type SplitName = {
    firstName: string
    lastName: string
}
