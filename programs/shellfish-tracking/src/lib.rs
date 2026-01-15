// Solana Smart Contract for Shellfish Tracking
// SPDX-License-Identifier: MIT
use anchor_lang::prelude::*;

declare_id!("9R7cojRLBMXbM4np25sFuL6R65F3XY8SARZkTxrNS4gh");

#[program]
pub mod shellfish_tracking {
    use super::*;

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
        let counter = &mut ctx.accounts.counter;
        
        batch.batch_id = counter.count;
        batch.species = species;
        batch.harvester = harvester;
        batch.harvest_location = location;
        batch.harvest_time = Clock::get()?.unix_timestamp;
        batch.processing_details = String::from("");
        batch.distribution_details = String::from("");
        batch.is_processed = false;
        batch.is_distributed = false;
        batch.authority = ctx.accounts.user.key();
        
        counter.count += 1;
        
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
    #[account(
        init,
        payer = user,
        space = 8 + 8, // discriminator + u64
        seeds = [b"counter"],
        bump
    )]
    pub counter: Account<'info, Counter>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct HarvestShellfish<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + // discriminator
                8 + // batch_id
                4 + 50 + // species (max 50 chars)
                4 + 50 + // harvester (max 50 chars)
                4 + 100 + // harvest_location (max 100 chars)
                8 + // harvest_time
                4 + 200 + // processing_details (max 200 chars)
                4 + 200 + // distribution_details (max 200 chars)
                1 + // is_processed
                1 + // is_distributed
                32 // authority (Pubkey)
    )]
    pub batch: Account<'info, ShellfishBatch>,
    
    #[account(
        mut,
        seeds = [b"counter"],
        bump
    )]
    pub counter: Account<'info, Counter>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ProcessShellfish<'info> {
    #[account(
        mut,
        has_one = authority
    )]
    pub batch: Account<'info, ShellfishBatch>,
    
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct DistributeShellfish<'info> {
    #[account(
        mut,
        has_one = authority
    )]
    pub batch: Account<'info, ShellfishBatch>,
    
    pub authority: Signer<'info>,
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
    pub authority: Pubkey, // Who can modify this batch
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