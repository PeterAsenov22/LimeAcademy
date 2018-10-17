const etherlime = require('etherlime');
const Cars = require('../build/Cars.json');

const deploy = async (network, secret) => {
	const deployer = new etherlime.InfuraPrivateKeyDeployer(secret, network, 'f8d2169f70584df396394ad9ce130289');
	const contractWrapper = await deployer.deploy(Cars);

	const initialCarSeed = await contractWrapper.contract.addCar('Audi', 'A6', 1);
	await contractWrapper.verboseWaitForTransaction(initialCarSeed, 'First car added.');
};

module.exports = {
	deploy
};