const PEM_BLOCK = /-----BEGIN ([A-Z0-9 ]+)-----([\s\S]*?)-----END \1-----/;

export function normalizePrivateKey(privateKey: string): string {
  const trimmed = privateKey.trim().replace(/\\n/g, '\n');
  const match = PEM_BLOCK.exec(trimmed);
  const label = match ? match[1].trim() : 'PRIVATE KEY';
  const body = (match ? match[2] : trimmed).replace(/\s+/g, '');
  if (body.length === 0 || !/^[A-Za-z0-9+/=]+$/.test(body)) {
    throw new Error(
      'The private key is not valid PEM. Paste the full contents of your .p8 file, including the -----BEGIN ... PRIVATE KEY----- and -----END ... PRIVATE KEY----- lines.'
    );
  }
  const lines = body.match(/.{1,64}/g) ?? [];
  return [`-----BEGIN ${label}-----`, ...lines, `-----END ${label}-----`].join(
    '\n'
  );
}
