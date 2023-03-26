import { ApEnvironment } from "@activepieces/shared";
import { authenticationService } from "../../authentication/authentication.service";
import { logger } from "../../helper/logger";
import { system } from "../../helper/system/system";
import { SystemProp } from "../../helper/system/system-prop";

const seedDevUser = async (): Promise<void> => {
    await authenticationService.signUp({
        email: "dev@ap.com",
        password: "12345678",
        firstName: "firstName",
        lastName: "lastName",
        trackEvents: false,
        newsLetter: false,
    });

    logger.info("[seedDevUser] email=dev@ap.com pass=12345678");
}

export const seedDevData = async () => {

    const env = system.getOrThrow(SystemProp.ENVIRONMENT);

    if (env !== ApEnvironment.DEVELOPMENT) {
        logger.info("[seedDevData] skip seeding dev data");
        return;
    }

    logger.info("[seedDevData] seeding dev data");

    await seedDevUser();
}
