import type { DiagramTemplate, ThemeVariables, IconSet } from './types';

// The key used to store and retrieve all icon sets from the browser's local storage.
export const ALL_ICON_SETS_KEY = 'mermaid-all-icon-sets';

// New Professional Themes for documentation
export const PROFESSIONAL_THEMES: Record<string, ThemeVariables> = {
  'professional-blue': {
    background: '#FFFFFF',
    primaryColor: '#EBF2FA',
    secondaryColor: '#B4C8E1',
    primaryTextColor: '#102A43',
    lineColor: '#5C6773',
    // Mermaid specific keys
    nodeBorder: '#275DAD',
    clusterBkg: '#F3F7FB',
    clusterBorder: '#A4B4C8',
    mainBkg: '#EBF2FA',
    textColor: '#102A43',
  },
  'documentation-light': {
    background: '#FFFFFF',
    primaryColor: '#F8F9FA',        // Default node fill: very light grey, almost white
    secondaryColor: '#E9ECEF',      // Light gray for secondary elements
    primaryTextColor: '#212529',    // High contrast black for text
    lineColor: '#495057',           // Medium-dark grey for connectors
    nodeBorder: '#ADB5BD',          // Medium grey for node borders
    clusterBkg: 'transparent',      // Use a transparent background for subgraphs
    clusterBorder: '#343A40',       // Strong, dark grey for subgraph borders
    mainBkg: '#FFFFFF',
    textColor: '#212529',
    labelBackground: '#ADB5BD',     // Darker grey for better label contrast
    arrowheadColor: '#495057',      // Match the line color
  }
};

