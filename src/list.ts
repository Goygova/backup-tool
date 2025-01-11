import * as fs from 'fs-extra';
import * as path from 'path';
import { Snapshot } from './snapshots';
import { formatSize } from './utils';

/**
 * Lists all snapshots stored in the directory.
 * 
 * This function first checks if the snapshots directory exists and is accessible. It then reads the contents 
 * of the directory and filters out any files that do not have a '.json' extension. For each valid snapshot 
 * file, the function reads the file's contents, parses it as JSON, and adds it to an array of snapshots. The 
 * snapshots are then sorted by timestamp and printed to the console in a tabular format, showing the index, 
 * snapshot ID, timestamp, directory size, and snapshot size.
 * 
 * @param {string} snapshotsDir - The directory where snapshots are stored.
 * 
 * @returns {Promise<void>} A promise that resolves once the snapshots have been listed.
 */
export const listSnapshots = async (snapshotsDir: string): Promise<void> => {
  try {
    await fs.promises.access(snapshotsDir);
  } catch (error: any) {
    throw new Error(`Error accessing directory "${snapshotsDir}": ${error.message}`);
  }

  let snapshotFiles: string[] = [];
  try {
    snapshotFiles = (await fs.promises.readdir(snapshotsDir)).filter((file) => file.endsWith('.json'));
  } catch (error: any) {
    console.error(`Error reading directory "${snapshotsDir}":`, error.message);
    return;
  }

  if (snapshotFiles.length === 0) {
    console.log('No snapshots found.');
    return;
  }

  const snapshots: Snapshot[] = [];
  for (const file of snapshotFiles) {
    const snapshotPath = path.join(snapshotsDir, file);
    try {
      const data = await fs.promises.readFile(snapshotPath, 'utf-8');
      const parsedSnapshot = JSON.parse(data);
      snapshots.push(parsedSnapshot);
    } catch (error) {
      console.warn(`Skipping invalid snapshot file "${file}": ${error}`);
    }
  }

  // Sorts snapshots by timestamp (fallback to a default date for invalid/missing timestamps)
  snapshots.sort((a, b) => {
    const dateA = new Date(a.timestamp).getTime() || 0;
    const dateB = new Date(b.timestamp).getTime() || 0;
    return dateA - dateB;
  });

  if (snapshots.length === 0) {
    console.log('No valid snapshots found.');
    return;
  }

  console.log('INDEX  SNAPSHOT ID                                 TIMESTAMP      DIRECTORY_SIZE   SNAPSHOT_SIZE');

  snapshots.forEach((snapshot: Snapshot, index: number) => {
    const { id, timestamp, directorySize, snapshotSize } = snapshot;
    const formattedDirectorySize = formatSize(directorySize);
    const formattedSnapshotSize = formatSize(snapshotSize);

    console.log(
      `${(index + 1).toString().padEnd(6)}${id.padEnd(40)}${timestamp.toString().padEnd(25)}${formattedDirectorySize.padEnd(15)}${formattedSnapshotSize}`
    );
  });
};



