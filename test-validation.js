// Test script to validate the Mermaid code validation function
const validateMermaidCode = (code) => {
    const errors = [];

    // Check if code starts with valid diagram type
    const validDiagramTypes = /^(graph|flowchart|sequenceDiagram|gantt|classDiagram|stateDiagram|erDiagram|journey|pie|gitGraph)/;
    if (!validDiagramTypes.test(code.trim())) {
        errors.push("Code must start with a valid diagram type (e.g., 'graph TD', 'flowchart LR', 'sequenceDiagram')");
    }

    // Check for incomplete style definitions (missing values after commas)
    const incompleteStyles = code.match(/style\s+\w+[^}]*,\s*$/gm);
    if (incompleteStyles) {
        errors.push("Found incomplete style definitions (missing values after commas)");
    }

    // Check for unbalanced brackets in subgraphs
    const subgraphCount = (code.match(/subgraph/g) || []).length;
    const endCount = (code.match(/end/g) || []).length;
    if (subgraphCount !== endCount) {
        errors.push(`Unbalanced subgraphs: ${subgraphCount} 'subgraph' keywords but ${endCount} 'end' keywords`);
    }

    // Check for incomplete connections (arrows without destinations)
    const incompleteConnections = code.match(/\w+\s*[-=]+>\s*$/gm);
    if (incompleteConnections) {
        errors.push("Found incomplete connection arrows");
    }

    return errors;
};

// Test with the problematic code from the user
const testCode = `graph TD

    subgraph "Endpoints & External Access"
        direction LR
        EP[icon:CISCO_ENDPOINT <br>Internal Endpoints]
        EXT[icon:CISCO_USER <br>External/MRA Users]
    end

    subgraph "Edge Layer (DMZ)"
        EWAYE[icon:CISCO_EWAY_E <br>Expressway-E]
    end

    subgraph "Core Services Layer"
        EWAYC[icon:CISCO_EWAY_C <br>Expressway-C]
        CUCM[icon:CISCO_CUCM <br>CUCM<br>Call Control]
        CMS[icon:CISCO_CMS <br>CMS<br>Conferencing]
    end

    subgraph "PSTN Connectivity"
        VG[icon:CISCO_VOICE_GATEWAY <br>Voice Gateway]
    end

    subgraph "Supporting Infrastructure"
        INFRA["icon:CISCO_INFRA <br>Infrastructure<br>(DNS, AD, PKI)"]
    end

    subgraph "Public Telephone Network"
        PSTN([PSTN / ITSP])
        style PSTN fill:#eceff1,stroke:#546e7a,stroke-dasharray: 5 `;

console.log("Testing validation function with problematic code:");
const errors = validateMermaidCode(testCode);
console.log("Validation errors found:", errors.length);
errors.forEach((error, index) => {
    console.log(`${index + 1}. ${error}`);
});

// Test with valid code for comparison
const validCode = `graph TD
    subgraph "Endpoints & External Access"
        direction LR
        EP[icon:CISCO_ENDPOINT <br>Internal Endpoints]
        EXT[icon:CISCO_USER <br>External/MRA Users]
    end

    subgraph "Edge Layer (DMZ)"
        EWAYE[icon:CISCO_EWAY_E <br>Expressway-E]
    end

    subgraph "Core Services Layer"
        EWAYC[icon:CISCO_EWAY_C <br>Expressway-C]
        CUCM[icon:CISCO_CUCM <br>CUCM<br>Call Control]
        CMS[icon:CISCO_CMS <br>CMS<br>Conferencing]
    end

    subgraph "PSTN Connectivity"
        VG[icon:CISCO_VOICE_GATEWAY <br>Voice Gateway]
    end

    subgraph "Supporting Infrastructure"
        INFRA["icon:CISCO_INFRA <br>Infrastructure<br>(DNS, AD, PKI)"]
    end

    subgraph "Public Telephone Network"
        PSTN([PSTN / ITSP])
        style PSTN fill:#eceff1,stroke:#546e7a,stroke-dasharray:5 5,stroke-width:2px
    end

    EP --> EWAYE
    EXT --> EWAYE
    EWAYE --> EWAYC
    EWAYC --> CUCM
    EWAYC --> CMS
    CUCM --> VG
    VG --> PSTN`;

console.log("\nTesting validation function with valid code:");
const validErrors = validateMermaidCode(validCode);
console.log("Validation errors found:", validErrors.length);
if (validErrors.length === 0) {
    console.log("✓ Valid code passed validation!");
} else {
    validErrors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
    });
}
