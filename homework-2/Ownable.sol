pragma solidity ^0.4.25;

contract Ownable {
    address internal owner;
    
    constructor() public {
        owner = msg.sender;
    }
    
    modifier onlyOwner() {
        require(msg.sender == owner, "This transaction was not sent by the owner.");
        _;
    }
}