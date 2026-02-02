/**
 * Example smart contracts for demo purposes
 * These showcase different vulnerability patterns that Gemini can analyze
 */

export const exampleContracts = {
  vulnerableVault: {
    name: 'Vulnerable Vault',
    description: 'A vault contract with multiple security issues including reentrancy and admin abuse potential',
    code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title SimpleVault
 * @notice A basic vault for depositing and withdrawing ETH
 * WARNING: This contract has intentional vulnerabilities for educational purposes
 */
contract SimpleVault {
    address public owner;
    mapping(address => uint256) public balances;
    bool public paused;
    
    event Deposit(address indexed user, uint256 amount);
    event Withdrawal(address indexed user, uint256 amount);
    event OwnerWithdrawal(address indexed owner, uint256 amount);
    
    constructor() {
        owner = msg.sender;
    }
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    modifier whenNotPaused() {
        require(!paused, "Contract paused");
        _;
    }
    
    function deposit() external payable whenNotPaused {
        require(msg.value > 0, "Must deposit something");
        balances[msg.sender] += msg.value;
        emit Deposit(msg.sender, msg.value);
    }
    
    // Vulnerability: Reentrancy - state update after external call
    function withdraw(uint256 amount) external whenNotPaused {
        require(balances[msg.sender] >= amount, "Insufficient balance");
        
        // External call before state update - VULNERABLE
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");
        
        balances[msg.sender] -= amount;
        emit Withdrawal(msg.sender, amount);
    }
    
    // Vulnerability: Owner can drain all funds
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        (bool success, ) = owner.call{value: balance}("");
        require(success, "Transfer failed");
        emit OwnerWithdrawal(owner, balance);
    }
    
    // Vulnerability: Owner can pause and trap user funds
    function setPaused(bool _paused) external onlyOwner {
        paused = _paused;
    }
    
    // Vulnerability: No timelock or multi-sig for ownership transfer
    function transferOwnership(address newOwner) external onlyOwner {
        owner = newOwner;
    }
    
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
}`,
  },

  adminToken: {
    name: 'Admin Token',
    description: 'An ERC20-like token with excessive admin privileges',
    code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title AdminToken
 * @notice ERC20-like token with admin controls
 * WARNING: This contract demonstrates admin abuse potential
 */
contract AdminToken {
    string public name = "AdminToken";
    string public symbol = "ADMIN";
    uint8 public decimals = 18;
    uint256 public totalSupply;
    
    address public admin;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    mapping(address => bool) public blacklisted;
    
    bool public tradingEnabled;
    uint256 public maxTransferAmount;
    
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event Blacklisted(address indexed account, bool status);
    event Mint(address indexed to, uint256 amount);
    event Burn(address indexed from, uint256 amount);
    
    constructor(uint256 initialSupply) {
        admin = msg.sender;
        totalSupply = initialSupply * 10**decimals;
        balanceOf[msg.sender] = totalSupply;
        maxTransferAmount = totalSupply;
        emit Transfer(address(0), msg.sender, totalSupply);
    }
    
    modifier onlyAdmin() {
        require(msg.sender == admin, "Not admin");
        _;
    }
    
    modifier notBlacklisted(address account) {
        require(!blacklisted[account], "Account is blacklisted");
        _;
    }
    
    // Vulnerability: Admin can mint unlimited tokens
    function mint(address to, uint256 amount) external onlyAdmin {
        totalSupply += amount;
        balanceOf[to] += amount;
        emit Mint(to, amount);
        emit Transfer(address(0), to, amount);
    }
    
    // Vulnerability: Admin can burn anyone's tokens
    function burnFrom(address from, uint256 amount) external onlyAdmin {
        require(balanceOf[from] >= amount, "Insufficient balance");
        balanceOf[from] -= amount;
        totalSupply -= amount;
        emit Burn(from, amount);
        emit Transfer(from, address(0), amount);
    }
    
    // Vulnerability: Admin can blacklist any address
    function setBlacklist(address account, bool status) external onlyAdmin {
        blacklisted[account] = status;
        emit Blacklisted(account, status);
    }
    
    // Vulnerability: Admin controls if trading is allowed
    function setTradingEnabled(bool enabled) external onlyAdmin {
        tradingEnabled = enabled;
    }
    
    // Vulnerability: Admin can limit transfer amounts arbitrarily
    function setMaxTransferAmount(uint256 amount) external onlyAdmin {
        maxTransferAmount = amount;
    }
    
    function transfer(address to, uint256 value) external 
        notBlacklisted(msg.sender) 
        notBlacklisted(to) 
        returns (bool) 
    {
        require(tradingEnabled || msg.sender == admin, "Trading not enabled");
        require(value <= maxTransferAmount, "Exceeds max transfer amount");
        require(balanceOf[msg.sender] >= value, "Insufficient balance");
        
        balanceOf[msg.sender] -= value;
        balanceOf[to] += value;
        emit Transfer(msg.sender, to, value);
        return true;
    }
    
    function approve(address spender, uint256 value) external returns (bool) {
        allowance[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }
    
    function transferFrom(address from, address to, uint256 value) external 
        notBlacklisted(from) 
        notBlacklisted(to) 
        returns (bool) 
    {
        require(tradingEnabled || msg.sender == admin, "Trading not enabled");
        require(value <= maxTransferAmount, "Exceeds max transfer amount");
        require(balanceOf[from] >= value, "Insufficient balance");
        require(allowance[from][msg.sender] >= value, "Insufficient allowance");
        
        balanceOf[from] -= value;
        balanceOf[to] += value;
        allowance[from][msg.sender] -= value;
        emit Transfer(from, to, value);
        return true;
    }
}`,
  },

  upgradeableProxy: {
    name: 'Upgradeable Proxy',
    description: 'A proxy pattern implementation with upgrade risks',
    code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title SimpleProxy
 * @notice A basic upgradeable proxy pattern
 * WARNING: This demonstrates upgrade-related risks
 */
contract SimpleProxy {
    // Storage slot for implementation address (EIP-1967)
    bytes32 private constant IMPLEMENTATION_SLOT = 
        bytes32(uint256(keccak256("eip1967.proxy.implementation")) - 1);
    
    // Storage slot for admin address
    bytes32 private constant ADMIN_SLOT = 
        bytes32(uint256(keccak256("eip1967.proxy.admin")) - 1);
    
    event Upgraded(address indexed implementation);
    event AdminChanged(address previousAdmin, address newAdmin);
    
    constructor(address initialImplementation, address admin_) {
        _setImplementation(initialImplementation);
        _setAdmin(admin_);
    }
    
    modifier onlyAdmin() {
        require(msg.sender == _getAdmin(), "Not admin");
        _;
    }
    
    // Vulnerability: Single admin can upgrade to malicious implementation
    function upgradeTo(address newImplementation) external onlyAdmin {
        _setImplementation(newImplementation);
        emit Upgraded(newImplementation);
    }
    
    // Vulnerability: upgradeToAndCall can execute arbitrary code
    function upgradeToAndCall(address newImplementation, bytes memory data) external onlyAdmin {
        _setImplementation(newImplementation);
        emit Upgraded(newImplementation);
        
        (bool success, ) = newImplementation.delegatecall(data);
        require(success, "Call failed");
    }
    
    // Vulnerability: No timelock on admin change
    function changeAdmin(address newAdmin) external onlyAdmin {
        address oldAdmin = _getAdmin();
        _setAdmin(newAdmin);
        emit AdminChanged(oldAdmin, newAdmin);
    }
    
    function _getImplementation() internal view returns (address impl) {
        bytes32 slot = IMPLEMENTATION_SLOT;
        assembly {
            impl := sload(slot)
        }
    }
    
    function _setImplementation(address newImplementation) private {
        bytes32 slot = IMPLEMENTATION_SLOT;
        assembly {
            sstore(slot, newImplementation)
        }
    }
    
    function _getAdmin() internal view returns (address adm) {
        bytes32 slot = ADMIN_SLOT;
        assembly {
            adm := sload(slot)
        }
    }
    
    function _setAdmin(address newAdmin) private {
        bytes32 slot = ADMIN_SLOT;
        assembly {
            sstore(slot, newAdmin)
        }
    }
    
    function implementation() external view returns (address) {
        return _getImplementation();
    }
    
    function admin() external view returns (address) {
        return _getAdmin();
    }
    
    // Forward all calls to implementation
    fallback() external payable {
        address impl = _getImplementation();
        assembly {
            calldatacopy(0, 0, calldatasize())
            let result := delegatecall(gas(), impl, 0, calldatasize(), 0, 0)
            returndatacopy(0, 0, returndatasize())
            switch result
            case 0 { revert(0, returndatasize()) }
            default { return(0, returndatasize()) }
        }
    }
    
    receive() external payable {}
}`,
  },

  safeVault: {
    name: 'Safe Vault',
    description: 'A well-designed vault with proper security patterns',
    code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";

/**
 * @title SafeVault
 * @notice A secure vault implementation following best practices
 */
contract SafeVault is ReentrancyGuard, Pausable, Ownable2Step {
    mapping(address => uint256) public balances;
    uint256 public constant MAX_DEPOSIT = 100 ether;
    uint256 public constant WITHDRAWAL_DELAY = 1 days;
    
    struct WithdrawalRequest {
        uint256 amount;
        uint256 unlockTime;
        bool executed;
    }
    
    mapping(address => WithdrawalRequest) public pendingWithdrawals;
    
    event Deposit(address indexed user, uint256 amount);
    event WithdrawalRequested(address indexed user, uint256 amount, uint256 unlockTime);
    event WithdrawalExecuted(address indexed user, uint256 amount);
    event WithdrawalCancelled(address indexed user);
    
    constructor() Ownable(msg.sender) {}
    
    function deposit() external payable whenNotPaused {
        require(msg.value > 0, "Must deposit something");
        require(msg.value <= MAX_DEPOSIT, "Exceeds max deposit");
        require(balances[msg.sender] + msg.value <= MAX_DEPOSIT, "Would exceed limit");
        
        balances[msg.sender] += msg.value;
        emit Deposit(msg.sender, msg.value);
    }
    
    // Secure: Uses withdrawal delay pattern
    function requestWithdrawal(uint256 amount) external whenNotPaused {
        require(balances[msg.sender] >= amount, "Insufficient balance");
        require(pendingWithdrawals[msg.sender].amount == 0, "Pending withdrawal exists");
        
        pendingWithdrawals[msg.sender] = WithdrawalRequest({
            amount: amount,
            unlockTime: block.timestamp + WITHDRAWAL_DELAY,
            executed: false
        });
        
        emit WithdrawalRequested(msg.sender, amount, block.timestamp + WITHDRAWAL_DELAY);
    }
    
    // Secure: ReentrancyGuard, checks-effects-interactions pattern
    function executeWithdrawal() external nonReentrant whenNotPaused {
        WithdrawalRequest storage request = pendingWithdrawals[msg.sender];
        
        require(request.amount > 0, "No pending withdrawal");
        require(!request.executed, "Already executed");
        require(block.timestamp >= request.unlockTime, "Still locked");
        require(balances[msg.sender] >= request.amount, "Insufficient balance");
        
        // Effects before interactions
        uint256 amount = request.amount;
        request.executed = true;
        balances[msg.sender] -= amount;
        
        // Interaction last
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");
        
        emit WithdrawalExecuted(msg.sender, amount);
    }
    
    function cancelWithdrawal() external {
        require(pendingWithdrawals[msg.sender].amount > 0, "No pending withdrawal");
        require(!pendingWithdrawals[msg.sender].executed, "Already executed");
        
        delete pendingWithdrawals[msg.sender];
        emit WithdrawalCancelled(msg.sender);
    }
    
    // Admin functions with safeguards
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
}`,
  },
};

export type ExampleContractKey = keyof typeof exampleContracts;
