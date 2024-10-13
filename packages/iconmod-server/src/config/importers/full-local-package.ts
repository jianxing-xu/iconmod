import type { RemoteDownloaderOptions } from '../../types/downloaders/remote.js'
import type { Importer } from '../../types/importers.js'
import type { ImportedData } from '../../types/importers/common.js'
import { createRequire } from 'node:module'
import { dirname } from 'node:path'
import { DirectoryDownloader } from '../../downloaders/directory.js'
import { RemoteDownloader } from '../../downloaders/remote.js'
import { createIconSetsPackageImporter } from '../../importers/full/json.js'

/**
 * Create importer for package
 */
export function createPackageIconSetImporter(
  packageName = '@iconify/json',
  useRemoteFallback = false,
  autoUpdateRemotePackage = false,
): Importer {
  // Try to locate package
  let dir: string | undefined
  try {
    const req = createRequire(import.meta.url)
    const filename = req.resolve(`${packageName}/package.json`)
    dir = filename ? dirname(filename) : undefined
  }
  catch (err) {
    console.log('createpackageIconSetImporter: ', err)
  }
  if (dir) {
    return createIconSetsPackageImporter(new DirectoryDownloader<ImportedData>(dir), {})
  }
  if (!useRemoteFallback) {
    throw new Error(`Cannot find package "${packageName}"`)
  }

  // Try to download it, update if
  const npm: RemoteDownloaderOptions = {
    downloadType: 'npm',
    package: packageName,
  }
  return createIconSetsPackageImporter(new RemoteDownloader<ImportedData>(npm, autoUpdateRemotePackage))
}
