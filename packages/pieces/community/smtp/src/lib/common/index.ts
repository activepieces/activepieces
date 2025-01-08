import nodemailer from 'nodemailer';

export const smtpCommon = {
  constructConfig(auth: smtpAuthParams) {
    return {
      host: auth.host,
      port: auth.port,
      requireTLS: auth.TLS,
      auth: {
        user: auth.email,
        pass: auth.password,
      },
      connectionTimeout: 60000,
      secure: auth.port === 465,
    };
  },
  createSMTPTransport(auth: smtpAuthParams) {
    const smtpOptions = smtpCommon.constructConfig(auth);
    const transporter = nodemailer.createTransport(smtpOptions);
    return transporter;
  },
};

export type smtpAuthParams = {
  host: string;
  email: string;
  password: string;
  port: number;
  TLS: boolean;
};
