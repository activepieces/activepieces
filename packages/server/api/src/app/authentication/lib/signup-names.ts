import { isNil } from '@activepieces/core-utils'

const MAX_NAME_PART_LENGTH = 50
const FALLBACK_FIRST_NAME = 'there'
const PLATFORM_NAME_NOUN = 'Platform'
const FALLBACK_PLATFORM_NAME = 'My Platform'
const SAFE_STRING_CHARS = /[./]/g

const CONSUMER_EMAIL_BRANDS: ReadonlySet<string> = new Set([
    'gmail', 'googlemail', 'outlook', 'hotmail', 'live', 'msn',
    'yahoo', 'ymail', 'rocketmail',
    'icloud', 'me', 'mac',
    'aol', 'gmx', 'web', 'mail', 'inbox',
    'proton', 'protonmail', 'pm', 'tutanota', 'tuta', 'hushmail',
    'zoho', 'yandex', 'fastmail', 'hey', 'posteo', 'runbox',
    'qq', '163', '126', 'sina', 'sohu', 'naver', 'daum',
    'comcast', 'verizon', 'att', 'sbcglobal', 'bellsouth', 'cox', 'charter',
    'btinternet', 'orange', 'laposte', 't-online', 'seznam', 'wp', 'onet', 'interia',
    'rediffmail', 'free',
])

const MULTI_PART_SUFFIX_LABELS: ReadonlySet<string> = new Set([
    'co', 'com', 'net', 'org', 'gov', 'edu', 'ac', 'or', 'ne', 'go', 'gob',
])

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

function domainLabels(email: string): string[] {
    const at = email.lastIndexOf('@')
    if (at < 0) {
        return []
    }
    return email
        .slice(at + 1)
        .toLowerCase()
        .trim()
        .split('.')
        .filter((label) => label.length > 0)
}

function registrableLabel(labels: string[]): string | null {
    if (labels.length < 2) {
        return null
    }
    const suffixIndex = labels.length - 1
    const usesMultiPartSuffix = labels.length >= 3 && MULTI_PART_SUFFIX_LABELS.has(labels[suffixIndex - 1])
    return labels[usesMultiPartSuffix ? suffixIndex - 2 : suffixIndex - 1] ?? null
}

function companyNameFromWorkEmail(email: string): string | null {
    const label = registrableLabel(domainLabels(email))
    if (isNil(label) || CONSUMER_EMAIL_BRANDS.has(label)) {
        return null
    }
    const name = titleCaseHyphenated(label)
    return name.length > 0 ? name.slice(0, MAX_NAME_PART_LENGTH) : null
}

function titleCaseHyphenated(label: string): string {
    return label
        .split('-')
        .map((part) => part.replace(/[^a-zA-Z0-9]/g, ''))
        .filter((part) => part.length > 0)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ')
}

function platformNameFromSignup({ firstName, email }: PlatformNameFromSignupParams): string {
    return companyNameFromWorkEmail(email) ?? platformNameFromPerson({ firstName, email })
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

function isPlaceholderName({ firstName, lastName, email }: IsPlaceholderNameParams): boolean {
    return lastName.trim().length === 0 && firstName.trim().toLowerCase() === firstNameFromEmail(email).toLowerCase()
}

export const signupNames = {
    firstNameFromEmail,
    platformNameFromPerson,
    platformNameFromSignup,
    companyNameFromWorkEmail,
    splitFullName,
    isPlaceholderName,
}

type PlatformNameFromPersonParams = {
    firstName: string
    email: string
}

type PlatformNameFromSignupParams = {
    firstName: string
    email: string
}

type IsPlaceholderNameParams = {
    firstName: string
    lastName: string
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
