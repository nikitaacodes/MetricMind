import * as fs from 'fs-extra';
import * as path from 'path';
import * as handlebars from 'handlebars';
import { TestResult } from '../models/test-case';

export class Reporter {
  private results: TestResult[] = [];
  private outputDir: string;
  
  constructor(config: { outputDir: string }) {
    this.outputDir = config.outputDir;
    fs.ensureDirSync(this.outputDir);
  }

  addResult(result: TestResult): void {
    this.results.push(result);
  }

  generateReport(): string {
    const passCount = this.results.filter(r => r.status === 'PASS').length;
    const failCount = this.results.filter(r => r.status === 'FAIL').length;
    const errorCount = this.results.filter(r => r.status === 'ERROR').length;
    
    // Default template as we don't have an external file in this example
    const templateContent = this.getDefaultTemplate();
    const template = handlebars.compile(templateContent);
    
    // Generate HTML report
    const reportHtml = template({
      timestamp: new Date().toISOString(),
      totalTests: this.results.length,
      passCount,
      failCount,
      errorCount,
      results: this.results
    });

    // Save the report
    const reportFileName = `report-${new Date().toISOString().replace(/[:.]/g, '-')}.html`;
    const reportPath = path.join(this.outputDir, reportFileName);
    fs.writeFileSync(reportPath, reportHtml);
    
    return reportPath;
  }
  
  private getDefaultTemplate(): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Terminator AI Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #333; }
        .summary { background: #f5f5f5; padding: 15px; margin-bottom: 20px; border-radius: 5px; }
        .test-case { border: 1px solid #ddd; margin-bottom: 15px; padding: 15px; border-radius: 5px; }
        .test-case.PASS { border-left: 5px solid green; }
        .test-case.FAIL { border-left: 5px solid red; }
        .test-case.ERROR { border-left: 5px solid orange; }
        .error { color: red; font-family: monospace; white-space: pre-wrap; }
        .steps { margin-top: 10px; }
        .step { padding: 5px; border-bottom: 1px solid #eee; }
        .step.PASS { background-color: #e6ffe6; }
        .step.FAIL { background-color: #ffe6e6; }
    </style>
</head>
<body>
    <h1>Terminator AI Test Report</h1>
    <div class="summary">
        <p><strong>Generated:</strong> {{timestamp}}</p>
        <p><strong>Total Tests:</strong> {{totalTests}}</p>
        <p><strong>Passed:</strong> {{passCount}}</p>
        <p><strong>Failed:</strong> {{failCount}}</p>
        <p><strong>Errors:</strong> {{errorCount}}</p>
    </div>

    {{#each results}}
    <div class="test-case {{status}}">
        <h2>{{testCase.name}}</h2>
        <p><strong>Status:</strong> {{status}}</p>
        <p><strong>Duration:</strong> {{duration}}ms</p>
        <p><strong>Description:</strong> {{testCase.description}}</p>
        
        {{#if error}}
        <div class="error">
            <strong>Error:</strong> {{error}}
        </div>
        {{/if}}
        
        <div class="steps">
            <h3>Steps:</h3>
            {{#each steps}}
            <div class="step {{status}}">
                <p><strong>{{step.description}}</strong> - {{status}}</p>
                {{#if error}}
                <p class="error">{{error}}</p>
                {{/if}}
            </div>
            {{/each}}
        </div>
    </div>
    {{/each}}
</body>
</html>
    `;
  }
}
