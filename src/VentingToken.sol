// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract VentingToken {
    // ───────────────────── Events ─────────────────────

    event Venting_EmployeeHired(
        address indexed employeeAddress,
        string name,
        uint256 hireDate,
        uint256 totalTokens
    );

    event Venting_EmployeeFired(
        address indexed employeeAddress,
        uint256 fireDate,
        uint256 claimedOnFire
    );

    event Venting_EmployeeClaimed(
        address indexed employeeAddress,
        uint256 amount,
        uint256 claimTime
    );

    event Venting_TokensDeposited(
        address indexed depositor,
        uint256 amount
    );

    event Venting_NotOwnerAttemptedAccess(
        address indexed attemptedBy,
        uint256 attemptDate
    );

    event Venting_ScheduleSet(
        address indexed employeeAddress,
        uint256[] durations,
        uint256[] percentages
    );

    // ───────────────────── Structs ─────────────────────

    struct VestingSchedule {
        uint256 cliffDuration;           // first milestone acts as cliff
        uint256[] vestingMilestones;     // durations from hire date (e.g. 365 days, 3*365 days)
        uint256[] vestingPercentages;    // cumulative % that vest at each milestone (must sum to 100)
    }

    struct TokenVestingInfo {
        uint256 totalTokens;       // total tokens allocated to this employee
        uint256 tokensVested;      // tokens already transferred (joining bonus + prior claims)
        uint256 vestingStartDate;  // timestamp vesting begins (= hireDate)
        VestingSchedule schedule;
    }

    struct Employee {
        address employeeAddress;
        string name;
        uint256 hireDate;
        TokenVestingInfo vestingInfo;
    }

    struct Employer {
        address employerAddress;
        string name;
    }

    // ───────────────────── State ─────────────────────

    uint256 public s_employeeCount;
    address public immutable i_owner;
    IERC20 public immutable i_token;
    Employer public s_employer;

    mapping(uint256 => address) public totalEmployees;
    mapping(address => Employee) public employees;

    // ───────────────────── Constructor / Modifiers ─────────────────────

    constructor(string memory employerName, address tokenAddress) {
        require(tokenAddress != address(0), "Invalid token address");
        i_owner = msg.sender;
        i_token = IERC20(tokenAddress);
        s_employer = Employer({employerAddress: msg.sender, name: employerName});
    }

    modifier onlyOwner() {
        if (msg.sender != i_owner) {
            emit Venting_NotOwnerAttemptedAccess(msg.sender, block.timestamp);
            revert("Only owner can call this function");
        }
        _;
    }

    // ───────────────────── Token Pool ─────────────────────

    /// @notice Owner deposits tokens into the contract pool before hiring employees.
    ///         Requires prior ERC20 approval: token.approve(address(this), amount)
    function depositTokens(uint256 amount) external onlyOwner {
        require(amount > 0, "Amount must be > 0");
        i_token.transferFrom(msg.sender, address(this), amount);
        emit Venting_TokensDeposited(msg.sender, amount);
    }

    function getContractBalance() external view returns (uint256) {
        return i_token.balanceOf(address(this));
    }

    // ───────────────────── Core Logic ─────────────────────

    function hireEmployee(
        address employeeAddress,
        string memory name,
        uint256 totalTokens,
        uint256 joiningToken
    ) public onlyOwner {
        require(employeeAddress != address(0), "Invalid employee address");
        require(employeeAddress != i_owner, "Owner cannot be hired");
        require(employees[employeeAddress].employeeAddress == address(0), "Already hired");
        require(bytes(name).length > 0, "Name required");
        require(totalTokens > 0, "Must allocate tokens");
        require(joiningToken <= totalTokens, "Joining token exceeds total");
        require(
            i_token.balanceOf(address(this)) >= joiningToken,
            "Insufficient balance for joining bonus"
        );

        uint256 employeeId = s_employeeCount++;
        totalEmployees[employeeId] = employeeAddress;

        Employee storage emp = employees[employeeAddress];
        emp.employeeAddress = employeeAddress;
        emp.name = name;
        emp.hireDate = block.timestamp;
        emp.vestingInfo.totalTokens = totalTokens;
        emp.vestingInfo.tokensVested = joiningToken;
        emp.vestingInfo.vestingStartDate = block.timestamp;

        if (joiningToken > 0) {
            i_token.transfer(employeeAddress, joiningToken);
        }

        emit Venting_EmployeeHired(employeeAddress, name, block.timestamp, totalTokens);
    }

    function fireEmployee(address employeeAddress) public onlyOwner {
        require(employeeAddress != address(0), "Invalid employee");
        require(employees[employeeAddress].employeeAddress != address(0), "Employee not found");

        Employee storage emp = employees[employeeAddress];

        // Pay out any vested-but-unclaimed tokens before removing the record
        uint256 claimable = _calculateClaimable(emp);
        if (claimable > 0) {
            emp.vestingInfo.tokensVested += claimable;
            i_token.transfer(employeeAddress, claimable);
        }

        // Swap-and-pop on the id → address mapping
        for (uint256 i = 0; i < s_employeeCount; i++) {
            if (totalEmployees[i] == employeeAddress) {
                totalEmployees[i] = totalEmployees[s_employeeCount - 1];
                delete totalEmployees[s_employeeCount - 1];
                s_employeeCount--;
                break;
            }
        }

        delete employees[employeeAddress];

        emit Venting_EmployeeFired(employeeAddress, block.timestamp, claimable);
    }

    // ───────────────────── Vesting Configuration ─────────────────────

    function setVestingSchedule(
        address employeeAddress,
        uint256[] calldata durations,
        uint256[] calldata percentages
    ) external onlyOwner {
        require(employeeAddress != address(0), "Invalid employee");
        require(durations.length == percentages.length, "Length mismatch");
        require(durations.length > 0, "Empty schedule");

        Employee storage emp = employees[employeeAddress];
        require(emp.employeeAddress != address(0), "Employee not hired");

        // Percentages are cumulative (e.g. [10, 50, 100] = 10% at cliff, 50% at yr3, 100% at yr5).
        // The final milestone must unlock 100% and each step must be strictly increasing.
        for (uint256 i = 0; i < percentages.length; i++) {
            require(percentages[i] > 0 && percentages[i] <= 100, "Percentage out of range");
            if (i > 0) {
                require(percentages[i] > percentages[i - 1], "Percentages must be increasing");
                require(durations[i] > durations[i - 1], "Durations must be increasing");
            }
        }
        require(percentages[percentages.length - 1] == 100, "Percentages must sum to 100");

        VestingSchedule storage schedule = emp.vestingInfo.schedule;
        delete schedule.vestingMilestones;
        delete schedule.vestingPercentages;

        schedule.cliffDuration = durations[0];

        for (uint256 i = 0; i < durations.length; i++) {
            schedule.vestingMilestones.push(durations[i]);
            schedule.vestingPercentages.push(percentages[i]);
        }

        emit Venting_ScheduleSet(employeeAddress, durations, percentages);
    }

    // ───────────────────── Vesting Claim Logic ─────────────────────

    function claimVestedTokens() external {
        address employeeAddress = msg.sender;
        Employee storage emp = employees[employeeAddress];
        require(emp.employeeAddress != address(0), "Not an employee");

        uint256 claimable = _calculateClaimable(emp);
        require(claimable > 0, "Nothing claimable");
        require(i_token.balanceOf(address(this)) >= claimable, "Insufficient contract balance");

        emp.vestingInfo.tokensVested += claimable;
        i_token.transfer(employeeAddress, claimable);

        emit Venting_EmployeeClaimed(employeeAddress, claimable, block.timestamp);
    }

    // ───────────────────── View Functions ─────────────────────

    function getVestingStatus(address employeeAddress)
        external
        view
        returns (
            uint256 totalTokens,
            uint256 tokensVested,
            uint256 claimable,
            uint256[] memory milestones,
            uint256[] memory percentages
        )
    {
        Employee storage emp = employees[employeeAddress];
        require(emp.employeeAddress != address(0), "Not an employee");

        totalTokens = emp.vestingInfo.totalTokens;
        tokensVested = emp.vestingInfo.tokensVested;
        claimable = _calculateClaimable(emp);

        VestingSchedule storage s = emp.vestingInfo.schedule;
        milestones = s.vestingMilestones;
        percentages = s.vestingPercentages;
    }

    /// @notice Returns all current employee addresses.
    function getAllEmployees() external view returns (address[] memory) {
        address[] memory list = new address[](s_employeeCount);
        for (uint256 i = 0; i < s_employeeCount; i++) {
            list[i] = totalEmployees[i];
        }
        return list;
    }

    /// @notice Returns full Employee structs for all employees in one call (avoids N+1 from frontend).
    function getAllEmployeeData() external view returns (Employee[] memory) {
        Employee[] memory list = new Employee[](s_employeeCount);
        for (uint256 i = 0; i < s_employeeCount; i++) {
            list[i] = employees[totalEmployees[i]];
        }
        return list;
    }

    // ───────────────────── Internal Helpers ─────────────────────

    function _calculateClaimable(Employee storage emp) internal view returns (uint256) {
        TokenVestingInfo storage v = emp.vestingInfo;
        VestingSchedule storage s = v.schedule;

        if (s.vestingMilestones.length == 0) return 0;

        uint256 currentTime = block.timestamp;

        if (currentTime < emp.hireDate + s.cliffDuration) return 0;

        uint256 vestedPercent;
        for (uint256 i = 0; i < s.vestingMilestones.length; i++) {
            if (currentTime >= emp.hireDate + s.vestingMilestones[i]) {
                vestedPercent = s.vestingPercentages[i];
            } else {
                break;
            }
        }

        if (vestedPercent == 0) return 0;

        uint256 totalVestedAmount = (v.totalTokens * vestedPercent) / 100;

        if (totalVestedAmount <= v.tokensVested) return 0;

        return totalVestedAmount - v.tokensVested;
    }
}
