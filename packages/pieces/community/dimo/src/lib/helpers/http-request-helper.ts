import { HttpResponse } from "@activepieces/pieces-common"
import { ErrorResponse } from "../models";

// Accepts: { developerJwt, vehicleJwt }, and a 'use' param ('developer' | 'vehicle')
export const getHeaders = (
    token : string,
) => {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

export const handleFailures = (response : HttpResponse) => {
    const hasErrors = response.status >= 400

    if (!hasErrors) {
        return
    }

    const dimoError = isDimoError(response.body)

    if (dimoError) {
        const body = response.body as ErrorResponse
        throw new Error(`Dimo Error: ${body.message} (Code: ${body.code})`)
    }

    if(response.status === 401) {
        throw new Error("Unauthorized")
    }

    if(response.status === 403) {
        throw new Error("Forbidden")
    }

    if(response.status === 404) {
        throw new Error("Not Found")
    }

    if(response.status === 500) {
        throw new Error("Internal Server Error")
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const isDimoError = (body: any): body is ErrorResponse => {
    return body && typeof body === 'object' && 'code' in body && 'message' in body;
}
