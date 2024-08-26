import { PiecePropValueSchema } from '@activepieces/pieces-framework';
import { rabbitmqAuth } from '../..';
import amqp, { Connection } from 'amqplib';

export async function rabbitmqConnect(
  auth: PiecePropValueSchema<typeof rabbitmqAuth>,
): Promise<Connection> {
  return amqp.connect(createAmqpURI(auth), (err: Error, conn: Connection) => {
    if (err) {
      throw err;
    }

    return conn;
  });
}

function createAmqpURI(auth: PiecePropValueSchema<typeof rabbitmqAuth>): string {
  const uri = `amqp://${auth.username}:${auth.password}@${auth.host}:${auth.port}`;

  if (!auth.vhost) {
    return uri;
  }
  return `${uri}/${auth.vhost}`;
}
