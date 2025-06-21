import { createAction, Property } from "@activepieces/pieces-framework";
import { AttestationResponse } from "./type";
import { httpClient, HttpMethod } from "@activepieces/pieces-common";
import { CREATE_VC_ENDPOINT } from "./constant";
import { getHeaders, handleFailures } from "../../helpers";
import { dimoAuth } from "../../../index";
// import { vehicleAuth } from '../../../index';

export const attestationApiAction = createAction({
    auth: dimoAuth, // Will be set to dimoAuth in the piece
    name: "generate-vehicle-vc-attestation-api",
    displayName: "Generate Vehicle VC via Attestation API",
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

        const response = await httpClient.sendRequest<AttestationResponse>({
          method: HttpMethod.POST,
          url: CREATE_VC_ENDPOINT.replace("{0}", vehicleTokenId.toString()),
          headers : getHeaders(ctx.auth as { developerJwt?: string; vehicleJwt?: string }, 'vehicle'),
        })

        handleFailures(response)

        return {
          body : response.body
        }
    }
})
