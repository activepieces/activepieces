import { PieceAuth } from "@activepieces/pieces-framework"

export const vehicleAuth = PieceAuth.CustomAuth({
    required : true,
    props : {
      token : PieceAuth.SecretText({
        displayName : "Vehicle JWT",
        description : "Use your developer token and Token Exchange API to get the vehicle JWT",
        required : true,
      })
    }
  })


  export const developerAuth = PieceAuth.CustomAuth({
    required : true,
    props: {
      token : PieceAuth.SecretText({
        displayName : "Developer Token",
        description : "Generate a developer token from the DIMO Developer Portal",
        required : true,
      })
    }
  })