import {
  BlockfrostProvider,
  MeshTxBuilder,
  MeshWallet,
  deserializeDatum,
  serializePlutusScript,
  mConStr0,
  Asset,
} from "@meshsdk/core";

// ═══════════════════════════════════════════════════════════════════
// CONSTANTS - ADA Market Mainnet
// ═══════════════════════════════════════════════════════════════════

const BLOCKFROST_KEY = "mainnetmYbTW9Ne1hmN5am2IohNI96Db4IZWWdw";

// Script hashes
const QTOKEN_POLICY = "a04ce7a52545e5e33c2867e148898d9e667a69602285f6a1298f9d68";
const ACTION_SCRIPT_HASH = "31415bb210164cf6b84d1b12537f0792d2912d156e0f1ed1d91c83ce";

// NFT identifiers (policy_id only, empty token name)
const ACTION_TOKEN = "7807209cec9f79c9f6cf5bea2ab7826e6e46b6a7583a337b7e20fb36";
const MARKET_STATE_TOKEN = "5a3cb4f52fb3a00ab5abe62080618623811ccafab9c760d0b686e44c";
const MARKET_PARAMS_TOKEN = "24f51a8308b4e47b9d1438ec1e91da4ee063c38c704b530cba4adc5b";

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

interface MarketState {
  supply: bigint;
  reserve: bigint;
  qTokens: bigint;
  principal: bigint;
  interest: bigint;
  interestIndex: bigint;
  interestRate: [bigint, bigint];
  lastInterestTime: bigint;
  lastBatch: bigint;
  qTokenRate: [bigint, bigint];  // [numerator, denominator]
  minAda: bigint;
}

interface ActionValue {
  supplyDiff: bigint;
  qTokensDiff: bigint;
  principalDiff: bigint;
  interestDiff: bigint;
  extraInterestRepaid: bigint;
}

interface ActionDatum {
  actionValue: ActionValue;
  reservedSupply: bigint;
}

// ═══════════════════════════════════════════════════════════════════
// DESERIALIZATION
// ═══════════════════════════════════════════════════════════════════

const deserializeMarketState = (plutusData: any): MarketState => {
  // MeshJS deserializeDatum returns {list: [{int: "..."}, ...]}
  const fields = plutusData.list;
  return {
    supply:           BigInt(fields[0].int),
    reserve:          BigInt(fields[1].int),
    qTokens:          BigInt(fields[2].int),
    principal:        BigInt(fields[3].int),
    interest:         BigInt(fields[4].int),
    interestIndex:    BigInt(fields[5].int),
    interestRate:     [BigInt(fields[6].list[0].int), BigInt(fields[6].list[1].int)],
    lastInterestTime: BigInt(fields[7].int),
    lastBatch:        BigInt(fields[8].int),
    qTokenRate:       [BigInt(fields[9].list[0].int), BigInt(fields[9].list[1].int)],
    minAda:           BigInt(fields[10].int),
  };
};

const deserializeActionDatum = (plutusData: any): ActionDatum => {
  // ActionDatum = [[supplyDiff, qTokensDiff, principalDiff, interestDiff, extraInterestRepaid], reservedSupply]
  const fields = plutusData.list;
  const actionValueFields = fields[0].list;
  return {
    actionValue: {
      supplyDiff:          BigInt(actionValueFields[0].int),
      qTokensDiff:         BigInt(actionValueFields[1].int),
      principalDiff:       BigInt(actionValueFields[2].int),
      interestDiff:        BigInt(actionValueFields[3].int),
      extraInterestRepaid: BigInt(actionValueFields[4].int),
    },
    reservedSupply: BigInt(fields[1].int),
  };
};

// ═══════════════════════════════════════════════════════════════════
// SERIALIZATION
// ═══════════════════════════════════════════════════════════════════

