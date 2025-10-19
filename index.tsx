import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';

const App = () => {
  useEffect(() => {
    class BedrockApp {
      private bedrockHash: string | null = null;

      // DOM Elements
      private principleFilesInput: HTMLInputElement;
      private generateHashBtn: HTMLButtonElement;
      private bedrockHashDisplay: HTMLElement;
      private artifactToSignInput: HTMLInputElement;
      private signBtn: HTMLButtonElement;
      private signatureOutput: HTMLElement;
      private verifyDropZone: HTMLElement;
      private verifyResult: HTMLElement;

      constructor() {
        this.principleFilesInput = document.getElementById('principle-files') as HTMLInputElement;
        this.generateHashBtn = document.getElementById('generate-hash-btn') as HTMLButtonElement;
        this.bedrockHashDisplay = document.getElementById('bedrock-hash-display')!;
        this.artifactToSignInput = document.getElementById('artifact-to-sign') as HTMLInputElement;
        this.signBtn = document.getElementById('sign-btn') as HTMLButtonElement;
        this.signatureOutput = document.getElementById('signature-output')!;
        this.verifyDropZone = document.getElementById('verify-drop-zone')!;
        this.verifyResult = document.getElementById('verify-result')!;
        this.initEventListeners();
      }

      private initEventListeners(): void {
        this.generateHashBtn.addEventListener('click', this.generateBedrockHash.bind(this));
        this.signBtn.addEventListener('click', this.signArtifact.bind(this));

        this.verifyDropZone.addEventListener('dragover', this.handleDragOver.bind(this));
        this.verifyDropZone.addEventListener('dragleave', this.handleDragLeave.bind(this));
        this.verifyDropZone.addEventListener('drop', this.handleVerifyDrop.bind(this));
      }

      private async sha256(buffer: ArrayBuffer): Promise<string> {
        const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      }

      private readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as ArrayBuffer);
          reader.onerror = reject;
          reader.readAsArrayBuffer(file);
        });
      }

      async generateBedrockHash(): Promise<void> {
        const files = this.principleFilesInput.files;
        if (!files || files.length === 0) {
          alert('Please select at least one principle file.');
          return;
        }

        const fileBuffers = await Promise.all(Array.from(files).map(f => this.readFileAsArrayBuffer(f)));
        const fileHashes = await Promise.all(fileBuffers.map(b => this.sha256(b)));

        const combinedHashes = fileHashes.sort().join('');
        const combinedHashesBuffer = new TextEncoder().encode(combinedHashes);

        this.bedrockHash = await this.sha256(combinedHashesBuffer);
        this.bedrockHashDisplay.textContent = this.bedrockHash;
        this.signBtn.disabled = false;
      }

      async signArtifact(): Promise<void> {
        if (!this.bedrockHash) {
          alert('Generate a bedrock hash first.');
          return;
        }
        const file = this.artifactToSignInput.files?.[0];
        if (!file) {
          alert('Please select an artifact to sign.');
          return;
        }

        const artifactBuffer = await this.readFileAsArrayBuffer(file);
        const artifactHash = await this.sha256(artifactBuffer);

        const signatureInput = artifactHash + this.bedrockHash;
        const signatureInputBuffer = new TextEncoder().encode(signatureInput);
        const signature = await this.sha256(signatureInputBuffer);

        this.signatureOutput.innerHTML = `Signature generated. <a href="#" id="download-sig">Download ${file.name}.sig</a>`;
        document.getElementById('download-sig')?.addEventListener('click', (e) => {
          e.preventDefault();
          this.downloadFile(signature, `${file.name}.sig`, 'text/plain');
        });
      }

      private downloadFile(content: string, fileName: string, contentType: string) {
        const a = document.createElement("a");
        const file = new Blob([content], { type: contentType });
        a.href = URL.createObjectURL(file);
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(a.href);
      }

      private handleDragOver(e: DragEvent): void {
        e.preventDefault();
        (e.currentTarget as HTMLElement).classList.add('dragover');
      }

      private handleDragLeave(e: DragEvent): void {
        (e.currentTarget as HTMLElement).classList.remove('dragover');
      }

      private async handleVerifyDrop(e: DragEvent): Promise<void> {
        e.preventDefault();
        (e.currentTarget as HTMLElement).classList.remove('dragover');
        this.verifyResult.textContent = '';

        if (!this.bedrockHash) {
          this.displayResult('Set a bedrock hash in step 1 first.', false);
          return;
        }

        const files = e.dataTransfer?.files;
        if (!files || files.length < 2) {
          this.displayResult('Drop both the artifact and its .sig file.', false);
          return;
        }

        const artifactFile = Array.from(files).find(f => !f.name.endsWith('.sig'));
        const sigFile = Array.from(files).find(f => f.name.endsWith('.sig'));

        if (!artifactFile || !sigFile) {
          this.displayResult('Could not find both artifact and .sig file.', false);
          return;
        }

        try {
          const artifactBuffer = await this.readFileAsArrayBuffer(artifactFile);
          const artifactHash = await this.sha256(artifactBuffer);

          const expectedSigHashInput = artifactHash + this.bedrockHash;
          const expectedSigHashBuffer = new TextEncoder().encode(expectedSigHashInput);
          const expectedSignature = await this.sha256(expectedSigHashBuffer);

          const actualSignature = (await sigFile.text()).trim();

          if (actualSignature === expectedSignature) {
            this.displayResult(`VERIFIED: ${artifactFile.name}`, true);
          } else {
            this.displayResult(`FAILED: ${artifactFile.name}`, false);
          }
        } catch (error) {
          this.displayResult('Error during verification.', false);
        }
      }

      private displayResult(message: string, isSuccess: boolean): void {
        this.verifyResult.innerHTML = `<span class="${isSuccess ? 'verified' : 'failed'}">${isSuccess ? '✅' : '❌'} ${message}</span>`;
      }
    }

    // This ensures the DOM is ready before the script runs.
    new BedrockApp();
  }, []); // Empty array ensures this effect runs only once after mount

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
          <input type="file" id="principle-files" multiple accept=".md,.txt" />
          <button id="generate-hash-btn">Generate Hash</button>
          <div className="hash-display" id="bedrock-hash-display">No hash generated yet.</div>
        </div>

        <div className="card">
          <h2>2. Sign Artifact</h2>
          <p>Select an artifact to sign it with the current bedrock hash.</p>
          <input type="file" id="artifact-to-sign" />
          <button id="sign-btn" disabled>Sign Artifact</button>
          <div id="signature-output"></div>
        </div>

        <div className="card">
          <h2>3. Verify Artifact</h2>
          <p>Drop an artifact and its .sig file here to verify alignment.</p>
          <div className="file-drop-zone" id="verify-drop-zone">Drag & Drop Files Here</div>
          <div id="verify-result" className="result-display"></div>
        </div>
      </main>
    </div>
  );
};

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<App />);
