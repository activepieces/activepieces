import { BetterAuthOptions, User } from "better-auth/types";
import { emailService } from "../../ee/helper/email/email-service";
import { ApplicationEventName, OtpType } from "@activepieces/ee-shared";
import { FastifyBaseLogger } from "fastify";
import { MiddlewareContext, AuthContext, MiddlewareOptions } from "better-auth/*";
import { getOAuthState } from "better-auth/api";
import { authenticationService } from "../authentication.service";
import { assertNotNullOrUndefined } from "@activepieces/shared";
import { eventsHooks } from "../../helper/application-events";
import { AppSystemProp } from "@activepieces/server-shared";
import { system } from "../../helper/system/system";
import { domainHelper } from "../../ee/custom-domains/domain-helper";

type SentData = {
  user: User;
  url: string;
  token: string;
}

interface IBetterAuthService {
    sendResetPassword: (data: SentData, request: Request | undefined) => Promise<void>
    sendVerificationEmail: (data: SentData, request: Request | undefined) => Promise<void>
    afterHook: (inputContext: MiddlewareContext<MiddlewareOptions, AuthContext<BetterAuthOptions> & {
      returned?: unknown | undefined;
      responseHeaders?: Headers | undefined;
    }>) => Promise<unknown | void>
}

export const betterAuthService = (log: FastifyBaseLogger): IBetterAuthService => ({
  sendResetPassword: async (data, request) => {
    await emailService(log).sendOtp({
      userIdentity: data.user,
      platformId: platformIdFromRequestQuery(request),
      otp: encodeURIComponent(data.token),
      type: OtpType.PASSWORD_RESET
    })
  },

  sendVerificationEmail: async (data, request) => {
    await emailService(log).sendOtp({
      userIdentity: data.user,
      platformId: platformIdFromRequestQuery(request),
      otp: encodeURIComponent(data.token),
      type: OtpType.EMAIL_VERIFICATION
    })
  },


  afterHook: async (ctx) => {
      if(ctx.path.startsWith("/callback")) {
        const identityId = ctx.context.newSession?.user.id
        assertNotNullOrUndefined(identityId, "identityId")
        const oAuthState = await getOAuthState();
        const platformId = oAuthState?.platformId ?? null
        const state = JSON.stringify({
          provider: oAuthState?.provider,
          from: oAuthState?.from, 
        })

        const response = await authenticationService(log).socialSignIn({
          identityId,
          predefinedPlatformId: platformId,
        })

        eventsHooks.get(log).sendUserEvent({
          platformId: response.platformId!,
          userId: response.id,
          projectId: response.projectId,
          ip: ctx.request!.headers.get(system.get(AppSystemProp.CLIENT_REAL_IP_HEADER) ?? "") ?? "",
        }, {
            action: ApplicationEventName.USER_SIGNED_UP,
            data: {
                source: 'sso',
            },
        })

        const redirectUrl = domainHelper.getPublicUrl({
          path: "/redirect"
        })

        throw ctx.redirect(`${redirectUrl}?response=${JSON.stringify(response)}&state=${state}`)
      }
  }

})

const platformIdFromRequestQuery = (request: Request | undefined) => {
  if (request) {
    const queryParams = new URLSearchParams(request.url)
    return queryParams.get("platformId")
  }
  return null
}