// src/core/test-runner.ts
import { DesktopUseClient, ApiError, Locator } from 'desktop-use';
import { TestCase, TestResult, TestStep } from '../models/test-case';
import * as fs from 'fs-extra';

// Utility function for delays
function sleep(ms: number): Promise<void> {
  console.log(`   Waiting for ${ms}ms...`);
  return new Promise(resolve => setTimeout(resolve, ms));
}

export class TestRunner {
  private client: DesktopUseClient;
  private timeout: number; // Used for general operation timeouts if needed, less for expect
  private retries: number; // Retries for actions

  // Automation timing configuration - MORE GENEROUS DELAYS
  private automationConfig = {
    postActionDelay: 500,     // Delay AFTER successful actions (ms)
    preActionDelay: 1000,     // Delay BEFORE attempting actions (ms)
    typeKeystrokeDelay: 100,  // Delay between keystrokes (ms)
    launchWait: 4000,         // Initial wait after app launch (ms)
    findAttemptDelay: 500,    // Delay between find attempts (ms)
    findAttemptCount: 10      // Number of times to try finding an element
  };

  constructor(config: { timeout: number; retries: number }) {
    this.client = new DesktopUseClient('http://127.0.0.1:9375');
    this.timeout = config.timeout; // Keep for potential future use
    this.retries = config.retries;
    console.log(`TestRunner initialized. Action retries: ${this.retries}. Using deliberate delays.`);
  }

  /**
   * Launches the application using a name or full path.
   */
  async launchApp(appNameOrPath: string): Promise<void> {
    // (Keep the existing launchApp logic from the previous version - it handles paths correctly)
    try {
      let executableName: string;
      if (appNameOrPath.toLowerCase().includes('.exe') || appNameOrPath.includes('\\') || appNameOrPath.includes('/')) {
         if (!fs.existsSync(appNameOrPath)) {
           throw new Error(`Provided executable path not found: ${appNameOrPath}`);
         }
         executableName = appNameOrPath;
      } else {
         executableName = this.getExecutableName(appNameOrPath);
      }

      console.log(`Launching application with executable: ${executableName}...`);
      await this.client.openApplication(executableName);
      console.log(`Successfully launched ${executableName}`);

      console.log(`Waiting ${this.automationConfig.launchWait}ms for app to initialize...`);
      await sleep(this.automationConfig.launchWait);

      // Basic check if the window exists after launch
      try {
          console.log("Checking for main application window presence...");
          // Attempt to find the window, don't wait too long here
          const windowLocator = this.client.locator('role:window');
          // A quick check if it's found, not necessarily fully visible/interactive yet
          await windowLocator.getBounds(); // getBounds will fail if not found
          console.log("Application window seems present.");
      } catch(winError) {
          console.warn("Could not confirm main window presence shortly after launch, proceeding cautiously.", winError);
      }

    } catch (error) {
      if (error instanceof ApiError) {
         console.error(`API error opening ${appNameOrPath}: (${error.status}): ${error.message}`);
      } else {
         console.error(`Failed to launch ${appNameOrPath}:`, error);
      }
      throw error;
    }
  }

  /**
   * Maps common application names to their executable names/paths.
   */
  private getExecutableName(appName: string): string {
    // (Keep the existing getExecutableName logic from the previous version)
    const appMapping: Record<string, string> = {
      'calculator': 'calc',
      'notepad': 'notepad',
      'paint': 'mspaint',
      'wordpad': 'wordpad',
      'browser': 'msedge' // Example
    };

    const normalized = appName.toLowerCase();
    if (normalized === 'whatsapp') {
      const user = process.env.USERNAME || 'default';
      const possiblePaths = [
         `C:\\Users\\${user}\\AppData\\Local\\WhatsApp\\WhatsApp.exe`,
         `C:\\Users\\${user}\\AppData\\Local\\Programs\\WhatsApp\\WhatsApp.exe`
      ];
      for (const p of possiblePaths) {
         if (fs.existsSync(p)) {
           console.log(`Found WhatsApp executable at: ${p}`);
           return p;
         }
      }
      console.warn("WhatsApp executable not found in common locations, falling back to 'WhatsApp.exe'");
      return 'WhatsApp.exe';
    }
    return appMapping[normalized] || appName;
  }

