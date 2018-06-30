const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * EXAMPLE USAGE:
 */
// const { files } = findFiles('C:/SomePath');
// const duplicates = findDuplicates(files);
// console.log(duplicates);

/**
 * @returns {Object} result of recursivly searching path {string}
 * @returns .dirs {Array<string>} list of found directories
 * @returns .files {Array<string>} list of found files
 */
function findFiles(path) {
    const rawFiles = readDir(path);
    const { dirs, files } = splitByFileType(rawFiles);
    dirs.forEach((dir) => {
        const { dirs: subDirs, files: subFiles } = findFiles(dir);
        dirs.push(...subDirs);
        files.push(...subFiles);
    });
    return { dirs, files };
}

/**
 * Removes from file system all duplicated files in files {Array<string>}, keeping the first occurrence.
 */
function removeDuplicates(files) {
    const duplicates = findDuplicates(files);
    duplicates.forEach(duplicate => {
        removeFile(duplicate);
    });
}

/**
 * @returns {Array<string>} list of duplicated files in files {Array<string>}, ignoring first occurence
 */
function findDuplicates(files) {
    const fileCount = files.length;
    console.log(`Searching ${fileCount} files`);
    const hashes = {};
    const timer = new FileSystemProgressLogger();
    const duplicates = [];
    files.forEach((file, index) => {
        try {
            let hash = createFileHash(file);
            if (hash in hashes) {
                const firstOccurence = hashes[hash];
                console.log(`Found duplicate: ${file} (First occurence: ${firstOccurence})`);
                duplicates.push(file);
            } else {
                hashes[hash] = file;
            }
        }
        catch (err) {
            console.log(`INFO: Ignoring file "${file}" ${err.message}`);
        }
        timer.update(index, fileCount);
    });
    return duplicates;
}

/**
 * Basic logger for file operations
 */
function FileSystemProgressLogger() {
    this.logInterval = 5000;
    const startTime = Date.now();
    let nextTimeCheck = startTime + this.logInterval;

    /**
     * Updates logging based on fileIndex {number} and totalFiles {number}
     */
    this.update = function (fileIndex, totalFiles) {
        let time = Date.now();
        if (time >= nextTimeCheck) {
            const fileNumber = fileIndex + 1;
            const fileRatio = fileNumber / totalFiles;
            const timeElapsed = time - startTime;
            const estimatedTotalTime = timeElapsed / fileRatio;
            const secondsLeft = Math.round((estimatedTotalTime - timeElapsed) / 1000);
            console.log(`Progress: ${fileNumber}/${totalFiles}\tETA: ${secondsLeft}`);
            nextTimeCheck = time + this.logInterval;
        }
    };
}

/**
 * Recursivly removes empty directories from {path}
 */
function removeEmptyDirs(path) {
    const { dirs, files } = findFiles(path);
    const dirsByDepth = dirs.reverse();
    dirs.forEach((dir) => {
        if (isEmptyDir(dir)) {
            removeEmptyDir(dir);
            console.log('Removed empty directory: ' + file);
        }
    });
}

// HELPERS ===========================================

function createFileHash(path) {
    const data = readFile(path);
    return createHash(data);
}

function createHash(data) {
    return crypto.createHash('md5').update(data).digest('hex');
}

function removeFile(path) {
    console.log(`Removing file: ${path}`);
    fs.unlinkSync(path);
}

function removeEmptyDir(path) {
    console.log(`Removing directory: ${path}`);
    fs.rmdirSync(path);
}

function getFileSize(file) {
    return fs.lstatSync(file).size;
}

function getFileName(file) {
    return file.match();
}

function getFileBaseName(file) {
    return path.basename(file);
}

function getFileExtName(path) {
    return path.extname(path);
}

function isEmptyDir(path) {
    return readDir(path).length === 0;
}

function readFile(path) {
    return fs.readFileSync(path, { encoding: 'utf8' });

}

function readDir(path) {
    path = getNormalizedPath(path);
    const names = fs.readdirSync(path, { encoding: 'utf8' });
    const files = names.map(name => {
        file = path + '/' + name;
        return file;
    });
    return files;
}

function getNormalizedPath(path) {
    return path.replace(/\\/g, '/');
}

function isDir(path) {
    return fs.lstatSync(path).isDirectory();
}

function isFile(path) {
    return !isDir(path);
}

function splitByFileType(rawFiles) {
    const dirs = [];
    const files = [];
    for (rawFile of rawFiles) {
        if (isDir(rawFile)) {
            dirs.push(rawFile);
        } else {
            files.push(rawFile);
        }
    }
    return { dirs, files };
}
