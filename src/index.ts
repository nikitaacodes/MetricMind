import * as dotenv from 'dotenv';
import * as fs from 'fs-extra';
import * as path from 'path';
import { TestRunner } from './core/test-runner';
import { AITestGenerator } from './core/ai-generator';
import { Reporter } from './core/reporter';
import { TestCase } from './models/test-case';

// Load environment variables from .env file
dotenv.config();

// Configuration
const config = {
  gemini: {
    model: "gemini-2.0-flash", // Using the model from your example
    temperature: 0.7
  },
  terminator: {
    timeout: 10000,
    retries: 3
  },
  reporting: {
    outputDir: './reports'
  },
  terminatorServerUrl: process.env.TERMINATOR_SERVER_URL,
};

async function main() {
  console.log('🚀 Starting AI-Powered Desktop App Test Runner...');
  
  // Initialize components
  const testRunner = new TestRunner({
  timeout: config.terminator.timeout,
  retries: config.terminator.retries
});
  const reporter = new Reporter(config.reporting);
  
  // Check if Gemini API key is provided
  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!geminiApiKey) {
    throw new Error('GEMINI_API_KEY not found in .env file.');
  }
  const aiTestGenerator = new AITestGenerator(geminiApiKey, config.gemini);
  
  // Process command line arguments
  const args = process.argv.slice(2);
  const appName = args[0] || 'Calculator'; // Default to Calculator
  
  console.log(`📱 Target application: ${appName}`);
  
  // Generate test cases using AI
  console.log('🤖 Generating test cases using Gemini AI...');
  
  let testCases: TestCase[] = [];
  
  // App description - we can customize this for different applications
  const appDescriptions = {
    Calculator: "Windows Calculator app with number buttons 0-9, operations buttons (+, -, *, /), equals button, and result display.",
    Notepad: "Windows Notepad text editor with a main text area, file menu, edit menu, and standard text editing functionality.",
    WhatsApp: "WhatsApp desktop app with chat list, message area, and contact information panel."
  };
  
  const appDescription = appDescriptions[appName as keyof typeof appDescriptions] || `${appName} desktop application`;
  
  try {
    testCases = await aiTestGenerator.generateTestCases(appDescription, appName, 3);
    console.log(`✅ Generated ${testCases.length} AI test cases.`);
    
    // Save generated test cases for reference
    const testCasesDir = path.join(process.cwd(), 'test-cases');
    fs.ensureDirSync(testCasesDir);
    fs.writeJSONSync(
      path.join(testCasesDir, `${appName}-test-cases.json`),
      testCases,
      { spaces: 2 }
    );
    
  } catch (error) {
    console.error('❌ Error generating AI test cases:', error);
    process.exit(1);
  }
  
  if (testCases.length === 0) {
    console.error('⚠️ No test cases generated. Exiting...');
    process.exit(1);
  }
  
  // Execute test cases
  console.log(`▶️ Running ${testCases.length} test cases for ${appName}...`);
  
  for (const testCase of testCases) {
    console.log(`\n========================================`);
    console.log(`🧪 Running test: ${testCase.name}`);
    console.log(`📝 Description: ${testCase.description}`);
    console.log(`========================================\n`);
    
    const result = await testRunner.executeTestCase(testCase);
    reporter.addResult(result);
    
    console.log(`\n${result.status === 'PASS' ? '✅' : '❌'} Test "${testCase.name}" completed with status: ${result.status}`);
    if (result.error) {
      console.log(`🐞 Error: ${result.error}`);
    }
  }
  
  // Generate report
  const reportPath = reporter.generateReport();
  console.log(`\n📊 Test execution completed. Report generated at: ${reportPath}`);
}

main().catch(error => {
  console.error('💥 Application error:', error);
  process.exit(1);
});
