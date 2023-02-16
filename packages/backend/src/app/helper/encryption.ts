import * as crypto from 'crypto';
import { system } from './system/system';
import { SystemProp } from './system/system-prop';

const encryptionKey = system.getOrThrow(SystemProp.ENCRYPTION_KEY);

export interface EncryptedObject {
    iv: string;
    data: string;
}

export function encryptObject(object: unknown): EncryptedObject {
    const iv = crypto.randomBytes(16); // Generate a random initialization vector
    const key = Buffer.from(encryptionKey.padEnd(32, '\0'), 'binary'); // Create a key from the encryption key
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv); // Create a cipher with the key and initialization vector
    let encrypted = cipher.update(JSON.stringify(object), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return {
        iv: iv.toString('hex'),
        data: encrypted
    };
}


export function decryptObject<T>(encryptedObject: EncryptedObject): T {
    const iv = Buffer.from(encryptedObject.iv, 'hex');
    const key = Buffer.from(encryptionKey.padEnd(32, '\0'), 'binary'); // Create a key from the encryption key
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encryptedObject.data, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return JSON.parse(decrypted);
}