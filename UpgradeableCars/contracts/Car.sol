pragma solidity ^0.4.25;

contract Car {
  bytes32 public make;
  bytes32 public model;
  address public owner;
  uint public price;
  bool public isSecondHand;
  bytes32 public imageHash;
  address public carShop;
    
  modifier onlyCarShop() {
    require(msg.sender == carShop, "Only car shop can call this");
    _;
  }
    
  constructor(bytes32 _make, bytes32 _model, address _owner, uint _price, bool _isSecondHand, bytes32 _imageHash) public {
    make = _make;
    model = _model;
    owner = _owner;
    price = _price;
    isSecondHand = _isSecondHand;
    imageHash = _imageHash;
    carShop = msg.sender;
  }
    
  function transferOwnership(address _newOwner, uint _newPrice) public onlyCarShop {
    owner = _newOwner;
    price = _newPrice;
    isSecondHand = true;
  }
}