const fs = require('fs')

const mdPath = 'node_modules/quasar-old-docs/source/components'
let oldFileNames = fs.readdirSync(mdPath)

const oldTags = require('./old/quasar-tags')

const foundTags = []
let missingTags = []


console.log()
const multipleCandidates = []

function getCandidates (baseFilename) {
  return oldFileNames.filter(
    file => {
      return file.includes(baseFilename) || baseFilename.includes(file.substring(0, file.length - 3))
    })
}

Object.entries(oldTags)
  .forEach(([tag]) => {
    let baseFilename = (tag.startsWith('q-') ? tag.substring(2) : tag)
      .replace(/btn/g, 'button')
    let filename = baseFilename + '.md'

    if (fs.existsSync(`${mdPath}/${filename}`)) {
      foundTags.push({ tag, filename })
      return
    }

    const candidates = getCandidates(baseFilename)

    if (candidates.length === 1) {
      filename = candidates[0]
      foundTags.push({ tag, filename })
      return
    } else if (candidates.length > 1) {
      multipleCandidates.push({ tag, candidates })
      return
    }

    missingTags.push(tag)
  })

multipleCandidates.forEach((t) => {
  const { tag, candidates } = t
  const notTakenCandidates = candidates.filter(
    candidate => !foundTags.some(tag => tag.filename === candidate))
  if (notTakenCandidates.length === 1) {
    foundTags.push({ tag, filename: notTakenCandidates[0], candidates })
  } else if (notTakenCandidates.length > 1) {
    console.log(`Candidates for ${tag}: ${notTakenCandidates}`)
    t.notTakenCandidates = notTakenCandidates
    missingTags.push(tag)
  }
})

missingTags = missingTags.map(tag => {
  const split = tag.substring(2).split('-')
  const candidates = split.map(part => getCandidates(part)).flat(1)
  return {
    tag, candidates
  }
}).filter(({ tag, candidates }) => {
  if (candidates.length === 1) {
    foundTags.push({ tag, filename: candidates[0] })
    return false
  }
  return true
})

console.log()
console.log(`missing tags ${missingTags.map(({ tag, candidates }) => `${tag}[${candidates.length}]`).slice(0, 10)}...`)
console.log()
console.log('found: ' + foundTags.length)
console.log('missing: ' + missingTags.length)