export const DIAGRAM_TEMPLATES: DiagramTemplate[] = [
  {
    name: 'AWS Cloud Architecture',
    code: `graph TD
    %%{init: {'theme': 'base', 'themeVariables': { 'primaryColor': '#232F3E', 'lineColor': '#FFFFFF', 'textColor': '#FFFFFF'}}}%%
    subgraph VPC
        subgraph "Public Subnet"
            elb[icon:AWS_ELB <br>Application LB]
        end

        subgraph "Private Subnet"
            ec2_a[icon:AWS_EC2 <br>Web Server A]
            ec2_b[icon:AWS_EC2 <br>Web Server B]
            rds[icon:AWS_RDS <br>Database]
        end
    end
    
    subgraph "S3 Storage"
      s3[icon:AWS_S3 <br>Static Assets]
    end

    User --> elb
    elb --> ec2_a
    elb --> ec2_b
    ec2_a --> rds
    ec2_b --> rds
    ec2_a --> s3
    ec2_b --> s3
    `
  },
  {
    name: 'Blog Schema (ER Diagram)',
    code: `erDiagram
    USERS ||--|{ POSTS : "writes"
    USERS ||--|{ COMMENTS : "makes"
    POSTS ||--o{ COMMENTS : "has"
    POSTS }o--|| TAGS : "is tagged with"

    USERS {
        int id PK "User ID"
        string username
        string email
        datetime created_at
    }
    POSTS {
        int id PK "Post ID"
        string title
        text content
        datetime published_at
        int user_id FK "Author"
    }
    COMMENTS {
        int id PK "Comment ID"
        text body
        int user_id FK "Commenter"
        int post_id FK "On Post"
    }
    TAGS {
        int id PK "Tag ID"
        string name
    }`
  },
  {
    name: 'Cisco Collaboration Architecture',
    code: `graph TD
    %% A professional, layered architecture for Cisco Collaboration, ideal for HLDs.

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
        style PSTN fill:#eceff1,stroke:#546e7a,stroke-dasharray: 5 5,stroke-width:2px
    end
    
    %% Connections
    EP -- "SIP / WebRTC" --> EWAYE
    EXT -- "TLS / SRTP" --> EWAYE
    EWAYE -- "SIP Traversal" --> EWAYC
    EWAYC --> CUCM
    EWAYC --> CMS
    
    CUCM -- "SIP Trunk" --> VG
    CUCM -- "Services" --> INFRA
    CMS -- "Services" --> INFRA
    
    VG -- "PRI / SIP" --> PSTN

    %% Professional Styling
    classDef endpointClass fill:#e1f5fe,stroke:#0277bd,stroke-width:2px
    classDef edgeClass fill:#fff3e0,stroke:#f57c00,stroke-width:2px
    classDef coreClass fill:#f3e5f5,stroke:#8e24aa,stroke-width:2px
    classDef infraClass fill:#fafafa,stroke:#546e7a,stroke-width:2px
    
    class EP,EXT endpointClass
    class EWAYE edgeClass
    class EWAYC,CUCM,CMS coreClass
    class VG,INFRA infraClass
    `
  },
  {
    name: 'Cisco Meraki Architecture',
    code: `graph LR
    subgraph "Cloud Management Plane"
        style "Cloud Management Plane" fill:#f0f6ff,stroke:#00a1e0,stroke-dasharray: 5 5
        cloud[icon:CISCO_MERAKI_CLOUD <br>Meraki Cloud Dashboard]
    end

    subgraph "On-Premise Network"
        internet([Internet]) -- "WAN Traffic" --> mx[icon:CISCO_MERAKI_MX <br>MX Security]
        mx -- "LAN Traffic" --> ms[icon:CISCO_MERAKI_MS <br>MS Switch]
        ms --> mr1[icon:CISCO_MERAKI_MR <br>MR Access Point]
        ms --> wired_device[Server / PC]
        ms --> mv[icon:CISCO_MERAKI_MV <br>MV Smart Camera]
    end

    %% Management Links
    mx -.->|Management| cloud
    ms -.->|Management| cloud
    mr1 -.->|Management| cloud
    mv -.->|Management| cloud

    %% Styling
    classDef meraki fill:#e6f7ff,stroke:#00a1e0,stroke-width:2px
    classDef internet fill:#f0f0f0,stroke:#999,stroke-width:2px
    class cloud,mx,ms,mr1,wired_device,mv meraki
    class internet internet
    linkStyle 0,1,2,3,4 stroke-width:2px,fill:none,stroke:black;
    linkStyle 5,6,7,8 stroke-width:1.5px,stroke-dasharray:3,stroke:#0078d4;
    `
  },
  {
    name: 'Class Diagram',
    code: `classDiagram
    Animal <|-- Duck
    Animal <|-- Fish
    Animal <|-- Zebra
    Animal : +int age
    Animal : +String gender
    Animal: +isMammal()
    Animal: +mate()
    class Duck{
      +String beakColor
      +swim()
      +quack()
    }
    class Fish{
      -int sizeInFeet
      -canEat()
    }
    class Zebra{
      +bool is_wild
      +run()
    }`
  },
  {
    name: 'Cross-Functional IT Diagram',
    code: `graph TB
    %% Directory & Security Layer
    subgraph "Directory & Security Layer"
        AD[Active Directory<br/>AD<br/>Groups / Users<br/>SSO Claims]
        PKI[PKI / CA<br/>Issuance / CRL<br/>Certificates]
    end

    %% Collaboration Core
    subgraph "Collaboration Core"
        CUCM[CUCM]
        CMS[CMS]
        EXWAY[Expressway-C/E]
    end

    %% Supporting Services
    subgraph "Supporting Services"
        DNS[DNS]
        NTP[NTP]
        EMAIL[Email<br/>Invites / Calendars]
    end

    %% External Integration
    subgraph "External Integration"
        BACKUP[Backup<br/>Repository]
        EXT_PLAT[External Platforms<br/>Teams / Zoom etc.]
    end

    %% Observability Stack
    subgraph "Observability Stack"
        OBS_STACK[SIEM / ELK<br/>Metrics / APM<br/>Dashboards]
    end

    %% Connections
    AD -->|LDAPS| PKI
    AD -->|Groups / Users<br/>SSO Claims| CUCM
    PKI -->|Certificates| CUCM

    CUCM <-->|Collaboration| CMS
    CMS <-->|Collaboration| EXWAY

    CUCM -->|Service| DNS
    CUCM -->|Service| NTP
    CUCM -->|Service| EMAIL

    EMAIL -->|Federation<br/>SIP/H.323| EXT_PLAT
    CUCM -->|Backup| BACKUP

    DNS -->|Monitoring| OBS_STACK
    NTP -->|Monitoring| OBS_STACK
    EMAIL -->|Monitoring| OBS_STACK
    BACKUP -->|Monitoring| OBS_STACK
    EXT_PLAT -->|Monitoring| OBS_STACK

    %% Styling
    classDef directoryClass fill:#e3f2fd,stroke:#42a5f5
    classDef securityClass fill:#fff3e0,stroke:#ffb74d
    classDef coreClass fill:#f3e5f5,stroke:#ba68c8
    classDef servicesClass fill:#e8f5e8,stroke:#81c784
    classDef externalClass fill:#fafafa,stroke:#90a4ae
    classDef obsClass fill:#fff8e1,stroke:#ffd54f

    class AD directoryClass
    class PKI securityClass
    class CUCM,CMS,EXWAY coreClass
    class DNS,NTP,EMAIL servicesClass
    class BACKUP,EXT_PLAT externalClass
    class OBS_STACK obsClass`
  },
  {
    name: 'Detailed API Sequence',
    code: `sequenceDiagram
    actor Client
    participant APIGateway as API Gateway
    participant AuthService as Authentication
    participant ProductService as Products API

    Client->>+APIGateway: POST /products (Auth Token)
    APIGateway->>+AuthService: Verify Token
    AuthService-->>-APIGateway: Token Valid
    APIGateway->>+ProductService: CreateProduct(productDetails)
    ProductService-->>-APIGateway: {productId: "123", status: "created"}
    APIGateway-->>-Client: 201 Created { ... }`
  },
  {
    name: 'Flowchart',
    code: `graph TD
    A[Start] --> B{Is it?};
    B -- Yes --> C[OK];
    C --> D[End];
    B -- No --> E[Find out];
    E --> B;`,
  },
  {
    name: 'Gantt Chart',
    code: `gantt
    title A Gantt Diagram
    dateFormat  YYYY-MM-DD
    section Section
    A task           :a1, 2024-01-01, 30d
    Another task     :after a1  , 20d
    section Another
    Task in sec      :2024-01-12  , 12d
    another task      : 24d`,
  },
  {
    name: 'Gitgraph',
    code: `gitGraph
   commit
   commit
   branch feature-a
   checkout feature-a
   commit
   commit
   checkout main
   merge feature-a
   commit
   commit`
  },
  {
    name: 'Infrastructure Dependencies',
    code: `graph TB
    %% Directory & Security Layer
    subgraph "Directory & Security Layer"
        AD[Active Directory<br/>AD<br/>Groups / Users<br/>SSO Claims]
        PKI[PKI / CA<br/>Issuance / CRL<br/>Certificates]
    end

    %% Collaboration Core
    subgraph "Collaboration Core"
        CUCM[CUCM]
        CMS[CMS]
        EXWAY[Expressway-C/E]
    end

    %% Supporting Services
    subgraph "Supporting Services"
        DNS[DNS]
        NTP[NTP]
        EMAIL[Email<br/>Invites / Calendars]
    end

    %% External Integration
    subgraph "External Integration"
        BACKUP[Backup<br/>Repository]
        EXT_PLAT[External Platforms<br/>Teams / Zoom etc.]
    end

    %% Observability Stack
    subgraph "Observability Stack"
        OBS_STACK[SIEM / ELK<br/>Metrics / APM<br/>Dashboards]
    end

    %% Connections
    AD -->|LDAPS| PKI
    AD -->|Groups / Users<br/>SSO Claims| CUCM
    PKI -->|Certificates| CUCM

    CUCM <-->|Collaboration| CMS
    CMS <-->|Collaboration| EXWAY

    CUCM -->|Service| DNS
    CUCM -->|Service| NTP
    CUCM -->|Service| EMAIL

    EMAIL -->|Federation<br/>SIP/H.323| EXT_PLAT
    CUCM -->|Backup| BACKUP

    DNS -->|Monitoring| OBS_STACK
    NTP -->|Monitoring| OBS_STACK
    EMAIL -->|Monitoring| OBS_STACK
    BACKUP -->|Monitoring| OBS_STACK
    EXT_PLAT -->|Monitoring| OBS_STACK

    %% Styling
    classDef directoryClass fill:#e3f2fd,stroke:#42a5f5
    classDef securityClass fill:#fff3e0,stroke:#ffb74d
    classDef coreClass fill:#f3e5f5,stroke:#ba68c8
    classDef servicesClass fill:#e8f5e8,stroke:#81c784
    classDef externalClass fill:#fafafa,stroke:#90a4ae
    classDef obsClass fill:#fff8e1,stroke:#ffd54f

    class AD directoryClass
    class PKI securityClass
    class CUCM,CMS,EXWAY coreClass
    class DNS,NTP,EMAIL servicesClass
    class BACKUP,EXT_PLAT externalClass
    class OBS_STACK obsClass`
  },
  {
    name: 'Kubernetes Deployment',
    code: `graph LR
    subgraph "User Request"
        user[User]
    end

    subgraph "Kubernetes Cluster"
        ingress[icon:K8S_INGRESS <br>Ingress]
        
        subgraph "Service Layer"
            service[icon:K8S_SERVICE <br>Service]
        end

        subgraph "Deployment"
            pod1[icon:K8S_POD <br>Pod 1]
            pod2[icon:K8S_POD <br>Pod 2]
            pod3[icon:K8S_POD <br>Pod 3]
        end

        subgraph "Configuration"
            config[icon:K8S_CONFIG <br>ConfigMap]
            secret[icon:K8S_SECRET <br>Secret]
        end
    end

    user --> ingress
    ingress --> service
    service --> pod1
    service --> pod2
    service --> pod3

    pod1 --> config
    pod2 --> config
    pod3 --> config

    pod1 --> secret
    pod2 --> secret
    pod3 --> secret
    `
  },
  {
    name: 'Pie Chart',
    code: `pie
    title Key Elements in Project Success
    "Communication" : 45
    "Technical Skill" : 25
    "Resource Allocation" : 20
    "Timeline Management" : 10`
  },
  {
    name: 'State Diagram',
    code: `stateDiagram-v2
    [*] --> Locked
    Locked --> Unlocked : key
    Unlocked --> Locked : key
    Unlocked --> Open : handle
    Open --> Unlocked : close`
  },
].sort((a, b) => a.name.localeCompare(b.name));;

