import { PieceAuth } from "@activepieces/pieces-framework";
import { makeRequest } from "./client";
import { HttpMethod } from "@activepieces/pieces-common";

export const NinoxAuth = PieceAuth.SecretText({
    displayName: 'Ninox API Key',
    description: `**Enter your Ninox Personal Access Token (API key).**

---

### How to obtain your API key

1. Visit [ninox.com](https://ninox.com) and log in.
2. Click the **Start Ninox** button to open the web app.
3. In the top-right corner, click the **Actions** gear icon.
4. Select **Integrations** from the drop-down menu.
5. In the pop-up window, click the **Generate** button.
6. Copy the API key to your clipboard and paste it here.
`,
    required: true,
    validate: async ({ auth }) => {
        if (auth) {
            try {
                await makeRequest(auth as string, HttpMethod.GET, '/teams', {});
                return {
                    valid: true,
                }
            } catch (error) {
                return {
                    valid: false,
                    error: 'Invalid Api Key'
                }
            }

        }
        return {
            valid: false,
            error: 'Invalid Api Key'
        }

    },

})