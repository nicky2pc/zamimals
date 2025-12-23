// src/game/fheMintUtils.ts
import { ethers } from 'ethers';

// Глобальный кэш instance
let fhevmInstance: any = null;

// UMD версия, которая совместима с твоим рабочим конфигом v0.9
const RELAYER_SDK_UMD_URL = 'https://cdn.zama.org/relayer-sdk-js/0.3.0-8/relayer-sdk-js.umd.cjs';

async function getFhevmInstance(ethereumProvider: any): Promise<any> {
  if (fhevmInstance) {
    return fhevmInstance;
  }

  if (!ethereumProvider) {
    throw new Error('Ethereum provider не найден');
  }

  // Динамическая загрузка SDK только при минте
  if (!(window as any).relayerSDK) {
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = RELAYER_SDK_UMD_URL;
      script.type = 'text/javascript';
      script.onload = () => {
        setTimeout(() => {
          if ((window as any).relayerSDK) {
            resolve();
          } else {
            reject(new Error('relayerSDK не загрузился'));
          }
        }, 200);
      };
      script.onerror = () => reject(new Error('Ошибка загрузки relayer-sdk-js UMD'));
      document.head.appendChild(script);
    });
  }

  const relayerSDK = (window as any).relayerSDK;
  if (!relayerSDK?.initSDK || !relayerSDK?.createInstance) {
    throw new Error('Relayer SDK загрузился некорректно');
  }

  await relayerSDK.initSDK();

  // ТОЧНО ТЕ ЖЕ адреса, что в твоём рабочем Node.js скрипте
  fhevmInstance = await relayerSDK.createInstance({
    aclContractAddress: '0xf0Ffdc93b7E186bC2f8CB3dAA75D86d1930A433D',
    kmsContractAddress: '0xbE0E383937d564D7FF0BC3b46c51f0bF8d5C311A',
    inputVerifierContractAddress: '0xBBC1fFCdc7C316aAAd72E807D9b0272BE8F84DA0',
    verifyingContractAddressDecryption: '0x5D8BD78e2ea6bbE41f26dFe9fdaEAa349e077478',
    verifyingContractAddressInputVerification: '0x483b9dE06E4E4C7D35CCf5837A1668487406D955',
    chainId: 11155111,
    gatewayChainId: 10901,
    network: ethereumProvider,
    relayerUrl: 'https://relayer.testnet.zama.org'
  });

  console.log('✅ FHEVM instance создан (как в твоём CLI скрипте)');
  return fhevmInstance;
}

const CONTRACT_ADDRESS = '0x7e6114bAB8ADf97d88e028697a9D0CF11A6af9e0';

const CONTRACT_ABI = [
  "function mintWithConfidentialScore(address to, string memory uri, bytes32 encryptedScore, bytes calldata inputProof) external"
];

// ТОЧНО ТЕ ЖЕ КОНВЕРТЕРЫ из твоего рабочего CLI, но без Buffer (для браузера)
function toBytes32(handle: any): string {
  if (typeof handle === 'string' && handle.startsWith('0x') && handle.length === 66) {
    return handle;
  }

  let bytes: number[] = [];

  if (Array.isArray(handle)) {
    if (handle.length !== 32) throw new Error('Array must be 32 bytes');
    bytes = handle;
  } else if (typeof handle === 'object' && handle !== null) {
    const keys = Object.keys(handle).map(k => parseInt(k)).sort((a, b) => a - b);
    if (keys.length !== 32 || keys[0] !== 0 || keys[31] !== 31) {
      throw new Error('Object must represent exactly 32 consecutive bytes (0..31)');
    }
    bytes = keys.map(k => handle[k]);
  } else {
    throw new Error('Cannot convert to bytes32: unsupported type');
  }

  // Ручная конвертация в hex без Buffer
  return '0x' + bytes.map(b => b.toString(16).padStart(2, '0')).join('');
}

function toBytes(proof: any): string {
  if (typeof proof === 'string' && proof.startsWith('0x')) {
    return proof;
  }

  let bytes: number[] = [];

  if (Array.isArray(proof)) {
    bytes = proof;
  } else if (typeof proof === 'object' && proof !== null) {
    const keys = Object.keys(proof).map(k => parseInt(k)).sort((a, b) => a - b);
    bytes = keys.map(k => proof[k]);
  } else {
    throw new Error('Cannot convert proof to bytes: unsupported type');
  }

  return '0x' + bytes.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function mintConfidentialNFT(
  wallet: any,
  score: number,
  onProgress?: (status: string) => void
): Promise<string> {
  if (!wallet) throw new Error('Кошелёк не подключён');
  if (!Number.isInteger(score) || score < 0 || score > 4294967295) {
    throw new Error('Score должен быть целым числом от 0 до 4294967295');
  }

  try {
    onProgress?.('🔒 Шифруем score на устройстве...');

    const ethereumProvider = await wallet.getEthereumProvider();

    const provider = new ethers.BrowserProvider(ethereumProvider);
    await provider.send("eth_requestAccounts", []);
    const signer = await provider.getSigner();
    const userAddress = await signer.getAddress();

    const fhe = await getFhevmInstance(ethereumProvider);

    const input = fhe.createEncryptedInput(CONTRACT_ADDRESS, userAddress);
    input.add32(score);
    const encrypted = await input.encrypt();

    const encryptedScore = toBytes32(encrypted.handles[0]);
    const inputProof = toBytes(encrypted.inputProof);

    onProgress?.('📝 Подготавливаем транзакцию...');

    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

    let gasLimit = 12_000_000;
    try {
      onProgress?.('⛽ Оцениваем gas...');
      const estimated = await contract.mintWithConfidentialScore.estimateGas(
        userAddress,
        `ipfs://trophy/${score}`,
        encryptedScore,
        inputProof
      );
      gasLimit = Math.floor(Number(estimated) * 1.2);
      console.log('Gas estimate:', estimated.toString());
    } catch (e) {
      console.warn('estimateGas не сработал — используем фиксированный лимит');
    }

    onProgress?.('🚀 Отправляем транзакцию...');

    const tx = await contract.mintWithConfidentialScore(
      userAddress,
      `ipfs://trophy/${score}`,
      encryptedScore,
      inputProof,
      { gasLimit }
    );

    onProgress?.(`✅ Транзакция отправлена! Хэш: ${tx.hash}`);
    console.log('Успешный минт:', tx.hash);
    return tx.hash;

  } catch (error: any) {
    console.error('Минт провалился:', error);
    throw error;
  }
}

export function getExplorerUrl(txHash: string): string {
  return `https://sepolia.etherscan.io/tx/${txHash}`;
}