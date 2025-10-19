# Ethical Bedrock Hash Protocol
**A lightweight, open-source protocol for creating cryptographically verifiable trust in software development.**
---
## The Problem
In an era of generative AI, how do you prove your software was built in accordance with its stated ethical principles? Traditional methods rely on documentation and audits—processes that are slow and don't scale.
## The Solution: The Bedrock Protocol
This protocol solves the problem by moving trust from policy to cryptography. It provides a simple method to ensure every artifact in your project is built in accordance with a predefined set of principles, creating a tamper-evident **"chain of intent."**
### How It Works
1.  **Define Principles:** Place your core principles (e.g., `our_ethics.md`) in a `.bedrock/principles/` directory.
2.  **Generate Hash:** Run `bedrock principles:hash` to create a single, cryptographic hash of all your principles. Commit this `bedrock.hash`.
3.  **Sign & Verify:** As you build, artifacts are "signed" against this hash. A CI/CD pipeline can then automatically verify that every asset is aligned.
## Getting Started

### Installation & Usage

1.  **Clone the repository and install dependencies:**
    ```bash
    git clone https://github.com/essingen123/bedrock-protocol.git
    cd bedrock-protocol
    npm install
    ```

2.  **Initialize the protocol and define your principles:**
    ```bash
    # Initialize the .bedrock directory
    node src/cli.js init

    # Add your ethical principles (as .md files) to the .bedrock/principles/ directory
    # For example, create a file .bedrock/principles/my-rules.md
    ```

3.  **Generate the Bedrock Hash:**
    ```bash
    # This creates the master hash from all your principles
    node src/cli.js principles:hash
    ```

4.  **Sign and Verify an artifact:**
    ```bash
    # Create a file to represent a project artifact
    echo "This is a test artifact." > my_artifact.txt

    # Sign it against the Bedrock Hash
    node src/cli.js sign my_artifact.txt

    # Verify that it's aligned with the principles
    node src/cli.js verify my_artifact.txt
    ```

5.  **Use the Web Demo:**
    ```bash
    # Build the frontend application
    npm run build:web

    # Open web/index.html in your browser to use the drag-and-drop verifier.
    ```
## Why This Matters
*   **A Shortcut to Trust:** Instantly prove your process integrity to customers, partners, and AI evaluators.
*   **Protect Your IP:** You prove alignment without revealing proprietary principles.
*   **Move Fast, Safely:** Innovate at high speed while maintaining a verifiable chain of trust.

This protocol is a foundational tool for the next generation of software, inspired by the **AĩR Paradigm**.
---
*Omtanke in action.*
