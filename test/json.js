const after = require('after')
const levelup = require('levelup')
const test = require('tape')
const PgDOWN = require('../')
const util = require('./util')

function pgupJSON (location, options) {
  if (typeof location !== 'string') {
    options = location
    location = null
  }

  options = options || {}
  options.db = PgDOWN
  options.keyEncoding = 'utf8'
  options.valueEncoding = 'json'

  return levelup(location, options)
}

test('crud', (t) => {
  const db = pgupJSON(util.location())

  t.test('initialize', (t) => {
    db.open((err) => {
      if (err) return t.end(err)

      db.db._drop((err) => {
        if (err) return t.end(err)
        db.close(t.end)
      })
    })
  })

  t.test('open', (t) => {
    db.open(t.end)
  })

  t.test('put', (t) => {
    db.put('a', { str: 'foo', int: 123 }, function (err, result) {
      if (err) return t.end(err)
      t.ok(result == null, 'empty response')
      t.end()
    })
  })

  t.test('get', (t) => {
    db.get('a', function (err, result) {
      if (err) return t.end(err)
      t.deepEqual(result, { str: 'foo', int: 123 })
      t.end()
    })
  })

  t.test('del', (t) => {
    db.del('a', function (err, result) {
      if (err) return t.end(err)
      db.get('a', function (err, result) {
        t.ok(err && err.notFound, 'not found')
        t.ok(result == null, 'empty response')
        t.end()
      })
    })
  })

  const batch = [
    {
      type: 'put',
      key: 'aa',
      value: { k: 'aa' }
    },
    {
      type: 'put',
      key: 'ac',
      value: { k: 'ac' }
    },
    {
      type: 'put',
      key: 'ab',
      value: { k: 'ab' }
    }
  ]

  const sorted = batch.slice().sort((a, b) => a.key < b.key ? -1 : (a.key > b.key ? 1 : 0))

  t.test('array batch', (t) => {
    db.batch(batch, (err) => {
      if (err) return t.end(err)

      const done = after(batch.length, t.end)

      db.get('aa', (err, record) => {
        done(err)
        t.deepEqual(record, sorted[0].value, 'aa')
      })
      db.get('ab', (err, record) => {
        done(err)
        t.deepEqual(record, sorted[1].value, 'ab')
      })
      db.get('ac', (err, record) => {
        done(err)
        t.deepEqual(record, sorted[2].value, 'ac')
      })
    })
  })

  t.test('read stream', (t) => {
    const data = []
    db.createReadStream()
    .on('error', t.end)
    .on('data', (d) => data.push(d))
    .on('end', () => {
      // add put op type to compare to sorted batch
      data.forEach((d) => { d.type = 'put' })
      t.deepEqual(data, sorted, 'all records in order')
      t.end()
    })
  })

  t.test('close', (t) => {
    db.close((err) => {
      if (err) return t.end(err)
      // idempotent close
      db.close(t.end)
    })
  })
})
