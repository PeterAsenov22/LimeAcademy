pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";

contract Billboard is Ownable {

  uint256 public price = 20;
  address public billboardOwner;
  address public tokenContract;
  address[] public historyOfOwners;
  mapping(address => uint256) public moneySpent;
  string public slogan;

  constructor(address _tokenContract) public {
    tokenContract = _tokenContract;
  }

  /**
   * events
   */

  event LogBillboardBought(address buyer, uint256 paied, string slogan);

  /**
   * functions
   */

  function buy(string newSlogan, uint tokens) public payable {
    require(tokens > price, "Not enough tokens sent");

    billboardOwner = msg.sender;
    historyOfOwners.push(msg.sender);
    moneySpent[msg.sender] += tokens;
    slogan = newSlogan;
    price = tokens;

    require(ERC20(tokenContract).transferFrom(msg.sender, address(this), tokens));

    emit LogBillboardBought(msg.sender, tokens, newSlogan);
  }
}