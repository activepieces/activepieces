import { createPiece } from "@activepieces/pieces-framework";
import { PieceCategory } from "@activepieces/shared";
import { createCustomApiCallAction, httpClient, HttpMethod } from "@activepieces/pieces-common";

import { cyberarkAuth, CyberArkAuth } from "./lib/common/auth";
import { createUser } from "./lib/actions/create-user";
import { updateUser } from "./lib/actions/update-user";
import { deleteUser } from "./lib/actions/delete-user";
import { activateUser } from "./lib/actions/activate-user";
import { enableUser } from "./lib/actions/enable-user";
import { disableUser } from "./lib/actions/disable-user";
import { findUser } from "./lib/actions/find-user";
import { addMemberToGroup } from "./lib/actions/add-member-to-group";
import { removeUserFromGroup } from "./lib/actions/remove-user-from-group";

export const cyberark = createPiece({
    displayName: "Cyberark",
    description: "Automate secrets management and privileged access security with CyberArk.",
    auth: cyberarkAuth,
    minimumSupportedRelease: '0.3.1',
    logoUrl: "https://cdn.activepieces.com/pieces/cyberark.png",
    authors: ['david-oluwaseun420'],
    categories: [PieceCategory.DEVELOPER_TOOLS],
    actions: [
        createUser,
        updateUser,
        deleteUser,
        activateUser,
        enableUser,
        disableUser,
        findUser,
        addMemberToGroup,
        removeUserFromGroup,
        createCustomApiCallAction({
            auth: cyberarkAuth,
            baseUrl: (auth) => {
                const pvwaUrl = (auth as CyberArkAuth).pvwaUrl;
                return pvwaUrl.replace(/\/$/, ""); 
            },
            authMapping: async (auth) => {
                const typedAuth = auth as CyberArkAuth;
                const pvwaUrl = typedAuth.pvwaUrl.replace(/\/$/, "");
                const response = await httpClient.sendRequest<string>({
                    method: HttpMethod.POST,
                    url: `${pvwaUrl}/PasswordVault/API/auth/Logon`,
                    body: {
                        username: typedAuth.username,
                        password: typedAuth.password,
                    },
                });

                return {
                    'Authorization': response.body,
                };
            }
        })
    ],
    triggers: [],
});