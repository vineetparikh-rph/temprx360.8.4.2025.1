const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('Starting to seed database with Georgies pharmacies...')

  // Create Georgies Parlin Pharmacy
  const parlinPharmacy = await prisma.pharmacy.create({
    data: {
      code: 'Parlin',
      name: 'Georgies Parlin Pharmacy',
      email: 'parlin@georgiesrx.com',
      faxNumber: '407-641-8434',
      licenseNumber: '28RS00747800',
      deaNumber: 'FP5862772',
      npiNumber: '1942661004',
      ncpdpNumber: '3151482',
      ownerName: 'Parlin Pharmacy Inc',
      // Note: Add address field to your schema if needed
      // address: '499 Ernston Road, Parlin, NJ 08859-1406'
    }
  })

  // Create Georgies Specialty Pharmacy
  const specialtyPharmacy = await prisma.pharmacy.create({
    data: {
      code: 'Specialty',
      name: 'Georgies Specialty Pharmacy',
      email: 'specialty@georgiesrx.com',
      faxNumber: '908-345-5030',
      licenseNumber: '28RS00770200',
      deaNumber: 'FS8218338',
      npiNumber: '1831657360',
      ncpdpNumber: '3155973',
      ownerName: 'Georgies Wood Avenue Inc.',
      // address: '521 N Wood Avenue, Linden, NJ 07036-4146'
    }
  })

  // Create Georgies Family Pharmacy
  const familyPharmacy = await prisma.pharmacy.create({
    data: {
      code: 'Family',
      name: 'Georgies Family Pharmacy',
      email: 'family@georgiesrx.com',
      faxNumber: '908-925-8090',
      licenseNumber: '28RS00714300',
      deaNumber: 'FS2846561',
      npiNumber: '1972883734',
      ncpdpNumber: '3198098',
      ownerName: 'St. George Healthcare Inc.',
      // address: '332 W. St. Georges Avenue, Linden, NJ 07036-5638'
    }
  })

  // Create Georgies Outpatient Pharmacy
  const outpatientPharmacy = await prisma.pharmacy.create({
    data: {
      code: 'Outpatient',
      name: 'Georgies Outpatient Pharmacy',
      email: 'outpatient@georgiesrx.com',
      faxNumber: '609-726-5810',
      licenseNumber: '28RS00771600',
      deaNumber: 'FG8342507',
      npiNumber: '1891359923',
      ncpdpNumber: '3156177',
      ownerName: 'Georgies Browns Mills Inc.',
      // address: '6 Earlin Drive, Suite 130, Browns Mills, NJ 08015-1768'
    }
  })

  // Create a default admin user
  const hashedPassword = await bcrypt.hash('admin123', 10)
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@georgiesrx.com',
      name: 'Admin User',
      hashedPassword: hashedPassword,
      role: 'admin'
    }
  })

  // Link admin user to all pharmacies
  await prisma.userPharmacy.createMany({
    data: [
      { userId: adminUser.id, pharmacyId: parlinPharmacy.id },
      { userId: adminUser.id, pharmacyId: specialtyPharmacy.id },
      { userId: adminUser.id, pharmacyId: familyPharmacy.id },
      { userId: adminUser.id, pharmacyId: outpatientPharmacy.id }
    ]
  })

  // Gateways and sensors will be populated from SensorPush API

  console.log('✅ Successfully seeded database with:')
  console.log('   - 4 Georgies pharmacies')
  console.log('     • Parlin Pharmacy (ID: ' + parlinPharmacy.id + ')')
  console.log('     • Specialty Pharmacy (ID: ' + specialtyPharmacy.id + ')')
  console.log('     • Family Pharmacy (ID: ' + familyPharmacy.id + ')')
  console.log('     • Outpatient Pharmacy (ID: ' + outpatientPharmacy.id + ')')
  console.log('   - 1 admin user (admin@georgiesrx.com / admin123)')
  console.log('   - Gateways and sensors will be populated from SensorPush API')
  console.log('')
  console.log('Login credentials:')
  console.log('   Email: admin@georgiesrx.com')
  console.log('   Password: admin123')
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })