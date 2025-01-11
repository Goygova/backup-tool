import { Command } from 'commander';
import { listSnapshots } from './src/list';
import { restoreSnapshot } from './src/restore';
import { pruneSnapshot } from './src/prune';
import { createSnapshot, saveSnapshot } from './src/snapshots';

const program = new Command();

// Snapshot command
program
  .command('snapshot <targetDir> <outputDir>')
  .description('Create a snapshot and save it')
  .action(async (targetDir, outputDir) => {
    console.log('Creating Snapshots:');
    const snapshot = await createSnapshot(targetDir);
    if (snapshot) {
      await saveSnapshot(snapshot, outputDir);
    }
  });

// List command
program
  .command('list <targetDir>')
  .description('List snapshots in the target directory')
  .action((targetDir) => {
    console.log('Listing Snapshots:');
    listSnapshots(targetDir);
  });

// Restore command
program
  .command('restore <snapshotId> <targetDir> <outputDir>')
  .description('Restore a snapshot from the target directory')
  .action((snapshotId, targetDir, outputDir) => {
    console.log('Restoring snapshot...');
    restoreSnapshot(snapshotId, targetDir, outputDir);
  });

// Prune command
program
  .command('prune <targetDir> <snapshotId>')
  .description('Prune (delete) snapshots from the target directory')
  .action(async (targetDir, snapshotId) => {
    console.log('Pruning Snapshots:');
    await pruneSnapshot(targetDir, snapshotId);
  });

program.parse(process.argv);
