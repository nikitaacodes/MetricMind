export interface TestStep {
    action: 'click' | 'type' | 'verify' | 'wait';
    selector?: string;
    value?: string;
    description: string;
  }
  
  export interface TestCase {
    id: string;
    name: string;
    description: string;
    application: string;
    steps: TestStep[];
    expectedResults: string[];
  }
  
  export interface TestResult {
    testCase: TestCase;
    status: 'PASS' | 'FAIL' | 'ERROR';
    startTime: Date;
    endTime: Date;
    duration: number;
    error?: string;
    steps: {
      step: TestStep;
      status: 'PASS' | 'FAIL';
      error?: string;
    }[];
  }
  