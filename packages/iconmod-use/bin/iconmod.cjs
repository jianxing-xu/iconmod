const fs = require('node:fs')
const path = require('node:path')
const { argv } = require('node:process')

const target = argv[2]

function copyDirectory(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true })
    console.log(`Created directory: ${dest}`)
  }

  const items = fs.readdirSync(src)
  console.log(`Copying from ${src} to ${dest}...`)
  items.forEach((item) => {
    const srcPath = path.join(src, item)
    const destPath = path.join(dest, item)

    const stat = fs.statSync(srcPath)
    if (stat.isDirectory()) {
      copyDirectory(srcPath, destPath)
    }
    else {
      fs.copyFileSync(srcPath, destPath)
      console.log(`Copied file: ${srcPath} to ${destPath}`)
    }
  })
}

function copyTemplate(target) {
  const targetDir = path.resolve(target)
  const templateDir = path.resolve(path.join(__dirname, '../dist/template'))

  console.log(`Source template directory: ${templateDir}`)
  console.log(`Target directory: ${targetDir}`)
  copyDirectory(templateDir, targetDir)
  console.log(`Successfully copied ${templateDir} to ${targetDir}`)
}

function writeComponent() {
  const componentFile = path.resolve(path.join(__dirname, '../dist/iconmod.iife.js'))
  const targetFile = path.resolve(path.join(target, 'component.js'))

  fs.readFile(componentFile, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading file:', err)
    }
    fs.writeFile(targetFile, data, 'utf8', (err) => {
      if (err) {
        console.error('Error writing file:', err)
      }
      console.log(`Successfully wrote ${componentFile} to ${targetFile}`)
    })
  })
}

copyTemplate(target)

writeComponent()