const serializeActionDatum = (datum: ActionDatum): any => {
  // MeshJS format: list of values (indefinite-length array in CBOR)
  return {
    list: [
      {
        list: [
          { int: datum.actionValue.supplyDiff.toString() },
          { int: datum.actionValue.qTokensDiff.toString() },
          { int: datum.actionValue.principalDiff.toString() },
          { int: datum.actionValue.interestDiff.toString() },
          { int: datum.actionValue.extraInterestRepaid.toString() },
        ]
      },
      { int: datum.reservedSupply.toString() }
    ]
  };
};

// Unit redeemer: Constr 0 []
const UNIT_REDEEMER = mConStr0([]);

// ═══════════════════════════════════════════════════════════════════
// HELPER: Find UTxO by token
// ═══════════════════════════════════════════════════════════════════

const findUtxoByToken = async (provider: BlockfrostProvider, policyId: string) => {
  // Query Blockfrost for addresses holding this token
  const response = await fetch(
    `https://cardano-mainnet.blockfrost.io/api/v0/assets/${policyId}/addresses`,
    { headers: { "project_id": BLOCKFROST_KEY } }
  );
  const addresses = await response.json();
  
  if (!addresses || addresses.length === 0) {
    throw new Error(`No UTxO found for token ${policyId}`);
  }
  
  // Get UTxOs at first address
  const utxos = await provider.fetchAddressUTxOs(addresses[0].address);
  
  // Find UTxO containing this token
  const utxo = utxos.find((u: any) => 
    u.output.amount.some((a: any) => a.unit.startsWith(policyId))
  );
  
  if (!utxo) {
    throw new Error(`UTxO with token ${policyId} not found`);
  }
  
  return utxo;
};

// ═══════════════════════════════════════════════════════════════════
// HELPER: Find script reference UTxO
// ═══════════════════════════════════════════════════════════════════

const findScriptRefUtxo = async (provider: BlockfrostProvider, scriptHash: string) => {
  // Query Blockfrost for script redeemers to find reference UTxO
  // The script reference is deployed at a known UTxO - fetch from registry
  // For production: cache this or fetch from Liqwid's registry.json
  
  const response = await fetch(
    `https://cardano-mainnet.blockfrost.io/api/v0/scripts/${scriptHash}/redeemers?count=1`,
    { headers: { "project_id": BLOCKFROST_KEY } }
  );
  
  // Alternative: Query the well-known script holder address
  // Script refs are held at addresses with the script as payment credential
  const scriptAddress = await fetch(
    `https://cardano-mainnet.blockfrost.io/api/v0/scripts/${scriptHash}`,
    { headers: { "project_id": BLOCKFROST_KEY } }
  );
  const scriptInfo = await scriptAddress.json();
  
  // For now, return a placeholder - in production, fetch from registry.json
  // The registry contains deployment.referenceUtxo for each script
  console.log(`   Script ${scriptHash.slice(0,8)}... found (type: ${scriptInfo.type})`);
  
  // Return structure expected by MeshJS
  return {
    input: { txHash: "fromRegistry", outputIndex: 0 },
    output: {
      address: "scriptRefAddress",
      amount: [{ unit: "lovelace", quantity: "0" }],
      scriptRef: scriptHash,
    }
  };
};

// ═══════════════════════════════════════════════════════════════════
// DEPOSIT (Supply ADA → Receive qADA)
// ═══════════════════════════════════════════════════════════════════

