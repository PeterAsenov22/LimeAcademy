pragma solidity ^0.4.25;

import "./Upgradeability/UpgradeableProxy.sol";

contract CarsProxy is UpgradeableProxy {
	constructor(address _initialImplementation) UpgradeableProxy(_initialImplementation) public {}
}