  /**
   * Attempts to find an element, retrying several times with delays.
   * This focuses on just *finding* it, not checking visibility/enabled state yet.
   */
  async findElementWithRetry(selector: string): Promise<Locator> {
    console.log(`Attempting to find element "${selector}"...`);
    let attempt = 0;
    while (attempt < this.automationConfig.findAttemptCount) {
      attempt++;
      try {
        const locator = this.client.locator(selector);
        // Try a basic operation like getBounds to confirm the element exists now
        await locator.getBounds();
        console.log(`   Found element "${selector}" on attempt ${attempt}.`);
        return locator; // Element found
      } catch (error) {
        if (attempt >= this.automationConfig.findAttemptCount) {
          console.error(`   Failed to find element "${selector}" after ${attempt} attempts.`);
          throw error; // Re-throw the last error
        }
        console.log(`   Element "${selector}" not found on attempt ${attempt}, retrying...`);
        await sleep(this.automationConfig.findAttemptDelay);
      }
    }
    // Should not be reached if findAttemptCount > 0, but satisfies TypeScript
    throw new Error(`Failed to find element "${selector}" after ${this.automationConfig.findAttemptCount} attempts.`);
  }

  /**
   * Clicks an element with delays and retries. Focuses on direct action after finding.
   */
  async clickElement(selector: string, retryCount: number = this.retries): Promise<void> {
    let attempt = 0;
    let lastError: unknown | undefined;

    while (attempt < retryCount) {
      attempt++;
      console.log(`Click attempt ${attempt}/${retryCount} for selector "${selector}"`);
      try {
        // 1. Find the element, retrying internally
        const element = await this.findElementWithRetry(selector);

        // 2. Add a deliberate pause *before* clicking
        console.log(`   Pausing ${this.automationConfig.preActionDelay}ms before click...`);
        await sleep(this.automationConfig.preActionDelay);

        // 3. Attempt the click directly
        console.log(`   Performing click on "${selector}"...`);
        await element.click();
        console.log(`   Successfully clicked "${selector}"`);

        // 4. Pause *after* the click
        await sleep(this.automationConfig.postActionDelay);
        return; // Success

      } catch (error) {
        console.error(`   Error on click attempt ${attempt} for "${selector}":`, error instanceof Error ? error.message : error);
        lastError = error;
        if (attempt < retryCount) {
          console.log(`   Waiting before click retry...`);
          await sleep(1000); // Longer wait between failed click attempts
        }
      }
    }
    // If loop finishes, all retries failed
    console.error(`Failed to click element "${selector}" after ${retryCount} attempts.`);
    throw lastError || new Error(`Failed to click element "${selector}" after ${retryCount} attempts`);
  }

  /**
   * Types text into an element with delays and retries.
   */
  async typeText(selector: string, text: string, retryCount: number = this.retries): Promise<void> {
     let attempt = 0;
     let lastError: unknown | undefined;

     while (attempt < retryCount) {
       attempt++;
       console.log(`Type attempt ${attempt}/${retryCount} for selector "${selector}"`);
       try {
         // 1. Find the element
         const element = await this.findElementWithRetry(selector);

         // 2. Pause before typing
         console.log(`   Pausing ${this.automationConfig.preActionDelay}ms before typing...`);
         await sleep(this.automationConfig.preActionDelay);

         // 3. Perform typing (character-by-character)
         console.log(`   Typing text "${text}" into "${selector}"...`);
         for (const char of text) {
           await element.typeText(char);
           await sleep(this.automationConfig.typeKeystrokeDelay);
         }
         console.log(`   Finished typing into "${selector}".`);

         // 4. Pause after typing
         await sleep(this.automationConfig.postActionDelay);
         return; // Success

       } catch (error) {
         console.error(`   Error on type attempt ${attempt} for "${selector}":`, error instanceof Error ? error.message : error);
         lastError = error;
         if (attempt < retryCount) {
           console.log(`   Waiting before type retry...`);
           await sleep(1000);
         }
       }
     }
     // If loop finishes, all retries failed
     console.error(`Failed to type into element "${selector}" after ${retryCount} attempts.`);
     throw lastError || new Error(`Failed to type into element "${selector}" after ${retryCount} attempts`);
   }