export const buildDepositTx = async (
  wallet: MeshWallet,
  depositAda: number
): Promise<string> => {
  
  const provider = new BlockfrostProvider(BLOCKFROST_KEY);
  const depositLovelace = BigInt(Math.floor(depositAda * 1_000_000));
  const userAddress = await wallet.getChangeAddress();
  
  console.log(`\n📥 Building DEPOSIT TX`);
  console.log(`   Amount: ${depositAda} ADA (${depositLovelace} lovelace)`);
  
  // ─────────────────────────────────────────────────────────────────
  // 1. Fetch Reference UTxOs
  // ─────────────────────────────────────────────────────────────────
  
  console.log(`\n📖 Fetching reference UTxOs...`);
  
  const marketStateUtxo = await findUtxoByToken(provider, MARKET_STATE_TOKEN);
  console.log(`   MarketState: ${marketStateUtxo.input.txHash}#${marketStateUtxo.input.outputIndex}`);
  
  const marketParamsUtxo = await findUtxoByToken(provider, MARKET_PARAMS_TOKEN);
  console.log(`   MarketParams: ${marketParamsUtxo.input.txHash}#${marketParamsUtxo.input.outputIndex}`);
  
  const actionScriptRefUtxo = await findScriptRefUtxo(provider, ACTION_SCRIPT_HASH);
  console.log(`   ActionScript: ${actionScriptRefUtxo.input.txHash}#${actionScriptRefUtxo.input.outputIndex}`);
  
  // ─────────────────────────────────────────────────────────────────
  // 2. Fetch Action UTxO (to spend)
  // ─────────────────────────────────────────────────────────────────
  
  console.log(`\n💰 Fetching Action UTxO...`);
  
  const actionUtxo = await findUtxoByToken(provider, ACTION_TOKEN);
  console.log(`   Action: ${actionUtxo.input.txHash}#${actionUtxo.input.outputIndex}`);
  console.log(`   Address: ${actionUtxo.output.address}`);
  
  // ─────────────────────────────────────────────────────────────────
  // 3. Decode MarketState → get qTokenRate
  // ─────────────────────────────────────────────────────────────────
  
  console.log(`\n📊 Decoding MarketState...`);
  
  const marketStateDatum = deserializeDatum(marketStateUtxo.output.plutusData);
  const marketState = deserializeMarketState(marketStateDatum);
  
  const qTokenRate = marketState.qTokenRate;
  console.log(`   qTokenRate: ${qTokenRate[0]} / ${qTokenRate[1]}`);
  console.log(`   1 ADA = ${(1_000_000n * qTokenRate[1]) / qTokenRate[0]} qTokens`);
  
  // ─────────────────────────────────────────────────────────────────
  // 4. Calculate qTokens to mint
  // ─────────────────────────────────────────────────────────────────
  
  const qTokensToMint = (depositLovelace * qTokenRate[1]) / qTokenRate[0];
  console.log(`\n🪙 qTokens to mint: ${qTokensToMint}`);
  
  // ─────────────────────────────────────────────────────────────────
  // 5. Decode & Update ActionDatum
  // ─────────────────────────────────────────────────────────────────
  
  console.log(`\n📝 Updating ActionDatum...`);
  
  const actionDatumRaw = deserializeDatum(actionUtxo.output.plutusData);
  const currentActionDatum = deserializeActionDatum(actionDatumRaw);
  
  console.log(`   Current supplyDiff:  ${currentActionDatum.actionValue.supplyDiff}`);
  console.log(`   Current qTokensDiff: ${currentActionDatum.actionValue.qTokensDiff}`);
  
  const newActionDatum: ActionDatum = {
    actionValue: {
      supplyDiff:  currentActionDatum.actionValue.supplyDiff + depositLovelace,
      qTokensDiff: currentActionDatum.actionValue.qTokensDiff + qTokensToMint,
      principalDiff: currentActionDatum.actionValue.principalDiff,
      interestDiff: currentActionDatum.actionValue.interestDiff,
      extraInterestRepaid: currentActionDatum.actionValue.extraInterestRepaid,
    },
    reservedSupply: currentActionDatum.reservedSupply,
  };
  
  console.log(`   New supplyDiff:  ${newActionDatum.actionValue.supplyDiff}`);
  console.log(`   New qTokensDiff: ${newActionDatum.actionValue.qTokensDiff}`);
  
  // ─────────────────────────────────────────────────────────────────
  // 6. Calculate new Action UTxO value
  // ─────────────────────────────────────────────────────────────────
  
  const currentActionLovelace = BigInt(
    actionUtxo.output.amount.find((a: Asset) => a.unit === "lovelace")?.quantity || "0"
  );
  const newActionLovelace = currentActionLovelace + depositLovelace;
  
  console.log(`\n💎 Action UTxO value: ${currentActionLovelace} → ${newActionLovelace} lovelace`);
  
  // ─────────────────────────────────────────────────────────────────
  // 7. Build Transaction
  // ─────────────────────────────────────────────────────────────────
  
  console.log(`\n🔨 Building transaction...`);
  
  const mesh = new MeshTxBuilder({
    fetcher: provider,
    evaluator: provider,
  });
  
  await mesh
    // Reference inputs (read-only state)
    .readOnlyTxInReference(
      marketStateUtxo.input.txHash,
      marketStateUtxo.input.outputIndex
    )
    .readOnlyTxInReference(
      marketParamsUtxo.input.txHash,
      marketParamsUtxo.input.outputIndex
    )
    .readOnlyTxInReference(
      actionScriptRefUtxo.input.txHash,
      actionScriptRefUtxo.input.outputIndex
    )
    
    // Spend Action UTxO (script spend)
    .spendingPlutusScriptV2()
    .txIn(
      actionUtxo.input.txHash,
      actionUtxo.input.outputIndex
    )
    .txInInlineDatumPresent()
    .txInRedeemerValue(UNIT_REDEEMER)
    .spendingTxInReference(
      actionScriptRefUtxo.input.txHash,
      actionScriptRefUtxo.input.outputIndex
    )
    
    // Mint qTokens
    .mintPlutusScriptV2()
    .mint(qTokensToMint.toString(), QTOKEN_POLICY, "")
    .mintRedeemerValue(UNIT_REDEEMER)
    // Note: Need to add QToken script reference here
    
    // Output: Updated Action UTxO
    .txOut(actionUtxo.output.address, [
      { unit: "lovelace", quantity: newActionLovelace.toString() },
      { unit: ACTION_TOKEN, quantity: "1" },
    ])
    .txOutInlineDatumValue(serializeActionDatum(newActionDatum))
    
    // Output: qTokens to user
    .txOut(userAddress, [
      { unit: "lovelace", quantity: "1500000" },  // min ADA
      { unit: QTOKEN_POLICY, quantity: qTokensToMint.toString() },
    ])
    
    .changeAddress(userAddress)
    .selectUtxosFrom(await wallet.getUtxos())
    .complete();
  
  const unsignedTx = mesh.txHex;
  console.log(`\n✅ Transaction built!`);
  console.log(`   Size: ${unsignedTx.length / 2} bytes`);
  
  return unsignedTx;
};

