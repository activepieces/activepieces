import {
  PlatformWithoutSensitiveData,
  SsoDomainVerificationStatus,
} from '@activepieces/shared';

export function getVerifiedDomain(
  platform: PlatformWithoutSensitiveData,
): string | null {
  return platform.ssoDomainVerification?.status ===
    SsoDomainVerificationStatus.VERIFIED
    ? platform.ssoDomain ?? null
    : null;
}