  /**
   * Gets text from an element after finding it.
   */
  async getText(selector: string): Promise<string> {
    try {
      // 1. Find the element
      const element = await this.findElementWithRetry(selector);

      // 2. Pause before getting text
      await sleep(this.automationConfig.preActionDelay / 2); // Shorter pause for read operations

      // 3. Get text
      const result = await element.getText();
      console.log(`Got text from "${selector}": "${result.text}"`);
      return result.text;

    } catch (error) {
      console.error(`Error getting text from "${selector}":`, error instanceof Error ? error.message : error);
      throw error;
    }
  }

  // --- executeTestCase and executeStep remain largely the same, calling the updated methods ---

  /**
   * Executes all steps of a given test case.
   */
  async executeTestCase(testCase: TestCase): Promise<TestResult> {
    const result: TestResult = {
      testCase,
      status: 'PASS',
      startTime: new Date(),
      endTime: new Date(), // Will be updated
      duration: 0,
      steps: []
    };

    try {
      // Launch the application
      await this.launchApp(testCase.application);

      // Execute each step
      for (const step of testCase.steps) {
        const stepStartTime = Date.now();
        try {
          await this.executeStep(step); // Calls the updated action methods
          result.steps.push({ step, status: 'PASS' });
          console.log(`   Step PASSED: ${step.description} (took ${Date.now() - stepStartTime}ms)`);
        } catch (error) {
          const errMsg = error instanceof Error ? error.message : String(error);
          console.error(`   Step FAILED: ${step.description}. Error: ${errMsg}`);
          result.steps.push({ step, status: 'FAIL', error: errMsg });
          result.status = 'FAIL';
          result.error = `Test case failed at step: "${step.description}". Error: ${errMsg}`;
          break; // Stop test case on first failure
        }
      }
    } catch (error) {
      // Errors during launch or setup
      const errMsg = error instanceof Error ? error.message : String(error);
      console.error(`Critical test execution error for "${testCase.name}": ${errMsg}`);
      result.status = 'ERROR';
      result.error = `Critical test execution error: ${errMsg}`;
    }

    result.endTime = new Date();
    result.duration = result.endTime.getTime() - result.startTime.getTime();
    console.log(`Test case "${testCase.name}" finished with status: ${result.status} in ${result.duration}ms`);
    return result;
  }

  /**
   * Executes a single test step based on its action.
   */
  private async executeStep(step: TestStep): Promise<void> {
    console.log(`---> Executing Step: ${step.description} (Action: ${step.action})`);
    switch (step.action) {
      case 'click':
        if (!step.selector) throw new Error(`Missing selector for click action: ${step.description}`);
        await this.clickElement(step.selector); // Uses updated clickElement
        break;
      case 'type':
        if (!step.selector) throw new Error(`Missing selector for type action: ${step.description}`);
        if (step.value === undefined || step.value === null) throw new Error(`Missing value for type action: ${step.description}`);
        await this.typeText(step.selector, step.value); // Uses updated typeText
        break;
      case 'verify':
        if (!step.selector) throw new Error(`Missing selector for verify action: ${step.description}`);
        if (step.value === undefined || step.value === null) throw new Error(`Missing value for verify action: ${step.description}`);
        const actualText = await this.getText(step.selector); // Uses updated getText
        if (!actualText.includes(step.value)) {
          // Use expectTextEquals for better error reporting if available and exact match needed
          // await this.findElementWithRetry(step.selector).expectTextEquals(step.value);
          throw new Error(`Verification failed for "${step.description}". Expected text containing "${step.value}" but got "${actualText}"`);
        }
        console.log(`   Verification PASSED: Text includes "${step.value}".`);
        break;
      case 'wait':
        const waitTime = step.value ? parseInt(step.value, 10) : 1000; // Default 1s
        if (isNaN(waitTime) || waitTime < 0) throw new Error(`Invalid wait time value: ${step.value}`);
        console.log(`Explicit wait for ${waitTime}ms...`);
        await sleep(waitTime);
        break;
      default:
        const _unhandledAction: never = step.action;
        throw new Error(`Unknown or unhandled step action type: '${step.action}' in step: ${step.description}`);
    }
  }
}
