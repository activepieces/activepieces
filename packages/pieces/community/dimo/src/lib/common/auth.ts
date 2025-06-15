import { PieceAuth } from "@activepieces/pieces-framework"

export const vehicleAuth = PieceAuth.CustomAuth({
    required : true,
    props : {
      token : PieceAuth.SecretText({
        displayName : "Vehicle JWT",
        description : "With your developer token and use 'vehicle-jwt-token-exchange-api' to generate a vehicle JWT",
        required : true,
      })
    }
  })


  export const developerAuth = PieceAuth.CustomAuth({
    required : true,
    props: {
      token : PieceAuth.SecretText({
        displayName : "Developer Token",
        description : "Generate a developer token using 'generate-developer-token-auth-api' action",
        required : true,
      })
    }
  })
