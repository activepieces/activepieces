import { test } from '@playwright/test';
import { builder } from '../page/builder';
import { flows } from '../page/flows';
import { authentication } from '../page/authentication';
import { faker } from '@faker-js/faker'
import { globalConfig } from '../config';

test('Test Execute Flow', async ({ page }) => {
  test.setTimeout(100000);
  const email = faker.internet.email();
  await authentication.signUp(page, {
    email: email,
    password: globalConfig.password
  })
  await flows.newFlowFromScratch(page);
  await builder.selectInitialTrigger(page, {
    piece: 'Schedule',
    trigger: 'Every Day'
  });

  await builder.addAction(page, {
    piece: 'Data Mapper',
    action: 'Advanced Mapping'
  });

  await builder.testFlowAndWaitForSuccess(page);
  await builder.clickHome(page);
  await flows.deleteFlow(page, { flowName: 'Untitled' })

});
