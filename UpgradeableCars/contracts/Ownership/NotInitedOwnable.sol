pragma solidity ^0.4.25;
/**
 * @title Ownable
 * @dev The Ownable contract has an owner address, and provides basic authorization control
 * functions, this simplifies the implementation of "user permissions".
 */
contract NotInitedOwnable {
  address public owner;

  event OwnershipTransfered(address indexed previousOwner, address indexed newOwner);

  /**
   * @dev Throws if called by any account other than the owner.
   */
  modifier onlyOwner() {
    require(msg.sender == owner);
    _;
  }

  /**
   * @dev Throws if called when the owner has not been set yet.
   */
  modifier ownerSet() {
    require(owner != address(0));
    _;
  }

  /**
   * @dev Allows the current owner to transfer control of the contract to a newOwner.
   * @param _newOwner The address to transfer ownership to.
   */
  function transferOwnership(address _newOwner) ownerSet onlyOwner public {
    require(_newOwner != address(0));
    emit OwnershipTransfered(owner, _newOwner);
    owner = _newOwner;
  }
}
