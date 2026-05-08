// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {VentingERC20} from "../src/VentingERC20.sol";
import {VentingToken} from "../src/VentingToken.sol";

contract DeployVentingToken is Script {
    string constant EMPLOYER_NAME = "Venting Inc.";
    string constant TOKEN_NAME = "Venting Token";
    string constant TOKEN_SYMBOL = "VTK";
    uint256 constant INITIAL_SUPPLY = 10_000_000; // 10 million whole tokens (decimals = 0)

    function run() external returns (VentingERC20 erc20, VentingToken ventingToken) {
        vm.startBroadcast();

        // 1. Deploy the ERC20 token — minted to deployer
        erc20 = new VentingERC20(TOKEN_NAME, TOKEN_SYMBOL, INITIAL_SUPPLY);

        // 2. Deploy the vesting manager
        ventingToken = new VentingToken(EMPLOYER_NAME, address(erc20));

        // 3. Transfer the full initial supply into the vesting contract pool
        erc20.transfer(address(ventingToken), INITIAL_SUPPLY);

        vm.stopBroadcast();

        console.log("VentingERC20 deployed to:", address(erc20));
        console.log("VentingToken deployed to:", address(ventingToken));
        console.log("Owner:", ventingToken.i_owner());
        console.log("Contract token balance:", erc20.balanceOf(address(ventingToken)));
    }
}
