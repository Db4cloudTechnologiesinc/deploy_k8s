import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { getUserModel } from '../models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const checkUserPermissions = async () => {
  try {
    console.log('🔍 Checking user permissions...\n');
    
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to database\n');

    // Check for the HR user vishal.bhukya@db4cloud.in
    const email = 'vishal.bhukya@db4cloud.in';
    const companyCode = 'DB4CLOUD';
    
    console.log(`Checking user: ${email} in company: ${companyCode}\n`);
    
    const CompanyUser = await getUserModel(companyCode);
    const user = await CompanyUser.findOne({ email: email.toLowerCase() });
    
    if (user) {
      console.log('✅ User found:');
      console.log('   Email:', user.email);
      console.log('   Role:', user.role);
      console.log('   Permissions:', user.permissions);
      console.log('   Has manage_company_settings?', user.permissions.includes('manage_company_settings'));
    } else {
      console.log('❌ User not found');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

checkUserPermissions();
