import jwt, { SignOptions, VerifyOptions } from 'jsonwebtoken';
import { Principal, PrincipalType, User } from 'shared';

const SECRET = 'SUPER_SECRET';
const ALGORITHM = 'HS256';
const KEY_ID = '1';
const EXPIRES_IN_SECONDS = 3600;
const ISSUER = 'activepieces';

export const tokenUtils = {
    encode: async (user: User): Promise<string> => {
        const principal: Principal = {
            id: user.id,
            type: PrincipalType.USER,
        };

        const signOptions: SignOptions = {
            algorithm: ALGORITHM,
            keyid: KEY_ID,
            expiresIn: EXPIRES_IN_SECONDS,
            issuer: ISSUER,
        };

        return new Promise((resolve, reject) => {
            jwt.sign(principal, SECRET, signOptions, (err, token) => {
                if (err) {
                    return reject(err);
                }

                resolve(token);
            });
        });
    },

    decode: async (token: string): Promise<Principal> => {
        const verifyOptions: VerifyOptions = {
            algorithms: [ALGORITHM],
            issuer: ISSUER,
        };

        return new Promise((resolve, reject) => {
            jwt.verify(token, SECRET, verifyOptions, (err, payload) => {
                if (err) {
                    return reject(err);
                }

                resolve(payload as Principal);
            });
        });
    }
};