export const THEMES = ['dark', 'default', 'forest', 'neutral', 'professional-blue', 'documentation-light'];

export const FONT_FAMILIES = ['sans-serif', 'Arial', 'Verdana', 'Courier New', 'Georgia'];

const AWS_ICON_SET: IconSet = {
    name: "AWS",
    icons: {
      AWS_EC2: 'AWS_EC2.svg',
      AWS_ELB: 'AWS_ELB.svg',
      AWS_S3: 'AWS_S3.svg',
      AWS_RDS: 'AWS_RDS.svg',
    }
};

const CISCO_ICON_SET: IconSet = {
    name: "Cisco",
    icons: {
        CISCO_ACCESS_POINT: 'CISCO_ACCESS_POINT.svg',
        CISCO_ASA: 'CISCO_ASA.svg',
        CISCO_CMS: 'CISCO_CMS.svg',
        CISCO_CUCM: 'CISCO_CUCM.svg',
        CISCO_CUCME: 'CISCO_CUCME.svg',
        CISCO_DNAC: 'CISCO_DNAC.svg',
        CISCO_ENDPOINT: 'CISCO_ENDPOINT.svg',
        CISCO_EWAY_C: 'CISCO_EWAY_C.svg',
        CISCO_EWAY_E: 'CISCO_EWAY_E.svg',
        CISCO_INFRA: 'CISCO_INFRA.svg',
        CISCO_IP_PHONE: 'CISCO_IP_PHONE.svg',
        CISCO_JABBER: 'CISCO_JABBER.svg',
        CISCO_MEETINGPLACE: 'CISCO_MEETINGPLACE.svg',
        CISCO_MERAKI_CLOUD: 'CISCO_MERAKI_CLOUD.svg',
        CISCO_MERAKI_MR: 'CISCO_MERAKI_MR.svg',
        CISCO_MERAKI_MS: 'CISCO_MERAKI_MS.svg',
        CISCO_MERAKI_MV: 'CISCO_MERAKI_MV.svg',
        CISCO_MERAKI_MX: 'CISCO_MERAKI_MX.svg',
        CISCO_NETWORK_MANAGEMENT: 'CISCO_NETWORK_MANAGEMENT.svg',
        CISCO_OBSERVABILITY: 'CISCO_OBSERVABILITY.svg',
        CISCO_ROUTER: 'CISCO_ROUTER.svg',
        CISCO_SWITCH: 'CISCO_SWITCH.svg',
        CISCO_TELEPRESENCE: 'CISCO_TELEPRESENCE.svg',
        CISCO_USER: 'CISCO_USER.svg',
        CISCO_VIDEO_DEVICE: 'CISCO_VIDEO_DEVICE.svg',
        CISCO_VOICE_GATEWAY: 'CISCO_VOICE_GATEWAY.svg',
        CISCO_VPN_CONCENTRATOR: 'CISCO_VPN_CONCENTRATOR.svg',
        CISCO_WEBEX: 'CISCO_WEBEX.svg',
        CISCO_WLC: 'CISCO_WLC.svg',
    }
};

