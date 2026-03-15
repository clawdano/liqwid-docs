import { BlockfrostProvider, deserializeDatum } from "@meshsdk/core";

const BLOCKFROST_KEY = "mainnetmYbTW9Ne1hmN5am2IohNI96Db4IZWWdw";
const MARKET_STATE_TOKEN = "5a3cb4f52fb3a00ab5abe62080618623811ccafab9c760d0b686e44c";

const bigIntReplacer = (key: string, value: any) => 
  typeof value === 'bigint' ? value.toString() : value;

const main = async () => {
  const provider = new BlockfrostProvider(BLOCKFROST_KEY);
  
  const response = await fetch(
    `https://cardano-mainnet.blockfrost.io/api/v0/assets/${MARKET_STATE_TOKEN}/addresses`,
    { headers: { "project_id": BLOCKFROST_KEY } }
  );
  const addresses = await response.json();
  
  const utxos = await provider.fetchAddressUTxOs(addresses[0].address);
  const utxo = utxos.find((u: any) => 
    u.output.amount.some((a: any) => a.unit.startsWith(MARKET_STATE_TOKEN))
  );
  
  if (utxo.output.plutusData) {
    const datum = deserializeDatum(utxo.output.plutusData);
    console.log("\nDeserialized datum structure:");
    console.log(JSON.stringify(datum, bigIntReplacer, 2));
  }
};

main().catch(console.error);
