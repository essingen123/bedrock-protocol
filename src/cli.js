#!/usr/bin/env node
const { Command } = require('commander');
const fs = require('fs');
const path = require('path');
const bedrock = require('./bedrock');
const program = new Command();

program.name('bedrock').description('CLI for the Ethical Bedrock Hash Protocol.');

program.command('init').description('Initializes the .bedrock directory.').action(() => {
    bedrock.ensureDirs();
    console.log('Ethical Bedrock initialized.');
});

const principles = program.command('principles').description('Manage principle documents.');
principles.command('add <file>').description('Adds a principle document.').action((file) => {
    if (!fs.existsSync(file)) return console.error(`Error: File not found at ${file}`);
    bedrock.ensureDirs();
    const dest = path.join(bedrock.PRINCIPLES_DIR, path.basename(file));
    fs.copyFileSync(file, dest);
    console.log(`Added principle: ${path.basename(file)}. Run "bedrock principles:hash" to update.`);
});
principles.command('hash').description('Generates the bedrock.hash.').action(() => {
    try {
        console.log(`Generated bedrock.hash: ${bedrock.generateBedrockHash()}`);
    } catch (e) { console.error(e.message); }
});

program.command('sign <artifact>').description('Signs an artifact.').action((artifact) => {
    try {
        console.log(`Signed ${artifact}. Signature: ${bedrock.signArtifact(artifact)}`);
    } catch (e) { console.error(e.message); }
});

program.command('verify <artifact>').description('Verifies an artifact.').action((artifact) => {
    try {
        const { valid, error } = bedrock.verifyArtifact(artifact);
        if (valid) {
            console.log(`✅ VERIFIED: ${artifact} is aligned.`);
        } else {
            console.error(`❌ FAILED: ${artifact} is NOT aligned. ${error || ''}`);
            process.exit(1);
        }
    } catch (e) {
        console.error(e.message);
        process.exit(1);
    }
});

program.parse(process.argv);