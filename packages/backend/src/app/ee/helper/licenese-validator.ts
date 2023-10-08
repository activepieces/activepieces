import axios from 'axios'
import { logger } from '../../helper/logger'

export async function verifyLicenseKey({ license }: { license: string }): Promise<boolean> {
    try {
        const res = await axios.post('https://secrets.activepieces.com/verify', { licenseKey: license })
        logger.info('[INFO]: License key Response ' + JSON.stringify(res))
        return res.status === 200
    }
    catch (err) {
        logger.error(err)
        // TODO FIX
        return true
    }
}