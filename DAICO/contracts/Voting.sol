pragma solidity ^0.4.25;

import "./CarToken.sol";
import "./EtherPool.sol";
import "./CarProposal.sol";
import "./CarProducer.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

contract Voting is Ownable {
  using SafeMath for uint;
    
  address public tokenContract;
  address public carProducerContract;
  address public etherPoolContract;
  address public companyAddress;
    
  mapping(address => CarProposal) public proposals;
  mapping(address => mapping(address => bool)) public proposalsVoters;
  mapping(address => mapping(address => bool)) public proposalsApprovementVoters;
  mapping(address => uint) public proposalsTotalVotesInTokens;
  mapping(address => uint) public proposalsApprovementTotalVotesInTokens;
    
  modifier onlyExistingProposal(address _proposalAddress) {
    require(proposals[_proposalAddress] != address(0x0), "Proposal does not exist");
    _;
  }
    
  modifier onlyTokenHolder() {
    require(CarToken(tokenContract).balanceOf(msg.sender) > 0);
    _;
  }
    
  modifier onlyOncePerProposal(address _proposalAddress) {
    require(proposalsVoters[_proposalAddress][msg.sender] == false, "Voter has already voted for the proposal");
    _;
  }
    
  modifier onlyOncePerProposalForApprovement(address _proposalAddress) {
    require(proposalsApprovementVoters[_proposalAddress][msg.sender] == false, "Voter has already voted for the approvement of the proposal");
    _;
  }
    
  constructor(address _tokenContract, address _carProducerContract, address _companyAddress) public {
    tokenContract = _tokenContract;
    carProducerContract = _carProducerContract;
    companyAddress = _companyAddress;
    etherPoolContract = new EtherPool();
  }

  function addProposal(address _proposalAddress) public onlyOwner {
    proposals[_proposalAddress] = CarProposal(_proposalAddress);
  }

  function vote(address _proposalAddress) public onlyExistingProposal(_proposalAddress) onlyTokenHolder onlyOncePerProposal(_proposalAddress) {
    require(proposals[_proposalAddress].status() == 0, "Proposal status is not Unapproved");
    require(now < proposals[_proposalAddress].endTime(), "Proposal has ended");
    
    proposalsVoters[_proposalAddress][msg.sender] = true;
    uint voterTokens = CarToken(tokenContract).balanceOf(msg.sender);
    proposalsTotalVotesInTokens[_proposalAddress].add(voterTokens);
  }
    
  function processProposal(address _proposalAddress) public onlyExistingProposal(_proposalAddress) {
    require(proposals[_proposalAddress].status() == 0, "Proposal status is not Unapproved");
    require(now >= proposals[_proposalAddress].endTime(), "Proposal has not ended");
    
    uint totalAvailableVotes = CarToken(tokenContract).totalSupply();
    
    if(proposalsTotalVotesInTokens[_proposalAddress] > totalAvailableVotes.div(2)) {
      proposals[_proposalAddress].updateStatus(2); // 2 -> status: Processing
    }
    else {
      proposals[_proposalAddress].updateStatus(1); // 1 -> status: Rejected
    }
  }
  
  function approveProposalDevelopment(address _proposalAddress) public onlyExistingProposal(_proposalAddress) onlyTokenHolder onlyOncePerProposalForApprovement(_proposalAddress) {
    require(proposals[_proposalAddress].developedStatus() == 1, "Proposal is not developed");
    require(now < proposals[_proposalAddress].endTime(), "Approvement time has ended");
    
    proposalsApprovementVoters[_proposalAddress][msg.sender] = true;
    uint voterTokens = CarToken(tokenContract).balanceOf(msg.sender);
    proposalsApprovementTotalVotesInTokens[_proposalAddress].add(voterTokens);
  }
  
  function processProposalApprovement(address _proposalAddress) public onlyExistingProposal(_proposalAddress) {
    CarProposal proposal = proposals[_proposalAddress];
    
    require(proposal.developedStatus() == 1, "Proposal is not developed");
    require(now >= proposal.endTime(), "Approvement time has not ended");
    
    uint totalAvailableVotes = CarToken(tokenContract).totalSupply();
    
    if(proposalsApprovementTotalVotesInTokens[_proposalAddress] > totalAvailableVotes.div(3)) {
      proposal.updateStatus(4); // 4 -> status: Approved
      EtherPool(etherPoolContract).payTap(companyAddress, proposal.tap());
      CarProducer(carProducerContract).startNewCarManufactory(proposal.proposedCarName(), proposal.proposedCarEngine(), proposal.proposedCarPrice());
    }
    else {
      proposal.updateStatus(1); // 1 -> status: Rejected
    }
  }
}
