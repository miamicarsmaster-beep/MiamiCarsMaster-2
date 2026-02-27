#!/usr/bin/env node

/**
 * Script to apply the financial_records RLS fix migration to Supabase
 * This script reads the migration file and executes it using the Supabase service role
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Error: Missing Supabase credentials in .env.local');
    process.exit(1);
}

// Create Supabase client with service role
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function applyMigration() {
    console.log('🚀 Starting migration: 20260210_fix_financial_records_rls.sql\n');

    try {
        // Read the migration file
        const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20260210_fix_financial_records_rls.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

        console.log('📄 Migration content:');
        console.log('─'.repeat(80));
        console.log(migrationSQL);
        console.log('─'.repeat(80));
        console.log('');

        // Execute the migration
        console.log('⚙️  Executing migration...');
        const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });

        if (error) {
            // If exec_sql doesn't exist, try direct execution (this won't work for DDL but let's try)
            console.log('⚠️  exec_sql RPC not found, trying alternative method...');

            // Split the SQL into individual statements
            const statements = migrationSQL
                .split(';')
                .map(s => s.trim())
                .filter(s => s.length > 0 && !s.startsWith('--'));

            console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

            for (let i = 0; i < statements.length; i++) {
                const statement = statements[i] + ';';
                console.log(`Executing statement ${i + 1}/${statements.length}...`);

                // Note: Supabase JS client doesn't support DDL directly
                // We need to use the SQL Editor in Supabase Dashboard or use the REST API
                console.log(statement);
                console.log('');
            }

            console.log('\n⚠️  IMPORTANT: The Supabase JS client cannot execute DDL statements directly.');
            console.log('📋 Please copy the migration SQL above and execute it in the Supabase Dashboard:');
            console.log(`   1. Go to ${supabaseUrl.replace('//', '//app.')}/project/_/sql`);
            console.log('   2. Paste the SQL from the migration file');
            console.log('   3. Click "Run"\n');

            return;
        }

        console.log('✅ Migration applied successfully!');
        console.log('');
        console.log('🎉 The financial_records RLS policies have been updated.');
        console.log('   - Admins can insert records for any vehicle');
        console.log('   - Investors can insert records for their assigned vehicles');
        console.log('');

    } catch (err) {
        console.error('❌ Error applying migration:', err);
        process.exit(1);
    }
}

applyMigration();
