import { randomUUID } from 'node:crypto';
import { e2eApi } from '../../../fixtures/api';
import { expect, test } from '../../../fixtures/embed-connections';
import webhookEcho from '../../../fixtures/templates/webhook-echo.json';
import { EmbedConnectionsPage } from '../../../pages/embed-connections.page';

test.describe('Embedded connections and MCP', { tag: ['@feature:embed-conn', '@surface'] }, () => {
  test.describe.configure({ timeout: 120_000 });

  test('create a connection on the embedded connections page', async ({ cleanup, embed, embedConnections, connectionsList }) => {
    const token = embed.signToken({ signingKey: await embed.createSigningKey() });
    const embedded = await embed.exchange({ token });
    const connectionName = e2eApi.uniqueName('embed connection').replaceAll(' ', '_');
    const embedPage = new EmbedConnectionsPage(await embed.hostPage());
    await embedPage.openConnect({ token, pieceName: ACTIVEPIECES_PIECE, connectionName });

    const connectResult = await embedPage.saveConnection({
      fields: { 'API Key': `e2e-${randomUUID()}` },
      onCreated: (connectionId) => cleanup.track({ resource: 'app-connections', id: connectionId }),
    });

    expect(connectResult, 'The SDK did not get the connection back').toEqual({ connection: { id: expect.any(String), name: connectionName } });
    const saved = await connectionsList.findByName({ displayName: connectionName, session: embedConnections.projectSession(embedded.projectId) });
    expect(saved, 'The connection is not in the project of the embedded user').toEqual([
      expect.objectContaining({ id: connectResult.connection?.id, externalId: connectionName, pieceName: ACTIVEPIECES_PIECE }),
    ]);
  });

  test('the embedded MCP page lists the tools of the project', async ({ seed, embed, embedConnections }) => {
    const token = embed.signToken({ signingKey: await embed.createSigningKey() });
    const embedded = await embed.exchange({ token });
    const tool = await embedConnections.seedMcpTool({ projectId: embedded.projectId });
    await seed.flow({ template: webhookEcho, publish: true, session: embedConnections.projectSession(embedded.projectId) });
    const embedPage = new EmbedConnectionsPage(await embed.hostPage());

    await embedPage.openMcpTools({ token });

    const tools = await embedConnections.readMcpFlowTools({ projectId: embedded.projectId });
    expect(tools, 'Only the published flow with the MCP trigger is a tool, not the published webhook flow').toEqual([{ id: tool.flowId, name: tool.flowName }]);
    await expect(embedPage.mcpFlowToolNames()).toHaveText(tools.map((projectTool) => projectTool.name));
  });

  test('a step offers the predefined connection and stores it', async ({ embed, embedConnections }) => {
    const token = embed.signToken({ signingKey: await embed.createSigningKey() });
    const embedded = await embed.exchange({ token });
    const predefined = await embedConnections.seedPredefinedConnection({ projectId: embedded.projectId });
    const flow = await embedConnections.seedConnectionStepFlow({ projectId: embedded.projectId });
    const embedPage = new EmbedConnectionsPage(await embed.hostPage());
    await embedPage.openFlow({ token, flowId: flow.flowId });

    await embedPage.selectConnection({ stepName: 'step_1', connectionName: predefined.displayName });

    await expect(embedPage.connectionSelect()).toContainText(predefined.displayName);
    await expect.poll(() => embedConnections.readFirstStepAuth({ flowId: flow.flowId }), { message: 'The step of the saved flow does not use the predefined connection' })
      .toBe(`{{connections['${predefined.externalId}']}}`);
  });
});

const ACTIVEPIECES_PIECE = '@activepieces/piece-activepieces';
