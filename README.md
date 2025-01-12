# Backup Tool

## Overview

The Backup Tool is a command-line utility for managing file snapshots. It allows users to create, list, restore, and prune snapshots for file versioning and backup purposes.

## Key Features

- Capture directory snapshots, including file names, hashes, and contents.
- Restore files to a target location from saved snapshots.
- List snapshots sorted by timestamp.
- Prune old or unused snapshots to optimize storage.
- Designed for scalability and future database integration.

## Language and Framework

- **TypeScript:** Ensures type safety and reliability, reducing runtime errors.
- **Node.js:** Provides cross-platform compatibility and fast prototyping capabilities.

## Design Decisions

For this prototype, JSON was chosen for simplicity and quick iteration. It is human-readable, portable, and eliminates the need for database setup. The design is modular, allowing easy integration of a database in future iterations.

## Installation

Prerequisites:

- Node.js (v16 or later) and npm installed on your system.

To install the Backup Tool, clone the repository and install the necessary dependencies:

```bash
npm install
```

## Usage

To use the Backup Tool, run the following commands:

### Create a Snapshot

Creates a snapshot of the specified directory, including the file content and hash for each file.
The create snapshot operation involves scanning a directory, capturing file metadata (such as filenames and paths), and storing the content of these files along with their hashes in a snapshot file. This snapshot is stored as a JSON file in the output directory.

```bash
npm run snapshot <targetDir> <outputDir>
```

- `<targetDir>`: The path to the directory that should be captured in the snapshot.
- `<outputDir>`: The directory where the snapshot JSON file will be saved.

Example input:

```bash
npm run snapshot ./test_data ./snapshots
```

Example output:

```
Creating Snapshots:
Traversing directory: test_data/subdir2
Traversing directory: test_data/subdir1
Snapshot saved to: snapshots/d8d684c0-e115-4d91-8bc5-084f26334e26.json
Snapshot size (unique files): 60 bytes

```

Note: if you want to create the same snapshot with the same UNCHANGED files you will need to remove data from hashMap in ./storage folder first, otherwise it won't crate a new snapshot even if you remove snapshot from ./snapshots folder.

If you want to check if it creates a new snapshot only for the updated file, you need to change any file in test_data directory, then run command to create a snapshot again and it should only creates snapshot with an updated file.

### List Snapshots

The list snapshots operation lists all snapshots available in the snapshot directory, providing a simple interface to see which snapshots are available to restore or prune. The snapshots are sorted by timestamp.

```bash
npm run list <targetDir>
```

- `<targetDir>`: The directory where snapshot files are stored.

Example input:

```bash
npm run list ./snapshots
```

Example output:

```
1 d8d684c0-e115-4d91-8bc5-084f26334e26 2025-01-11 12:47:18 60 B 60 B
```

### Restore from a Snapshot

Restoring from a snapshot involves taking the file data from a snapshot and copying it to the target directory. This is useful for reverting a directory to a previous state.

```bash
npm run restore <snapshotId> <targetDir> <outputDir>
```

- `<snapshotId>`: The unique identifier of the snapshot to restore.
- `<targetDir>`: The directory where the snapshot JSON file is stored.
- `<outputDir>`: The directory where the snapshot files will be restored.

Example input (use an id from running a list command):

```bash
npm run restore 956acbbc-fe05-4011-af67-00ff0919c565 ./snapshots ./restore_test
```

Example output:

```
Restoring snapshot...

- Restoring snapshot "956acbbc-fe05-4011-af67-00ff0919c565" to "./restore_test"...
- Restoring file: test_data/file1.txt
- Snapshot "956acbbc-fe05-4011-af67-00ff0919c565" restored successfully.

```

### Prune Snapshots

The prune snapshots operation deletes a specific snapshot file and removes any files that are no longer referenced by any of the remaining snapshots. This helps in managing storage and removing unused data.

```bash
npm run prune <targetDir> <snapshotId>
```

- `<targetDir>`: The path to the directory containing snapshot files.
- `<snapshotId>`: The ID of the snapshot to be removed.

Example input (use an id from running a list command)

```bash
npm run prune ./snapshots 956acbbc-fe05-4011-af67-00ff0919c565
```

Example output:

```
Pruning Snapshots:

- Pruning snapshot with ID: `956acbbc-fe05-4011-af67-00ff0919c565`
- Deleted snapshot file: `snapshots/956acbbc-fe05-4011-af67-00ff0919c565.json`
- Successfully pruned snapshot `956acbbc-fe05-4011-af67-00ff0919c565` and updated the hash map.
```

### Hash Map Usage

In ./storage folder there is HashMap json file. It's used for following reasons:

- When creating a snapshot, the hash map is populated with file hashes and their corresponding contents.
  This allows future operations to quickly verify the integrity of files.
  The hash map helps in identifying files that already exist in the backup and avoiding redundancy (if the same file appears in multiple snapshots).
- When restoring a snapshot, the hash map helps track which files are included in the snapshot, ensuring that files are restored to the correct state. If multiple snapshots reference the same file, the hash map ensures that the correct version of the file (from the selected snapshot) is restored. Before restoration, the hash map ensures that only files referenced by the snapshot are copied, avoiding extraneous files being restored.
- The hash map is critical for pruning operations. After deleting a snapshot, the hash map ensures that only files still referenced by the remaining snapshots are retained.
  The hash map helps identify which files are no longer referenced by any snapshot and can be safely deleted. Without it, the tool might accidentally delete files still referenced by other snapshots.This makes pruning efficient and safe, ensuring no data loss from the remaining snapshots.

### Tests

```bash
npm run test
```
