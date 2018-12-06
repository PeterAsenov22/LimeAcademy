const etherlime = require('etherlime');
const ethers = require('ethers');
const ECTools = require('../build/ECTools.json');
const MetaBatchProxy = require('../build/MetaBatchProxy.json');
const MetaToken = require('../build/MetaToken.json');
const Billboard = require('../build/Billboard.json');

const deploy = async (network, secret) => {
	const deployer = new etherlime.EtherlimeGanacheDeployer();
	const wallet = deployer.wallet;

	const ECToolsWrapper = await deployer.deploy(ECTools);
	const MetaTokenWrapper = await deployer.deploy(MetaToken);
	const MetaBatchProxyWrapper = await deployer.deploy(MetaBatchProxy, {ECTools: ECToolsWrapper.contractAddress});
	const BillboardWrapper = await deployer.deploy(Billboard, {}, MetaTokenWrapper.contractAddress);
	
	// Mint tokens
	const mintTx = await MetaTokenWrapper.contract.mint(MetaBatchProxyWrapper.contractAddress, 10000);
	await MetaTokenWrapper.verboseWaitForTransaction(mintTx, "Minting 10000 tokens to proxy.");
};

module.exports = {
	deploy
};