import {
  ParsedContract,
  ContractFunction,
  StateVariable,
  AccessControlPattern,
} from './types';

/**
 * Parses Solidity source code to extract structural information
 * This is a lightweight static analysis for feeding context to Gemini
 */
export function parseContract(sourceCode: string): ParsedContract {
  const contractName = extractContractName(sourceCode);
  const functions = extractFunctions(sourceCode);
  const stateVariables = extractStateVariables(sourceCode);
  const accessControl = detectAccessControl(sourceCode);
  const inheritsFrom = extractInheritance(sourceCode);

  return {
    name: contractName,
    functions,
    stateVariables,
    accessControl,
    inheritsFrom,
    hasUpgradeability: detectUpgradeability(sourceCode),
    hasSelfdestruct: /selfdestruct|suicide/i.test(sourceCode),
    hasDelegateCall: /delegatecall/i.test(sourceCode),
    usesAssembly: /assembly\s*\{/i.test(sourceCode),
    externalCalls: extractExternalCalls(sourceCode),
    events: extractEvents(sourceCode),
  };
}

function extractContractName(source: string): string {
  const match = source.match(/contract\s+(\w+)/);
  return match ? match[1] : 'Unknown';
}

function extractFunctions(source: string): ContractFunction[] {
  const functions: ContractFunction[] = [];
  
  // Match function declarations
  const funcRegex = /function\s+(\w+)\s*\(([^)]*)\)\s*(public|external|internal|private)?\s*(view|pure|payable)?\s*(returns\s*\([^)]*\))?/g;
  let match;

  while ((match = funcRegex.exec(source)) !== null) {
    const [, name, params, visibility, modifier, returnType] = match;
    
    // Extract modifiers from the function context
    const funcContext = source.slice(Math.max(0, match.index - 100), match.index + match[0].length + 200);
    const modifiers = extractModifiers(funcContext);

    functions.push({
      name,
      visibility: (visibility as ContractFunction['visibility']) || 'public',
      modifiers,
      parameters: parseParameters(params),
      returnType: returnType?.replace('returns', '').trim(),
      isPayable: modifier === 'payable',
      stateChanging: modifier !== 'view' && modifier !== 'pure',
    });
  }

  return functions;
}

function parseParameters(params: string): { name: string; type: string }[] {
  if (!params.trim()) return [];
  
  return params.split(',').map(param => {
    const parts = param.trim().split(/\s+/);
    const type = parts[0] || 'unknown';
    const name = parts[parts.length - 1] || 'unnamed';
    return { type, name };
  });
}

function extractModifiers(context: string): string[] {
  const modifiers: string[] = [];
  
  // Common modifier patterns
  const modifierPatterns = [
    'onlyOwner',
    'onlyAdmin',
    'onlyRole',
    'whenNotPaused',
    'whenPaused',
    'nonReentrant',
    'initializer',
    'authorized',
  ];

  modifierPatterns.forEach(mod => {
    if (context.includes(mod)) {
      modifiers.push(mod);
    }
  });

  return modifiers;
}

function extractStateVariables(source: string): StateVariable[] {
  const variables: StateVariable[] = [];
  
  // Match state variable declarations
  const varRegex = /(address|uint\d*|int\d*|bool|string|bytes\d*|mapping\([^)]+\))\s+(public|private|internal)?\s*(constant|immutable)?\s+(\w+)/g;
  let match;

  while ((match = varRegex.exec(source)) !== null) {
    const [, type, visibility, mutability, name] = match;
    variables.push({
      name,
      type,
      visibility: (visibility as StateVariable['visibility']) || 'internal',
      isConstant: mutability === 'constant' || mutability === 'immutable',
      isMutable: mutability !== 'constant' && mutability !== 'immutable',
    });
  }

  return variables;
}

function detectAccessControl(source: string): AccessControlPattern {
  const hasOwnable = /Ownable|owner\s*\(\)/i.test(source);
  const hasAccessControl = /AccessControl|hasRole|grantRole/i.test(source);
  const hasMultiSig = /MultiSig|multisig|gnosis/i.test(source);

  if (hasMultiSig) {
    return {
      type: 'multi-sig',
      hasRenounce: /renounceOwnership/i.test(source),
      hasTransfer: /transferOwnership/i.test(source),
    };
  }

  if (hasAccessControl) {
    const roles = extractRoles(source);
    return {
      type: 'role-based',
      roles,
      hasRenounce: /renounceRole/i.test(source),
    };
  }

  if (hasOwnable) {
    return {
      type: 'owner',
      hasRenounce: /renounceOwnership/i.test(source),
      hasTransfer: /transferOwnership/i.test(source),
    };
  }

  return { type: 'none' };
}

