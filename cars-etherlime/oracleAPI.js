const axios = require('axios');
const ethers = require('ethers');
const ETH_API = 'https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=USD,JPY,EUR';
const Oracle = require('./build/Oracle.json');
let deployedContract;
// enter contract address here
const contractAddress = '';
let priceInUSD;

const getEthPrice = async () => {
	try {
    let response = await axios.get(ETH_API);
    priceInUSD = Math.trunc(response.data.USD);

	} catch (e) {}

  // updateRate();
  ganacheUpdateRate();
};

const updateRate = async () => {
	let infuraProvider = new ethers.providers.InfuraProvider('ropsten');
	deployedContract = await new ethers.Contract(contractAddress, Oracle.abi, infuraProvider);

	//Enter your private key here
	const wallet = new ethers.Wallet("", infuraProvider);
	const connectedContract = deployedContract.connect(wallet);

	await connectedContract.setPrice(priceInUSD);
}

const ganacheUpdateRate = async () => {
	let ganacheProvider = await new ethers.providers.JsonRpcProvider("http://localhost:8545");
	deployedContract = await new ethers.Contract(contractAddress, Oracle.abi, ganacheProvider);

  //Enter your private key here
	const wallet = new ethers.Wallet("", ganacheProvider);
	const connectedContract = deployedContract.connect(wallet);

  const currentPrice = await connectedContract.ethPriceInUSD();
  console.log('Current price: ' + currentPrice);

  console.log('Price from provider: '+ priceInUSD);
  await connectedContract.setPrice(priceInUSD);
  
  const updatedPrice = await connectedContract.ethPriceInUSD();
  console.log('Updated price: ' + updatedPrice);

  const oldPrice = await connectedContract.lastEthPriceInUSD();
  console.log('Old price: ' + oldPrice);
}

getEthPrice();