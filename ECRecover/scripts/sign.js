const ethers = require('ethers');
const providers = ethers.providers;
const Wallet = ethers.Wallet;
const utils = ethers.utils;
const ECVerifier = require('../build/ECVerifier.json');

(async function () {

	if (process.argv.length < 5) {
		throw new Error('Invalid arguments');
	}

	const provider = new providers.JsonRpcProvider('http://localhost:8545');

	const privateKey = process.argv[2];
	const wallet = new Wallet(privateKey, provider);

	const message = process.argv[3];
	const hashMsg = utils.solidityKeccak256(['string'], [message]);
	const dataBytes = utils.arrayify(hashMsg);

	const signature = await wallet.signMessage(dataBytes);
	console.log(signature);

	const contractAddress = process.argv[4];
	const verifierContract = new ethers.Contract(contractAddress, ECVerifier.abi, wallet);
	
	const localVerify = utils.verifyMessage(dataBytes, signature);
	console.log(localVerify);

	const remoteVerify = await verifierContract.verify(dataBytes, signature);
	console.log(remoteVerify);
})()