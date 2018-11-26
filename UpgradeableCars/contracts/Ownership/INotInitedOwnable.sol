pragma solidity ^0.4.25;

contract INotInitedOwnable {

	function init() public;

  function transferOwnership(address _newOwner) public;
}
