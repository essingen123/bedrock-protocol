class BedrockVerifier {
    private bedrockHash: string | null = null;
    private hashDisplay: HTMLElement;
    private dropZone: HTMLElement;
    private resultDisplay: HTMLElement;

    constructor() {
        this.hashDisplay = document.getElementById('bedrock-hash')!;
        this.dropZone = document.getElementById('drop-zone')!;
        this.resultDisplay = document.getElementById('result')!;
        this.initEventListeners();
        this.updateDropZoneState();
    }

    private initEventListeners(): void {
        document.body.addEventListener('dragover', (e) => e.preventDefault());
        document.body.addEventListener('drop', (e) => e.preventDefault());

        this.hashDisplay.addEventListener('dragover', (e) => e.preventDefault());
        this.hashDisplay.addEventListener('drop', this.handleHashDrop.bind(this));

        this.dropZone.addEventListener('dragover', this.handleDragOver.bind(this));
        this.dropZone.addEventListener('dragleave', this.handleDragLeave.bind(this));
        this.dropZone.addEventListener('drop', this.handleArtifactDrop.bind(this));
    }
    
    private updateDropZoneState(): void {
        const dropZoneText = this.dropZone.querySelector('p');
        if (this.bedrockHash) {
            this.dropZone.classList.remove('disabled');
            if (dropZoneText) {
                dropZoneText.textContent = 'Drag & Drop an artifact and its .sig file here';
            }
        } else {
            this.dropZone.classList.add('disabled');
            if (dropZoneText) {
                dropZoneText.textContent = 'Load a bedrock.hash file above before verifying artifacts';
            }
        }
    }

    private async handleHashDrop(e: DragEvent): Promise<void> {
        e.preventDefault();
        e.stopPropagation();
        const files = e.dataTransfer?.files;
        if (files && files.length > 0) {
            this.bedrockHash = (await files[0].text()).trim();
            this.hashDisplay.textContent = this.bedrockHash;
            this.resultDisplay.textContent = ''; 
            this.updateDropZoneState();
        }
    }

    private handleDragOver(e: DragEvent): void {
        e.preventDefault();
        e.stopPropagation();
        if (this.bedrockHash) {
            this.dropZone.classList.add('dragover');
        }
    }

    private handleDragLeave(): void {
        this.dropZone.classList.remove('dragover');
    }

    private findFilePair(files: FileList): { artifactFile: File, sigFile: File } | null {
        const fileArray = Array.from(files);
        for (const potentialArtifact of fileArray) {
            if (potentialArtifact.name.endsWith('.sig')) {
                continue;
            }
            const expectedSigName = `${potentialArtifact.name}.sig`;
            const sigFile = fileArray.find(f => f.name === expectedSigName);
            if (sigFile) {
                return { artifactFile: potentialArtifact, sigFile: sigFile };
            }
        }
        return null;
    }

    private async handleArtifactDrop(e: DragEvent): Promise<void> {
        e.preventDefault();
        e.stopPropagation();
        this.dropZone.classList.remove('dragover');
        this.resultDisplay.textContent = '';

        if (!this.bedrockHash) {
            return;
        }

        const files = e.dataTransfer?.files;
        if (!files || files.length === 0) {
            return;
        }

        this.displayLoading('Verifying...');
        await new Promise(resolve => setTimeout(resolve, 50));

        const filePair = this.findFilePair(files);

        if (!filePair) {
            this.displayResult('Could not find a matching artifact and .sig file pair (e.g., "file.txt" + "file.txt.sig").', false);
            return;
        }
        
        const { artifactFile, sigFile } = filePair;

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
                this.displayResult(`FAILED: Signature mismatch for ${artifactFile.name}`, false);
            }
        } catch (error) {
            console.error('Verification Error:', error);
            this.displayResult('An error occurred during verification.', false);
        }
    }

    private displayLoading(message: string): void {
        this.resultDisplay.innerHTML = `<div class="loader"></div><span>${message}</span>`;
    }

    private displayResult(message: string, isSuccess: boolean): void {
        this.resultDisplay.innerHTML = `<span class="${isSuccess ? 'verified' : 'failed'}">${isSuccess ? '✅' : '❌'} ${message}</span>`;
    }

    private readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as ArrayBuffer);
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });
    }

    private async sha256(buffer: ArrayBuffer): Promise<string> {
        const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
}

new BedrockVerifier();
