import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding assets...')

  const companies = await prisma.company.findMany({
    include: { properties: true }
  })

  if (companies.length === 0) {
    console.log('No companies found. Please run main seed first.')
    return
  }

  // Clear existing assets to make it idempotent
  await prisma.asset.deleteMany()
  console.log('Cleared existing assets.')

  const categories = [
    { name: 'HVAC Chiller Unit', category: 'HVAC', baseValue: 120000, status: 'ACTIVE' },
    { name: 'Main Power Generator', category: 'Machinery', baseValue: 85000, status: 'ACTIVE' },
    { name: 'Fire Suppression System', category: 'Safety', baseValue: 45000, status: 'ACTIVE' },
    { name: 'Office Workstations Set', category: 'Furniture', baseValue: 25000, status: 'ACTIVE' },
    { name: 'Facility Service Van', category: 'Vehicle', baseValue: 65000, status: 'UNDER_MAINTENANCE' },
    { name: 'Elevator Control Panel', category: 'Electrical', baseValue: 95000, status: 'ACTIVE' },
    { name: 'CCTV Security System', category: 'Security', baseValue: 35000, status: 'ACTIVE' },
  ]

  let count = 0
  for (const company of companies) {
    // Generate 3 to 6 random assets per company
    const numAssets = Math.floor(Math.random() * 4) + 3
    for (let i = 0; i < numAssets; i++) {
      const cat = categories[i % categories.length]!
      const property = company.properties[i % company.properties.length]

      const randomDays = Math.floor(Math.random() * 365 * 3) // up to 3 years ago
      const purchaseDate = new Date()
      purchaseDate.setDate(purchaseDate.getDate() - randomDays)

      await prisma.asset.create({
        data: {
          name: `${company.name} ${cat.name}`,
          assetCode: `AST-${company.id.substring(15, 19).toUpperCase()}-${cat.category.substring(0, 3).toUpperCase()}-${(i + 1).toString().padStart(3, '0')}`,
          category: cat.category,
          value: cat.baseValue + Math.floor(Math.random() * 15000) - 7500,
          purchaseDate,
          status: cat.status,
          companyId: company.id,
          propertyId: property ? property.id : null,
          notes: `Seeded asset for ${company.name}`
        }
      })
      count++
    }
  }

  console.log(`Successfully seeded ${count} assets.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
