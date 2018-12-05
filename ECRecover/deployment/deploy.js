const etherlime = require('etherlime');
const ECTools = require('../build/ECTools.json');
const ECVerifier = require('../build/ECVerifier.json');

const deploy = async (network, secret) => {

	const deployer = new etherlime.EtherlimeGanacheDeployer();
	const ECToolsWrapper = await deployer.deploy(ECTools);
  const ECVerifierWrapper = await deployer.deploy(ECVerifier, {ECTools: ECToolsWrapper.contractAddress});
};

module.exports = {
	deploy
};