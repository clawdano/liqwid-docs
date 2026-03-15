# Liqwid Market Registry (Mainnet)

Complete mapping of all Liqwid Finance markets on Cardano mainnet.

## Quick Reference

| Market | QToken Policy | MarketState Token | Action Token |
|--------|---------------|-------------------|--------------|
| Ada | `a04ce7a5...` | `5a3cb4f5...` | `7807209c...` |
| USDA | `aa280c98...` | `9330ff6f...` | `10ab1174...` |
| USDC | `aebcb6ea...` | `191f7684...` | `f37e1604...` |
| DJED | `6df63e2f...` | `43c4bdac...` | `9e432ad7...` |
| USDM | `9e00df06...` | `dae2eab1...` | `e50ce37c...` |
| BTC | `f72166e9...` | `aecc77dc...` | `d196c3f4...` |
| ETH | `5f429945...` | `ef654dcf...` | `f7e9f09f...` |

---

## How to Find UTxOs

For any market, use these patterns:

### MarketState UTxO
```typescript
// Find by MarketStateToken (MintingPolicy hash)
const utxo = await fetchUtxoByToken(MARKET_STATE_TOKEN_HASH);
// Contains: qTokenRate, supply, principal, etc.
```

### Action UTxO
```typescript
// Find by ActionToken (MintingPolicy hash)
const utxo = await fetchUtxoByToken(ACTION_TOKEN_HASH);
// Contains: ActionDatum with supplyDiff/qTokensDiff
```

### MarketParams UTxO
```typescript
// Find by MarketParamsToken (MintingPolicy hash)
const utxo = await fetchUtxoByToken(MARKET_PARAMS_TOKEN_HASH);
// Contains: Protocol parameters
```

---

## Complete Market Details

### Ada

| Component | Type | Script Hash |
|-----------|------|-------------|
| QToken | MintingPolicy | `a04ce7a52545e5e33c2867e148898d9e667a69602285f6a1298f9d68` |
| Action | Validator | `31415bb210164cf6b84d1b12537f0792d2912d156e0f1ed1d91c83ce` |
| Action | MintingPolicy | `7807209cec9f79c9f6cf5bea2ab7826e6e46b6a7583a337b7e20fb36` |
| MarketState | Validator | `8d258b9d08dcab73f3165a11751d464b46056264091c1789da588726` |
| MarketState | MintingPolicy | `5a3cb4f52fb3a00ab5abe62080618623811ccafab9c760d0b686e44c` |
| MarketParams | MintingPolicy | `24f51a8308b4e47b9d1438ec1e91da4ee063c38c704b530cba4adc5b` |
| Batch | Validator | `a3e56ea9d2db008038ce6fb32e500faef1523dcb042e5a637d633fc8` |
| Loan | Validator | `71391f18fb131f28a230fa7f3b6c6099e447602b2bd2df5d046c5e99` |
| Liquidation | MintingPolicy | `3c9ee71d8f14b386df802f4121d82746df5508e29198744bea7552ef` |

### USDA

| Component | Type | Script Hash |
|-----------|------|-------------|
| QToken | MintingPolicy | `aa280c98c5b07fdfc8d7a93fb5ba84510b421388e4a18e16efa8eb5f` |
| Action | Validator | `536fdafec178c3f649997ebf961065ffd1aef69f5935dde4e59446d9` |
| Action | MintingPolicy | `10ab1174ee5b8c82df978ce61b0f32573320be50c97f93188e58f643` |
| MarketState | Validator | `07de5eb4fdb9f6bd23c7bc3c588306f03d46c8c59ee980223132c87e` |
| MarketState | MintingPolicy | `9330ff6f3d301a9abc1979cffd1465cd27f7563837a7d635f59f1aa2` |
| MarketParams | MintingPolicy | `63523a527d2eefce0415b61743ebdccef41f8aee09f96b74152f66fe` |
| Loan | Validator | `dd4657091fdb7e8fa8680b5a87ebb914c95056ba0523913a7cd2b081` |
| Liquidation | MintingPolicy | `f8ce78ffa7b03cbca6e18cef4e6b65c6604e4b15754fe1fe65caddde` |

