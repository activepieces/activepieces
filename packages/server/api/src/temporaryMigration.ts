import { flowRepo } from "./app/flows/flow/flow.repo"
import { system } from "./app/helper/system/system"
import { projectRepo } from "./app/project/project-service"
import { gitRepoService } from "./app/ee/project-release/git-sync/git-sync.service"

export const temporaryMigration = {
    async backfill() {
        const logger = system.globalLogger();
        logger.info("Starting backfill process");

        const projects = await projectRepo().find();
        logger.info(`Found ${projects.length} projects`);

        for(const project of projects) {
            logger.info(`Processing project with ID: ${project.id}`);

            const gitRepo = await gitRepoService(logger).getOneByProjectOrThrow({ projectId: project.id });
            logger.info(`Retrieved git repository for project ID: ${project.id}`);

            const flows = await flowRepo().find({ where: { projectId: project.id } });
            logger.info(`Found ${flows.length} flows for project ID: ${project.id}`);

            const repoState = await gitRepoService(logger).getState({ gitRepo, userId: project.ownerId, log: logger });
            logger.info(`Retrieved repository state for project ID: ${project.id}`);

            for(const flow of repoState.flows) {
                const flowState = flows.find(f => f.versions[f.versions.length - 1].displayName === flow.version.displayName);
                if(flowState) {
                    logger.info(`Updating flow with ID: ${flowState.id} to have external ID: ${flow.externalId}`);
                    await flowRepo().update(flowState.id, { externalId: flow.externalId });
                } else {
                    logger.warn(`No matching flow found for external flow with display name: ${flow.version.displayName}`);
                }
            }
        }

        logger.info("Backfill process completed");
    }
}