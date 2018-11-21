pragma solidity ^0.4.25;

import "./Car.sol";
import "./CarShop.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

contract CarProducer is Ownable {
  address public carShopContract;
  address public crowdsaleContract;
  address public votingContract;
    
  modifier onlyCarShop() {
    require(msg.sender == carShopContract, "Message sender is different than carShopContract");
    _;
  }
    
  modifier onlyCrowdsaleContract() {
    require(msg.sender == crowdsaleContract, "Message sender is different than crowdsaleContract");
    _;
  }

  modifier onlyVotingContract() {
    require(msg.sender == votingContract, "Message sender is different than votingContract");
    _;
  }
    
  modifier onlyIfCarShopExists() {
    require(carShopContract != address(0x0), "Car Shop is not set");
    _;
  }
    
  function generateFirstTenCars() public onlyCrowdsaleContract {
    for(uint i = 0; i < 10; i++) {
      address createdCar = createNewCar("Audi A8", "4.3", 1 ether);
      CarShop(carShopContract).addNewCar(createdCar);
    }
  }

  function produceNewCarBasedOnSoldOne(Car _car) public onlyCarShop {
    address createdCar = createNewCar(
      _car.model(), 
      _car.engine(),
      _car.price()
    );

    CarShop(carShopContract).withdrawCarPrice(_car.price());
    CarShop(carShopContract).addNewCar(createdCar);
  }

  function startNewCarManufactory(bytes32 _model, bytes32 _engine, uint _price) public onlyVotingContract onlyIfCarShopExists {
    for(uint i = 0; i < 5; i++) {
      address createdCar = createNewCar(_model, _engine, _price); 
      CarShop(carShopContract).addNewCar(createdCar);
    }
  }

  function createNewCar(bytes32 _model, bytes32 _engine, uint _price) internal returns(address) {
    Car newCar = new Car(
      _model,
      _engine,
      _price, 
      address(carShopContract)
    );

    return newCar;
  }

  function setCarShop(address _carShopContract) public onlyOwner {
    require(_carShopContract != address(0x0), "Invalid CarShopContract address");
    carShopContract = _carShopContract;
  }
    
  function setCrowdsale(address _crowdsaleContract) public onlyOwner {
    require(_crowdsaleContract != address(0x0), "Invalid CrowdsaleContract address");
    crowdsaleContract = _crowdsaleContract;
  }

  function setVoting(address _votingContract) public onlyOwner {
    require(_votingContract != address(0x0), "Invalid VotingContract address");
    votingContract = _votingContract;
  }
    
  function withdraw() public {
    owner().transfer(address(this).balance);
  }

  function() external payable {
  }
}
