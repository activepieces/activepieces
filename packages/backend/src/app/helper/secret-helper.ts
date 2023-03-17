import { captureException } from "@sentry/node";
import axios from "axios";
import { ApEnvironment, FlowVersion } from "@activepieces/shared";
import { system } from "./system/system";
import { SystemProp } from "./system/system-prop";
import fs from "node:fs/promises";
import { logger } from "./logger";

let edition = undefined;
let webhookSecrets = undefined;

async function verifyLicense(licenseKey: string): Promise<boolean> {
    try {
        const response =
            await axios.post(
                'https://secrets.activepieces.com/verify', { licenseKey });
        return response.status === 200;
    }
    catch (e) {
        return false;
    }
}

export async function getEdition(): Promise<string> {
    if (edition === undefined) {
        const licenseKey = system.get(SystemProp.LICENSE_KEY);
        edition = (await verifyLicense(licenseKey)) ? 'ee' : 'ce';
    }
    return edition;
}

export async function getWebhookSecret(flowVersion: FlowVersion): Promise<string> {
    const appName = flowVersion.trigger?.settings['pieceName'];
    if (!appName) {
        return undefined;
    }
    if (webhookSecrets === undefined) {
        webhookSecrets = await getWebhookSecrets();
    }
    return webhookSecrets[appName]?.webhookSecret;
}

export async function getWebhookSecrets(): Promise<Record<string, string>> {
    try {
        const secretPath = (await system.get(SystemProp.ENVIRONMENT)) === ApEnvironment.PRODUCTION ? '/app/config/app-secrets.json' : 'packages/backend/app-secrets-dev.json';
        if (fs.access(secretPath) !== undefined) {
            const file = await fs.readFile(secretPath, 'utf8');
            return JSON.parse(file);
        }
        logger.warn("app-secrets.json file not found. See https://activepieces.com/docs for more information.");
        return {};
    }
    catch (e) {
        captureException(e);
        throw e;
    }
}