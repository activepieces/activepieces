function userToken({
  userId = 'user-a',
  platformId = 'platform-a',
}: {
  userId?: string;
  platformId?: string;
} = {}): string {
  const encode = (value: object): string =>
    Buffer.from(JSON.stringify(value)).toString('base64url');
  return [
    encode({ alg: 'HS256', typ: 'JWT' }),
    encode({ id: userId, type: 'USER', platform: { id: platformId } }),
    'signature',
  ].join('.');
}

export const tokenFixtures = { userToken };
