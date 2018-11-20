pragma solidity ^0.4.25;

contract Car {
  bytes32 public model;
  bytes32 public engine;
  uint public price;
  address public owner;
    
  modifier onlyOwner() {
    require(msg.sender == owner, "Message sender is not owner of the car");
    _;
  }
    
  constructor(bytes32 _model, bytes32 _engine, uint _price, address _owner) public{
    model = _model;
    engine = _engine;
    price = _price;
    owner = _owner;
  }

  function changeOwnership(address newOwner) public onlyOwner {
    owner = newOwner;
  }
}