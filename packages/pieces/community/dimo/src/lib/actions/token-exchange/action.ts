import { createAction, Property } from "@activepieces/pieces-framework";
import { getHeaders, handleFailures } from "../../helpers";
import { httpClient,HttpMethod } from "@activepieces/pieces-common";
import { dimoNftContractAddress, exchangeTokenEndpoint } from "./constant";
import { TokenExchangeResponse } from "./type";
import { dimoAuth } from '../../../index';

export const tokenExchangeApiAction = createAction({
    auth: dimoAuth,
    name: "vehicle-jwt-token-exchange-api",
    displayName: "Vehicle JWT via Token Exchange API",
    description: "Creates a token exchange to obtain a Vehicle JWT. The response will provide a short-lived token that last you 10 minutes to access additional vehicle information such as Trips and Telemetry data",
    props: {
        vehicleTokenId : Property.Number({
            displayName : "Vehicle Token ID",
            description : "The ID of the vehicle for getting Vehicle JWT",
            required : true,
        }),
        privileges : Property.StaticMultiSelectDropdown({
            displayName : "Privileges",
            description : "Privileges are the permissions that the owner of the vehicle shared with you",
            required : true,
            options : {
                options: [
                    { label: 'All-time, non-location data (1)', value: 1 },
                    { label: 'Commands (2)', value: 2 },
                    { label: 'Current location (3)', value: 3 },
                    { label: 'All-time location (4)', value: 4 },
                    { label: 'View VIN credentials (5)', value: 5 },
                    { label: 'Live data streams (6)', value: 6 },
                  ],
            }
        })
    },
    run: async (ctx) => {
        const {vehicleTokenId, privileges} = ctx.propsValue
        const { developerJwt } = ctx.auth;

        const response = await httpClient.sendRequest<TokenExchangeResponse>({
            method : HttpMethod.POST,
            url : exchangeTokenEndpoint,
            body : {
                tokenId : vehicleTokenId,
                privileges,
                nftContractAddress : dimoNftContractAddress
            },
            headers : getHeaders(developerJwt),
        })

        handleFailures(response)

        return {
            vehicleJwt : response.body.token
        }
}})
