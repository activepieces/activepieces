import fs from 'fs';
import path from 'path';

import { ALL_PRINCIPAL_TYPES } from '@activepieces/shared';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';

import { getWorkflowApps, getTemplateWorkflows, saveTemplateWorkflow } from './template.service';


export const templateController: FastifyPluginAsyncTypebox = async (app) => {
  const readFileTemplate = async () => {
    return new Promise((resolve, reject) => {
      //C:\work\wp\activepieces\dist\packages\server\api\assets
      const pathFile = path.join(
        'dist',
        'packages',
        'server',
        'api',
        'assets',
        'flow-templates' + '.json'
      );
      fs.readFile(pathFile, 'utf8', (err: any, data: any) => {
        if (err) {
          console.error('Error reading JSON file:', err);
          //   return;
          reject(err);
        }
        try {
          const jsonData = JSON.parse(data);
          console.log('JSON Data:', jsonData);
          resolve(jsonData);
        } catch (parseErr) {
          console.error('Error parsing JSON:', parseErr);
          reject(parseErr);
        }
      });
    });
  };

  app.get(
    '/flow-templates',
    {
      config: {
        allowedPrincipals: ALL_PRINCIPAL_TYPES,
      },
      //   logLevel: 'silent',
    },
    async (request) => {
      let response = await readFileTemplate();

      return response;
    }
  );

  app.get(
    '/wf-apps',
    {
      config: {
        allowedPrincipals: ALL_PRINCIPAL_TYPES,
      },
      //   logLevel: 'silent',
    },
    async (request) => {
      let response = await getWorkflowApps();
      return response;
    }
  );

  app.get(
    '/getTemplateWorkflows',
    {
      config: {
        allowedPrincipals: ALL_PRINCIPAL_TYPES,
      },
      //   logLevel: 'silent',
    },
    async (request) => {
      let response = await getTemplateWorkflows(request);


      return response;
    }
  );

  app.post(
    '/saveTemplateWorkflow',
    {
      config: {
        allowedPrincipals: ALL_PRINCIPAL_TYPES,
      },
      //   logLevel: 'silent',
    },
    async (request) => {
      let response = await saveTemplateWorkflow(request.body);


      return response;
    }
  );
};
