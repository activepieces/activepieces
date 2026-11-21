import { FAKE_SPRINKLR_CLIENT, FakeSprinklrOptions, startFakeSprinklr } from './fake-sprinklr';

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const values = (name: string): string[] =>
    args.flatMap((a, i) => (a === `--${name}` && args[i + 1] !== undefined ? [args[i + 1]] : []));
  const value = (name: string): string | undefined => values(name)[0];
  const flag = (name: string): boolean => args.includes(`--${name}`);

  const apiKey = value('client-id') ?? FAKE_SPRINKLR_CLIENT.apiKey;
  const secret = value('client-secret') ?? FAKE_SPRINKLR_CLIENT.secret;
  const redirectUris = values('redirect-uri');
  const options: FakeSprinklrOptions = {
    port: Number(value('port') ?? 4799),
    host: value('host') ?? '127.0.0.1',
    envelope: value('envelope') === 'bare' ? 'bare' : 'wrapped',
    segment: value('segment'),
    tokenTtlSeconds: value('token-ttl') ? Number(value('token-ttl')) : undefined,
    cursorParam: parseCursorParam(value('cursor-param')),
    cursorIdPrefix: flag('cursor-id-prefix'),
    autoEmitEvents: flag('auto-emit'),
    clients: { [apiKey]: { secret, redirectUris: redirectUris.length > 0 ? redirectUris : FAKE_SPRINKLR_CLIENT.redirectUris } },
    onRequest: (entry) => console.log(`${new Date().toISOString()} ${entry.method} ${entry.path} ${entry.status}`),
  };
  const fake = await startFakeSprinklr(options);
  const seed = Number(value('seed') ?? 0);
  if (seed > 0) fake.control.seedCases(seed);

  console.log(`Fake Sprinklr listening at ${fake.baseUrl}`);
  console.log(`  authorize: ${fake.baseUrl}/oauth/authorize`);
  console.log(`  token:     ${fake.baseUrl}/oauth/token`);
  console.log(`  api:       ${fake.baseUrl}/api/v3`);
  console.log(`  client id: ${apiKey}`);
  console.log(`  secret:    ${secret}`);
  console.log(`  callbacks: ${options.clients?.[apiKey]?.redirectUris.join(', ')}`);

  const stop = (): void => {
    void fake.close().then(() => process.exit(0));
  };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
}

function parseCursorParam(raw: string | undefined): FakeSprinklrOptions['cursorParam'] {
  if (raw === undefined || raw === 'id' || raw === 'cursor' || raw === 'both') {
    return raw ?? 'id';
  }
  throw new Error(`--cursor-param must be id, cursor or both, got ${raw}`);
}

void main();
