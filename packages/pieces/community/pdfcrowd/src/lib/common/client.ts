import { pdfcrowdAuth } from './auth';
import { AppConnectionValueForAuthProperty } from '@activepieces/pieces-framework';

export const BASE_URL = 'https://api.pdfcrowd.com/api';
export const DEFAULT_CONVERTER_VERSION = '24.04';

export function getConvertUrl(version?: string): string {
    return `https://api.pdfcrowd.com/convert/${version || DEFAULT_CONVERTER_VERSION}/`;
}

export function getAuthHeader(auth: AppConnectionValueForAuthProperty<typeof pdfcrowdAuth>): string {
    return 'Basic ' + Buffer.from(`${auth.username}:${auth.password}`).toString('base64');
}
