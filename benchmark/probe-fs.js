export const code = async () => {
    const fs = require('fs');
    const probe = (p) => {
        try {
            fs.accessSync(p, fs.constants.R_OK);
            return { ok: true, isDir: fs.statSync(p).isDirectory() };
        } catch (e) {
            return { ok: false, code: e.code ?? 'UNKNOWN' };
        }
    };
    const paths = [
        '/usr/src/app',
        '/usr/src/app/cache',
        '/usr/src/node_modules',
        '/usr/bin',
        '/usr/local/bin/node',
        '/etc',
        '/root',
        '/root/codes',
    ];
    return {
        paths: Object.fromEntries(paths.map((p) => [p, probe(p)])),
        envKeys: Object.keys(process.env).sort(),
    };
};
