// src/core/ai-generator.ts
import { GoogleGenAI } from '@google/genai';
import { TestCase } from '../models/test-case';

export class AITestGenerator {
  private ai: GoogleGenAI;
  private modelName: string;
  private temperature: number;
  
  constructor(apiKey: string, config: { model: string; temperature: number }) {
    // Initialize the Google Gen AI with API key
    this.ai = new GoogleGenAI({
      apiKey: apiKey
    });
    
    this.modelName = config.model;
    this.temperature = config.temperature;
    
    console.log(`AI Test Generator initialized with model: ${this.modelName}`);
  }

  async generateTestCases(appDescription: string, appName: string, numberOfTests: number = 3): Promise<TestCase[]> {
    try {
      console.log(`Generating ${numberOfTests} test cases for ${appName}...`);
      const prompt = this.createTestGenerationPrompt(appDescription, appName, numberOfTests);
      
      const config = {
        temperature: this.temperature,
        responseMimeType: 'text/plain',
      };
      
      const contents = [
        {
          role: 'user',
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ];
  
      // Generate content with streaming
      const response = await this.ai.models.generateContentStream({
        model: this.modelName,
        config,
        contents,
      });
      
      // Collect the streamed chunks
      let fullContent = '';
      for await (const chunk of response) {
        if (chunk.text) {
          fullContent += chunk.text;
          process.stdout.write('.'); // Optional: Show progress in console
        }
      }
      
      if (!fullContent) {
        throw new Error("Empty response from Gemini API");
      }
      
      console.log("Received complete response from Gemini API");
      
      try {
        // Parse JSON as before
        const jsonMatch = fullContent.match(/```json\s*([\s\S]*?)\s*```/) || 
                          fullContent.match(/```\s*([\s\S]*?)\s*```/) || 
                          [null, fullContent];
        
        const jsonContent = jsonMatch[1] || fullContent;
        const parsedTestCases = JSON.parse(jsonContent);
        
        if (!Array.isArray(parsedTestCases)) {
          throw new Error("Response is not a valid array of test cases");
        }
        
        console.log(`Successfully parsed ${parsedTestCases.length} test cases`);
        return parsedTestCases as TestCase[];
      } catch (parseError) {
        if (parseError instanceof Error) {
          console.error('Error parsing AI response as JSON:', parseError.message);
        } else {
          console.error('Error parsing AI response as JSON:', parseError);
        }
        console.log('Raw AI response (first 500 chars):', fullContent.substring(0, 500) + '...');
        return [];
      }
    } catch (error: any) {
      console.error('Error generating test cases:', error.message || error);
      return [];
    }
  }
  
  private getExecutableName(appName: string): string {
    const appMapping: Record<string, string> = {
      'calculator': 'calc',
      'notepad': 'notepad',
      'paint': 'mspaint',
      'wordpad': 'wordpad',
      'browser': 'msedge' // Or another browser you have installed
    };

    const normalizedName = appName.toLowerCase();
    return appMapping[normalizedName] || appName;
  }

 private createTestGenerationPrompt(appDescription: string, appName: string, numberOfTests: number): string {
  const executableName = this.getExecutableName(appName);
  
  return `
Generate ${numberOfTests} test cases for automated UI testing of the following application:

Application Description:
${appDescription}

Each test case should follow this JSON structure in an array:
[
  {
    "id": "unique-test-id",
    "name": "Test Name",
    "description": "Detailed test description", 
    "application": "${executableName}", 
    "steps": [
      {
        "action": "click|type|verify|wait",
        "selector": "name:ButtonName or role:button", 
        "value": "text to type or verify (if applicable)",
        "description": "Description of this step"
      }
    ],
    "expectedResults": ["Expected result 1", "Expected result 2"]
  }
]

Use realistic UI selectors that might exist in this application.
For Windows, Calculator is launched with 'calc', Notepad with 'notepad', etc.
Return the test cases as a valid JSON array wrapped in code blocks.
`;
}}