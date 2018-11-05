pragma solidity ^0.4.25;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

contract Cars is Ownable {
    using SafeMath for uint;

    struct Car {
        bytes32 make;
        bytes32 model;
        address owner;
        uint price;
        bool isSecondHand;
        bytes32 imageHash;
    }
    
    Car[] private cars;
    
    mapping(address => uint[]) addressCars;
    mapping(uint => uint) carIndexPosition;
    mapping(address => uint) totalMoneySpentByAddress;
    
    event CarAddedByContractOwner(uint _carIndex, bytes32 _make, bytes32 _model, uint _initialPrice);
    event CarBoughtFromContractOwner(address _buyer, uint256 _price, bytes32 _make, bytes32 _model);
    event CarBoughtFromSeller(address _buyer, address _from, uint _price, bytes32 _make, bytes32 _model);
    event ProfitWithdrawal(uint _amount, uint _timestamp);

    modifier onlyExistingCar(uint _index) {
        require(cars.length >= _index + 1, "Car does not exist.");
        _;
    }
    
    function addCar(bytes32 _make, bytes32 _model, uint _initialPrice, bytes32 _imageHash) public onlyOwner {
        require(_make[0] != 0, "Invalid car make.");
        require(_model[0] != 0, "Invalid car model.");
        require(_initialPrice > 0, "Invalid initial car price.");
        require(_imageHash[0] != 0, "Invalid car image hash.");
        
        Car memory car = Car(_make, _model, owner, _initialPrice, false, _imageHash);
        uint _carIndex = cars.push(car) - 1;
        
        uint carsLength = addressCars[owner].push(_carIndex);
        carIndexPosition[_carIndex] = carsLength - 1;
        
        emit CarAddedByContractOwner(_carIndex, car.make, car.model, car.price);
    }
    
    function buyCarFromContractOwner(uint _index) public payable onlyExistingCar(_index) {
     
        Car storage car = cars[_index];
        require(car.owner == owner, "Contract owner is not owner of the car.");
        require(car.isSecondHand == false, "The car is second-hand.");
        require(msg.sender != owner, "Contract owner is not allowed to call this function.");
        require(msg.value >= car.price, "The amount of ether sent is not enough.");
        
        removeCarFromCurrentOwner(car.owner, _index);
        
        uint carsLength = addressCars[msg.sender].push(_index);
        carIndexPosition[_index] = carsLength - 1;
        
        car.owner = msg.sender;
        car.price = msg.value;
        car.isSecondHand = true;
        totalMoneySpentByAddress[msg.sender] = totalMoneySpentByAddress[msg.sender].add(msg.value);
        
        emit CarBoughtFromContractOwner(car.owner, car.price, car.make, car.model);
    }
    
    function buyCarFromSeller(uint _index) public payable onlyExistingCar(_index) {
        
        Car storage car = cars[_index];
        address currentOwner = car.owner;
        
        require(car.isSecondHand == true, "This car is owned by the contract owner.");
        require(msg.sender != currentOwner, "The owner of the car cannot buy a car he already owns.");
        require(msg.value >= car.price.mul(2) , "You must pay at least twice the current price of the car.");
        
        removeCarFromCurrentOwner(currentOwner, _index);
        
        uint carsLength = addressCars[msg.sender].push(_index);
        carIndexPosition[_index] = carsLength - 1;
        
        uint refund = car.price.add(msg.value.sub(car.price).div(2));
   
        car.owner = msg.sender;
        car.price = msg.value;
        totalMoneySpentByAddress[msg.sender] = totalMoneySpentByAddress[msg.sender].add(msg.value);
        
        currentOwner.transfer(refund);
        
        emit CarBoughtFromSeller(car.owner, currentOwner, car.price, car.make, car.model);
    }
    
    function getCarInfo(uint _index) public view onlyExistingCar(_index) returns (bytes32 _carMake, bytes32 _carModel, address _carOwner, uint _carPrice, bool _isSecondHand, bytes32 _imageHash) {
        
        Car memory car = cars[_index];
        _carOwner = car.owner;
        _carPrice = car.price;
        _carMake = car.make;
        _carModel = car.model;
        _isSecondHand = car.isSecondHand;
        _imageHash = car.imageHash;
    }
    
    function getAddressCars(address _address) public view returns (uint[]) {
        return addressCars[_address];
    }
    
    function withdrawProfit() onlyOwner public {
        uint balance = address(this).balance;
        require(balance > 0, "The contract does not have any profit.");
        address(owner).transfer(balance);
        
        emit ProfitWithdrawal(balance, now);
    }
    
    function getContractBalance() public view onlyOwner returns (uint) {
        return address(this).balance;
    }

    function getTotalSpendingsByAddress(address _address) public view returns (uint) {
        return totalMoneySpentByAddress[_address];
    }

    function getCarsCount() public view returns (uint) {
        return cars.length;
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