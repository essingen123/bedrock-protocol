
import React, { useState, useCallback } from 'react';
import { DropZone } from './components/DropZone';
import { VerificationResult } from './types';
import { readFileAsArrayBuffer, sha256 } from './utils/crypto';

// Replicating user's original CSS as Tailwind classes for a modern, dark aesthetic
const bodyClasses = "bg-gray-900 text-gray-200 font-mono flex justify-center items-center min-h-screen p-4 box-border";
const containerClasses = "max-w-2xl w-full text-center";
const cardClasses = "bg-gray-800 p-6 sm:p-8 my-8 rounded-lg border border-gray-700 shadow-lg";
const titleClasses = "text-3xl sm:text-4xl font-bold text-teal-300";
const subtitleClasses = "text-gray-400 mt-2";
const cardTitleClasses = "text-2xl font-semibold text-gray-100 mb-4";
const hashDisplayClasses = "bg-gray-900 p-4 rounded-md text-sm text-cyan-300 break-all min-h-[50px] flex items-center justify-center border border-gray-700";
const resultDisplayClasses = "mt-6 text-lg min-h-[1.5rem] font-semibold";
const verifiedClasses = "text-green-400";
const failedClasses = "text-red-400";
const dropZoneTextClasses = "text-gray-500";
const footerClasses = "text-gray-600 text-sm mt-8";

const App: React.FC = () => {
    const [bedrockHash, setBedrockHash] = useState<string | null>(null);
    const [result, setResult] = useState<VerificationResult | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const handleHashDrop = useCallback(async (files: FileList) => {
        if (files && files.length > 0) {
            try {
                const hash = (await files[0].text()).trim();
                setBedrockHash(hash);
                setResult(null); // Clear previous results
            } catch (error) {
                console.error("Error reading hash file:", error);
                setResult({ message: 'Error reading hash file.', isSuccess: false });
            }
        }
    }, []);

    const handleArtifactDrop = useCallback(async (files: FileList) => {
        setResult(null);
        setIsLoading(true);

        if (!bedrockHash) {
            setResult({ message: 'Please load a bedrock.hash file first.', isSuccess: false });
            setIsLoading(false);
            return;
        }

        if (files.length < 2) {
            setResult({ message: 'Please drop both the artifact and its .sig file.', isSuccess: false });
            setIsLoading(false);
            return;
        }

        const artifactFile = Array.from(files).find(f => !f.name.endsWith('.sig'));
        const sigFile = Array.from(files).find(f => f.name.endsWith('.sig'));

        if (!artifactFile || !sigFile) {
            setResult({ message: 'Could not find both an artifact and its .sig file.', isSuccess: false });
            setIsLoading(false);
            return;
        }

        try {
            const artifactBuffer = await readFileAsArrayBuffer(artifactFile);
            const artifactHash = await sha256(artifactBuffer);
            
            const expectedSigHashInput = artifactHash + bedrockHash;
            const expectedSigHashBuffer = new TextEncoder().encode(expectedSigHashInput);
            const expectedSignature = await sha256(expectedSigHashBuffer);

            const actualSignature = (await sigFile.text()).trim();

            if (actualSignature === expectedSignature) {
                setResult({ message: `VERIFIED: ${artifactFile.name} is aligned.`, isSuccess: true });
            } else {
                setResult({ message: `FAILED: ${artifactFile.name} is NOT aligned.`, isSuccess: false });
            }
        } catch (error) {
            console.error("Error during verification:", error);
            setResult({ message: 'An error occurred during verification.', isSuccess: false });
        } finally {
            setIsLoading(false);
        }
    }, [bedrockHash]);
    
    // Applying body classes to the root element's parent for full-page background
    document.body.className = bodyClasses;

    return (
        <div className={containerClasses}>
            <header>
                <h1 className={titleClasses}>Ethical Bedrock Hash</h1>
                <p className={subtitleClasses}>Cryptographically Verifiable Trust in Software</p>
            </header>
            <main>
                <div className={cardClasses}>
                    <h2 className={cardTitleClasses}>1. Load Bedrock Hash</h2>
                    <DropZone onDropFiles={handleHashDrop} className="p-4">
                        <div className={hashDisplayClasses}>
                            {bedrockHash ? <span>{bedrockHash}</span> : <span className={dropZoneTextClasses}>Drop a bedrock.hash file here</span>}
                        </div>
                    </DropZone>
                </div>

                <div className={cardClasses}>
                    <h2 className={cardTitleClasses}>2. Verify Artifact</h2>
                    <DropZone onDropFiles={handleArtifactDrop}>
                        <p className={dropZoneTextClasses}>Drag & Drop an artifact and its .sig file here</p>
                    </DropZone>
                    {isLoading && <div className={`${resultDisplayClasses} text-yellow-400`}>Verifying...</div>}
                    {result && !isLoading && (
                        <div className={resultDisplayClasses}>
                             <span className={result.isSuccess ? verifiedClasses : failedClasses}>
                                {result.isSuccess ? '✅' : '❌'} {result.message}
                            </span>
                        </div>
                    )}
                </div>
            </main>
            <footer className={footerClasses}>
                <p>Inspired by the AĩR Paradigm. Omtanke in action.</p>
            </footer>
        </div>
    );
};

export default App;
