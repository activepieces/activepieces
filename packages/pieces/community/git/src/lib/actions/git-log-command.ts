/**
 * 🔐 Activepieces Issue #7902 Fix — GitLogCommand Command Injection Vulnerability Patch
 * Reward: $500.00 USD (Algora Bounty)
 * Developer: Samarth Nimangre (@Samarth1306w)
 */

import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export interface GitLogOptions {
    repoPath: string;
    maxCount?: number;
    branch?: string;
    author?: string;
}

export class GitLogCommand {
    /**
     * Sanitizes inputs and executes git log safely using execFile to prevent command injection
     */
    public static async execute(options: GitLogOptions): Promise<string> {
        const args: string[] = ['log'];

        if (options.maxCount && Number.isInteger(options.maxCount)) {
            args.push('-n', options.maxCount.toString());
        }

        if (options.branch) {
            const sanitizedBranch = options.branch.replace(/[^a-zA-Z0-9_\-\.\/]/g, '');
            if (sanitizedBranch) {
                args.push(sanitizedBranch);
            }
        }

        if (options.author) {
            args.push(`--author=${options.author.replace(/["'$`\\]/g, '')}`);
        }

        try {
            const { stdout } = await execFileAsync('git', args, {
                cwd: options.repoPath,
                maxBuffer: 10 * 1024 * 1024
            });
            return stdout;
        } catch (error: any) {
            throw new Error(`GitLogCommand execution failed safely: ${error.message}`);
        }
    }
}
