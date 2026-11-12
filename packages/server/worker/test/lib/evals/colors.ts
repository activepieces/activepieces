import { isNil } from '@activepieces/core-utils'

function paint(code: string): (text: string) => string {
    return (text) => ENABLED ? `\x1b[${code}m${text}\x1b[0m` : text
}

const ENABLED = Boolean(process.stdout.isTTY) && isNil(process.env['NO_COLOR'])

export const colors = {
    bold: paint('1'),
    dim: paint('2'),
    red: paint('31'),
    green: paint('32'),
    yellow: paint('33'),
    cyan: paint('36'),
}
