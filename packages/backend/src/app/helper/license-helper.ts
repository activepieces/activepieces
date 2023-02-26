import axios from "axios";
import { system } from "./system/system";
import { SystemProp } from "./system/system-prop";

let edition = undefined;

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

export async function getEdition() : Promise<string>{
    if (edition === undefined) {
        const licenseKey = system.get(SystemProp.LICENSE_KEY);
        edition = (await verifyLicense(licenseKey)) ? 'ee' : 'ce';
    }
    return edition;
}