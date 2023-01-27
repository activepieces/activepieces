import { Property } from "../../../framework/property";


export const telegramCommons = {
    bot_token: Property.SecretText({
        displayName: "Bot Token",
        description: "Check activepieces documentation for how to obtain one",
        required: true,
    }),
    getApiUrl: (botToken: string, methodName: string) => {
        return `https://api.telegram.org/bot${botToken}/${methodName}`;
    }
}