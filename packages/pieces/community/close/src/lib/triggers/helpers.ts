import crypto from 'crypto';

export const verifySignature = (
	signatureKey?: string, // hex-encoded key
	timestamp?: string, // 'close-sig-timestamp' header
	rawBody?: any, // raw body as string
	signatureHash?: string, // 'close-sig-hash' header
): boolean => {
	if (!signatureKey || !timestamp || !rawBody || !signatureHash) {
		return false;
	}

	try {
		const dataToHmac = timestamp + rawBody;

		const generatedHash = crypto
			.createHmac('sha256', Buffer.from(signatureKey, 'hex'))
			.update(dataToHmac, 'utf8')
			.digest('hex');

		return crypto.timingSafeEqual(
			Buffer.from(generatedHash, 'hex'),
			Buffer.from(signatureHash, 'hex'),
		);
	} catch (error) {
		return false;
	}
};
