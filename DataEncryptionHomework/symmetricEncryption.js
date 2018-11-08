const fs = require('fs');
const crypto = require('crypto');
const ipfsApi = require('ipfs-api');

function readFilesAndEncrypt(symmetricKey, iv) {
  const dirPath = './files';
  const dirFiles = [];

  try {
    const files = fs.readdirSync(dirPath);

    for (let i = 0; i < files.length; i++) {
      const fileName = files[i];
      const filePath = `${dirPath}/${fileName}`;
  
      const fileContent = fs.readFileSync(filePath);
      const fileObj = {
        path: fileName,
        content: encryptFile(fileContent, symmetricKey, iv)
      }

      dirFiles.push(fileObj);
    }

    return dirFiles;
  } catch (err) {
    console.log(err);
  }
}

function generateSymmetricKey() {
  return crypto.randomBytes(32);
}

function generateIV() {
  return crypto.randomBytes(16);
}

function encryptFile(bufferContent, symmetricKey, iv) {
  const cipher = crypto.createCipheriv('aes-256-ctr', symmetricKey, iv);
  return Buffer.concat([cipher.update(bufferContent), cipher.final()]);
}

function decryptFile(bufferEncryptedContent, symmetricKey, iv) {
  const decipher = crypto.createDecipheriv('aes-256-ctr', symmetricKey, iv);
  return Buffer.concat([decipher.update(bufferEncryptedContent), decipher.final()]);
}

async function uploadFilesToIpfsAndReadThem() {
  try {
    const ipfsNode = ipfsApi();
    const symmetricKey = generateSymmetricKey();
    const IV = generateIV();
    const files = readFilesAndEncrypt(symmetricKey, IV);

    const options = {
      wrapWithDirectory: true
    }
  
    const result = await ipfsNode.add(files, options);
    const wrapperFolderHash = result[files.length].hash;
    console.log('IPFS folder hash: ' + wrapperFolderHash);
    
    fs.mkdirSync(wrapperFolderHash);
    const filesResult = await ipfsNode.files.get(wrapperFolderHash);
    filesResult.forEach((file) => {
      if (file.content) {
        file.content = decryptFile(file.content, symmetricKey, IV);
        fs.writeFileSync(`./${file.path}`, file.content, 'utf8');
      }
    });
  } catch (err) {
    console.log(err);
  }
}

uploadFilesToIpfsAndReadThem();