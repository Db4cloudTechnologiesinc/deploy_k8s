import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Company from '../models/Company.js';
import createCompanyModel from '../models/modelFactory.js';
import { leaveBalanceSchema } from '../models/LeaveBalance.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const updateLeaveBalances = async () => {
  try {
    console.log('🔄 Starting leave balance update...');
    console.log('📋 Target: Casual Leave = 12, Sick Leave = 4\n');
    
    // Connect to main database
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to main database\n');

    // Get all companies
    const companies = await Company.find({});
    console.log(`📊 Found ${companies.length} companies\n`);

    let totalUpdated = 0;
    let totalEmployees = 0;

    // Update leave balances in each company database
    for (const company of companies) {
      try {
        console.log(`\n🏢 Processing company: ${company.companyName || 'N/A'} (${company.companyCode})`);
        
        // Get the LeaveBalance model for this company
        const LeaveBalance = await createCompanyModel(
          company.companyCode, 
          'LeaveBalance', 
          leaveBalanceSchema
        );
        
        // Find all leave balance records
        const leaveBalances = await LeaveBalance.find({});
        console.log(`   Found ${leaveBalances.length} employee leave balance record(s)`);
        totalEmployees += leaveBalances.length;

        for (const balance of leaveBalances) {
          let updated = false;
          let updates = [];

          // Update Casual Leave to 12 if different
          if (balance.casual.total !== 12) {
            const oldTotal = balance.casual.total;
            balance.casual.total = 12;
            updated = true;
            updates.push(`Casual: ${oldTotal} → 12`);
          }

          // Update Sick Leave to 4 if different
          if (balance.sick.total !== 4) {
            const oldTotal = balance.sick.total;
            
            // If sick leave used is more than 4, we need to adjust
            if (balance.sick.used > 4) {
              console.log(`   ⚠️  Employee ${balance.employeeCode} has used ${balance.sick.used} sick leaves (more than new limit of 4)`);
              // Keep the used amount but set total to match used (preventing negative available)
              balance.sick.total = balance.sick.used;
              updates.push(`Sick: ${oldTotal} → ${balance.sick.used} (adjusted to match used)`);
            } else {
              balance.sick.total = 4;
              updates.push(`Sick: ${oldTotal} → 4`);
            }
            updated = true;
          }

          if (updated) {
            await balance.save();
            totalUpdated++;
            console.log(`   ✅ Updated ${balance.employeeCode}: ${updates.join(', ')}`);
          } else {
            console.log(`   ✓ ${balance.employeeCode} already has correct balances`);
          }
        }

        // Also update the company's leave policy settings
        if (company.settings?.leavePolicy) {
          let policyUpdated = false;
          
          if (company.settings.leavePolicy.casualLeavePerYear !== 12) {
            company.settings.leavePolicy.casualLeavePerYear = 12;
            policyUpdated = true;
          }
          
          if (company.settings.leavePolicy.sickLeavePerYear !== 4) {
            company.settings.leavePolicy.sickLeavePerYear = 4;
            policyUpdated = true;
          }

          if (policyUpdated) {
            await company.save();
            console.log(`   ✅ Updated company leave policy`);
          }
        }

      } catch (companyError) {
        console.error(`   ❌ Error processing company ${company.companyCode}:`, companyError.message);
      }
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log(`✅ Migration complete!`);
    console.log(`📊 Summary:`);
    console.log(`   - Total companies processed: ${companies.length}`);
    console.log(`   - Total employees found: ${totalEmployees}`);
    console.log(`   - Total leave balances updated: ${totalUpdated}`);
    console.log(`   - Casual Leave: 12`);
    console.log(`   - Sick Leave: 4`);
    console.log(`${'='.repeat(60)}\n`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating leave balances:', error);
    process.exit(1);
  }
};

updateLeaveBalances();
