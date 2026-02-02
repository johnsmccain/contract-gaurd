import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  ParsedContract,
  AnalysisResult,
  RiskFinding,
  ExploitNarrative,
  RiskSeverity,
} from "./types";
import { createContractSummary } from "./contract-parser";

/**
 * ContractGuard Gemini Service
 * Uses Gemini API as an intelligent reasoning engine for smart contract analysis
 */
export class ContractAnalyzer {
  private genAI: GoogleGenerativeAI;
  private model: ReturnType<GoogleGenerativeAI["getGenerativeModel"]>;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({
      model: "gemini-3-pro-preview",
      generationConfig: { responseMimeType: "application/json" },
    });
  }

  /**
   * Main analysis function - uses Gemini to reason about contract risks
   */
  async analyzeContract(
    sourceCode: string,
    parsedContract: ParsedContract,
  ): Promise<AnalysisResult> {
    const contractSummary = createContractSummary(parsedContract);

    const prompt = `You are ContractGuard, an expert smart contract security analyst. Your role is to identify potential risks, explain them clearly to both technical and non-technical audiences, and help developers understand what could go wrong.

## SOURCE CODE
\`\`\`solidity
${sourceCode}
\`\`\`

## PARSED CONTRACT STRUCTURE
${contractSummary}

## YOUR TASK
Analyze this smart contract and identify potential security risks. For each risk:
1. Explain what the vulnerability is
2. Describe a realistic exploit scenario (from an attacker's perspective)
3. Explain the potential impact in plain language
4. Suggest mitigations

Focus on these risk categories:
- **Access Control**: Who can call critical functions? Can owners abuse their power?
- **Fund Security**: How are funds handled? Can they be drained or locked?
- **Logic Errors**: Are there calculation issues, reentrancy vectors, or state inconsistencies?
- **External Calls**: Are there unsafe external interactions?
- **Upgradeability**: Can the contract behavior be changed maliciously?

## OUTPUT FORMAT (JSON)
{
  "overallScore": <number 0-10, where 10 is highest risk>,
  "riskLevel": "<LOW|MEDIUM|HIGH|CRITICAL>",
  "summary": "<2-3 sentence executive summary of the contract's risk profile>",
  "findings": [
    {
      "id": "<unique-id>",
      "title": "<short descriptive title>",
      "severity": "<LOW|MEDIUM|HIGH|CRITICAL>",
      "category": "<access-control|fund-security|logic|external-calls|upgradeability>",
      "description": "<technical description of the issue>",
      "affectedCode": "<relevant code snippet if applicable>",
      "exploitScenario": "<step-by-step attack scenario from attacker perspective>",
      "impact": "<plain language explanation of what happens if exploited>",
      "mitigation": "<recommended fix or best practice>"
    }
  ],
  "exploitNarratives": [
    {
      "title": "<attack name>",
      "attackerProfile": "<who might attempt this: competitor, insider, opportunist, etc>",
      "steps": ["<step 1>", "<step 2>", ...],
      "outcome": "<what the attacker gains>",
      "estimatedImpact": "<financial or operational impact estimate>",
      "probability": "<Low|Medium|High>"
    }
  ],
  "positiveAspects": ["<good security practices observed>"],
  "recommendations": ["<high-level recommendations for the development team>"]
}

Be thorough but realistic. Don't invent issues that aren't there, but don't miss real risks either. Explain technical concepts in accessible terms.`;

    try {
      const result = await this.model.generateContent(prompt);
      console.log("First result:", result);
      const text = result.response.text();

      // Log the raw response for debugging
      console.log("Gemini raw response:", text);

      const data = JSON.parse(text);

      return {
        contractName: parsedContract.name,
        overallScore: data.overallScore || 0,
        riskLevel: (data.riskLevel as RiskSeverity) || "LOW",
        summary: data.summary || "Analysis complete.",
        findings: (data.findings || []).map((f: RiskFinding) => ({
          id: f.id || crypto.randomUUID(),
          title: f.title,
          severity: f.severity,
          category: f.category,
          description: f.description,
          affectedCode: f.affectedCode,
          exploitScenario: f.exploitScenario,
          impact: f.impact,
          mitigation: f.mitigation,
        })),
        exploitNarratives: data.exploitNarratives || [],
        positiveAspects: data.positiveAspects || [],
        recommendations: data.recommendations || [],
        analyzedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.log(error)
      console.error("Gemini Analysis Error Details:", error);

      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes("API key")) {
          throw new Error(
            "Invalid Gemini API key. Please check your API key and try again.",
          );
        } else if (error.message.includes("quota")) {
          throw new Error(
            "API quota exceeded. Please check your Gemini API usage limits.",
          );
        } else if (error.message.includes("JSON")) {
          throw new Error(
            "Failed to parse Gemini response. The AI returned invalid JSON.",
          );
        } else {
          throw new Error(`Gemini API Error: ${error.message}`);
        }
      }

      throw new Error(
        "Failed to analyze contract with Gemini. Check console for details.",
      );
    }
  }

  /**
   * Generate a detailed exploit narrative for a specific finding
   */
  async generateDetailedNarrative(
    finding: RiskFinding,
    contractName: string,
  ): Promise<ExploitNarrative> {
    const prompt = `You are a security researcher explaining a vulnerability to stakeholders.

## Vulnerability
- Contract: ${contractName}
- Issue: ${finding.title}
- Severity: ${finding.severity}
- Description: ${finding.description}

## Task
Create a detailed, realistic exploit narrative that explains:
1. Who might attempt this attack (attacker profile)
2. Step-by-step how they would execute it
3. What they would gain
4. The estimated impact

Make it accessible to non-technical stakeholders while remaining accurate.

## Output Format (JSON)
{
  "title": "<attack name>",
  "attackerProfile": "<who: nation-state, competitor, insider, opportunist, automated bot>",
  "steps": ["<detailed step 1>", "<step 2>", ...],
  "outcome": "<what attacker achieves>",
  "estimatedImpact": "<financial/operational impact>",
  "probability": "<Low|Medium|High>"
}`;

    const result = await this.model.generateContent(prompt);
    const text = result.response.text();
    return JSON.parse(text);
  }

  /**
   * Get quick insights without full analysis
   */
  async getQuickInsights(sourceCode: string): Promise<string[]> {
    const model = this.genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: { responseMimeType: "application/json" },
    });

    const prompt = `Quickly scan this smart contract and provide 3-5 key observations about its security profile:

\`\`\`solidity
${sourceCode}
\`\`\`

Return as JSON: { "insights": ["<insight 1>", "<insight 2>", ...] }`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const data = JSON.parse(text);
    return data.insights || [];
  }
}