const GCP_ICON_SET: IconSet = {
    name: "Google Cloud",
    icons: {
        GCP_COMPUTE: 'GCP_COMPUTE.svg',
        GCP_STORAGE: 'GCP_STORAGE.svg',
        GCP_SQL: 'GCP_SQL.svg',
        GCP_LOADBALANCER: 'GCP_LOADBALANCER.svg',
    }
};

const AZURE_ICON_SET: IconSet = {
    name: "Azure",
    icons: {
        AZURE_VM: 'AZURE_VM.svg',
        AZURE_BLOB: 'AZURE_BLOB.svg',
        AZURE_SQL: 'AZURE_SQL.svg',
        AZURE_LOADBALANCER: 'AZURE_LOADBALANCER.svg',
        AZURE_FUNCTIONS: 'AZURE_FUNCTIONS.svg',
        AZURE_AKS: 'AZURE_AKS.svg',
        AZURE_COSMOSDB: 'AZURE_COSMOSDB.svg',
        AZURE_MONITOR: 'AZURE_MONITOR.svg',
        AZURE_AAD: 'AZURE_AAD.svg',
        AZURE_VNET: 'AZURE_VNET.svg',
        AZURE_APP_SERVICE: 'AZURE_APP_SERVICE.svg',
        AZURE_KEY_VAULT: 'AZURE_KEY_VAULT.svg',
    }
};

