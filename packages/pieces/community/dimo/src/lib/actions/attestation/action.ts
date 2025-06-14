import { createAction, Property } from "@activepieces/pieces-framework";
import { vehicleAuth } from "../../common";
import { AttestationResponse } from "./type";
import { httpClient, HttpMethod } from "@activepieces/pieces-common";
import { CREATE_VC_ENDPOINT } from "./constant";
import { getHeaders, handleFailures } from "../../helpers";

export const attestationApiAction = createAction({
    auth: vehicleAuth,
    name: "attestation-api",
    displayName: "Attestation API",
    description: "Generates the VIN VC for a given vehicle if it has never been created, or if it has expired. If an unexpired VC is found, returns the VC.",
    props: {
        vehicleTokenId : Property.Number({
            displayName : "Vehicle Token ID",
            description : "The ID of the vehicle for getting Attestation VC",
            required : true,
        }),
    },
    run : async (ctx) => {
        const {vehicleTokenId} = ctx.propsValue
        const {token} = ctx.auth
        const response = await httpClient.sendRequest<AttestationResponse>({
          method: HttpMethod.GET,
          url: CREATE_VC_ENDPOINT.replace("{0}", vehicleTokenId.toString()),
          headers : getHeaders(token),
        })

        handleFailures(response)

        return {
          body : response.body
        }
    }
})