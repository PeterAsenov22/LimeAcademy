const etherlime = require('etherlime');
const ethers = require('ethers');
const Cars = require('../build/Cars.json');
const CarToken = require('../build/CarToken.json');
const Oracle = require('../build/Oracle.json');

const deploy = async (network, secret) => {
	const deployer = new etherlime.InfuraPrivateKeyDeployer(secret, network, 'f8d2169f70584df396394ad9ce130289');

	const tokenName = 'Car Token';
	const tokenSymbol = 'CT'
	const tokenDecimals = 18;
	const etherPriceInUsd = 140;
	const TEN_CAR_TOKENS = ethers.utils.bigNumberify('10000000000000000000');

	const oracleContract = await deployer.deploy(Oracle, {}, etherPriceInUsd);
	const carTokenContract = await deployer.deploy(CarToken, {}, tokenName, tokenSymbol, tokenDecimals);
	const carsContract = await deployer.deploy(Cars, {}, carTokenContract.contractAddress, oracleContract.contractAddress);

	const ownerMintTx = await carTokenContract.contract.mint(deployer.wallet.address, TEN_CAR_TOKENS);
	await carTokenContract.verboseWaitForTransaction(ownerMintTx, `Minting 10 Car Tokens to address: ${deployer.wallet.address}`);

	const firstAddressMintTx = await carTokenContract.contract.mint('0xE0D2A86BEb83645d01444cCd09198328F5eFE689', TEN_CAR_TOKENS);
	await carTokenContract.verboseWaitForTransaction(firstAddressMintTx, `Minting 10 Car Tokens to address: 0xE0D2A86BEb83645d01444cCd09198328F5eFE689`);

	const secondAddressMintTx = await carTokenContract.contract.mint('0xA6c9e29e74FB1f17E9d41C233e942D3f64724DB2', TEN_CAR_TOKENS);
	await carTokenContract.verboseWaitForTransaction(secondAddressMintTx, `Minting 10 Car Tokens to address: 0xA6c9e29e74FB1f17E9d41C233e942D3f64724DB2`);

	const thirdAddressMintTx = await carTokenContract.contract.mint('0xBd16C7321956F0AE814e922dB882D70C7696EA76', TEN_CAR_TOKENS);
	await carTokenContract.verboseWaitForTransaction(thirdAddressMintTx, `Minting 10 Car Tokens to address: 0xBd16C7321956F0AE814e922dB882D70C7696EA76`);
};

module.exports = {
	deploy
};