# VentingToken — On-Chain Employee Token Vesting

A full-stack blockchain application for managing employee token vesting schedules. Employers can hire employees, deposit tokens, define multi-milestone vesting schedules with cliff periods, and employees can claim their vested tokens — all on-chain.

> **Not deployed on any testnet or mainnet.**
> This project runs entirely on a **local Anvil node**. To use it, you must clone the repo, spin up Anvil, deploy the contracts, and run the frontend locally. See [Getting Started](#getting-started) below.

---

## Table of Contents

- [Overview](#overview)
- [How It Looks](#how-it-looks)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
  - [1. Clone the Repository](#1-clone-the-repository)
  - [2. Install Contract Dependencies](#2-install-contract-dependencies)
  - [3. Run the Local Blockchain](#3-run-the-local-blockchain)
  - [4. Deploy the Contracts](#4-deploy-the-contracts)
  - [5. Configure the Frontend](#5-configure-the-frontend)
  - [6. Run the Frontend](#6-run-the-frontend)
- [Smart Contract Architecture](#smart-contract-architecture)
- [Frontend Features](#frontend-features)
- [Running Tests](#running-tests)
- [Project Structure](#project-structure)

---

## Overview

VentingToken lets an employer run a fully on-chain vesting program for their employees:

- **Hire** employees with a name, total token allocation, and optional joining bonus
- **Define vesting schedules** with a cliff period and up to N milestones, each unlocking a cumulative percentage of the total allocation
- **Deposit tokens** into the contract pool so employees can actually claim them
- **Fire** employees — unvested tokens return to the pool, already-vested tokens are paid out immediately
- **Claim** vested tokens as an employee any time after a milestone has passed

All logic lives in two Solidity contracts. The frontend is a React app that connects via MetaMask (or any injected wallet) using Wagmi + Viem.

---

## How It Looks

### Employer Dashboard

The employer dashboard gives a four-stat overview at the top:

| Stat | Description |
|------|-------------|
| Active Employees | Total currently hired employees |
| Contract Balance | Tokens available in the vesting pool |
| Total Promised | Sum of all employee allocations |
| Your Wallet Balance | Employer's own token balance |

Below the stats, a warning banner appears if the contract is **underfunded** (promised > balance). The main area has two action cards (Deposit Tokens, Hire Employee) and a full employee table where you can fire an employee or set their vesting schedule inline.

```
┌─────────────────────────────────────────────────────────────┐
│  VentingToken          [0xAbCd...1234]                      │
├─────────────────────────────────────────────────────────────┤
│  [3 Active]  [9,500 Balance]  [8,000 Promised]  [500 Yours] │
│                                                             │
│  ⚠ Contract is underfunded — deposit more tokens           │
│                                                             │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │  Deposit Tokens  │  │   Hire Employee  │                │
│  └──────────────────┘  └──────────────────┘                │
│                                                             │
│  ┌─── Employee Table ─────────────────────────────────────┐ │
│  │  Name      Address     Hired       Tokens  Actions     │ │
│  │  Alice     0xAa…      2025-01-10  2000    [Fire][Vest] │ │
│  │  Bob       0xBb…      2025-02-15  3000    [Fire][Vest] │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Employee Dashboard

Employees see a **Vesting Status Card** with:

- Total tokens allocated
- Tokens already vested
- Tokens currently claimable (ready to claim now)
- A milestone progress list — each milestone shows its unlock date and percentage
- A **Claim Tokens** button (disabled if nothing is claimable)

```
┌─────────────────────────────────────────────────────────────┐
│  VentingToken          [0xAlice...5678]                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─── Your Vesting Status ──────────────────────────────┐  │
│  │                                                      │  │
│  │  Total Allocated:   2,000 VTK                        │  │
│  │  Already Vested:      500 VTK                        │  │
│  │  Claimable Now:       500 VTK                        │  │
│  │                                                      │  │
│  │  Milestones:                                         │  │
│  │   ✅  6 months  →  25%  (500 tokens)  — Unlocked    │  │
│  │   ⏳  12 months →  50%  (500 tokens)  — 3 mo. away  │  │
│  │   ⏳  24 months → 100%  (1000 tokens) — 15 mo. away │  │
│  │                                                      │  │
│  │              [ Claim 500 Tokens ]                    │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Connect Wallet Screen

If no wallet is connected, a centered card prompts you to connect. Once connected, the app automatically detects whether the address is the contract owner (employer view) or an employee (employee view), or shows a "not registered" message.

> **To add your own screenshots:** place PNG files inside a `screenshots/` folder at the project root and reference them here:
> ```markdown
> ![Employer Dashboard](screenshots/employer-dashboard.png)
> ![Employee Dashboard](screenshots/employee-dashboard.png)
> ```

---

## Tech Stack

### Smart Contracts
| Tool | Version | Purpose |
|------|---------|---------|
| Solidity | ^0.8.13 | Contract language |
| Foundry (Forge) | latest | Build, test, deploy |
| Anvil | latest | Local EVM node |
| OpenZeppelin | 5.6.1 | ERC20, Ownable base contracts |

### Frontend
| Tool | Version | Purpose |
|------|---------|---------|
| React | 18.3.1 | UI framework |
| TypeScript | 5.5.3 | Type safety |
| Wagmi | 2.12.7 | Ethereum React hooks |
| Viem | 2.21.1 | Ethereum utilities |
| TanStack Query | 5.56.2 | Data fetching & caching |
| React Router | 6.26.2 | Client-side routing |
| Tailwind CSS | 3.4.13 | Styling |
| Vite | 5.4.8 | Build tool |

---

## Prerequisites

Before you start, make sure you have:

- **Git** — [git-scm.com](https://git-scm.com)
- **Foundry** — [getfoundry.sh](https://getfoundry.sh) (includes `forge`, `anvil`, `cast`)
- **Node.js** v18+ and **npm** — [nodejs.org](https://nodejs.org)
- **MetaMask** browser extension — [metamask.io](https://metamask.io)

Install Foundry (if not already installed):

```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

---

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/<your-username>/VentingToken.git
cd VentingToken
```

### 2. Install Contract Dependencies

```bash
forge install
```

This pulls OpenZeppelin Contracts and forge-std from the `lib/` directory.

Build the contracts to verify everything compiles:

```bash
forge build
```

You should see `Compiler run successful` with no errors.

---

### 3. Run the Local Blockchain

Open a **new terminal window** and start Anvil (the local EVM node):

```bash
anvil
```

Anvil will print 10 pre-funded test accounts with private keys. **Keep this terminal running** — it is your local blockchain.

```
Available Accounts
==================
(0) 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266  (10000 ETH)
(1) 0x70997970C51812dc3A010C7d01b50e0d17dc79C8  (10000 ETH)
...

Private Keys
============
(0) 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
...
```

> Account (0) is the **deployer/employer**. Import it into MetaMask using its private key.

---

### 4. Deploy the Contracts

In your original terminal (not the Anvil one), run the deployment script:

```bash
forge script script/DeployVentingToken.s.sol \
  --broadcast \
  --rpc-url http://127.0.0.1:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

The script will output the deployed contract addresses:

```
VentingERC20 deployed at: 0x5FbDB2315678afecb367f032d93F642f64180aa3
VentingToken deployed at: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
```

**Copy these addresses** — you'll need them in the next step.

---

### 5. Configure the Frontend

```bash
cd frontend
cp .env.example .env
```

Open `frontend/.env` and fill in the contract addresses from the deployment output:

```env
VITE_CHAIN_ID=31337
VITE_RPC_URL=http://127.0.0.1:8545
VITE_VENTING_TOKEN_ADDRESS=0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
VITE_VENTING_ERC20_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
```

---

### 6. Run the Frontend

```bash
# still inside the frontend/ directory
npm install
npm run dev
```

The app will be available at **http://localhost:5173**.

#### Connect MetaMask

1. Open MetaMask → **Add a network manually**:
   - Network Name: `Anvil Local`
   - RPC URL: `http://127.0.0.1:8545`
   - Chain ID: `31337`
   - Currency Symbol: `ETH`
2. Import **Account (0)** using its private key (the deployer = employer)
3. Open the app — you'll land on the **Employer Dashboard**

To test the employee view, import a second Anvil account (e.g. Account (1)) into MetaMask, hire that address through the employer UI, then switch to Account (1) in MetaMask.

---

## Smart Contract Architecture

### `VentingERC20.sol`

A minimal ERC20 token with **0 decimals** (whole tokens only). The owner can mint additional supply. Deployed with an initial supply of **10,000,000 tokens**, all transferred to the VentingToken contract on deployment.

### `VentingToken.sol`

The core vesting manager. The deployer is the permanent **employer/owner**.

```
VestingSchedule
├── cliffDuration       — seconds before any tokens unlock (first milestone)
├── milestoneDurations  — durations from hire date for each milestone
└── cumulativePercents  — cumulative % unlocked at each milestone (must end at 100)

Employee
├── addr, name, hireDate
└── TokenVestingInfo
    ├── totalTokens     — total allocated
    ├── tokensVested    — already claimed
    ├── startDate       — hire timestamp
    └── schedule        — their VestingSchedule
```

**Key functions:**

| Function | Who | Description |
|----------|-----|-------------|
| `hireEmployee(addr, name, tokens, bonus)` | Owner | Hire + optional immediate joining bonus |
| `fireEmployee(addr)` | Owner | Pay out vested tokens, remove employee |
| `depositTokens(amount)` | Owner | Approve + deposit ERC20 tokens into pool |
| `setVestingSchedule(addr, schedule)` | Owner | Assign vesting milestones to employee |
| `claimVestedTokens()` | Employee | Claim all currently unlocked tokens |
| `getVestingStatus(addr)` | Anyone | Read employee vesting info |
| `getAllEmployeeData()` | Anyone | Bulk read all employees |
| `getContractBalance()` | Anyone | Available tokens in pool |

---

## Frontend Features

### Employer View
- **4-stat dashboard** — employees, pool balance, total promised, wallet balance
- **Underfunding warning** — banner when pool can't cover all allocations
- **Deposit Tokens** — approve ERC20 + deposit in one flow
- **Hire Employee** — name, address, total allocation, joining bonus
- **Employee Table** — view all employees; fire or set vesting schedule per row
- **Set Vesting Schedule** — configure milestones inline (up to N milestones, cumulative %)

### Employee View
- **Vesting Status Card** — total, vested, claimable, milestone progress
- **Claim Button** — enabled only when tokens are claimable; shows tx status inline

### Shared
- **Wallet-gated routing** — auto-detects owner vs employee vs unknown
- **Transaction feedback** — pending / confirmed / error states shown in-place
- **Live data polling** — Wagmi polls the chain every 30 seconds for fresh balances

---

## Running Tests

The test suite uses Foundry's Forge and covers ~30+ cases:

```bash
forge test
```

For verbose output (shows individual test names and gas):

```bash
forge test -vv
```

To run a specific test:

```bash
forge test --match-test test_HireEmployee -vv
```

Test categories covered:

- Employee hire / fire (ownership checks, state mutations, edge cases)
- Vesting schedule configuration (validation, milestone ordering)
- Token claiming (cliff enforcement, milestone unlocking, joining bonus accounting)
- Token deposit mechanics
- Bulk data fetching
- Event emission

For fuzz testing with more runs:

```bash
forge test --profile ci
```

---

## Project Structure

```
VentingToken/
├── src/
│   ├── VentingToken.sol          # Core vesting manager
│   └── VentingERC20.sol          # ERC20 token (0 decimals)
├── script/
│   └── DeployVentingToken.s.sol  # Deployment script
├── test/
│   └── VentingTokenTest.t.sol    # Foundry test suite
├── frontend/
│   ├── src/
│   │   ├── abi/                  # Generated contract ABIs
│   │   ├── components/
│   │   │   ├── employer/         # Employer dashboard + forms
│   │   │   ├── employee/         # Employee dashboard
│   │   │   ├── layout/           # Header
│   │   │   └── shared/           # ConnectWallet, TxStatus, Spinner
│   │   ├── hooks/
│   │   │   ├── useContractData.ts     # Read hooks (balance, employees, etc.)
│   │   │   └── useContractActions.ts  # Write hooks (hire, claim, deposit, etc.)
│   │   ├── lib/
│   │   │   ├── contracts.ts      # Contract addresses + ABI exports
│   │   │   └── wagmiConfig.ts    # Wagmi + chain config
│   │   └── App.tsx               # Route + wallet-gate logic
│   ├── .env.example
│   └── package.json
├── lib/
│   ├── openzeppelin-contracts/   # OZ v5.6.1
│   └── forge-std/                # Foundry stdlib
├── foundry.toml
└── README.md
```

---

## Notes

- The ERC20 token has **0 decimals** — all amounts are whole numbers.
- The contract enforces that vesting schedules have milestones in ascending order and the final cumulative percentage is exactly 100.
- Joining bonuses are transferred immediately on hire and do **not** count against the vesting schedule — the `totalTokens` field tracks vesting-only allocation.
- The employer address is immutable after deployment (set via `Ownable`).
- There is no timelock or governance — the employer has full control.
