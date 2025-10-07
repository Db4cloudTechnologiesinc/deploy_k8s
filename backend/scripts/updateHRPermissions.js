import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { getUserModel } from '../models/User.js';
import Company from '../models/Company.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const updateHRPermissions = async () => {
  try {
    console.log('🔄 Starting HR permissions update...');
    
    // Connect to main database
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to main database');

    // Get all companies
    const companies = await Company.find({});
    console.log(`📊 Found ${companies.length} companies`);

    let totalUpdated = 0;

    // Update HR users in each company database
    for (const company of companies) {
      try {
        console.log(`\n🏢 Processing company: ${company.companyName} (${company.companyCode})`);
        
        const CompanyUser = await getUserModel(company.companyCode);
        
        // Find all HR users
        const hrUsers = await CompanyUser.find({ role: 'hr' });
        console.log(`   Found ${hrUsers.length} HR user(s)`);

        for (const user of hrUsers) {
          // Check if user already has manage_company_settings permission
          if (user.permissions.includes('manage_company_settings')) {
            console.log(`   ✓ ${user.email} already has manage_company_settings`);
            continue;
          }

          // Add manage_company_settings permission
          user.permissions.push('manage_company_settings');
          user.$skipMiddleware = true; // Skip password hashing
          await user.save();
          
          totalUpdated++;
          console.log(`   ✅ Updated ${user.email} - added manage_company_settings permission`);
        }
      } catch (companyError) {
        console.error(`   ❌ Error processing company ${company.companyCode}:`, companyError.message);
      }
    }

    console.log(`\n✅ Migration complete! Updated ${totalUpdated} HR user(s) across all companies`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating HR permissions:', error);
    process.exit(1);
  }
};

updateHRPermissions();
