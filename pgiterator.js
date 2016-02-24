const Cursor = require('pg-cursor')
const AbstractIterator = require('abstract-leveldown').AbstractIterator
const debug = require('debug')('pgdown')

const RANGE_OPS = {
  lt: '<',
  lte: '<=',
  gte: '>=',
  gt: '>',
  eq: '=',
  ne: '<>'
}

// TODO: sanitization
function formatRange (range) {
  // handle `or` clauses
  if (Array.isArray(range)) {
    return '(' + range.map(formatRange).join(') OR (') + ')'
  }

  const clauses = []
  for (var k in range) {
    const v = range[k]
    const op = RANGE_OPS[k]
    if (op && v !== undefined) {
      clauses.push(`key${op}(${v})`)
    } else if (op === 'or') {
      // TODO: just being lazy, but should fix up extra array wrapping cruft
      clauses.push(formatRange([ range[k] ]))
    }
  }

  return clauses.join(' AND ')
}

module.exports = PgIterator

function PgIterator (db, options) {
  AbstractIterator.call(this, db)

  const clauses = []

  clauses.push('SELECT key, value FROM ${db.pg.id}')

  const constraints = formatRange(options)
  if (constraints) clauses.push('WHERE ' + constraints)

  clauses.push('ORDER BY key ' + options.reverse ? 'DESC' : 'ASC')

  if (options.limit > 0) clauses.push('LIMIT ' + options.limit)

  // TODO: any reason not to do this?
  // if (options.offset > 0) clauses.push('OFFSET ' + options.offset)

  const sql = clauses.join(' ')
  debug('iterator query:', sql)

  // iterator
  this.pg = {}
  this.pg.cursor = db.pg.client.query(Cursor(sql))
}

PgIterator.prototype._next = function (cb) {
  // TODO: read in batches, up to some reasonable limit, and cache
  this.pg.cursor.read(1, (err, rows) => {
    if (err || !rows.length) return cb(err)

    const row = rows[0] || {}
    cb(null, row.key, row.value)
  })
}

PgIterator.prototype._end = function (cb) {
  this.pg.cursor.close(cb)
}