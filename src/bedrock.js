const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const BEDROCK_DIR = '.bedrock';
const PRINCIPLES_DIR = path.join(BEDROCK_DIR, 'principles');
const HASH_FILE = path.join(BEDROCK_DIR, 'bedrock.hash');
const SIGNATURE_SUFFIX = '.sig';

function ensureDirs() {
    if (!fs.existsSync(BEDROCK_DIR)) fs.mkdirSync(BEDROCK_DIR);
    if (!fs.existsSync(PRINCIPLES_DIR)) fs.mkdirSync(PRINCIPLES_DIR);
}

function hashFile(filePath) {
    const fileBuffer = fs.readFileSync(filePath);
    return crypto.createHash('sha256').update(fileBuffer).digest('hex');
}

function generateBedrockHash() {
    ensureDirs();
    const principleFiles = fs.readdirSync(PRINCIPLES_DIR).sort();
    if (principleFiles.length === 0) {
        console.warn('Warning: No principles found. Hash will be empty.');
        fs.writeFileSync(HASH_FILE, '');
        return '';
    }
    const combinedHashes = principleFiles.map(file => {
        const filePath = path.join(PRINCIPLES_DIR, file);
        return hashFile(filePath);
    }).join('');

    const bedrockHash = crypto.createHash('sha256').update(combinedHashes).digest('hex');
    fs.writeFileSync(HASH_FILE, bedrockHash);
    return bedrockHash;
}

function getBedrockHash() {
    if (!fs.existsSync(HASH_FILE)) {
        throw new Error('bedrock.hash not found. Run "bedrock principles:hash" first.');
    }
    return fs.readFileSync(HASH_FILE, 'utf-8');
}

function signArtifact(artifactPath) {
    const bedrockHash = getBedrockHash();
    const artifactHash = hashFile(artifactPath);
    const signature = crypto.createHash('sha256').update(artifactHash + bedrockHash).digest('hex');
    const signaturePath = artifactPath + SIGNATURE_SUFFIX;
    fs.writeFileSync(signaturePath, signature);
    return signature;
}

function verifyArtifact(artifactPath) {
    const signaturePath = artifactPath + SIGNATURE_SUFFIX;
    if (!fs.existsSync(signaturePath)) {
        return { valid: false, error: 'Signature file not found.' };
    }
    const bedrockHash = getBedrockHash();
    const artifactHash = hashFile(artifactPath);
    const expectedSignature = crypto.createHash('sha256').update(artifactHash + bedrockHash).digest('hex');
    const actualSignature = fs.readFileSync(signaturePath, 'utf-8');

    return { valid: actualSignature === expectedSignature };
}

module.exports = { ensureDirs, generateBedrockHash, getBedrockHash, signArtifact, verifyArtifact, PRINCIPLES_DIR };