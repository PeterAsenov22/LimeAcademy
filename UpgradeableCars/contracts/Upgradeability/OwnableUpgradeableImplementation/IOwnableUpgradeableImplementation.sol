pragma solidity ^0.4.25;

import "../../Ownership/INotInitedOwnable.sol";

contract IOwnableUpgradeableImplementation is INotInitedOwnable {

	function getOwner() view public returns(address);

	function upgradeImplementation(address _newImpl) public;
}
