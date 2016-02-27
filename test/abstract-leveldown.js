const test = require('tape')
const util = require('./util')
const pgdown = require('../')

// TODO: use a larger buffer
const buffer = new Buffer('00ff61626301feffff00000000ffff')

// compatibility w/ leveldown api

require('abstract-leveldown/abstract/leveldown-test').args(pgdown, test, util)

require('abstract-leveldown/abstract/open-test').args(pgdown, test, util)
require('abstract-leveldown/abstract/open-test').open(pgdown, test, util)

require('abstract-leveldown/abstract/put-test').all(pgdown, test, util)

require('abstract-leveldown/abstract/del-test').all(pgdown, test, util)

require('abstract-leveldown/abstract/get-test').all(pgdown, test, util)

require('abstract-leveldown/abstract/put-get-del-test').all(pgdown, test, util, buffer)

// require('abstract-leveldown/abstract/iterator-test').all(pgdown, test, util)

// require('abstract-leveldown/abstract/batch-test').all(pgdown, test, util)
// require('abstract-leveldown/abstract/chained-batch-test').all(pgdown, test, util)

require('abstract-leveldown/abstract/close-test').close(pgdown, test, util)