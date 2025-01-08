import { gitRepoService } from './app/ee/project-release/git-sync/git-sync.service'
import { flowRepo } from './app/flows/flow/flow.repo'
import { flowVersionService } from './app/flows/flow-version/flow-version.service'
import { system } from './app/helper/system/system'
import { projectRepo } from './app/project/project-service'
import { isNil } from 'packages/shared/src/lib/common/utils'
import { GitBranchType } from '@activepieces/ee-shared'

export const temporaryMigration = {
    async backfill() {
        const logger = system.globalLogger()
        logger.info('Starting backfill process')

        const projects = await projectRepo().find()
        logger.info(`Found ${projects.length} projects`)

        for (const project of projects) {
            logger.info(`Processing project with ID: ${project.id}`)

            const gitRepo = await gitRepoService(logger).getOneByProject({ projectId: project.id })
            logger.info(`Retrieved git repository for project ID: ${project.id}`)

            if (isNil(gitRepo)) {
                logger.info(`No git repository found for project ID: ${project.id}`)
                continue
            }

            if (gitRepo.branchType !== GitBranchType.PRODUCTION) {
                logger.info(`Skipping project ID: ${project.id} because it is not on the production branch`)
                continue
            }

            const flows = await flowRepo().find({ where: { projectId: project.id } })
            logger.info(`Found ${flows.length} flows for project ID: ${project.id}`)

            const repoState = await gitRepoService(logger).getState({ gitRepo, userId: project.ownerId, log: logger })
            logger.info(`Retrieved repository state for project ID: ${project.id}`)

            if (isNil(repoState)) {
                logger.info(`No repository state found for project ID: ${project.id}`)
                continue
            }

            for (const flow of repoState.flows) {
                const flowResults = await Promise.all(flows.map(async (f) => {
                    const latestVersion = await flowVersionService(logger).getOne(f.id);
                    if (isNil(latestVersion)) {
                        return null;
                    }
                    if (latestVersion.displayName === flow.version.displayName && latestVersion.trigger.settings.pieceName === flow.version.trigger.settings.pieceName) {
                        return f;
                    }
                    return null;
                }));

                const matchingFlows = flowResults.filter(f => f !== null);

                if (matchingFlows.length === 0) {
                    const matchingFlowsByDisplayName = await Promise.all(matchingFlows.map(async (f) => {
                        const latestVersion = await flowVersionService(logger).getOne(f.id);
                        if (isNil(latestVersion)) {
                            return null;
                        }
                        if (latestVersion.displayName === flow.version.displayName) {
                            return f;
                        }
                        return null;
                    }));

                    const matchingFlow = matchingFlowsByDisplayName.find(f => f !== null);

                    if (matchingFlow) {
                        logger.info(`Updating flow with ID: ${matchingFlow.id} to have external ID: ${flow.externalId}`);
                        await flowRepo().update(matchingFlow.id, { externalId: flow.externalId });
                    }
                    else {
                        logger.warn(`No matching flow found for external flow with display name: ${flow.version.displayName}`);
                    }

                } else if (matchingFlows.length === 1) {
                    const matchingFlow = matchingFlows[0];
                    logger.info(`Updating flow with ID: ${matchingFlow.id} to have external ID: ${flow.externalId}`);
                    await flowRepo().update(matchingFlow.id, { externalId: flow.externalId });
                } else {
                    const matchingFlow = matchingFlows.find(f => f !== null);

                    if (matchingFlow) {
                        logger.info(`Updating flow with ID: ${matchingFlow.id} to have external ID: ${flow.externalId}`);
                        await flowRepo().update(matchingFlow.id, { externalId: flow.externalId });
                    } else {
                        logger.warn(`No flows match after additional filtering for display name: ${flow.version.displayName}`);
                    }
                }
            }
        }

        logger.info('Backfill process completed')
    },
}