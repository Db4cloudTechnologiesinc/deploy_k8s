import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { getUserModel } from '../models/User.js';
import Company from '../models/Company.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const findAllHRUsers = async () => {
  try {
    console.log('🔍 Finding all HR users across all companies...\n');
    
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to database\n');

    const companies = await Company.find({});
    console.log(`📊 Found ${companies.length} companies\n`);

    for (const company of companies) {
      try {
        const CompanyUser = await getUserModel(company.companyCode);
        const hrUsers = await CompanyUser.find({ role: 'hr' });
        
        if (hrUsers.length > 0) {
          console.log(`\n🏢 Company: ${company.companyName || 'N/A'} (${company.companyCode})`);
          hrUsers.forEach(user => {
            console.log(`   📧 ${user.email}`);
            console.log(`      Role: ${user.role}`);
            console.log(`      Permissions: ${user.permissions.join(', ')}`);
            console.log(`      Has manage_company_settings? ${user.permissions.includes('manage_company_settings') ? '✅ YES' : '❌ NO'}`);
          });
        }
      } catch (error) {
        console.error(`   ❌ Error processing ${company.companyCode}:`, error.message);
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

findAllHRUsers();
