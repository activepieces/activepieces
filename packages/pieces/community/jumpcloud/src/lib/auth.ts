import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { JUMPCLOUD_REGION, jumpcloudApi } from './common/client';

export const jumpcloudAuth = PieceAuth.CustomAuth({
    displayName: 'JumpCloud Connection',
    description: `Connect with a JumpCloud administrator API key.

1. Sign in to the [JumpCloud Admin Portal](https://console.jumpcloud.com).
2. Click your account initials in the top-right corner and choose **My API Key**.
3. Generate a key if you have none, copy it and paste it below.
4. Pick the region your organization lives in. Use **EU** if you sign in at console.eu.jumpcloud.com, **India** for console.in.jumpcloud.com.

The key acts with the permissions of the admin who owns it.`,
    required: true,
    props: {
        apiKey: PieceAuth.SecretText({
            displayName: 'API Key',
            description: 'The administrator API key from My API Key in the Admin Portal.',
            required: true,
        }),
        region: Property.StaticDropdown({
            displayName: 'Region',
            description: 'The data center your JumpCloud organization lives in.',
            required: true,
            defaultValue: JUMPCLOUD_REGION.US,
            options: {
                disabled: false,
                options: [
                    { label: 'United States (console.jumpcloud.com)', value: JUMPCLOUD_REGION.US },
                    { label: 'European Union (console.eu.jumpcloud.com)', value: JUMPCLOUD_REGION.EU },
                    { label: 'India (console.in.jumpcloud.com)', value: JUMPCLOUD_REGION.IN },
                ],
            },
        }),
        orgId: Property.ShortText({
            displayName: 'Organization ID',
            description:
                'Only needed if you manage several organizations (multi-tenant admin). Find it in the Admin Portal under Settings > Organization Profile. Leave empty otherwise.',
            required: false,
        }),
    },
    validate: async ({ auth }) => jumpcloudApi.validateConnection(auth),
});
