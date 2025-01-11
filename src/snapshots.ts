import * as fs from 'fs-extra';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { formatTimestamp, getFileHash, loadHashMap, saveHashMap } from './utils';

export type Snapshot = {
  id: string;
  timestamp: Date;
  files: Record<string, { hash: string, content: string }>;
  snapshotSize: number;
  directorySize: number;
};

/**
 * Creates a snapshot of a target directory by traversing its contents and comparing them to a hash map.
 * 
 * This function generates a unique snapshot ID using UUID, retrieves the current timestamp, and initializes 
 * an empty object to store the files in the snapshot. It then traverses the target directory recursively, 
 * calculating the hash of each file and comparing it to the hash map. If a file's hash is not found in the 
 * hash map, the file's content is read and added to the snapshot object. The function also calculates the 
 * total size of the directory and the snapshot. If no changes are detected during the traversal, the function 
 * returns null, indicating that no snapshot was created.
 * 
 * @param {string} targetDir - The target directory for which a snapshot needs to be created.
 * 
 * @returns {Promise<Snapshot | null>} A promise that resolves to a snapshot object if changes are detected, 
 *                                    or null if no changes are found.
 */
export const createSnapshot = async (targetDir: string): Promise<Snapshot | null> => {
  const snapshotId = uuidv4();
  const timestamp = new Date();
  const files: Record<string, { hash: string; content: string }> = {};
  const hashMap = loadHashMap();

  let directorySize = 0;
  let snapshotSize = 0;
  let hasChanges = false;

  const traverseDirectory = async (dir: string) => {
    const items = await fs.promises.readdir(dir);
    await Promise.all(items.map(async (item) => {
      const fullPath = path.join(dir, item);
      const stat = await fs.promises.stat(fullPath);

      if (stat.isDirectory()) {
        console.log(`Traversing directory: ${fullPath}`);
        await traverseDirectory(fullPath);
      } else if (stat.isFile()) {
        directorySize += stat.size;

        const fileHash = getFileHash(await fs.promises.readFile(fullPath));
        if (!hashMap[fileHash]) {
          const fileContent = await fs.promises.readFile(fullPath, 'utf-8');
          files[fullPath] = { hash: fileHash, content: fileContent };
          hashMap[fileHash] = fileContent;
          snapshotSize += stat.size;
          hasChanges = true;
        }
      }
    }));
  };

  try {
    await traverseDirectory(targetDir);
  } catch (error) {
    throw new Error(`Error traversing directory ${targetDir}: ${error}`);
  }

  if (!hasChanges) {
    console.log('No changes detected; no snapshot created.');
    return null;
  }

  const snapshot = {
    id: snapshotId,
    timestamp,
    files,
    snapshotSize,
    directorySize,
  };
  return snapshot;
};


/**
 * Saves a snapshot object to a JSON file in the specified output directory.
 * 
 * This function takes a snapshot object and an output directory as input. It constructs the file name 
 * using the snapshot ID and writes the snapshot object to a JSON file in the output directory. The function 
 * also loads the existing hash map, updates it with the new files from the snapshot, and saves the updated 
 * hash map back to the file system. The function ensures that the output directory exists and writes the 
 * snapshot object to a JSON file with proper formatting. It logs the path to the saved snapshot file and 
 * the disk usage of the snapshot.
 * 
 * @param {Snapshot} snapshot - The snapshot object to be saved.
 * @param {string} outputDir - The output directory where the snapshot file will be saved.
 * 
 * @returns {Promise<void>} A promise that resolves once the snapshot is saved to the output directory.
 */
export const saveSnapshot = async (snapshot: Snapshot, outputDir: string): Promise<void> => {
  const fileName = `${snapshot.id}.json`;
  const filePath = path.join(outputDir, fileName);

  await fs.ensureDir(outputDir);

  const snapshotToSave = {
    ...snapshot,
    timestamp: formatTimestamp(snapshot.timestamp),
  };

  let existingHashMap = loadHashMap();

  // Updates the hash map with actual file content from the snapshot
  for (const [filePath, fileData] of Object.entries(snapshot.files)) {
    const { hash, content } = fileData as { hash: string; content: string };

    if (!existingHashMap[hash]) {
      existingHashMap[hash] = content;
    }
  }

  await fs.writeJson(filePath, snapshotToSave, { spaces: 2 });

  saveHashMap(existingHashMap);

  console.log(`Snapshot saved to: ${filePath}`);
  console.log(`- Snapshot size (unique files): ${snapshot.snapshotSize} bytes`);
};