function extractRoles(source: string): string[] {
  const roles: string[] = [];
  const roleRegex = /bytes32.*?(\w+_ROLE)/g;
  let match;

  while ((match = roleRegex.exec(source)) !== null) {
    roles.push(match[1]);
  }

  return roles;
}

function extractInheritance(source: string): string[] {
  const match = source.match(/contract\s+\w+\s+is\s+([^{]+)/);
  if (!match) return [];
  
  return match[1].split(',').map(s => s.trim());
}

function detectUpgradeability(source: string): boolean {
  const upgradePatterns = [
    'Upgradeable',
    'UUPSUpgradeable',
    'TransparentProxy',
    'BeaconProxy',
    'initialize',
    'initializer',
    '_disableInitializers',
  ];

  return upgradePatterns.some(pattern => source.includes(pattern));
}

function extractExternalCalls(source: string): string[] {
  const calls: string[] = [];
  
  // Match external contract calls
  const callRegex = /(\w+)\.call\{|(\w+)\.transfer\(|(\w+)\.send\(/g;
  let match;

  while ((match = callRegex.exec(source)) !== null) {
    const target = match[1] || match[2] || match[3];
    if (!calls.includes(target)) {
      calls.push(target);
    }
  }

  return calls;
}

function extractEvents(source: string): string[] {
  const events: string[] = [];
  const eventRegex = /event\s+(\w+)/g;
  let match;

  while ((match = eventRegex.exec(source)) !== null) {
    events.push(match[1]);
  }

  return events;
}

/**
 * Creates a structured summary for Gemini prompt
 */
export function createContractSummary(parsed: ParsedContract): string {
  const publicFuncs = parsed.functions.filter(f => 
    f.visibility === 'public' || f.visibility === 'external'
  );
  
  const payableFuncs = parsed.functions.filter(f => f.isPayable);
  const stateChangingFuncs = parsed.functions.filter(f => 
    f.stateChanging && (f.visibility === 'public' || f.visibility === 'external')
  );

  return `
## Contract: ${parsed.name}

### Inheritance
${parsed.inheritsFrom.length > 0 ? parsed.inheritsFrom.join(', ') : 'None'}

### Access Control
- Pattern: ${parsed.accessControl.type}
${parsed.accessControl.roles ? `- Roles: ${parsed.accessControl.roles.join(', ')}` : ''}
${parsed.accessControl.hasRenounce ? '- Can renounce ownership' : ''}
${parsed.accessControl.hasTransfer ? '- Can transfer ownership' : ''}

### Risk Indicators
- Upgradeability: ${parsed.hasUpgradeability ? '⚠️ YES' : 'No'}
- Selfdestruct: ${parsed.hasSelfdestruct ? '🚨 YES' : 'No'}
- Delegatecall: ${parsed.hasDelegateCall ? '⚠️ YES' : 'No'}
- Assembly usage: ${parsed.usesAssembly ? '⚠️ YES' : 'No'}

### Public/External Functions (${publicFuncs.length})
${publicFuncs.map(f => `- ${f.name}(${f.parameters.map(p => p.type).join(', ')})${f.isPayable ? ' [payable]' : ''}${f.modifiers.length > 0 ? ` [${f.modifiers.join(', ')}]` : ''}`).join('\n')}

### Payable Functions (${payableFuncs.length})
${payableFuncs.map(f => `- ${f.name}`).join('\n') || 'None'}

### State-Changing External Functions (${stateChangingFuncs.length})
${stateChangingFuncs.map(f => `- ${f.name}`).join('\n')}

### State Variables (${parsed.stateVariables.length})
${parsed.stateVariables.map(v => `- ${v.name}: ${v.type} [${v.visibility}]${v.isConstant ? ' (constant)' : ''}`).join('\n')}

### External Calls
${parsed.externalCalls.length > 0 ? parsed.externalCalls.join(', ') : 'None detected'}

### Events
${parsed.events.length > 0 ? parsed.events.join(', ') : 'None'}
`.trim();
}
