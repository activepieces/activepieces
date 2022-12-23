import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from 'fastify';
import { ActivepiecesError, ErrorCode } from '../helper/activepieces-error';
import { SelectInput } from 'components/dist/src/framework/config/select-input.model';
import { InputType } from 'components/dist/src/framework/config';
import { components, getComponent } from 'components/dist/src/apps';
import {
  ComponentOptionRequest,
  ComponentOptionRequestSchema,
} from 'shared/dist/dto/components/component-option-request';

export const componentsController = async (
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) => {
  fastify.get('/components', async (_request, _reply) => {
    return components.map((f) => f.metadata());
  });

  fastify.post(
    '/components/:componentName/options',
    {
      schema: ComponentOptionRequestSchema,
    },
    async (
      _request: FastifyRequest<{
        Params: { componentName: string };
        Body: ComponentOptionRequest;
      }>,
      _reply
    ) => {
      const component = getComponent(_request.params.componentName);
      if (component === undefined) {
        throw new ActivepiecesError({
          code: ErrorCode.COMPONENT_NOT_FOUND,
          params: {
            componentName: _request.params.componentName,
          },
        });
      }
      const action = component.getAction(_request.body.stepName);
      const trigger = component.getTrigger(_request.body.stepName);
      if (action === undefined && trigger === undefined) {
        throw new ActivepiecesError({
          code: ErrorCode.STEP_NOT_FOUND,
          params: {
            stepName: _request.body.stepName,
            componentName: _request.params.componentName,
          },
        });
      }
      const configs = action !== undefined ? action.configs : trigger.configs;
      const config = configs.find((f) => f.name === _request.body.configName);
      if (config === undefined || config.type !== InputType.SELECT) {
        throw new ActivepiecesError({
          code: ErrorCode.CONFIG_NOT_FOUND,
          params: {
            stepName: _request.body.stepName,
            componentName: _request.params.componentName,
            configName: _request.body.configName,
          },
        });
      }
      return await (config as SelectInput).options(_request.body.config);
    }
  );
};
