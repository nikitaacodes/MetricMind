export interface GeminiConfig {
  model: string;
  temperature: number;
}
  export interface TerminatorConfig {
    timeout: number;
    retries: number;
  }
  
  export interface ReportingConfig {
    outputDir: string;
  }
  
  
export interface AppConfig {
  gemini: GeminiConfig;
  terminator: TerminatorConfig;
  reporting: ReportingConfig;
  terminatorServerUrl: string;
}
  