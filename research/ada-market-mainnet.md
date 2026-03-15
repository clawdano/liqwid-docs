# ADA Market - Mainnet Script Info

## Key Components for Supply/Withdraw

### QToken Minting Policy
- **Policy ID**: `a04ce7a52545e5e33c2867e148898d9e667a69602285f6a1298f9d68`
- **Purpose**: Mints/burns qADA tokens
- **Token Name**: (empty string - just the policy ID)

### Action Validators (Supply/Withdraw UTxOs)
| Script Hash | Reference UTxO |
|-------------|----------------|
| `31415bb210164cf6b84d1b12537f0792d2912d156e0f1ed1d91c83ce` | `8078e3eef9f6939b716bdf476ab6a49a96943bc6586ac9e3bf72ed28c6c508cd#0` |
| `0faa4f20b9d810205f89b42896e693ffc89c3ee4e307f4f0a4893e13` | `e18e160b140421f33e552256ad257d1990ae7c09281d8ae5fbd195f5b91794ed#4` |
| `7dd5bab2fa79f087d1ea2f5bf58a9a5dfc3b09061032ec3cc372566e` | `f656cbb687886ffcb9e7ba5ec8b68fd25f49dbfbb7be7dbcefc17729ba4f7bd9#0` |
| `800ca266a8f29a834dc8c4a9bc507cb3d9f4cd078934ddcc8ff97823` | `a18baff306e727e3e5b186864875da2933806bc91cf36da876d7fba20eaab254#0` |
| `3ffeeefc63489a728d3b126c59d537d8ddcb56a1116704aaa3b8a90c` | `bc858f88c7ce00cbc6f83f0f988c766f8ace1d1452340fb63c4e806850dc2220#0` |

### MarketState
- **Validator**: `8d258b9d08dcab73f3165a11751d464b46056264091c1789da588726`
- **Token Policy**: `5a3cb4f52fb3a00ab5abe62080618623811ccafab9c760d0b686e44c`
- **Contains**: qTokenRate (exchange rate), supply, qTokens, interest, etc.

### MarketParams
- **Token Policy**: `24f51a8308b4e47b9d1438ec1e91da4ee063c38c704b530cba4adc5b`
- **Contains**: Initial qToken rate, interest model, thresholds, etc.

### Batch
- **Validator**: `a3e56ea9d2db008038ce6fb32e500faef1523dcb042e5a637d633fc8`
- **Token Policy**: `15706915432bf92ea3585aa468b507b90e427dc4effeae31ee5cf40e`

## Transaction Flow

### Supply (Deposit ADA → Receive qADA)
1. Find available Action UTxO
2. Read current MarketState (get qTokenRate)
3. Build TX:
   - Input: User's ADA
   - Input: Action UTxO (script input with redeemer)
   - Mint: qADA tokens (amount = ADA / qTokenRate)
   - Output: Updated Action UTxO
   - Output: qADA to user
4. Submit & wait for batch processing

### Withdraw (Burn qADA → Receive ADA)
1. Find available Action UTxO  
2. Read current MarketState (get qTokenRate)
3. Build TX:
   - Input: User's qADA
   - Input: Action UTxO
   - Burn: qADA tokens
   - Mint: Negative qADA (burn)
   - Output: ADA to user (amount = qADA * qTokenRate)
   - Output: Updated Action UTxO
4. Submit & wait for batch processing
