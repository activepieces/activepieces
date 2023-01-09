import fastify from "fastify";
import { Principal } from "shared";

declare module "fastify" {
  export interface FastifyRequest {
    principal: Principal;
  }
}
