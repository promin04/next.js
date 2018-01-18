import path from 'path'
import glob from 'glob-promise'

const nextPagesDir = path.join(__dirname, '..', '..', '..', 'pages')

export async function getPages (dir, {dev, isServer}) {
  const pageFiles = await getPagePaths(dir, {dev, isServer})

  return getPageEntries(pageFiles, {dir, isServer})
}

async function getPagePaths (dir, {dev, isServer}) {
  let pages

  if (dev) {
    pages = await glob(isServer ? 'pages/+(_document|_error).+(js|jsx|ts|tsx)' : 'pages/_error.+(js|jsx|ts|tsx)', { cwd: dir })
  } else {
    pages = await glob(isServer ? 'pages/**/*.+(js|jsx|ts|tsx)' : 'pages/**/!(_document)*.+(js|jsx|ts|tsx)', { cwd: dir })
  }

  return pages
}

// Convert page path into single entry
export function entry ({isServer}) {
  return function createEntry (filePath, name) {
    const parsedPath = path.parse(filePath)
    let entryName = name || filePath

    // This makes sure we compile `pages/blog/index.js` to `pages/blog.js`.
    // Excludes `pages/index.js` from this rule since we do want `/` to route to `pages/index.js`
    if (parsedPath.dir !== 'pages' && parsedPath.name === 'index') {
      entryName = `${parsedPath.dir}.js`
    }

    // Makes sure supported extensions are stripped off. The outputted file should always be `.js`
    entryName = entryName.replace(/\.+(jsx|tsx|ts)/, '.js')

    const bundlesDir = isServer ? '' : 'bundles'
    return {
      name: path.join(bundlesDir, entryName),
      file: parsedPath.root ? filePath : `./${filePath}`
    }
  }
}

// Convert page paths into entries
export function getPageEntries (pagePaths, {dir, isServer}) {
  const entries = {}

  const createEntry = entry({isServer})

  for (const filePath of pagePaths) {
    const entry = createEntry(filePath)
    entries[entry.name] = entry.file
  }

  const errorPagePath = path.join(nextPagesDir, '_error.js')
  const errorPageEntry = createEntry(errorPagePath, 'pages/_error.js') // default error.js
  if (!entries[errorPageEntry.name]) {
    entries[errorPageEntry.name] = errorPageEntry.file
  }

  if (isServer) {
    const documentPagePath = path.join(nextPagesDir, '_document.js')
    const documentPageEntry = createEntry(documentPagePath, 'pages/_document.js')
    if (!entries[documentPageEntry.name]) {
      entries[documentPageEntry.name] = documentPageEntry.file
    }
  }

  console.log(entries)

  return entries
}
