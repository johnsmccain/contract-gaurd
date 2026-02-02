// Risk severity levels
export type RiskSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

// Contract function analysis
export interface ContractFunction {
  name: string;
  visibility: 'public' | 'external' | 'internal' | 'private';
  modifiers: string[];
  parameters: { name: string; type: string }[];
  returnType?: string;
  isPayable: boolean;
  stateChanging: boolean;
}

// State variable analysis
export interface StateVariable {
  name: string;
  type: string;
  visibility: 'public' | 'private' | 'internal';
  isConstant: boolean;
  isMutable: boolean;
}

// Access control pattern
export interface AccessControlPattern {
  type: 'owner' | 'role-based' | 'multi-sig' | 'none';
  owner?: string;
  roles?: string[];
  hasRenounce?: boolean;
  hasTransfer?: boolean;
}

// Parsed contract structure
export interface ParsedContract {
  name: string;
  functions: ContractFunction[];
  stateVariables: StateVariable[];
  accessControl: AccessControlPattern;
  inheritsFrom: string[];
  hasUpgradeability: boolean;
  hasSelfdestruct: boolean;
  hasDelegateCall: boolean;
  usesAssembly: boolean;
  externalCalls: string[];
  events: string[];
}

// Individual risk finding
export interface RiskFinding {
  id: string;
  title: string;
  severity: RiskSeverity;
  category: 'access-control' | 'fund-security' | 'logic' | 'external-calls' | 'upgradeability';
  description: string;
  affectedCode?: string;
  exploitScenario: string;
  impact: string;
  mitigation: string;
}

// Exploit narrative
export interface ExploitNarrative {
  title: string;
  attackerProfile: string;
  steps: string[];
  outcome: string;
  estimatedImpact: string;
  probability: 'Low' | 'Medium' | 'High';
}

// Overall analysis result
export interface AnalysisResult {
  contractName: string;
  overallScore: number; // 0-10, higher is riskier
  riskLevel: RiskSeverity;
  summary: string;
  findings: RiskFinding[];
  exploitNarratives: ExploitNarrative[];
  positiveAspects: string[];
  recommendations: string[];
  analyzedAt: string;
}

// Input types
export interface ContractInput {
  type: 'source' | 'address';
  content: string;
  network?: 'ethereum' | 'polygon' | 'bsc' | 'arbitrum';
}

// Analysis state
export interface AnalysisState {
  status: 'idle' | 'parsing' | 'analyzing' | 'complete' | 'error';
  progress: number;
  currentStep: string;
  result: AnalysisResult | null;
  error: string | null;
}