// ═══════════════════════════════════════════════════════════════════
// WITHDRAW (Burn qADA → Receive ADA)
// ═══════════════════════════════════════════════════════════════════

export const buildWithdrawTx = async (
  wallet: MeshWallet,
  qTokensToBurn: bigint
): Promise<string> => {
  
  const provider = new BlockfrostProvider(BLOCKFROST_KEY);
  const userAddress = await wallet.getChangeAddress();
  
  console.log(`\n📤 Building WITHDRAW TX`);
  console.log(`   qTokens to burn: ${qTokensToBurn}`);
  
  // Fetch UTxOs (same as deposit)
  const marketStateUtxo = await findUtxoByToken(provider, MARKET_STATE_TOKEN);
  const marketParamsUtxo = await findUtxoByToken(provider, MARKET_PARAMS_TOKEN);
  const actionScriptRefUtxo = await findScriptRefUtxo(provider, ACTION_SCRIPT_HASH);
  const actionUtxo = await findUtxoByToken(provider, ACTION_TOKEN);
  
  // Decode MarketState
  const marketStateDatum = deserializeDatum(marketStateUtxo.output.plutusData);
  const marketState = deserializeMarketState(marketStateDatum);
  const qTokenRate = marketState.qTokenRate;
  
  // Calculate ADA to receive
  const lovelaceToReceive = (qTokensToBurn * qTokenRate[0]) / qTokenRate[1];
  console.log(`   ADA to receive: ${lovelaceToReceive} lovelace (${Number(lovelaceToReceive) / 1_000_000} ADA)`);
  
  // Decode & Update ActionDatum (NEGATIVE diffs)
  const actionDatumRaw = deserializeDatum(actionUtxo.output.plutusData);
  const currentActionDatum = deserializeActionDatum(actionDatumRaw);
  
  const newActionDatum: ActionDatum = {
    actionValue: {
      supplyDiff:  currentActionDatum.actionValue.supplyDiff - lovelaceToReceive,  // negative
      qTokensDiff: currentActionDatum.actionValue.qTokensDiff - qTokensToBurn,     // negative
      principalDiff: currentActionDatum.actionValue.principalDiff,
      interestDiff: currentActionDatum.actionValue.interestDiff,
      extraInterestRepaid: currentActionDatum.actionValue.extraInterestRepaid,
    },
    reservedSupply: currentActionDatum.reservedSupply,
  };
  
  // Calculate new Action UTxO value
  const currentActionLovelace = BigInt(
    actionUtxo.output.amount.find((a: Asset) => a.unit === "lovelace")?.quantity || "0"
  );
  const newActionLovelace = currentActionLovelace - lovelaceToReceive;
  
  // Build TX
  const mesh = new MeshTxBuilder({
    fetcher: provider,
    evaluator: provider,
  });
  
  // Find user's qToken UTxO
  const userUtxos = await wallet.getUtxos();
  const userQTokenUtxo = userUtxos.find((u: any) =>
    u.output.amount.some((a: Asset) => a.unit.startsWith(QTOKEN_POLICY))
  );
  
  if (!userQTokenUtxo) {
    throw new Error("No qTokens found in wallet");
  }
  
  await mesh
    // Reference inputs
    .readOnlyTxInReference(marketStateUtxo.input.txHash, marketStateUtxo.input.outputIndex)
    .readOnlyTxInReference(marketParamsUtxo.input.txHash, marketParamsUtxo.input.outputIndex)
    .readOnlyTxInReference(actionScriptRefUtxo.input.txHash, actionScriptRefUtxo.input.outputIndex)
    
    // Spend Action UTxO
    .spendingPlutusScriptV2()
    .txIn(actionUtxo.input.txHash, actionUtxo.input.outputIndex)
    .txInInlineDatumPresent()
    .txInRedeemerValue(UNIT_REDEEMER)
    .spendingTxInReference(actionScriptRefUtxo.input.txHash, actionScriptRefUtxo.input.outputIndex)
    
    // Spend user's qTokens
    .txIn(userQTokenUtxo.input.txHash, userQTokenUtxo.input.outputIndex)
    
    // Burn qTokens (NEGATIVE mint)
    .mintPlutusScriptV2()
    .mint("-" + qTokensToBurn.toString(), QTOKEN_POLICY, "")
    .mintRedeemerValue(UNIT_REDEEMER)
    
    // Output: Updated Action UTxO (less ADA)
    .txOut(actionUtxo.output.address, [
      { unit: "lovelace", quantity: newActionLovelace.toString() },
      { unit: ACTION_TOKEN, quantity: "1" },
    ])
    .txOutInlineDatumValue(serializeActionDatum(newActionDatum))
    
    // Output: ADA to user
    .txOut(userAddress, [
      { unit: "lovelace", quantity: lovelaceToReceive.toString() },
    ])
    
    .changeAddress(userAddress)
    .selectUtxosFrom(userUtxos)
    .complete();
  
  return mesh.txHex;
};

