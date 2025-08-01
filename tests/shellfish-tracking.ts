import * as anchor from "@coral-xyz/anchor";
import { Program, web3 } from "@coral-xyz/anchor";
import { ShellfishTracking } from "../target/types/shellfish_tracking";
import { assert } from "chai";

describe("shellfish-tracking", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());
  const provider = anchor.getProvider();
  const program = anchor.workspace.ShellfishTracking as Program<ShellfishTracking>;

  it("harvest_shellfish works", async () => {
    // Generate keypairs for the batch and counter accounts.
    const batchAccount = web3.Keypair.generate();
    const counterAccount = web3.Keypair.generate();

    // Calculate the minimum balance required for rent exemption for the Counter account.
    const counterSpace = 8; // u64 takes 8 bytes
    const lamports = await provider.connection.getMinimumBalanceForRentExemption(counterSpace);

    // Create and fund the counter account manually.
    const createCounterTx = new web3.Transaction().add(
      web3.SystemProgram.createAccount({
        fromPubkey: provider.publicKey,
        newAccountPubkey: counterAccount.publicKey,
        space: counterSpace,
        lamports,
        programId: program.programId,
      })
    );
    await provider.sendAndConfirm(createCounterTx, [counterAccount]);

    // Now call the harvest_shellfish instruction.
    const tx = await program.methods
      .harvestShellfish("Oyster", "John Doe", "Gulf Coast")
      .accounts({
        batch: batchAccount.publicKey,
        counter: counterAccount.publicKey,
        user: provider.publicKey,
        systemProgram: web3.SystemProgram.programId,
      })
      .signers([batchAccount])
      .rpc();

    console.log("Transaction signature", tx);

    // Optionally, add assertions here to verify state changes (if you query the account, for example)
    assert.ok(tx);
  });
});