const K8S_ICON_SET: IconSet = {
    name: "Kubernetes",
    icons: {
        K8S_POD: 'K8S_POD.svg',
        K8S_SERVICE: 'K8S_SERVICE.svg',
        K8S_INGRESS: 'K8S_INGRESS.svg',
        K8S_CONFIG: 'K8S_CONFIG.svg',
        K8S_SECRET: 'K8S_SECRET.svg',
    }
};

const MICROSOFT_ICON_SET: IconSet = {
    name: "Microsoft",
    icons: {
        MS_AD: 'MS_AD.svg',
        MS_AZURE: 'MS_AZURE.svg',
        MS_EXCHANGE: 'MS_EXCHANGE.svg',
        MS_O365: 'MS_O365.svg',
        MS_SHAREPOINT: 'MS_SHAREPOINT.svg',
        MS_SQL_SERVER: 'MS_SQL_SERVER.svg',
        MS_TEAMS: 'MS_TEAMS.svg',
        MS_WIN_SERVER: 'MS_WIN_SERVER.svg',
    }
};

// FIX: Renamed ICON_SETS to DEFAULT_ICON_SETS to match usage in useAppStore.ts
export const DEFAULT_ICON_SETS: Record<string, IconSet> = {
    'aws': AWS_ICON_SET,
    'azure': AZURE_ICON_SET,
    'cisco': CISCO_ICON_SET,
    'gcp': GCP_ICON_SET,
    'k8s': K8S_ICON_SET,
    'microsoft': MICROSOFT_ICON_SET,
};