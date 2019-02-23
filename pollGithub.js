const axios = require('axios')

async function loadAll () {
  let page = 1
  let data = []
  while (true) {
    const response = await axios.get(`https://api.github.com/repos/quasarframework/quasar-framework.org/commits?path=themes/quasar/scripts/page-helpers.js&page=${page}`)
    if (response.data.length === 0 || page > 10) { // 10 to prevent crazy downloads
      break
    }
    page++
    data.push(...response.data)
  }
  return data
}

const fs = require('fs')

fs.writeFileSync('helper-commits.json', JSON.stringify(loadAll()))
