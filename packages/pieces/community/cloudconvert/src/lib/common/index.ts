import { CloudConvertClient } from './client';

export { cloudconvertAuth } from './auth';

export { CloudConvertClient } from './client';

export { convertFileProps } from './properties';

export { convertFileSchema, captureWebsiteSchema, mergePdfSchema, downloadFileSchema, archiveFileSchema, optimizeFileSchema } from './schemas';

export const cloudconvertCommon = {
    baseUrl: (region = 'auto') => {
        switch (region) {
            case 'eu-central':
                return 'https://eu-central.api.cloudconvert.com/v2';
            case 'us-east':
                return 'https://us-east.api.cloudconvert.com/v2';
            default:
                return 'https://api.cloudconvert.com/v2';
        }
    },

    createClient(auth: any) {
        return new CloudConvertClient(auth);
    },
};
