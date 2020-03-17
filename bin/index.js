#!/usr/bin/env node

const //

    { ldbundler } = require('./builder'),
    { getOptions } = require('./options'),
    options = getOptions(process.argv.slice(2));

exports.ldbundler = ldbundler(options);