import { User } from "better-auth/types";
import { emailService } from "../../ee/helper/email/email-service";
import { system } from "../../helper/system/system";
import { OtpType } from "@activepieces/ee-shared";

type SentData = {
  user: User;
  url: string;
  token: string;
}

interface IBetterAuthService {
    sendResetPassword: (data: SentData, request: Request | undefined) => Promise<void>
    sendVerificationEmail: (data: SentData, request: Request | undefined) => Promise<void>
}

export const betterAuthService: IBetterAuthService = {
  sendResetPassword: async (data, request) => {
    await emailService(system.globalLogger()).sendOtp({
      userIdentity: data.user,
      platformId: platformIdFromRequestQuery(request),
      otp: encodeURIComponent(data.token),
      type: OtpType.PASSWORD_RESET
    })
  },

  sendVerificationEmail: async (data, request) => {
    await emailService(system.globalLogger()).sendOtp({
      userIdentity: data.user,
      platformId: platformIdFromRequestQuery(request),
      otp: encodeURIComponent(data.token),
      type: OtpType.EMAIL_VERIFICATION
    })
  },
}

const platformIdFromRequestQuery = (request: Request | undefined) => {
  if (request) {
    const queryParams = new URLSearchParams(request.url)
    return queryParams.get("platformId")
  }
  return null
}