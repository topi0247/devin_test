// Simple test to verify extension can be loaded
const fs = require('fs');
const path = require('path');

console.log('Testing VS Code extension structure...');

// Check if main files exist
const requiredFiles = [
    'package.json',
    'src/extension.ts',
    'src/previewProvider.ts',
    'src/textParser.ts',
    'src/settingsManager.ts'
];

let allFilesExist = true;
requiredFiles.forEach(file => {
    if (fs.existsSync(file)) {
        console.log(`✅ ${file} exists`);
    } else {
        console.log(`❌ ${file} missing`);
        allFilesExist = false;
    }
});

// Check compiled output
if (fs.existsSync('out/extension.js')) {
    console.log('✅ Compiled extension.js exists');
} else {
    console.log('❌ Compiled extension.js missing');
    allFilesExist = false;
}

console.log(allFilesExist ? '✅ Extension structure is valid' : '❌ Extension structure has issues');
