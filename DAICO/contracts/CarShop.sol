pragma solidity ^0.4.25;

import "./Car.sol";
import "./CarProducer.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

contract CarShop {
  using SafeMath for uint;

  address public producerContract;

  mapping(address => address) public carsForPurchase;
    
  modifier onlyProducerContract(){
    require(msg.sender == producerContract);
    _;
  }
    
  modifier onlyInStock(address _carAddress) {
    require(carsForPurchase[_carAddress] != address(0x0), "Car is not in stock");
    _;
  }

  constructor(address _producerContract) public {
    producerContract = _producerContract;
  }
    
  function addNewCar(address _newCar) public onlyProducerContract {
    carsForPurchase[_newCar] = _newCar;
  }
    
  function buyCar(address _wantedCar) public payable onlyInStock(_wantedCar) {
    Car carForSell = Car(_wantedCar);
    require(msg.value >= carForSell.price(), "Not enough money for buying this car");
      
    carForSell.changeOwnership(msg.sender);
    carsForPurchase[_wantedCar] = address(0x0);
      
    CarProducer(producerContract).produceNewCarBasedOnSoldOne(carForSell);
  }
    
  function withdrawCarPrice(uint carPrice) public onlyProducerContract {
    producerContract.transfer(carPrice.div(2));
  }
}
