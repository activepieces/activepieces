import jwt, { SignOptions, VerifyOptions } from 'jsonwebtoken';
import { Principal, PrincipalType, User } from 'shared';
import {ActivepiecesError, ErrorCode} from "../../helper/activepieces-error";

const SECRET = 'SUPER_SECRET';
const ALGORITHM = 'HS256';
const KEY_ID = '1';
// TODO MAKE IT SHORT LIVE WITH REFRESH TOKEN STRATEGY
const EXPIRES_IN_SECONDS = 7 * 24 * 3600;
const ISSUER = 'activepieces';

export const tokenUtils = {
    encode: async (principal: Principal): Promise<string> => {
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
                if(token === undefined){
                    reject();
                }else {
                    resolve(token);
                }
            });
        });
    },

    decode: async (token: string): Promise<Principal> => {
        try {
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
        }catch (e){
            throw new ActivepiecesError({code: ErrorCode.INVALID_BEARER_TOKEN, params: {}})
        }
    }
};
