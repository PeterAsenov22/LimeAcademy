const etherlime = require('etherlime');
const MerkleUtils = require('../build/MerkleUtils.json');
const MerkleLime = require('../build/MerkleLime.json');

const rootHash = '0x30242ba0d6f048003bc3c17c45c9b23979eb8a1015967cef7715766f1454cc22';

const deploy = async (network, secret) => {
	const deployer = new etherlime.EtherlimeGanacheDeployer();
	const merkleUtilsWrapper = await deployer.deploy(MerkleUtils);
	const merkleLimeWrapper = await deployer.deploy(MerkleLime, {MerkleUtils: merkleUtilsWrapper.contractAddress}, rootHash);
};

module.exports = {
	deploy
};