import { Command } from 'commander';
import { benchmarkCommand } from './lib/commands/benchmark';

const program = new Command()
    .name('activepieces-benchmark')
    .description('Standalone entry that only loads the benchmark command, avoiding the transitive imports of the full CLI.');

program.addCommand(benchmarkCommand);
program.parseAsync(['node', 'benchmark-only', 'benchmark', ...process.argv.slice(2)]).catch((err) => {
    console.error(err);
    process.exit(1);
});
