import { ExecOptions } from 'node:child_process';
import { exec } from './exec';
import { logger } from './logger';

type PackageManagerOutput = {
    stdout: string;
    stderr: string;
}

type PnpmCoreCommand = 'add' | 'init';
type PnpmDependencyCommand = 'webpack';
type PnpmCommand = PnpmCoreCommand | PnpmDependencyCommand;

export type PackageManagerDependencies = Record<string, string>;

const executePnpm = async (directory: string, command: PnpmCommand, ...args: string[]): Promise<PackageManagerOutput> => {
    const fullCommand = `pnpm ${command} ${args.join(' ')}`;

    const execOptions: ExecOptions = {
        cwd: directory,
    };

    logger.info(`[PackageManager#executePnpm] directory: ${directory}, fullCommand: ${fullCommand}`);

    return await exec(fullCommand, execOptions);
}

export const packageManager = {
    async addDependencies(directory: string, dependencies: PackageManagerDependencies): Promise<PackageManagerOutput> {
        const depsCount = Object.keys(dependencies).length;

        if (depsCount === 0) {
            logger.info(`[PackageManager#addDependencies] skip adding deps, depsCount=0`);
            return;
        }

        const options = [
            "--prefer-offline",
            "--config.lockfile=false",
            "--config.auto-install-peers=true",
        ];

        const dependencyArgs = Object.entries(dependencies)
            .map(([name, version]) => `${name}@${version}`);

        return await executePnpm(directory, 'add', ...dependencyArgs, ...options);
    },

    async initProject(directory: string): Promise<PackageManagerOutput> {
        return await executePnpm(directory, 'init');
    },

    async runLocalDependency(directory: string, command: PnpmDependencyCommand): Promise<PackageManagerOutput> {
        return await executePnpm(directory, command);
    },
};
