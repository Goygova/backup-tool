import * as fs from 'fs-extra';
import * as path from 'path';
import { updateHashMap } from './utils'; 

/**
 * Removes a specific snapshot file from the snapshot directory and updates the hash map.
 * @param {string} snapshotDir - The directory containing snapshot files.
 * @param {string} snapshotIdToRemove - The ID of the snapshot file to be removed (without file extension).
 * @returns {Promise<void>} Resolves when the snapshot is successfully removed and the hash map is updated.
 *
 * @throws {Error} Throws an error if the snapshot directory is inaccessible, the snapshot file cannot be found,
 * or an error occurs during file removal or hash map update.
 *
 */
export const pruneSnapshot = async (
  snapshotDir: string,
  snapshotIdToRemove: string
): Promise<void> => {
  const snapshotFilePath = path.join(snapshotDir, `${snapshotIdToRemove}.json`);

  try {
    await fs.promises.access(snapshotDir);

    if (!(await fs.pathExists(snapshotFilePath))) {
      console.error(`Snapshot with ID "${snapshotIdToRemove}" not found.`);
      return;
    }

    console.log(`Pruning snapshot with ID: ${snapshotIdToRemove}`);

    // Read the snapshot to get the file hashes to remove
    const snapshotContent = await fs.promises.readFile(snapshotFilePath, 'utf-8');
    const snapshot = JSON.parse(snapshotContent) as {
      files: { [filePath: string]: { hash: string; content: string } };
    };

    const hashesToRemove = Object.values(snapshot.files).map(file => file.hash);

    // Delete the snapshot file
    await fs.promises.unlink(snapshotFilePath);
    console.log(`Deleted snapshot file: ${snapshotFilePath}`);

    // Update the hash map by removing the hashes from this snapshot
    updateHashMap(hashesToRemove);
    console.log(`Successfully updated the hash map.`);
  } catch (error: any) {
    console.error(`Error occurred while pruning snapshot: ${error.message}`);
  }
};





