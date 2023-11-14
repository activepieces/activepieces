import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { FastifyPluginCallbackTypebox } from '@fastify/type-provider-typebox';
import { projectModule } from '../project/project-module';
import { projectService } from '../project/project-service';
import { ProjectType } from '@activepieces/shared';

export const xgModule: FastifyPluginAsyncTypebox = async (app) => {
  await app.register(xgController, { prefix: '/v1/xg' });
};

const xgController: FastifyPluginCallbackTypebox = (fastify, _opts, done) => {
  fastify.post('/create', async (request) => {
    console.log('RRR', request);
    return [
      await projectService.create({
        ownerId: 'ywnNzyTBf8uNdCjEPorMJ',
        displayName: '',
        platformId: undefined,
        type: ProjectType.PLATFORM_MANAGED,
        externalId: 'organizationId',
      }),
    ];
  });

  done();
};
