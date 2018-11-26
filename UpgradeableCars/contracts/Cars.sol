pragma solidity ^0.4.25;

import "./Car.sol";
import "./ICars.sol";
import "./Upgradeability/OwnableUpgradeableImplementation/OwnableUpgradeableImplementation.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";

contract Cars is ICars, OwnableUpgradeableImplementation {
  using SafeMath for uint;
    
  mapping(address => uint[]) addressCars;
  mapping(uint => uint) carIndexPosition;
  mapping(address => uint) totalTokensSpentByAddress;
    
  address[] private cars;
  address public carToken;

  modifier onlyExistingCar(uint _index) {
    require(cars.length >= _index + 1, "Car does not exist.");
    _;
  }
    
  function addCar(bytes32 _make, bytes32 _model, uint _initialPrice, bytes32 _imageHash) public onlyOwner {
    require(_make[0] != 0, "Invalid car make.");
    require(_model[0] != 0, "Invalid car model.");
    require(_initialPrice > 0, "Invalid initial car price.");
    require(_imageHash[0] != 0, "Invalid car image hash.");
      
    address car = new Car(_make, _model, getOwner(), _initialPrice, false, _imageHash);
    uint _carIndex = cars.push(car) - 1;
      
    uint carsLength = addressCars[getOwner()].push(_carIndex);
    carIndexPosition[_carIndex] = carsLength - 1;
      
    emit CarAddedByContractOwner(_carIndex, _make, _model, _initialPrice);
  }
    
  function buyCarFromContractOwner(uint _index, uint _tokens) public onlyExistingCar(_index) {
      
    Car car = Car(cars[_index]);
    address carOwner = car.owner();
    uint carPrice = car.price();
    
    require(carOwner == getOwner(), "Contract owner is not owner of the car.");
    require(car.isSecondHand() == false, "The car is second-hand.");
    require(msg.sender != getOwner(), "Contract owner is not allowed to call this function.");
    require(_tokens >= carPrice, "The amount of tokens sent is not enough.");
      
    removeCarFromCurrentOwner(carOwner, _index);
    
    uint carsLength = addressCars[msg.sender].push(_index);
    carIndexPosition[_index] = carsLength - 1;
    
    car.transferOwnership(msg.sender, _tokens);
    totalTokensSpentByAddress[msg.sender] = totalTokensSpentByAddress[msg.sender].add(_tokens);

    require(ERC20(carToken).transferFrom(msg.sender, address(this), _tokens));
    
    emit CarBoughtFromContractOwner(carOwner, carPrice, car.make(), car.model());
  }
    
  function buyCarFromSeller(uint _index, uint _tokens) public onlyExistingCar(_index) {
      
    Car car = Car(cars[_index]);
    address currentCarOwner = car.owner();
    uint currentCarPrice = car.price();
    
    require(car.isSecondHand() == true, "This car is owned by the contract owner.");
    require(msg.sender != currentCarOwner, "The owner of the car cannot buy a car he already owns.");
    require(_tokens >= currentCarPrice.mul(2) , "You must pay at least twice the current price of the car.");
      
    removeCarFromCurrentOwner(currentCarOwner, _index);
    
    uint carsLength = addressCars[msg.sender].push(_index);
    carIndexPosition[_index] = carsLength - 1;
    
    uint refund = currentCarPrice.add(_tokens.sub(currentCarPrice).div(2));

    car.transferOwnership(msg.sender, _tokens);
    totalTokensSpentByAddress[msg.sender] = totalTokensSpentByAddress[msg.sender].add(_tokens);
    
    require(ERC20(carToken).transferFrom(msg.sender, address(this), _tokens));
    require(ERC20(carToken).transfer(currentCarOwner, refund));
    
    emit CarBoughtFromSeller(msg.sender, currentCarOwner, car.price(), car.make(), car.model());
  }
    
  function setCarTokenContractAddress(address _carTokenContract) onlyOwner public {
    carToken = _carTokenContract;
  }
    
  function getCarTokenContractAddress() public view returns (address _carTokenContract) {
    return carToken;
  }
    
  function getCarInfo(uint _index) public view onlyExistingCar(_index) returns (bytes32 _carMake, bytes32 _carModel, address _carOwner, uint _carPrice, bool _isSecondHand, bytes32 _imageHash) {
    Car car = Car(cars[_index]);
    _carOwner = car.owner();
    _carPrice = car.price();
    _carMake = car.make();
    _carModel = car.model();
    _isSecondHand = car.isSecondHand();
    _imageHash = car.imageHash();
  }
    
  function getAddressCars(address _address) public view returns (uint[]) {
    return addressCars[_address];
  }

  function getTotalSpendingsByAddress(address _address) public view returns (uint) {
    return totalTokensSpentByAddress[_address];
  }

  function getCarsCount() public view returns (uint) {
    return cars.length;
  }
    
  function withdrawProfit() onlyOwner public {
    ERC20 carTokenContract = ERC20(carToken);
    uint balance = carTokenContract.balanceOf(address(this));
    require(balance > 0, "The contract does not have any profit.");
    
    carTokenContract.transfer(getOwner(), balance);
    
    emit ProfitWithdrawal(balance, now);
  }
    
  function removeCarFromCurrentOwner(address _owner, uint _carIndex) private {
    uint arrIndex = carIndexPosition[_carIndex];
  
    if (addressCars[_owner].length > 1) {
      carIndexPosition[addressCars[_owner][addressCars[_owner].length - 1]] = arrIndex;
      
      addressCars[_owner][arrIndex] = addressCars[_owner][addressCars[_owner].length - 1];
    }
      
    addressCars[_owner].length--;
  }
}