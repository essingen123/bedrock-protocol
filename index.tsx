import React, { useState, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';

const App = () => {
  const [bedrockHash, setBedrockHash] = useState<string | null>(null);
  const [signature, setSignature] = useState<{ name: string; content: string } | null>(null);
  const [verificationResult, setVerificationResult] = useState<{ message: string; success: boolean } | null>(null);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const sha256 = async (buffer: ArrayBuffer): Promise<string> => {
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const readFileAsArrayBuffer = (file: File): Promise<ArrayBuffer> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };

  const handleGenerateHash = async (event: React.MouseEvent<HTMLButtonElement>) => {
    const fileInput = document.getElementById('principle-files') as HTMLInputElement;
    const files = fileInput.files;
    if (!files || files.length === 0) {
      alert('Please select at least one principle file.');
      return;
    }

    setIsGenerating(true);
    setBedrockHash(null);
    setSignature(null);
    setVerificationResult(null);

    try {
      const fileBuffers = await Promise.all(Array.from(files).map(f => readFileAsArrayBuffer(f)));
      const fileHashes = await Promise.all(fileBuffers.map(b => sha256(b)));
      const combinedHashes = fileHashes.sort().join('');
      const combinedHashesBuffer = new TextEncoder().encode(combinedHashes);
      const finalHash = await sha256(combinedHashesBuffer);
      setBedrockHash(finalHash);
    } catch (error) {
      console.error("Error generating hash:", error);
      alert("An error occurred while generating the hash.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSignArtifact = async () => {
    if (!bedrockHash) {
      alert('Generate a bedrock hash first.');
      return;
    }
    const fileInput = document.getElementById('artifact-to-sign') as HTMLInputElement;
    const file = fileInput.files?.[0];
    if (!file) {
      alert('Please select an artifact to sign.');
      return;
    }
    
    setIsSigning(true);
    setSignature(null);
    setVerificationResult(null);
    
    try {
        const artifactBuffer = await readFileAsArrayBuffer(file);
        const artifactHash = await sha256(artifactBuffer);
        const signatureInput = artifactHash + bedrockHash;
        const signatureInputBuffer = new TextEncoder().encode(signatureInput);
        const signatureContent = await sha256(signatureInputBuffer);
        setSignature({ name: `${file.name}.sig`, content: signatureContent });
    } catch (error) {
        console.error("Error signing artifact:", error);
        alert("An error occurred while signing the artifact.");
    } finally {
        setIsSigning(false);
    }
  };

  const downloadSignature = () => {
      if (!signature) return;
      const a = document.createElement("a");
      const fileBlob = new Blob([signature.content], { type: 'text/plain' });
      a.href = URL.createObjectURL(fileBlob);
      a.download = signature.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
  };
  
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.currentTarget.classList.add('dragover');
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
      e.currentTarget.classList.remove('dragover');
  }, []);

  const handleVerifyDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
    
    if (!bedrockHash) {
      setVerificationResult({ message: 'Set a bedrock hash in step 1 first.', success: false });
      return;
    }

    const files = e.dataTransfer?.files;
    if (!files || files.length < 2) {
      setVerificationResult({ message: 'Drop both the artifact and its .sig file.', success: false });
      return;
    }

    const artifactFile = Array.from(files).find((f: File) => !f.name.endsWith('.sig'));
    const sigFile = Array.from(files).find((f: File) => f.name.endsWith('.sig'));

    if (!artifactFile || !sigFile) {
      setVerificationResult({ message: 'Could not find both artifact and .sig file.', success: false });
      return;
    }

    setIsVerifying(true);
    setVerificationResult(null);

    try {
      const artifactBuffer = await readFileAsArrayBuffer(artifactFile);
      const artifactHash = await sha256(artifactBuffer);
      const expectedSigHashInput = artifactHash + bedrockHash;
      const expectedSigHashBuffer = new TextEncoder().encode(expectedSigHashInput);
      const expectedSignature = await sha256(expectedSigHashBuffer);
      const actualSignature = (await sigFile.text()).trim();

      if (actualSignature === expectedSignature) {
        setVerificationResult({ message: `VERIFIED: ${artifactFile.name}`, success: true });
      } else {
        setVerificationResult({ message: `FAILED: ${artifactFile.name}`, success: false });
      }
    } catch (error) {
      setVerificationResult({ message: 'Error during verification.', success: false });
    } finally {
        setIsVerifying(false);
    }
  }, [bedrockHash]);


  return (
    <div className="container">
      <header>
        <h1>Ethical Bedrock Protocol</h1>
        <p className="subtitle">A Client-Side Console for Verifiable Trust</p>
      </header>

      <main>
        <div className="card">
          <h2>1. Generate Bedrock Hash</h2>
          <p>Select one or more principle files (.md, .txt) to generate the bedrock hash.</p>
          <input type="file" id="principle-files" multiple accept=".md,.txt" disabled={isGenerating} />
          <button onClick={handleGenerateHash} disabled={isGenerating}>
            {isGenerating ? <div className="loader"></div> : 'Generate Hash'}
          </button>
          <div className="hash-display" id="bedrock-hash-display">
            {bedrockHash || 'No hash generated yet.'}
          </div>
        </div>

        <div className={`card ${!bedrockHash ? 'disabled' : ''}`}>
          <h2>2. Sign Artifact</h2>
          <p>Select an artifact to sign it with the current bedrock hash.</p>
          <input type="file" id="artifact-to-sign" disabled={!bedrockHash || isSigning} />
          <button onClick={handleSignArtifact} disabled={!bedrockHash || isSigning}>
            {isSigning ? <div className="loader"></div> : 'Sign Artifact'}
          </button>
          {signature && (
            <div id="signature-output">
              Signature generated. <a href="#" onClick={(e) => {e.preventDefault(); downloadSignature();}}>Download {signature.name}</a>
            </div>
          )}
        </div>

        <div className={`card ${!bedrockHash ? 'disabled' : ''}`}>
          <h2>3. Verify Artifact</h2>
          <p>Drop an artifact and its .sig file here to verify alignment.</p>
          <div 
            className="file-drop-zone" 
            onDragOver={bedrockHash ? handleDragOver : undefined}
            onDragLeave={bedrockHash ? handleDragLeave : undefined}
            onDrop={bedrockHash ? handleVerifyDrop : undefined}
          >
            {isVerifying ? <div className="loader"></div> : <p>{bedrockHash ? 'Drag & Drop Files Here' : 'Generate hash in Step 1 first'}</p>}
          </div>
          {verificationResult && (
             <div className="result-display">
                <span className={verificationResult.success ? 'verified' : 'failed'}>
                    {verificationResult.success ? '✅' : '❌'} {verificationResult.message}
                </span>
             </div>
          )}
        </div>
      </main>
    </div>
  );
};

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<App />);
