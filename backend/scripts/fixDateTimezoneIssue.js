import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Company from '../models/Company.js';
import createCompanyModel from '../models/modelFactory.js';
import { onboardingFormSchema } from '../models/employeeRegisterModel.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const fixDateTimezoneIssue = async () => {
  try {
    console.log('🔄 Starting date timezone fix migration...');
    console.log('📋 This will add +1 day to dates affected by timezone conversion\n');
    
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to main database\n');

    const companies = await Company.find({});
    console.log(`📊 Found ${companies.length} companies\n`);

    let totalEmployees = 0;
    let totalUpdated = 0;

    for (const company of companies) {
      try {
        console.log(`\n🏢 Processing company: ${company.companyName || 'N/A'} (${company.companyCode})`);
        
        const Employee = await createCompanyModel(
          company.companyCode,
          'OnboardingForm',
          onboardingFormSchema
        );
        
        const employees = await Employee.find({});
        console.log(`   Found ${employees.length} employee(s) in OnboardingForm collection`);
        totalEmployees += employees.length;

        for (const employee of employees) {
          let updated = false;
          const updates = [];

          // Fix DOB (personalInfo.dob)
          if (employee.personalInfo?.dob) {
            const originalDob = new Date(employee.personalInfo.dob);
            if (!isNaN(originalDob.getTime())) {
              const fixedDob = new Date(originalDob);
              fixedDob.setDate(fixedDob.getDate() + 1);
              employee.personalInfo.dob = fixedDob;
              updated = true;
              updates.push(`DOB: ${originalDob.toISOString().slice(0, 10)} → ${fixedDob.toISOString().slice(0, 10)}`);
            }
          }

          // Fix Date of Appointment (joiningDetails.dateOfAppointment)
          if (employee.joiningDetails?.dateOfAppointment) {
            const originalDate = new Date(employee.joiningDetails.dateOfAppointment);
            if (!isNaN(originalDate.getTime())) {
              const fixedDate = new Date(originalDate);
              fixedDate.setDate(fixedDate.getDate() + 1);
              employee.joiningDetails.dateOfAppointment = fixedDate;
              updated = true;
              updates.push(`Appointment: ${originalDate.toISOString().slice(0, 10)} → ${fixedDate.toISOString().slice(0, 10)}`);
            }
          }

          // Fix Date of Joining (joiningDetails.dateOfJoining)
          if (employee.joiningDetails?.dateOfJoining) {
            const originalDate = new Date(employee.joiningDetails.dateOfJoining);
            if (!isNaN(originalDate.getTime())) {
              const fixedDate = new Date(originalDate);
              fixedDate.setDate(fixedDate.getDate() + 1);
              employee.joiningDetails.dateOfJoining = fixedDate;
              updated = true;
              updates.push(`Joining: ${originalDate.toISOString().slice(0, 10)} → ${fixedDate.toISOString().slice(0, 10)}`);
            }
          }

          // Fix Family Details dates
          if (employee.familyDetails && Array.isArray(employee.familyDetails)) {
            employee.familyDetails.forEach((member, index) => {
              if (member.dob) {
                const originalDate = new Date(member.dob);
                if (!isNaN(originalDate.getTime())) {
                  const fixedDate = new Date(originalDate);
                  fixedDate.setDate(fixedDate.getDate() + 1);
                  employee.familyDetails[index].dob = fixedDate;
                  updated = true;
                  updates.push(`Family[${index}] DOB: ${originalDate.toISOString().slice(0, 10)} → ${fixedDate.toISOString().slice(0, 10)}`);
                }
              }
            });
          }

          // Fix Service History dates
          if (employee.serviceHistory && Array.isArray(employee.serviceHistory)) {
            employee.serviceHistory.forEach((service, index) => {
              let serviceUpdated = false;
              
              if (service.fromDate) {
                const originalDate = new Date(service.fromDate);
                if (!isNaN(originalDate.getTime())) {
                  const fixedDate = new Date(originalDate);
                  fixedDate.setDate(fixedDate.getDate() + 1);
                  employee.serviceHistory[index].fromDate = fixedDate;
                  serviceUpdated = true;
                  updates.push(`Service[${index}] From: ${originalDate.toISOString().slice(0, 10)} → ${fixedDate.toISOString().slice(0, 10)}`);
                }
              }
              
              if (service.toDate) {
                const originalDate = new Date(service.toDate);
                if (!isNaN(originalDate.getTime())) {
                  const fixedDate = new Date(originalDate);
                  fixedDate.setDate(fixedDate.getDate() + 1);
                  employee.serviceHistory[index].toDate = fixedDate;
                  serviceUpdated = true;
                  updates.push(`Service[${index}] To: ${originalDate.toISOString().slice(0, 10)} → ${fixedDate.toISOString().slice(0, 10)}`);
                }
              }
              
              if (serviceUpdated) updated = true;
            });
          }

          if (updated) {
            await employee.save();
            totalUpdated++;
            console.log(`   ✅ Updated ${employee.Emp_ID || 'Unknown'}: ${updates.join(', ')}`);
          }
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
    console.log(`   - Total employees updated: ${totalUpdated}`);
    console.log(`${'='.repeat(70)}\n`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing date timezone issue:', error);
    process.exit(1);
  }
};

fixDateTimezoneIssue();
