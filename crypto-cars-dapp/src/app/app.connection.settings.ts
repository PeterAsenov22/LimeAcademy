declare let require: any;
const Cars = require('./contract_interfaces/Cars.json');

export const connectionSettings = {
  network: 'ropsten',
  apiAccessToken: 'f8d2169f70584df396394ad9ce130289',
  contractAddress: '0x596f712b270ed0d7cedadcab6baa34bee878dbff',
  contractABI: Cars.abi,
};

