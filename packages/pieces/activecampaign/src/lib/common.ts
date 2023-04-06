import { Property } from '@activepieces/framework'

export const activeCampaignProps = {
  authentication: Property.SecretText({
    displayName: 'Secret API Key',
    description: `
      To access your **Secret API Key**
      ---
      1. Log in to ActiveCampaign
      2. Go to Settings, then Developer. https://your_account_name_here.activehosted.com/app/settings/developer
      3. Under \`API Access\` copy \`Key\` and Paste it below.
      4. Click **Save**
    `,
    required: true
  }),
  account_name: Property.ShortText({
    displayName: "Account Name",
    description: "Your username/account name. Please check for possible typos.",
    required: true
  })
}