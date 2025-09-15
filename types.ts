
export interface DiagramTemplate {
  name: string;
  code: string;
}

export interface ThemeVariables {
  background: string;
  primaryColor: string;
  secondaryColor: string;
  primaryTextColor: string;
  lineColor: string;
  [key: string]: string;
}

export interface IconSet {
  name: string;
  icons: Record<string, string>;
}

export interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
  timestamp: number;
}
