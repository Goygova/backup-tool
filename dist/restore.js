"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.restoreSnapshot = void 0;
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const snapshots_1 = require("./snapshots");
const utils_1 = require("./utils");
const restoreSnapshot = (snapshotId, targetDir, outputDir) => {
    // Load the snapshot by ID from the targetDir where snapshots are stored
    const snapshot = (0, snapshots_1.loadSnapshotById)(snapshotId, targetDir);
    if (!snapshot) {
        console.log(`Snapshot with id ${snapshotId} not found`);
        return;
    }
    console.log(`Restoring snapshot ${snapshotId} to ${outputDir}...`);
    // Ensure the output directory exists
    fs.ensureDirSync(outputDir);
    // Restore all files and directories from the snapshot to the output directory
    Object.keys(snapshot.files).forEach((filePath) => {
        const snapshotFile = snapshot.files[filePath];
        const restoredPath = path.join(outputDir, filePath); // Files are restored to outputDir
        // Ensure the directory for the file exists in the outputDir
        const dirPath = path.dirname(restoredPath);
        fs.ensureDirSync(dirPath);
        // Check if the file exists, and if not, restore it
        if (fs.existsSync(restoredPath)) {
            const currentFileContent = fs.readFileSync(restoredPath, 'utf-8');
            const currentFileHash = (0, utils_1.getFileHash)(Buffer.from(currentFileContent, 'utf-8'));
            // If the hash doesn't match, restore the file
            if (currentFileHash !== snapshotFile.hash) {
                console.log(`File changed: ${filePath}. Restoring it...`);
                restoreFile(restoredPath, snapshotFile); // Restore the file in outputDir
            }
            else {
                console.log(`File is up-to-date: ${filePath}`);
            }
        }
        else {
            // If the file doesn't exist in outputDir, restore it
            console.log(`File missing: ${filePath}. Restoring it...`);
            restoreFile(restoredPath, snapshotFile); // Restore the file in outputDir
        }
    });
};
exports.restoreSnapshot = restoreSnapshot;
// Helper function to restore a file from the snapshot
const restoreFile = (filePath, snapshotFile) => {
    console.log(`Restoring file: ${filePath}`);
    // Restore the file content from the snapshot
    const restoredContent = snapshotFile.content;
    fs.outputFileSync(filePath, restoredContent);
    console.log(`File ${filePath} restored with hash ${snapshotFile.hash}`);
};
