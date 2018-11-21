pragma solidity ^0.4.25;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

contract EtherPool is Ownable {
  function payTap(address _recipient, uint _amount) external onlyOwner {
    _recipient.transfer(_amount);
  }
    
  function getBalance() public view returns (uint) {
    return address(this).balance;
  }
    
  function() external payable {
  }
}