### USDC

| Component | Type | Script Hash |
|-----------|------|-------------|
| QToken | MintingPolicy | `aebcb6eaba17dea962008a9d693e39a3160b02b5b89b1c83e537c599` |
| Action | Validator | `469772d2f93d70f92a4930fa608457392e58e480babf723ade7f9857` |
| Action | MintingPolicy | `f37e16045a5aa79503c1e3a36c0892a04a6f4471e4a097c9c98d3854` |
| MarketState | Validator | `1579f32be90cf3825e7194568240dae5e0b87c7c40108ed7cdfe89f8` |
| MarketState | MintingPolicy | `191f768460713989c5ae88821f208522df7800f6b5572ca7905a7a60` |
| MarketParams | MintingPolicy | `1847265fd9019209f837113ec1753a4b0de657987e66f89ebcee47e6` |
| Loan | Validator | `4986257bffd6bc8bda0e56fd7796c5d125fe496deb3a00c5196068a3` |
| Liquidation | MintingPolicy | `f79c83ce02ecfee5cda7ca12188f14acc4bfe27fc90254f1d489124f` |

### DJED

| Component | Type | Script Hash |
|-----------|------|-------------|
| QToken | MintingPolicy | `6df63e2fdde8b2c3b3396265b0cc824aa4fb999396b1c154280f6b0c` |
| Action | Validator | `7bd80451bde142f4e9d9af436de303fb4c0aaf51d96b14a41e2e07de` |
| Action | MintingPolicy | `9e432ad7f92337287c0b68cb82d9e89413ee9e24c43bb4e91fe3a1ee` |
| MarketState | Validator | `e88f72f6b4673db78efe148b1cd90c689115ddb3d7e356a0003148cf` |
| MarketState | MintingPolicy | `43c4bdac04537dbd338935d00a8a0746a078d4f03d7ac302a4bf5d3d` |
| MarketParams | MintingPolicy | `9f61f4563c3037017d768c34c392976e6f7c5fd080d9a0b315cc9b8d` |
| Loan | Validator | `7bf8d17b4ea7a5abb5ed56f70cea83f2c6055180dd5dbae86a458595` |
| Liquidation | MintingPolicy | `1ee678e1031bd8cdea9357b2bb953bd086ffc868d9e3ffb74e3c3e7b` |

### USDM

| Component | Type | Script Hash |
|-----------|------|-------------|
| QToken | MintingPolicy | `9e00df0615de0a7b121a7f961d43e23165b8e81b64786c6eb708d370` |
| Action | Validator | `c33a552babbaa6141e2b14c94f15efe337dba3d12d7bf51f8251011f` |
| Action | MintingPolicy | `e50ce37ceacd25ecc42ce8397b6adca66f13f83a86a81dc03b4744e7` |
| MarketState | Validator | `05a1efe8520e7bcc27e233db5f5b504b39a14e897b56420f33f8f13f` |
| MarketState | MintingPolicy | `dae2eab1798b6a6184c34e305faf7b04c325201f9a24535b98ddbf8b` |
| MarketParams | MintingPolicy | `5ba0102094888ce634630f087b62339c9c9044d7d8dcce3aeeb75344` |
| Loan | Validator | `4cbdb859b85e22319045d82cde85efb14779b4ee6a3ba5cfacf12eca` |
| Liquidation | MintingPolicy | `dfc8b0ed99d862e2d5e332e069c46a3be0e9d121798a0d30e754f8d9` |

### BTC (cBTC)

| Component | Type | Script Hash |
|-----------|------|-------------|
| QToken | MintingPolicy | `f72166e9fac8297aeb553c19ffab14f51ae271c2cb26783ba289a3a5` |
| Action | Validator | `7a254b687a2605b3f725a42d5ab74f49aac26ce677bac2d80e995cee` |
| Action | MintingPolicy | `d196c3f492412878c21aaf916eb980c9f3cbee7ce04aad6ff9a6fa2d` |
| MarketState | Validator | `2516bd5a957c6caf068bd5fd67bf020dfed938fbb50242dff2529c49` |
| MarketState | MintingPolicy | `aecc77dce9fb0959a8e544d4319fe2a6afa28f12709e1ac71fab0d41` |
| MarketParams | MintingPolicy | `b0b7aebc1e98c7bbd82b65cbf8c43d21758ba63b6e086c8cf5a010c5` |
| Loan | Validator | `3c48f941040c4fc638a89c5a89d331700cd6d620fc174c9b03e8301d` |
| Liquidation | MintingPolicy | `524509608c7599dd8a21008be761b542618bcd46b42a5fe5b08b8fe8` |

