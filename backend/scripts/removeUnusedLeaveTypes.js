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

const removeUnusedLeaveTypes = async () => {
  try {
    console.log('🔄 Removing unused leave types from employee balances...');
    console.log('📋 Keeping only: Casual Leave (12) and Sick Leave (4)\n');
    
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to main database\n');

    const companies = await Company.find({});
    console.log(`📊 Found ${companies.length} companies\n`);

    let totalUpdated = 0;
    let totalEmployees = 0;

    for (const company of companies) {
      try {
        console.log(`\n🏢 Processing company: ${company.companyName || 'N/A'} (${company.companyCode})`);
        
        const LeaveBalance = await createCompanyModel(
          company.companyCode,
          'LeaveBalance',
          leaveBalanceSchema
        );
        
        const balances = await LeaveBalance.find({});
        console.log(`   Found ${balances.length} employee leave balance(s)`);
        totalEmployees += balances.length;

        for (const balance of balances) {
          // Remove all leave types except casual and sick
          balance.annual = undefined;
          balance.personal = undefined;
          balance.maternity = undefined;
          balance.paternity = undefined;
          balance.earned = undefined;
          balance.lastAccrualDate = undefined;
          
          // Ensure casual and sick are properly set
          if (!balance.casual) {
            balance.casual = { total: 12, used: 0, pending: 0 };
          }
          if (!balance.sick) {
            balance.sick = { total: 4, used: 0, pending: 0 };
          }
          
          await balance.save();
          totalUpdated++;
          console.log(`   ✅ Updated ${balance.employeeCode} - Kept only Casual (${balance.casual.total}) and Sick (${balance.sick.total})`);
        }

      } catch (companyError) {
        console.error(`   ❌ Error processing company ${company.companyCode}:`, companyError.message);
      }
    }

    console.log(`\n${'='.repeat(70)}`);
    console.log(`✅ Migration complete!`);
    console.log(`📊 Summary:`);
    console.log(`   - Total companies processed: ${companies.length}`);
    console.log(`   - Total employees found: ${totalEmployees}`);
    console.log(`   - Total leave balances updated: ${totalUpdated}`);
    console.log(`   - Remaining leave types: Casual (12), Sick (4)`);
    console.log(`   - Removed: Annual, Personal, Maternity, Paternity, Earned`);
    console.log(`${'='.repeat(70)}\n`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

removeUnusedLeaveTypes();
