const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  await prisma.user.create({
    data: {
      email: 'admin@iconmod.com',
      name: 'Iconmoad Admin',
      pwd: 'a123456',
    },
  })
  console.log('initial user `admin@iconmod.com` `a123456`')
}
main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
