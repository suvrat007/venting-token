// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test} from "forge-std/Test.sol";
import {VentingToken} from "../src/VentingToken.sol";
import {VentingERC20} from "../src/VentingERC20.sol";

contract VentingTokenTest is Test {
    VentingToken public ventingToken;
    VentingERC20 public token;

    address public owner = makeAddr("owner");
    address public employee1 = makeAddr("employee1");
    address public employee2 = makeAddr("employee2");

    uint256 constant INITIAL_SUPPLY = 1_000_000;

    function setUp() public {
        vm.startPrank(owner);
        token = new VentingERC20("Venting Token", "VTK", INITIAL_SUPPLY);
        ventingToken = new VentingToken("Venting Inc.", address(token));
        // Fund the vesting contract so it can pay out tokens
        token.transfer(address(ventingToken), INITIAL_SUPPLY);
        vm.stopPrank();
    }

    // ───────────────────── Hire Employee Tests ─────────────────────

    function testHireEmployeeRevertsIfNotOwner() public {
        vm.prank(employee1);
        vm.expectRevert("Only owner can call this function");
        ventingToken.hireEmployee(employee2, "Alice", 1000, 100);
    }

    function testHireEmployee() public {
        string memory name = "Alice";
        uint256 totalTokens = 10_000;
        uint256 joiningBonus = 500;

        vm.prank(owner);
        ventingToken.hireEmployee(employee1, name, totalTokens, joiningBonus);

        (
            address empAddress,
            string memory empName,
            uint256 hireDate,
            VentingToken.TokenVestingInfo memory vestingInfo
        ) = ventingToken.employees(employee1);

        assertEq(empAddress, employee1);
        assertEq(keccak256(abi.encode(empName)), keccak256(abi.encode(name)));
        assertEq(hireDate, block.timestamp);
        assertEq(vestingInfo.totalTokens, totalTokens);
        assertEq(vestingInfo.tokensVested, joiningBonus);
        assertEq(vestingInfo.vestingStartDate, block.timestamp);

        assertEq(ventingToken.s_employeeCount(), 1);
        assertEq(ventingToken.totalEmployees(0), employee1);

        // ERC20: joining bonus was immediately transferred to employee
        assertEq(token.balanceOf(employee1), joiningBonus);
        assertEq(token.balanceOf(address(ventingToken)), INITIAL_SUPPLY - joiningBonus);
    }

    function testEmployeeCountIncrements() public {
        vm.startPrank(owner);
        ventingToken.hireEmployee(employee1, "Alice", 10_000, 500);
        assertEq(ventingToken.s_employeeCount(), 1);

        ventingToken.hireEmployee(employee2, "Bob", 15_000, 750);
        assertEq(ventingToken.s_employeeCount(), 2);
        vm.stopPrank();
    }

    function testHireEmployeeEmitsEvent() public {
        string memory name = "Bob";
        uint256 totalTokens = 15_000;
        uint256 joiningBonus = 750;

        vm.expectEmit(true, true, false, true);
        emit VentingToken.Venting_EmployeeHired(employee1, name, block.timestamp, totalTokens);

        vm.prank(owner);
        ventingToken.hireEmployee(employee1, name, totalTokens, joiningBonus);
    }

    function testCannotHireTwice() public {
        vm.startPrank(owner);
        ventingToken.hireEmployee(employee1, "Alice", 10_000, 500);

        vm.expectRevert("Already hired");
        ventingToken.hireEmployee(employee1, "Alice2", 20_000, 1000);
        vm.stopPrank();
    }

    function testHireRevertsIfOwnerHiresSelf() public {
        vm.prank(owner);
        vm.expectRevert("Owner cannot be hired");
        ventingToken.hireEmployee(owner, "Boss", 10_000, 0);
    }

    function testHireRevertsIfEmptyName() public {
        vm.prank(owner);
        vm.expectRevert("Name required");
        ventingToken.hireEmployee(employee1, "", 10_000, 0);
    }

    function testHireRevertsIfZeroTotalTokens() public {
        vm.prank(owner);
        vm.expectRevert("Must allocate tokens");
        ventingToken.hireEmployee(employee1, "Alice", 0, 0);
    }

    // ───────────────────── Fire Employee Tests ─────────────────────

    function testFireEmployeeRevertsIfNotOwner() public {
        vm.prank(owner);
        ventingToken.hireEmployee(employee1, "Alice", 1000, 100);

        vm.prank(employee1);
        vm.expectRevert("Only owner can call this function");
        ventingToken.fireEmployee(employee1);
    }

    function testFireEmployee() public {
        vm.prank(owner);
        ventingToken.hireEmployee(employee1, "Alice", 1000, 100);
        assertEq(ventingToken.s_employeeCount(), 1);

        vm.prank(owner);
        ventingToken.fireEmployee(employee1);

        assertEq(ventingToken.s_employeeCount(), 0);

        (address empAddress,,,) = ventingToken.employees(employee1);
        assertEq(empAddress, address(0));
    }

    function testFireEmployeeEmitsEvent() public {
        vm.startPrank(owner);
        ventingToken.hireEmployee(employee1, "Alice", 1000, 100);

        vm.expectEmit(true, true, false, true);
        emit VentingToken.Venting_EmployeeFired(employee1, block.timestamp, 0);

        ventingToken.fireEmployee(employee1);
        vm.stopPrank();
    }

    function testFireNonExistentEmployee() public {
        vm.prank(owner);
        vm.expectRevert("Employee not found");
        ventingToken.fireEmployee(employee1);
    }

    function testFireEmployeePaysClaimed() public {
        vm.startPrank(owner);
        ventingToken.hireEmployee(employee1, "Alice", 10_000, 0);

        uint256[] memory durations = new uint256[](1);
        uint256[] memory percentages = new uint256[](1);
        durations[0] = 1 days;
        percentages[0] = 100;
        ventingToken.setVestingSchedule(employee1, durations, percentages);
        vm.stopPrank();

        vm.warp(block.timestamp + 2 days);

        // Fire should auto-pay out vested tokens (10_000)
        vm.prank(owner);
        ventingToken.fireEmployee(employee1);

        assertEq(token.balanceOf(employee1), 10_000);
        (address empAddress,,,) = ventingToken.employees(employee1);
        assertEq(empAddress, address(0));
    }

    // ───────────────────── Vesting Schedule Tests ─────────────────────

    function testSetVestingScheduleRevertsIfNotOwner() public {
        vm.prank(owner);
        ventingToken.hireEmployee(employee1, "Alice", 10_000, 500);

        uint256[] memory durations = new uint256[](3);
        uint256[] memory percentages = new uint256[](3);
        durations[0] = 365 days; durations[1] = 3 * 365 days; durations[2] = 5 * 365 days;
        percentages[0] = 10; percentages[1] = 50; percentages[2] = 100;

        vm.prank(employee1);
        vm.expectRevert("Only owner can call this function");
        ventingToken.setVestingSchedule(employee1, durations, percentages);
    }

    function testSetVestingSchedule() public {
        vm.startPrank(owner);
        ventingToken.hireEmployee(employee1, "Alice", 10_000, 500);

        uint256[] memory durations = new uint256[](3);
        uint256[] memory percentages = new uint256[](3);
        durations[0] = 365 days; durations[1] = 3 * 365 days; durations[2] = 5 * 365 days;
        percentages[0] = 10; percentages[1] = 50; percentages[2] = 100;

        ventingToken.setVestingSchedule(employee1, durations, percentages);
        vm.stopPrank();

        (,,, VentingToken.TokenVestingInfo memory vestingInfo) = ventingToken.employees(employee1);

        assertEq(vestingInfo.schedule.cliffDuration, 365 days);
        assertEq(vestingInfo.schedule.vestingMilestones.length, 3);
        assertEq(vestingInfo.schedule.vestingMilestones[0], 365 days);
        assertEq(vestingInfo.schedule.vestingPercentages[0], 10);
    }

    function testSetVestingScheduleRevertsLengthMismatch() public {
        vm.prank(owner);
        ventingToken.hireEmployee(employee1, "Alice", 10_000, 500);

        uint256[] memory durations = new uint256[](2);
        uint256[] memory percentages = new uint256[](3);

        vm.prank(owner);
        vm.expectRevert("Length mismatch");
        ventingToken.setVestingSchedule(employee1, durations, percentages);
    }

    function testSetVestingScheduleRevertsOnDecreasingDurations() public {
        vm.prank(owner);
        ventingToken.hireEmployee(employee1, "Alice", 10_000, 0);

        uint256[] memory durations = new uint256[](3);
        uint256[] memory percentages = new uint256[](3);
        // durations[1] == durations[0] — not strictly increasing
        durations[0] = 365 days; durations[1] = 365 days; durations[2] = 730 days;
        percentages[0] = 30; percentages[1] = 60; percentages[2] = 100;

        vm.prank(owner);
        vm.expectRevert("Durations must be increasing");
        ventingToken.setVestingSchedule(employee1, durations, percentages);
    }

    function testSetVestingScheduleEmitsEvent() public {
        vm.prank(owner);
        ventingToken.hireEmployee(employee1, "Alice", 10_000, 0);

        uint256[] memory durations = new uint256[](2);
        uint256[] memory percentages = new uint256[](2);
        durations[0] = 365 days; durations[1] = 2 * 365 days;
        percentages[0] = 50; percentages[1] = 100;

        vm.prank(owner);
        vm.expectEmit(true, false, false, false);
        emit VentingToken.Venting_ScheduleSet(employee1, durations, percentages);
        ventingToken.setVestingSchedule(employee1, durations, percentages);
    }

    function testSetVestingScheduleRevertsSumNot100() public {
        vm.prank(owner);
        ventingToken.hireEmployee(employee1, "Alice", 10_000, 500);

        uint256[] memory durations = new uint256[](2);
        uint256[] memory percentages = new uint256[](2);
        durations[0] = 365 days; durations[1] = 2 * 365 days;
        // Cumulative percentages: final value must be 100 — 80 is invalid
        percentages[0] = 40; percentages[1] = 80;

        vm.prank(owner);
        vm.expectRevert("Percentages must sum to 100");
        ventingToken.setVestingSchedule(employee1, durations, percentages);
    }

    // ───────────────────── Claim Vesting Tests ─────────────────────

    function testClaimVestedTokensRevertsNotEmployee() public {
        vm.prank(makeAddr("stranger"));
        vm.expectRevert("Not an employee");
        ventingToken.claimVestedTokens();
    }

    function testClaimVestedTokensNothingBeforeCliff() public {
        vm.startPrank(owner);
        ventingToken.hireEmployee(employee1, "Alice", 10_000, 500);

        uint256[] memory durations = new uint256[](1);
        uint256[] memory percentages = new uint256[](1);
        durations[0] = 365 days;
        percentages[0] = 100;

        ventingToken.setVestingSchedule(employee1, durations, percentages);
        vm.stopPrank();

        vm.prank(employee1);
        vm.expectRevert("Nothing claimable");
        ventingToken.claimVestedTokens();
    }

    function testClaimVestedTokensAfterCliffAccountsForJoiningBonus() public {
        vm.startPrank(owner);
        ventingToken.hireEmployee(employee1, "Alice", 10_000, 500);

        uint256[] memory durations = new uint256[](1);
        uint256[] memory percentages = new uint256[](1);
        durations[0] = 1 days;
        percentages[0] = 100;

        ventingToken.setVestingSchedule(employee1, durations, percentages);
        vm.stopPrank();

        vm.warp(block.timestamp + 2 days);

        vm.prank(employee1);
        ventingToken.claimVestedTokens();

        (,,, VentingToken.TokenVestingInfo memory vestingInfo) = ventingToken.employees(employee1);
        assertEq(vestingInfo.tokensVested, 10_000);

        // ERC20: employee received 500 joining + 9500 claimed = 10_000 total
        assertEq(token.balanceOf(employee1), 10_000);
    }

    function testClaimVestedTokensMultipleClaims() public {
        vm.startPrank(owner);
        ventingToken.hireEmployee(employee1, "Alice", 10_000, 0);

        uint256[] memory durations = new uint256[](3);
        uint256[] memory percentages = new uint256[](3);
        durations[0] = 1 days; durations[1] = 2 days; durations[2] = 3 days;
        percentages[0] = 20; percentages[1] = 50; percentages[2] = 100;

        ventingToken.setVestingSchedule(employee1, durations, percentages);
        vm.stopPrank();

        // First claim: past milestone 1 (20%) but before milestone 2 (50%)
        vm.warp(block.timestamp + 1 days + 1);
        vm.prank(employee1);
        ventingToken.claimVestedTokens();

        (,,, VentingToken.TokenVestingInfo memory vestingInfo) = ventingToken.employees(employee1);
        assertEq(vestingInfo.tokensVested, 2000);
        assertEq(token.balanceOf(employee1), 2000);

        // Second claim: past milestone 2 (50% cumulative → additional 3000)
        vm.warp(block.timestamp + 1 days);
        vm.prank(employee1);
        ventingToken.claimVestedTokens();

        (, ,, vestingInfo) = ventingToken.employees(employee1);
        assertEq(vestingInfo.tokensVested, 5000);
        assertEq(token.balanceOf(employee1), 5000);
    }

    function testGetVestingStatus() public {
        vm.startPrank(owner);
        ventingToken.hireEmployee(employee1, "Alice", 10_000, 500);

        uint256[] memory durations = new uint256[](2);
        uint256[] memory percentages = new uint256[](2);
        durations[0] = 1 days; durations[1] = 2 days;
        percentages[0] = 50; percentages[1] = 100;

        ventingToken.setVestingSchedule(employee1, durations, percentages);
        vm.stopPrank();

        // Before cliff
        (uint256 totalTokens, uint256 tokensVested, uint256 claimable,,) =
            ventingToken.getVestingStatus(employee1);
        assertEq(totalTokens, 10_000);
        assertEq(tokensVested, 500);
        assertEq(claimable, 0);

        // After first milestone (50%) but before second (100%)
        vm.warp(block.timestamp + 1 days + 1);
        (,, claimable,,) = ventingToken.getVestingStatus(employee1);
        assertEq(claimable, 4500); // 5000 vested - 500 joining bonus
    }

    // ───────────────────── Deposit & Balance Tests ─────────────────────

    function testDepositTokensRevertsIfNotOwner() public {
        vm.startPrank(owner);
        // Create fresh token and contract where owner still holds the supply
        VentingERC20 freshToken = new VentingERC20("T", "T", 1000);
        VentingToken fresh = new VentingToken("Co", address(freshToken));
        freshToken.approve(address(fresh), 1000);
        vm.stopPrank();

        vm.prank(employee1);
        vm.expectRevert("Only owner can call this function");
        fresh.depositTokens(100);
    }

    function testDepositTokens() public {
        vm.startPrank(owner);
        VentingERC20 freshToken = new VentingERC20("T", "T", 1000);
        VentingToken fresh = new VentingToken("Co", address(freshToken));
        freshToken.approve(address(fresh), 500);
        fresh.depositTokens(500);
        vm.stopPrank();

        assertEq(freshToken.balanceOf(address(fresh)), 500);
    }

    function testGetAllEmployeeData() public {
        vm.startPrank(owner);
        ventingToken.hireEmployee(employee1, "Alice", 10_000, 0);
        ventingToken.hireEmployee(employee2, "Bob", 5_000, 0);
        vm.stopPrank();

        VentingToken.Employee[] memory list = ventingToken.getAllEmployeeData();
        assertEq(list.length, 2);
        assertEq(list[0].employeeAddress, employee1);
        assertEq(list[1].employeeAddress, employee2);
    }
}