// ═══════════════════════════════════════════════════════════════════
// CLI / TEST
// ═══════════════════════════════════════════════════════════════════

const main = async () => {
  console.log("═══════════════════════════════════════════════════════════");
  console.log(" Liqwid Finance - Supply/Withdraw SDK");
  console.log("═══════════════════════════════════════════════════════════");
  
  const provider = new BlockfrostProvider(BLOCKFROST_KEY);
  
  // ─────────────────────────────────────────────────────────────────
  // Fetch MarketState
  // ─────────────────────────────────────────────────────────────────
  console.log("\n📊 Fetching MarketState...\n");
  
  const marketStateUtxo = await findUtxoByToken(provider, MARKET_STATE_TOKEN);
  const marketStateDatum = deserializeDatum(marketStateUtxo.output.plutusData);
  const marketState = deserializeMarketState(marketStateDatum);
  
  console.log(`   UTxO: ${marketStateUtxo.input.txHash}#${marketStateUtxo.input.outputIndex}`);
  console.log(`   Total Supply:    ${(Number(marketState.supply) / 1_000_000).toLocaleString()} ADA`);
  console.log(`   Total Borrowed:  ${(Number(marketState.principal) / 1_000_000).toLocaleString()} ADA`);
  console.log(`   qToken Rate:     ${marketState.qTokenRate[0]} / ${marketState.qTokenRate[1]}`);
  console.log(`   1 ADA = ${(1_000_000n * marketState.qTokenRate[1]) / marketState.qTokenRate[0]} qTokens`);
  
  // ─────────────────────────────────────────────────────────────────
  // Fetch Action UTxO
  // ─────────────────────────────────────────────────────────────────
  console.log("\n💰 Fetching Action UTxO...\n");
  
  const actionUtxo = await findUtxoByToken(provider, ACTION_TOKEN);
  const actionDatumRaw = deserializeDatum(actionUtxo.output.plutusData);
  const actionDatum = deserializeActionDatum(actionDatumRaw);
  
  const actionLovelace = actionUtxo.output.amount.find((a: any) => a.unit === "lovelace")?.quantity || "0";
  
  console.log(`   UTxO: ${actionUtxo.input.txHash}#${actionUtxo.input.outputIndex}`);
  console.log(`   Address: ${actionUtxo.output.address.slice(0, 40)}...`);
  console.log(`   Lovelace: ${Number(actionLovelace).toLocaleString()} (${(Number(actionLovelace) / 1_000_000).toLocaleString()} ADA)`);
  console.log(`   ActionDatum:`);
  console.log(`      supplyDiff:  ${actionDatum.actionValue.supplyDiff} (${(Number(actionDatum.actionValue.supplyDiff) / 1_000_000).toLocaleString()} ADA)`);
  console.log(`      qTokensDiff: ${actionDatum.actionValue.qTokensDiff}`);
  console.log(`      reservedSupply: ${actionDatum.reservedSupply}`);
  
  // ─────────────────────────────────────────────────────────────────
  // Simulate a 10 ADA deposit
  // ─────────────────────────────────────────────────────────────────
  console.log("\n🧮 Simulating 10 ADA deposit...\n");
  
  const depositLovelace = 10_000_000n;
  const qTokensToMint = (depositLovelace * marketState.qTokenRate[1]) / marketState.qTokenRate[0];
  
  console.log(`   Deposit:       ${depositLovelace} lovelace (10 ADA)`);
  console.log(`   qTokens mint:  ${qTokensToMint}`);
  
  const newActionDatum: ActionDatum = {
    actionValue: {
      supplyDiff:  actionDatum.actionValue.supplyDiff + depositLovelace,
      qTokensDiff: actionDatum.actionValue.qTokensDiff + qTokensToMint,
      principalDiff: actionDatum.actionValue.principalDiff,
      interestDiff: actionDatum.actionValue.interestDiff,
      extraInterestRepaid: actionDatum.actionValue.extraInterestRepaid,
    },
    reservedSupply: actionDatum.reservedSupply,
  };
  
  console.log(`\n   New ActionDatum:`);
  console.log(`      supplyDiff:  ${newActionDatum.actionValue.supplyDiff}`);
  console.log(`      qTokensDiff: ${newActionDatum.actionValue.qTokensDiff}`);
  
  console.log("\n✅ Ready to build transaction!");
};

main().catch(console.error);
