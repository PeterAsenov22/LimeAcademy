const etherlime = require('etherlime');
const ethers = require('ethers');
const utils = ethers.utils;

const MerkleUtils = require('../build/MerkleUtils.json');
const MerkleLime = require('../build/MerkleLime.json');

let merkleLimeContract;

describe('Example', () => {
  let deployer;

  let aOriginal;
  let bOriginal;
  let cOriginal;
  let dOriginal;
  let eOriginal;
  let fOriginal;
  let gOriginal;
  let hOriginal;

  let aHash;
  let bHash;
  let cHash;
  let dHash;
  let eHash;
  let fHash;
  let gHash;
  let hHash;
  let abHash;
  let cdHash;
  let efHash;
  let ghHash;
  let abcdHash;
  let efghHash;
  let root;

  const createTree = () => {
    aOriginal = 'a;b;50';
    bOriginal = 'b;c;20';
    cOriginal = 'c;d;30';
    dOriginal = 'd;a;10';
    eOriginal = 'e;a;50';
    fOriginal = 'f;h;12';
    gOriginal = 'g;c;80';
    hOriginal = 'h;d;40';

    aHash = utils.solidityKeccak256(['bytes'], [utils.toUtf8Bytes(aOriginal)]);
    bHash = utils.solidityKeccak256(['bytes'], [utils.toUtf8Bytes(bOriginal)]);
    cHash = utils.solidityKeccak256(['bytes'], [utils.toUtf8Bytes(cOriginal)]);
    dHash = utils.solidityKeccak256(['bytes'], [utils.toUtf8Bytes(dOriginal)]);
    eHash = utils.solidityKeccak256(['bytes'], [utils.toUtf8Bytes(eOriginal)]);
    fHash = utils.solidityKeccak256(['bytes'], [utils.toUtf8Bytes(fOriginal)]);
    gHash = utils.solidityKeccak256(['bytes'], [utils.toUtf8Bytes(gOriginal)]);
    hHash = utils.solidityKeccak256(['bytes'], [utils.toUtf8Bytes(hOriginal)]);
    abHash = utils.solidityKeccak256(['bytes32', 'bytes32'], [aHash, bHash]);
    cdHash = utils.solidityKeccak256(['bytes32', 'bytes32'], [cHash, dHash]);
    efHash = utils.solidityKeccak256(['bytes32', 'bytes32'], [eHash, fHash]);
    ghHash = utils.solidityKeccak256(['bytes32', 'bytes32'], [gHash, hHash]);
    abcdHash = utils.solidityKeccak256(['bytes32', 'bytes32'], [abHash, cdHash]);
    efghHash = utils.solidityKeccak256(['bytes32', 'bytes32'], [efHash, ghHash]);

    root = utils.solidityKeccak256(['bytes32', 'bytes32'], [abcdHash, efghHash]);
  }

  before(async () => {
    deployer = new etherlime.EtherlimeGanacheDeployer();
    createTree();

    const merkleUtilsWrapper = await deployer.deploy(MerkleUtils);
    const merkleLimeWrapper = await deployer.deploy(MerkleLime, {MerkleUtils: merkleUtilsWrapper.contractAddress}, root);
    merkleLimeContract  = merkleLimeWrapper.contract;
  });

  it('should correctly discover leaf from the tree', async () => {
    const data = utils.toUtf8Bytes(bOriginal);
    const nodes = new Array();
    nodes.push(aHash);
    nodes.push(cdHash);
    nodes.push(efghHash);

    const result = await merkleLimeContract.verifyDataInState(data, nodes, 1);
    assert(result, "The data is not in the tree"); 
  });

  it('should fail on wrong leaf passed', async () => {
    const data = utils.toUtf8Bytes('b;c;30');
    const nodes = new Array();
    nodes.push(aHash);
    nodes.push(cdHash);
    nodes.push(efghHash);

    const result = await merkleLimeContract.verifyDataInState(data, nodes, 1);
    assert.isFalse(result, "The data is in the tree");
  });

  it('should fail on wrong intermediary hashes passed', async () => {
    const data = utils.toUtf8Bytes(bOriginal);
    const nodes = new Array();
    nodes.push(cHash);
    nodes.push(cdHash);
    nodes.push(efghHash);

    const result = await merkleLimeContract.verifyDataInState(data, nodes, 1);
    assert(!result, "Wrong data returned true"); 
  })

  it('should fail on wrong index passed', async () => {
    const data = utils.toUtf8Bytes(bOriginal);
    const nodes = new Array();
    nodes.push(aHash);
    nodes.push(cdHash);
    nodes.push(efghHash);

    const result = await merkleLimeContract.verifyDataInState(data, nodes, 4);
    assert(!result, "Wrong data returned true");
  });
});