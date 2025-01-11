import * as crypto from 'crypto';
import * as path from 'path';
import { format } from 'date-fns';
import * as fs from 'fs-extra';

// Function to calculate the hash of a file
export const getFileHash = (fileContent: Buffer): string => {
  const hash = crypto.createHash('sha256');
  hash.update(fileContent);
  return hash.digest('hex');
}

// Formats a file size in bytes into a human-readable string
export const formatSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(2)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(2)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
};

// Function to format a timestamp into a string
export const formatTimestamp = (date: Date): string => {
  return format(date, 'yyyy-MM-dd HH:mm:ss');
}

// Function to save the hash map to a file
export const saveHashMap = (hashMap: Record<string, string>): void => {
  const hashMapFilePath = path.join(__dirname, '../storage/hashMap.json');
  fs.writeFileSync(hashMapFilePath, JSON.stringify(hashMap, null, 2));
};

// Function to load the existing hash map from a file
export const loadHashMap = (): Record<string, string> => {
  const hashMapFilePath = path.join(__dirname, '../storage/hashMap.json');

  if (fs.existsSync(hashMapFilePath)) {
    const fileContent = fs.readFileSync(hashMapFilePath, 'utf-8');
    
    if (fileContent.trim() !== '') {
      try {
        return JSON.parse(fileContent);
      } catch (error) {
        console.error("Error parsing JSON:", error);
      }
    }
  }

  return {};
};

// Helper function to update the hash map
export const updateHashMap = (hashesToRemove: string[]): void => {
  let existingHashMap = loadHashMap();

  for (const hash of hashesToRemove) {
    if (existingHashMap[hash]) {
      delete existingHashMap[hash];
    }
  }

  saveHashMap(existingHashMap);
  console.log(`Hash map updated successfully.`);
};
