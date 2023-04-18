import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import { billingService, stripe } from "./billing.service";
import { SystemProp } from "@backend/helper/system/system-prop";
import { system } from "@backend/helper/system/system";
import { logger } from "@backend/helper/logger";
import { StatusCodes } from "http-status-codes";
import { usageService } from "./usage.service";


const stripeSecret = system.getOrThrow(SystemProp.STRIPE_WEBHOOK_SECRET);

export const billingModule = async (app: FastifyInstance, _options: FastifyPluginOptions) => {
  app.register(billingController, { prefix: "/v1/billing" });
};

const billingController = async (fastify: FastifyInstance, options: FastifyPluginOptions) => {
  fastify.get(
    "/",
    async (
      request,
      _reply
    ) => {
      return {
        usage: await usageService.getUsage({ projectId: request.principal.projectId }),
        plan: await billingService.getPlan({ projectId: request.principal.projectId }),
        customerPortalUrl: await billingService.createPortalSessionUrl({ projectId: request.principal.projectId }),
      };
    }
  );


  fastify.post(
    "/stripe/webhook",
    {
      config: {
        rawBody: true,
      }
    },
    async (
      request: FastifyRequest<{}>,
      reply
    ) => {
      const payloadString = request.rawBody;
      const sig = request.headers["stripe-signature"] as string;
      try {
        const event = stripe.webhooks.constructEvent(
          payloadString!,
          sig,
          stripeSecret
        );
        await billingService.handleWebhook({ webhook: event });
        reply.status(StatusCodes.OK).send();
      } catch (err) {
        console.error(err);
        logger.warn(`⚠️  Webhook signature verification failed.`);
        logger.warn(`⚠️  Check the env file and enter the correct webhook secret.`);
        reply.status(StatusCodes.BAD_REQUEST).send(`Invalid webhook signature`);
      }
    }
  );
};
