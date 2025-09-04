import { Property, DynamicPropsValue } from "@activepieces/pieces-framework";
import { HttpMethod, httpClient } from "@activepieces/pieces-common";
import { docsbotAuth } from "../../index";

export const docsbotCommon = {
    teamId: Property.Dropdown({
        displayName: "Team",
        required: true,
        refreshers: [],
        options: async ({ auth }) => {
            if (!auth) {
                return {
                    disabled: true,
                    placeholder: "Please connect your account first.",
                    options: [],
                };
            }
            const request = {
                method: HttpMethod.GET,
                url: `https://docsbot.ai/api/teams/`,
                headers: {
                    'Authorization': `Bearer ${auth}`,
                },
            };
            const response = await httpClient.sendRequest<{ id: string; name: string }[]>(request);
            const options = response.body.map((team) => ({
                label: team.name,
                value: team.id,
            }));
            return {
                disabled: false,
                options: options,
            };
        },
    }),
    botId: Property.Dropdown({
        displayName: "Bot",
        required: true,
        refreshers: ['teamId'],
        options: async ({ auth, teamId }) => {
            if (!auth || !teamId) {
                return {
                    disabled: true,
                    placeholder: "Please select a team first.",
                    options: [],
                };
            }
            const request = {
                method: HttpMethod.GET,
                url: `https://docsbot.ai/api/teams/${teamId}/bots`,
                headers: {
                    'Authorization': `Bearer ${auth}`,
                },
            };
            const response = await httpClient.sendRequest<{ id: string; name: string }[]>(request);
            const options = response.body.map((bot) => ({
                label: bot.name,
                value: bot.id,
            }));
            return {
                disabled: false,
                options: options,
            };
        },
    }),
};
