import { httpClient, HttpMethod, AuthenticationType } from "@activepieces/pieces-common";
import { OAuth2PropertyValue } from "@activepieces/pieces-framework";
import dayjs from "dayjs";

export const oneDriveCommon = {
    baseUrl: "https://graph.microsoft.com/v1.0/me/drive",

    async getFiles(auth: OAuth2PropertyValue, search?: {
        parentFolder?: string,
        createdTime?: string | number | Date,
        createdTimeOp?: string
    }) {
        let url = `${this.baseUrl}/items/root/children?$filter=folder eq null`;
        if (search?.parentFolder) {
            url = `${this.baseUrl}/items/${search.parentFolder}/children?$filter=folder eq null`;
        }

        const response = await httpClient.sendRequest<{ value: { id: string, name: string, createdDateTime: string }[] }>({
            method: HttpMethod.GET,
            url: url,
            queryParams: {
                $select: 'id,name,createdDateTime',
                $orderby: 'createdDateTime asc'
            },
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: auth.access_token,
            }
        });

        const files = response.body.value;

        if (search?.createdTime) {
            const compareDate = dayjs(search.createdTime);
            return files.filter(file => {
                const fileDate = dayjs(file.createdDateTime);
                const comparison = search.createdTimeOp === '<' ? fileDate.isBefore(compareDate) : fileDate.isAfter(compareDate);
                return comparison;
            });
        }

        return files;
    },
}
