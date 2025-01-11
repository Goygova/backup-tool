import * as fs from 'fs-extra';
import * as path from 'path';
import { loadHashMap } from './utils';
import { Snapshot } from './snapshots';

/**
 * Restores a snapshot to a target directory by reading the snapshot file and restoring its contents.
 * 
 * This function first checks if the snapshots directory exists and is accessible. It then reads the snapshot 
 * file with the given ID and parses it as JSON. For each file in the snapshot, the function creates the 
 * corresponding directory structure in the output directory and restores the file content by retrieving it 
 * from the hash map. If the content for a file's hash is not found in the hash map, the file is skipped with 
 * a warning. The function logs the progress and completion of the restoration process.
 * 
 * @param {string} snapshotId - The ID of the snapshot to restore.
 * @param {string} snapshotsDir - The directory where snapshots are stored.
 * @param {string} outputDir - The directory where the snapshot should be restored.
 * 
 * @returns {Promise<void>} A promise that resolves once the snapshot has been restored.
 */
export const restoreSnapshot = async (
  snapshotId: string,
  snapshotsDir: string,
  outputDir: string,
): Promise<void> => {
  try {
    await fs.promises.access(snapshotsDir);
  } catch (error: any) {
    throw new Error(`Error accessing directory "${snapshotsDir}": ${error.message}`);
  }

  const snapshotFilePath = path.join(snapshotsDir, `${snapshotId}.json`);
  const hashMap = loadHashMap();

  try {
    await fs.promises.access(snapshotFilePath);
  } catch (error: any) {
    console.error(`Snapshot file with ID "${snapshotId}" not found.`);
    throw new Error(`Snapshot file not found: ${snapshotFilePath}`);
  }

  try {
    const snapshotContent = await fs.promises.readFile(snapshotFilePath, 'utf-8');
    const snapshot: Snapshot = JSON.parse(snapshotContent);

    console.log(`Restoring snapshot "${snapshotId}" to "${outputDir}"...`);

    await fs.promises.mkdir(outputDir, { recursive: true });

    // Restores files from the snapshot
    for (const [filePath, fileHashObj] of Object.entries(snapshot.files)) {
      const restoredPath = path.join(outputDir, filePath);
      const dirPath = path.dirname(restoredPath);

      // Ensures the directory for the file exists in the outputDir
      await fs.promises.mkdir(dirPath, { recursive: true });

      // Retrieves the file content from the hash map and restore it
      if (hashMap[fileHashObj.hash]) {
        console.log(`Restoring file: ${filePath}`);
        await fs.promises.writeFile(restoredPath, hashMap[fileHashObj.hash]);
      } else {
        console.warn(`Content for hash "${fileHashObj.hash}" not found in hash map. Skipping file: ${filePath}`);
      }
    }

    console.log(`Snapshot "${snapshotId}" restored successfully.`);
  } catch (error: any) {
    console.error(`Failed to restore snapshot "${snapshotId}":`, error.message);
    throw error;
  }
};
