// Solana Smart Contract for Shellfish Tracking
// SPDX-License-Identifier: MIT

use anchor_lang::prelude::*;
use anchor_lang::solana_program::clock::Clock; // Import Clock to get the current timestamp

// Declare the program ID at the crate root (outside of any modules)
declare_id!("9R7cojRLBMXbM4np25sFuL6R65F3XY8SARZkTxrNS4gh");

#[program]
pub mod shellfish_tracking {
    use super::*;

    // New instruction to initialize the counter account.
    pub fn initialize_counter(ctx: Context<InitializeCounter>) -> Result<()> {
        let counter = &mut ctx.accounts.counter;
        counter.count = 0;
        msg!("Counter initialized to 0");
        Ok(())
    }

    pub fn harvest_shellfish(
        ctx: Context<HarvestShellfish>, 
        species: String, 
        harvester: String, 
        location: String
    ) -> Result<()> {
        let batch = &mut ctx.accounts.batch;
        batch.batch_id = ctx.accounts.counter.count;
        batch.species = species;
        batch.harvester = harvester;
        batch.harvest_location = location;
        batch.harvest_time = Clock::get()?.unix_timestamp;
        batch.processing_details = String::from("");
        batch.distribution_details = String::from("");
        batch.is_processed = false;
        batch.is_distributed = false;
        ctx.accounts.counter.count += 1;
        msg!("Harvested shellfish batch with id: {}", batch.batch_id);
        Ok(())
    }

    pub fn process_shellfish(
        ctx: Context<ProcessShellfish>, 
        details: String
    ) -> Result<()> {
        let batch = &mut ctx.accounts.batch;
        require!(!batch.is_processed, CustomError::AlreadyProcessed);
        batch.processing_details = details;
        batch.is_processed = true;
        msg!("Processed shellfish batch with id: {}", batch.batch_id);
        Ok(())
    }

    pub fn distribute_shellfish(
        ctx: Context<DistributeShellfish>, 
        details: String
    ) -> Result<()> {
        let batch = &mut ctx.accounts.batch;
        require!(batch.is_processed, CustomError::NotProcessedYet);
        require!(!batch.is_distributed, CustomError::AlreadyDistributed);
        batch.distribution_details = details;
        batch.is_distributed = true;
        msg!("Distributed shellfish batch with id: {}", batch.batch_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeCounter<'info> {
    // Initialize the counter account with 16 bytes (8 for discriminator + 8 for u64)
    #[account(init, payer = user, space = 16)]
    pub counter: Account<'info, Counter>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct HarvestShellfish<'info> {
    #[account(init, payer = user, space = 400)]
    pub batch: Account<'info, ShellfishBatch>,
    #[account(mut)]
    pub counter: Account<'info, Counter>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ProcessShellfish<'info> {
    #[account(mut)]
    pub batch: Account<'info, ShellfishBatch>,
}

#[derive(Accounts)]
pub struct DistributeShellfish<'info> {
    #[account(mut)]
    pub batch: Account<'info, ShellfishBatch>,
}

#[account]
pub struct ShellfishBatch {
    pub batch_id: u64,
    pub species: String,
    pub harvester: String,
    pub harvest_location: String,
    pub harvest_time: i64,
    pub processing_details: String,
    pub distribution_details: String,
    pub is_processed: bool,
    pub is_distributed: bool,
}

#[account]
pub struct Counter {
    pub count: u64,
}

#[error_code]
pub enum CustomError {
    #[msg("Shellfish batch has already been processed.")]
    AlreadyProcessed,
    #[msg("Shellfish batch has already been distributed.")]
    AlreadyDistributed,
    #[msg("Shellfish batch has not been processed yet.")]
    NotProcessedYet,
}
