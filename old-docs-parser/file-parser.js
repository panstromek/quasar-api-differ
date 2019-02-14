module.exports = {
  /**
   *
   * Returns array of objects with table rows and additional information
   * (Headers appearing before each table, file, and filename)
   *
   * @param file
   * @param filename
   * @return {{headers: Array, file: *, filename: *, rows: Array}[]}
   */
  intoTableMetaObjects (file, filename) {
    const tables = [{
      headers: [],
      rows: [],
      file,
      filename
    }]

    file
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.startsWith('#') || line.startsWith('|'))
      .forEach(line => {
        if (line.startsWith('#')) {
          if (tables[0].rows.length) {
            tables.unshift({
              headers: [line],
              rows: [],
              file,
              filename
            })
          } else {
            tables[0].headers.push(line)
          }
        } else if (line.startsWith('|')) {
          tables[0].rows.push(line)
        }
      })
    return tables.filter(table => table.rows.length > 0)
  }

}