### ETH (cETH)

| Component | Type | Script Hash |
|-----------|------|-------------|
| QToken | MintingPolicy | `5f42994532b04f9f5bd4141c69364c5b7d33c85036146ee321799702` |
| Action | Validator | `d72eaa2420d1de0dddde811260e4683f70df7ec6bfd6c51eea52deb2` |
| Action | MintingPolicy | `f7e9f09fb8d29ebc3252b7014fd8f5db3b4ae39ddf7ffbb7d15f6864` |
| MarketState | Validator | `adc98419692104e565144f8e2b3e5e80c73e785a752625373ee63467` |
| MarketState | MintingPolicy | `ef654dcff3df94784b088e9ed61e68a17dd2249cd51c410ffea24199` |
| MarketParams | MintingPolicy | `0b75999a419e7036fd703cdf34223dbad3a02affc82d7a9ab83b548c` |
| Loan | Validator | `83b7535f0b27152f76f33756c199f3370ed638149272a4b1f1006bf2` |
| Liquidation | MintingPolicy | `36088d63cf12e1e23d163c8be5c7fcfa2871623dc650c915e89c6f03` |

### IUSD

| Component | Type | Script Hash |
|-----------|------|-------------|
| QToken | MintingPolicy | `d15c36d6dec655677acb3318294f116ce01d8d9def3cc54cdd78909b` |
| Action | Validator | `14386d24c827f3ce74bdf6c875e548d928e12036c145ebec14f04df5` |
| Action | MintingPolicy | `1cc1aceaf5c7df55e270864a60600b9f52383fe418164574ffdeeed0` |
| MarketState | Validator | `6a836e8bb408ef5110a7477039a9f5fc41e55be9fc7eb5464def826b` |
| MarketState | MintingPolicy | `416109f322b43051b80e83075b4baa8c5af14c88acaca47d5c251820` |
| MarketParams | MintingPolicy | `f967b3a86a9880c876851fa64b352a4d3887d6436904190b698f232e` |

### MIN

| Component | Type | Script Hash |
|-----------|------|-------------|
| QToken | MintingPolicy | `a4430a085f45bca6399bec6bd7514eb8c2fce1ed75c7554739cfc32b` |
| Action | Validator | `02652a93b8327ba64b6c0bb8dfb11a76cbb333a3fbb4243ddc0859ac` |
| Action | MintingPolicy | `2fd85ced99dd9f254dfe5a1cdfb807ea2b3599e6ce33fe436210353a` |
| MarketState | Validator | `959d9b08113e0edbc48ce2c23bb293e4e47590bf574fa4f811fb736b` |
| MarketState | MintingPolicy | `7211aebe5303f1a8c7905198f637099f194a3b23e841b1dcbc064017` |
| MarketParams | MintingPolicy | `413b0737013724910078491505fbd391d04b8d11f35e98c02f41ba0d` |

### SNEK

| Component | Type | Script Hash |
|-----------|------|-------------|
| QToken | MintingPolicy | `4e8c49d610335d139ad7711e0f50315006e29b5221da531e365b4ef8` |
| Action | Validator | `a28c4a421a395cf3096152f35bfd5c2a5b6492dce4456ebdd34a84e5` |
| Action | MintingPolicy | `bfe54da27ae9b8732a89dd848682df31ae797420fc2644e907d85933` |
| MarketState | Validator | `b0b99c50b9ec9c997086cb2222bb9e4fa2841d77b2e7580b94d6e0c6` |
| MarketState | MintingPolicy | `c6f7898a261056bef6c9b52ed63aa3cd1e9b9051b0d9190e998259db` |
| MarketParams | MintingPolicy | `b6ad0fb58504876a767d4701e6ee812abfe548057f99f75283755f9b` |

