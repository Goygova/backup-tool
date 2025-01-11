import { listSnapshots } from '../src/list';
import { restoreSnapshot } from '../src/restore';
import { pruneSnapshots } from '../src/prune';
import { createSnapshot, saveSnapshot } from '../src/snapshots';
const command = process.argv[2];
const targetDir = process.argv[3];
const outputDir = process.argv[4];
const snapshotId = process.argv[5];
switch (command) {
    case 'snapshot':
        if (!targetDir) {
            console.log('Please provide a target directory for snapshot.');
            process.exit(1);
        }
        console.log('Creating Snapshots:');
        const snapshot = createSnapshot(targetDir);
        saveSnapshot(snapshot, outputDir);
    case 'list':
        if (!targetDir) {
            console.log('Please provide a target directory for listing snapshots.');
            process.exit(1);
        }
        console.log('Listing Snapshots:');
        listSnapshots(targetDir);
        break;
    case 'restore':
        if (!snapshotId || !targetDir || !outputDir) {
            console.log('Please provide a snapshot ID, target directory, and output directory for restore.');
            process.exit(1);
        }
        console.log('Restoring snapshot...');
        restoreSnapshot(snapshotId, targetDir, outputDir);
        break;
    case 'prune':
        console.log('Pruning Snapshots:');
        pruneSnapshots(targetDir, [snapshotId]);
        break;
    default:
        console.log('Unknown command');
}
