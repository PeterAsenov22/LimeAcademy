const etherlime = require('etherlime');
const ethers = require('ethers');
const Cars = require('../build/Cars.json');
const Cars2 = require('../build/Cars2.json');
const ICars = require('../build/ICars.json');
const ICars2 = require('../build/ICars2.json');
const CarsProxy = require('../build/CarsProxy.json');
const CarToken = require('../build/CarToken.json');
const Oracle = require('../build/Oracle.json');

const deploy = async (network, secret) => {

	const deployer = new etherlime.EtherlimeGanacheDeployer();
	const carsContractWrapper = await deployer.deploy(Cars);
	const proxyWrapper = await deployer.deploy(CarsProxy, {}, carsContractWrapper.contractAddress);
	const upgradeableCarsWrapper = deployer.wrapDeployedContract(ICars, proxyWrapper.contractAddress);
	const upgradeableCarsContract = upgradeableCarsWrapper.contract;
	const initResult = await upgradeableCarsContract.init({gasLimit: 2000000});
	await upgradeableCarsWrapper.verboseWaitForTransaction(initResult, 'Init transaction');

	const tokenName = 'Car Token';
	const tokenSymbol = 'CT'
	const tokenDecimals = 18;
	const tokenContractWrapper = await deployer.deploy(CarToken, {}, tokenName, tokenSymbol, tokenDecimals);
	const setTokenContractResult = await upgradeableCarsContract.setCarTokenContractAddress(tokenContractWrapper.contractAddress, {gasLimit: 2000000});
	await upgradeableCarsWrapper.verboseWaitForTransaction(setTokenContractResult, "Set token contract address");

	const make = ethers.utils.formatBytes32String('Audi');
  const model = ethers.utils.formatBytes32String('A6');
  const initialPrice = ethers.utils.bigNumberify('1000000000000000000');
	const imageHash = '0x017dfd85d4f6cb4dcd715a88101f7b1f06cd1e009b2327a0809d01eb9c91f231';
	const addCarResult = await upgradeableCarsContract.addCar(make, model, initialPrice, imageHash, {gasLimit: 2000000});
	await upgradeableCarsWrapper.verboseWaitForTransaction(addCarResult, "Add new car");

	const carInfo = await upgradeableCarsContract.getCarInfo(0);
	console.log("Car Info: " + carInfo);

	const upgradedCarsContractWrapper = await deployer.deploy(Cars2);
	const upgradeTransaction = await upgradeableCarsContract.upgradeImplementation(upgradedCarsContractWrapper.contractAddress, {gasLimit: 2000000});
	await upgradeableCarsWrapper.verboseWaitForTransaction(upgradeTransaction, 'Upgrade Transaction');
	const upgradeableCarsWrapper2 = deployer.wrapDeployedContract(ICars2, proxyWrapper.contractAddress);
	const upgradeableCarsContract2 = upgradeableCarsWrapper2.contract;

	const ethPrice = 140;
	const oracleContractWrapper = await deployer.deploy(Oracle, {}, ethPrice);
	const setOracleContractResult = await upgradeableCarsContract2.setOracleContractAddress(oracleContractWrapper.contractAddress, {gasLimit: 2000000});
	await upgradeableCarsWrapper2.verboseWaitForTransaction(setOracleContractResult, "Set oracle contract address");

	const carInfoAfterUpgrade = await upgradeableCarsContract2.getCarInfo(0);
	console.log("Car Info After Upgrade: " + carInfoAfterUpgrade);
	const carPriceInUSD = await upgradeableCarsContract2.getCarPriceInUSD(0);
	console.log("Car price in USD: " + carPriceInUSD);
};

module.exports = {
	deploy
};