### LQ

| Component | Type | Script Hash |
|-----------|------|-------------|
| QToken | MintingPolicy | `3883e3e6a24e092d4c14e757fa8ef5c887853060def087d6cf5603f5` |
| Action | Validator | `4e893c9375f959e5c5051aa70c18583510bf64e3464d5838005403f3` |
| Action | MintingPolicy | `4d9704165d10021bf6e5b878ead59fe6f9f6b37e1bd10b9bc073cc95` |
| MarketState | Validator | `0cd585246a46ce0229669b55461079227a4ccbe5f3b8d86e27b31f09` |
| MarketState | MintingPolicy | `aca430e2ba97649cbf5c21d1a0825d2c123b96a69d359ebddaafa787` |
| MarketParams | MintingPolicy | `0891e4c0dfb6875b75ad128c9cd0a2fc449d87201ea82b9e5d3a3345` |

### WMT

| Component | Type | Script Hash |
|-----------|------|-------------|
| QToken | MintingPolicy | `f2636c8280e49e7ed7a7b1151341130989631b45a08d1b320f016981` |
| Action | Validator | `4811377ea9279acb8fff1d65a225e19c0eca68bb5c1d836a47584e67` |
| Action | MintingPolicy | `ca873ee2bd0303b0a8bce0a5c7376ee6bf811df27f5f83163c0bdb00` |
| MarketState | Validator | `f42f7a0c16e377a7313404e8880386a6f8e5725db39985d25757b6ba` |
| MarketState | MintingPolicy | `d8c6d5509d11856fe3c2cfc434e6f251f0ed6b0d54090b40656df6ae` |
| MarketParams | MintingPolicy | `ee73884453cf3c5788313ca0341f494f684c1c40bb3bc5c0df85be6d` |

---

## All Supported Markets

| Market | Underlying Asset |
|--------|------------------|
| Ada | Native ADA |
| USDA | Stablecoin |
| USDC | Circle USDC |
| DJED | Djed stablecoin |
| USDM | Mehen USDM |
| IUSD | Indigo iUSD |
| BTC | Wrapped BTC |
| ETH | Wrapped ETH |
| SNEK | SNEK token |
| MIN | Minswap MIN |
| LQ | Liqwid LQ |
| WMT | World Mobile |
| AGIX | SingularityNET |
| IAG | IAGON |
| NIGHT | NIGHT token |
| SHEN | Djed SHEN |
| DAI | Wrapped DAI |
| EURC | Euro Coin |
| ERG | Ergo ERG |
| COPI | Cornucopias |
| POL | Polygon |
| PYUSD | PayPal USD |
| USDT | Tether |
| USDCx | USDC variant |

---

## Component Roles

| Component | Purpose |
|-----------|---------|
| **QToken** | Minting policy for supplier tokens (mint on supply, burn on redeem) |
| **Action** | Validator + token for supply/redeem operations |
| **MarketState** | Read-only state (qTokenRate, supply totals) |
| **MarketParams** | Protocol parameters (interest model, thresholds) |
| **Batch** | Periodic state aggregation |
| **Loan** | Borrow position management |
| **Liquidation** | Unhealthy loan liquidation |
| **DividendsIncome** | Fee distribution |
| **TreasuryIncome** | Protocol treasury |

---

## Usage Example

```typescript
// For any market, use the same pattern:
const getMarketContracts = (market: string) => {
  // Fetch from registry or use hardcoded values
  return {
    qTokenPolicy: MARKETS[market].qToken,
    actionValidator: MARKETS[market].action.validator,
    actionToken: MARKETS[market].action.token,
    marketStateToken: MARKETS[market].marketState.token,
    marketParamsToken: MARKETS[market].marketParams,
  };
};

// Then use the same supply/redeem flow for any market
const contracts = getMarketContracts("USDC");
const marketStateUtxo = await findUtxoByToken(contracts.marketStateToken);
// ... same logic as Ada market
```
