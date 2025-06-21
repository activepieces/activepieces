import { httpClient, HttpMethod } from "@activepieces/pieces-common"
import { getHeaders, handleFailures } from "../../helpers"
import { exchangeTokenEndpoint, dimoNftContractAddress } from "./constant"
import { TokenExchangeResponse } from "./type"

const defaultPrivileges = [1,2,3,4,5,6]

export const getVehicleToken = async (developerJwt:string,tokenId:number,privileges?:number[]) => {
    privileges = privileges || defaultPrivileges

        const response = await httpClient.sendRequest<TokenExchangeResponse>({
            method : HttpMethod.POST,
            url : exchangeTokenEndpoint,
            body : {
                tokenId,
                privileges,
                nftContractAddress : dimoNftContractAddress
            },
            headers : getHeaders(developerJwt),
        })

        handleFailures(response)

        return response.body.token
}
