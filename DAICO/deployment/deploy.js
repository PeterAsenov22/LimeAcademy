const etherlime = require('etherlime');
const ethers = require('ethers');
const CarToken = require('../build/CarToken.json');
const CarProducer = require('../build/CarProducer.json');
const ProposalFactory = require('../build/ProposalFactory.json');
const CarShop = require('../build/CarShop.json');
const CarTokenCrowdsale = require('../build/CarTokenCrowdsale.json');
const VotingContractABI = [
	{
		"constant": true,
		"inputs": [
			{
				"name": "",
				"type": "address"
			},
			{
				"name": "",
				"type": "address"
			}
		],
		"name": "proposalsVoters",
		"outputs": [
			{
				"name": "",
				"type": "bool"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [
			{
				"name": "",
				"type": "address"
			}
		],
		"name": "proposals",
		"outputs": [
			{
				"name": "",
				"type": "address"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [],
		"name": "companyAddress",
		"outputs": [
			{
				"name": "",
				"type": "address"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [],
		"name": "tokenContract",
		"outputs": [
			{
				"name": "",
				"type": "address"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [
			{
				"name": "",
				"type": "address"
			}
		],
		"name": "proposalsApprovementTotalVotesInTokens",
		"outputs": [
			{
				"name": "",
				"type": "uint256"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [
			{
				"name": "",
				"type": "address"
			},
			{
				"name": "",
				"type": "address"
			}
		],
		"name": "proposalsApprovementVoters",
		"outputs": [
			{
				"name": "",
				"type": "bool"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": false,
		"inputs": [],
		"name": "renounceOwnership",
		"outputs": [],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [],
		"name": "owner",
		"outputs": [
			{
				"name": "",
				"type": "address"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [],
		"name": "isOwner",
		"outputs": [
			{
				"name": "",
				"type": "bool"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [],
		"name": "carProducerContract",
		"outputs": [
			{
				"name": "",
				"type": "address"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [
			{
				"name": "",
				"type": "address"
			}
		],
		"name": "proposalsTotalVotesInTokens",
		"outputs": [
			{
				"name": "",
				"type": "uint256"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [],
		"name": "etherPoolContract",
		"outputs": [
			{
				"name": "",
				"type": "address"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": false,
		"inputs": [
			{
				"name": "newOwner",
				"type": "address"
			}
		],
		"name": "transferOwnership",
		"outputs": [],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"name": "_tokenContract",
				"type": "address"
			},
			{
				"name": "_carProducerContract",
				"type": "address"
			},
			{
				"name": "_companyAddress",
				"type": "address"
			}
		],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"name": "previousOwner",
				"type": "address"
			},
			{
				"indexed": true,
				"name": "newOwner",
				"type": "address"
			}
		],
		"name": "OwnershipTransferred",
		"type": "event"
	},
	{
		"constant": false,
		"inputs": [
			{
				"name": "_proposalAddress",
				"type": "address"
			}
		],
		"name": "addProposal",
		"outputs": [],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"constant": false,
		"inputs": [
			{
				"name": "_proposalAddress",
				"type": "address"
			}
		],
		"name": "vote",
		"outputs": [],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"constant": false,
		"inputs": [
			{
				"name": "_proposalAddress",
				"type": "address"
			}
		],
		"name": "processProposal",
		"outputs": [],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"constant": false,
		"inputs": [
			{
				"name": "_proposalAddress",
				"type": "address"
			}
		],
		"name": "approveProposalDevelopment",
		"outputs": [],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"constant": false,
		"inputs": [
			{
				"name": "_proposalAddress",
				"type": "address"
			}
		],
		"name": "processProposalApprovement",
		"outputs": [],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	}
];

const deploy = async (network, secret) => {
	const deployer = new etherlime.EtherlimeGanacheDeployer();
	
	const carToken = await deployer.deploy(CarToken, {}, "CarToken", "CT", 18);
	const carProducer = await deployer.deploy(CarProducer);
	const proposalFactory = await deployer.deploy(ProposalFactory, {}, carToken.contractAddress, carProducer.contractAddress);
	const carShop = await deployer.deploy(CarShop, {}, carProducer.contractAddress);

	const softCap = ethers.utils.bigNumberify('10000000000000000000');
	const hardCap = ethers.utils.bigNumberify('100000000000000000000');
	const dateNow = Date.now();
  const crowdsaleStartDate = parseInt((new Date(dateNow + 2 * 24*3600*1000).getTime())/1000);
	const crowdsaleEndDate = parseInt((new Date((crowdsaleStartDate*1000) + 14 * 24*3600*1000).getTime())/1000);
	const votingContractAddress = await proposalFactory.contract.votingContract();
	const votingContract = new ethers.Contract(votingContractAddress, VotingContractABI, deployer.provider);
	const etherPoolAddress = await votingContract.etherPoolContract();
	
	const crowdsale = await deployer.deploy(CarTokenCrowdsale, {}, softCap, hardCap, crowdsaleStartDate, crowdsaleEndDate, etherPoolAddress, carToken.contractAddress, carProducer.contractAddress);
};

module.exports = {
	deploy
};