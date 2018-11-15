pragma solidity ^0.4.25;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20Mintable.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Detailed.sol";

contract CarToken is ERC20Mintable, ERC20Detailed {
  constructor(string _name, string _symbol, uint8 _decimals) public ERC20Detailed(_name, _symbol, _decimals) {
  }
}