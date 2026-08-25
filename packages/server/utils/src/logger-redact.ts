// NOTE: This redact ruleset is a draft. It will be tuned along the way as we
// observe real log output and discover new shapes that need redaction (or
// over-redaction that hurts debuggability). Treat the path list as a living
// document, not a final spec.
//
// Wildcards (`*`) match a single path segment. Patterns here cover up to depth
// 2 (e.g. `*.*.password`); secrets nested deeper than that must be added as
// explicit paths. Pino's fast-redact does not support recursive (`**`) wildcards.
export type RedactConfig = {
    paths: string[]
    censor: string
    remove: boolean
}

export const loggerRedact: RedactConfig = {
    paths: [
        'req.headers.authorization',
        'req.headers.cookie',
        'req.headers["x-api-key"]',
        'req.headers["set-cookie"]',
        'res.headers["set-cookie"]',

        'password',
        '*.password',
        '*.*.password',
        '*.currentPassword',
        '*.*.currentPassword',
        '*.newPassword',
        '*.*.newPassword',
        '*.newPasswordConfirmation',
        '*.*.newPasswordConfirmation',

        'token',
        '*.token',
        '*.*.token',
        'accessToken',
        '*.accessToken',
        '*.*.accessToken',
        'access_token',
        '*.access_token',
        '*.*.access_token',
        'refreshToken',
        '*.refreshToken',
        '*.*.refreshToken',
        'refresh_token',
        '*.refresh_token',
        '*.*.refresh_token',
        'idToken',
        '*.idToken',
        '*.*.idToken',
        'id_token',
        '*.id_token',
        '*.*.id_token',

        'apiKey',
        '*.apiKey',
        '*.*.apiKey',
        'api_key',
        '*.api_key',
        '*.*.api_key',
        'secret',
        '*.secret',
        '*.*.secret',
        'clientSecret',
        '*.clientSecret',
        '*.*.clientSecret',
        'client_secret',
        '*.client_secret',
        '*.*.client_secret',
        'privateKey',
        '*.privateKey',
        '*.*.privateKey',
        'private_key',
        '*.private_key',
        '*.*.private_key',
        'connection.value',
        '*.connection.value',
        '*.*.connection.value',
        'appConnection.value',
        '*.appConnection.value',
        'app_connection.value',
        '*.app_connection.value',
        'connectionValue',
        '*.connectionValue',
        '*.*.connectionValue',

        'err.response.data',
        'err.config.headers.authorization',
        'err.config.headers.Authorization',
        'err.request._header',
    ],
    censor: '[REDACTED]',
    remove: false,
}
