export const VENTING_TOKEN_ABI = [
  // ── Events ──────────────────────────────────────────────────────────────
  {
    type: 'event',
    name: 'Venting_EmployeeHired',
    inputs: [
      { name: 'employeeAddress', type: 'address', indexed: true },
      { name: 'name',            type: 'string',  indexed: false },
      { name: 'hireDate',        type: 'uint256', indexed: false },
      { name: 'totalTokens',     type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'Venting_EmployeeFired',
    inputs: [
      { name: 'employeeAddress', type: 'address', indexed: true },
      { name: 'fireDate',        type: 'uint256', indexed: false },
      { name: 'claimedOnFire',   type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'Venting_EmployeeClaimed',
    inputs: [
      { name: 'employeeAddress', type: 'address', indexed: true },
      { name: 'amount',          type: 'uint256', indexed: false },
      { name: 'claimTime',       type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'Venting_TokensDeposited',
    inputs: [
      { name: 'depositor', type: 'address', indexed: true },
      { name: 'amount',    type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'Venting_ScheduleSet',
    inputs: [
      { name: 'employeeAddress', type: 'address',   indexed: true  },
      { name: 'durations',       type: 'uint256[]', indexed: false },
      { name: 'percentages',     type: 'uint256[]', indexed: false },
    ],
  },
  // ── Read ────────────────────────────────────────────────────────────────
  {
    type: 'function',
    name: 'i_owner',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
  },
  {
    type: 'function',
    name: 'i_token',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
  },
  {
    type: 'function',
    name: 's_employeeCount',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 's_employer',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      { name: 'employerAddress', type: 'address' },
      { name: 'name',            type: 'string' },
    ],
  },
  {
    type: 'function',
    name: 'getContractBalance',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'getVestingStatus',
    stateMutability: 'view',
    inputs: [{ name: 'employeeAddress', type: 'address' }],
    outputs: [
      { name: 'totalTokens',  type: 'uint256'   },
      { name: 'tokensVested', type: 'uint256'   },
      { name: 'claimable',    type: 'uint256'   },
      { name: 'milestones',   type: 'uint256[]' },
      { name: 'percentages',  type: 'uint256[]' },
    ],
  },
  {
    type: 'function',
    name: 'getAllEmployees',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address[]' }],
  },
  {
    type: 'function',
    name: 'getAllEmployeeData',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'tuple[]',
        components: [
          { name: 'employeeAddress', type: 'address' },
          { name: 'name',            type: 'string'  },
          { name: 'hireDate',        type: 'uint256' },
          {
            name: 'vestingInfo',
            type: 'tuple',
            components: [
              { name: 'totalTokens',     type: 'uint256' },
              { name: 'tokensVested',    type: 'uint256' },
              { name: 'vestingStartDate', type: 'uint256' },
              {
                name: 'schedule',
                type: 'tuple',
                components: [
                  { name: 'cliffDuration',      type: 'uint256'   },
                  { name: 'vestingMilestones',  type: 'uint256[]' },
                  { name: 'vestingPercentages', type: 'uint256[]' },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    type: 'function',
    name: 'employees',
    stateMutability: 'view',
    inputs: [{ name: '', type: 'address' }],
    outputs: [
      { name: 'employeeAddress', type: 'address' },
      { name: 'name',            type: 'string'  },
      { name: 'hireDate',        type: 'uint256' },
      {
        name: 'vestingInfo',
        type: 'tuple',
        components: [
          { name: 'totalTokens',      type: 'uint256' },
          { name: 'tokensVested',     type: 'uint256' },
          { name: 'vestingStartDate', type: 'uint256' },
          {
            name: 'schedule',
            type: 'tuple',
            components: [
              { name: 'cliffDuration',      type: 'uint256'   },
              { name: 'vestingMilestones',  type: 'uint256[]' },
              { name: 'vestingPercentages', type: 'uint256[]' },
            ],
          },
        ],
      },
    ],
  },
  // ── Write ───────────────────────────────────────────────────────────────
  {
    type: 'function',
    name: 'depositTokens',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'amount', type: 'uint256' }],
    outputs: [],
  },
  {
    type: 'function',
    name: 'hireEmployee',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'employeeAddress', type: 'address' },
      { name: 'name',            type: 'string'  },
      { name: 'totalTokens',     type: 'uint256' },
      { name: 'joiningToken',    type: 'uint256' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'fireEmployee',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'employeeAddress', type: 'address' }],
    outputs: [],
  },
  {
    type: 'function',
    name: 'setVestingSchedule',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'employeeAddress', type: 'address'   },
      { name: 'durations',       type: 'uint256[]' },
      { name: 'percentages',     type: 'uint256[]' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'claimVestedTokens',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },
] as const
