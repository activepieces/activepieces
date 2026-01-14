import { Property, createAction } from '@activepieces/pieces-framework';
import { GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import * as openpgp from 'openpgp';
import { amazonS3Auth } from '../..';
import { createS3, createSecretsManagerClient } from '../common';

export const decryptPgpFile = createAction({
  auth: amazonS3Auth,
  name: 'decrypt-pgp-file',
  displayName: 'Decrypt PGP File',
  description: 'Decrypt a PGP encrypted file from S3 using a private key stored in AWS Secrets Manager',
  props: {
    key: Property.ShortText({
      displayName: 'S3 File Key',
      description: 'The key (path) of the encrypted file in S3',
      required: true,
    }),
    secretArn: Property.ShortText({
      displayName: 'Secret ARN',
      description: 'The ARN of the secret in AWS Secrets Manager containing the PGP private key',
      required: true,
    }),
    passphraseArn: Property.ShortText({
      displayName: 'Passphrase ARN',
      description: 'Optional ARN of the secret in AWS Secrets Manager containing the passphrase for the private key (if the key is encrypted)',
      required: false,
    }),
    secretsManagerRegion: Property.ShortText({
      displayName: 'Secrets Manager Region',
      description: 'The AWS region where the Secrets Manager secret is stored (defaults to S3 region if not provided)',
      required: false,
    }),
  },
  async run(context) {
    const { bucket } = context.auth.props;
    const { key, secretArn, passphraseArn, secretsManagerRegion } = context.propsValue;
    const { accessKeyId, secretAccessKey, region } = context.auth.props;

    // Create S3 client
    const s3 = createS3(context.auth.props);

    // Download the encrypted file from S3
    let encryptedData: Buffer;
    try {
      const file = await s3.getObject({
        Bucket: bucket,
        Key: key,
      });
      
      const base64 = await file.Body?.transformToString('base64');
      if (!base64) {
        throw new Error(`Could not read file ${key} from S3`);
      }
      encryptedData = Buffer.from(base64, 'base64');
    } catch (error: any) {
      throw new Error(`Failed to download file from S3: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Create AWS Secrets Manager client
    const secretsClient = createSecretsManagerClient({
      accessKeyId: accessKeyId,
      secretAccessKey: secretAccessKey,
      region: secretsManagerRegion || region,
    });

    // Fetch the secret key from AWS Secrets Manager
    let privateKeyArmored: string;
    try {
      const command = new GetSecretValueCommand({
        SecretId: secretArn,
      });
      const response = await secretsClient.send(command);
      
      if (!response.SecretString) {
        throw new Error(`Secret ${secretArn} does not contain a string value`);
      }
      
      // Trim whitespace from the key (AWS Secrets Manager might add extra whitespace)
      privateKeyArmored = response.SecretString.trim();
    } catch (error: any) {
      // Provide more specific error messages for common issues
      if (error.name === 'AccessDeniedException') {
        throw new Error(
          `Access denied when retrieving secret ${secretArn}. ` +
          `Please ensure your AWS credentials have the secretsmanager:GetSecretValue permission for this secret.`
        );
      }
      if (error.name === 'ResourceNotFoundException') {
        throw new Error(
          `Secret ${secretArn} not found. Please verify the secret ARN is correct and exists in region ${secretsManagerRegion || region}.`
        );
      }
      if (error.name === 'InvalidParameterException') {
        throw new Error(
          `Invalid secret ARN: ${secretArn}. Please verify the ARN format is correct.`
        );
      }
      throw new Error(
        `Failed to retrieve secret from AWS Secrets Manager: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }

    // Fetch the passphrase from AWS Secrets Manager if provided
    let passphrase: string | undefined;
    if (passphraseArn) {
      try {
        const passphraseCommand = new GetSecretValueCommand({
          SecretId: passphraseArn,
        });
        const passphraseResponse = await secretsClient.send(passphraseCommand);
        
        if (!passphraseResponse.SecretString) {
          throw new Error(`Secret ${passphraseArn} does not contain a string value`);
        }
        
        passphrase = passphraseResponse.SecretString.trim();
      } catch (error: any) {
        // Provide more specific error messages for common issues
        if (error.name === 'AccessDeniedException') {
          throw new Error(
            `Access denied when retrieving passphrase secret ${passphraseArn}. ` +
            `Please ensure your AWS credentials have the secretsmanager:GetSecretValue permission for this secret.`
          );
        }
        if (error.name === 'ResourceNotFoundException') {
          throw new Error(
            `Passphrase secret ${passphraseArn} not found. Please verify the secret ARN is correct and exists in region ${secretsManagerRegion || region}.`
          );
        }
        if (error.name === 'InvalidParameterException') {
          throw new Error(
            `Invalid passphrase secret ARN: ${passphraseArn}. Please verify the ARN format is correct.`
          );
        }
        throw new Error(
          `Failed to retrieve passphrase from AWS Secrets Manager: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    // Read the encrypted file data
    const encryptedString = encryptedData.toString('utf8');

    // Decrypt the file using OpenPGP
    try {
      let message;
      try {
        message = await openpgp.readMessage({
          armoredMessage: encryptedString,
        });
      } catch {
        // If armored fails, try as binary
        message = await openpgp.readMessage({
          binaryMessage: encryptedData,
        });
      }

      // Read the private key
      let privateKey = await openpgp.readPrivateKey({
        armoredKey: privateKeyArmored,
      });
      
      if (!privateKey.isPrivate()) {
        throw new Error('The provided key is not a private key. Please ensure you are using a private key, not a public key.');
      }

      // Check if the key is encrypted and needs a passphrase
      if (!privateKey.isDecrypted()) {
        if (!passphrase) {
          throw new Error('Private key is encrypted but no passphrase was provided. Please provide a Passphrase ARN.');
        }
        try {
          const decryptedKey = await openpgp.decryptKey({
            privateKey: privateKey,
            passphrase: passphrase,
          });
          privateKey = decryptedKey;
        } catch (error) {
          throw new Error(`Failed to unlock private key with passphrase: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Decrypt the message
      const decrypted = await openpgp.decrypt({
        message,
        decryptionKeys: privateKey,
        format: 'binary',
        config: {
          allowInsecureDecryptionWithSigningKeys: false,
        },
      });

      // Get the decrypted data
      const decryptedData = new Uint8Array(await decrypted.data);

      // Write the decrypted file
      const fileName = key.split("/").at(-1)?.toLowerCase().replace(/\.(pgp|gpg)$/i, '');

      return await context.files.write({
        fileName: fileName ?? 'decrypted_file',
        data: Buffer.from(decryptedData),
      });
    } catch (error) {
      throw new Error(`Failed to decrypt file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});
