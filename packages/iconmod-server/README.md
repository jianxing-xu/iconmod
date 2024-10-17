# Iconmod Api

### Quick Start By Docker

cli: `docker` `docker-compose`

```bash
# tow ways to start
npm run docker:restart

# or
npm run docker:build
npm run docker:start
```

### Start without Docker

```bash
npm run build
npm run start
```

### Docker data volume map dir

path: `docker-compose.yml`

```yml
services:
  iconmod-server:
    ports:
      - '3131:3131'
    image: iconmod-server:latest
    # you can modify the path to other directory in the system
    # e.g: /home/custom/data_volume:/app/data_volume
    volumes:
      - /home/ubuntu/dockers/iconmod-server/data_volume:/app/data_volume
```

## Key config

### Custom Icons

path: `/src/config/app.ts`

```ts
const dataVolumeDir = path.resolve('data_volume')
export const appConfig: AppConfig = {
  // ...other config

  // custom icons, save some projects of created
  // Can be modified to other directory in the system
  // This directory is not tracked by git
  customIconDir: path.join(dataVolumeDir, 'icons'),
}
```

### Seeding User

path: `/prisma/seed.cjs`

Initial default users, you can modify it.

```ts
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
```
