const // 
    hound = require('hound'),
    process = require('process'),
    argmts = process.argv.slice(2),
    [input = 'src', outDir = 'dist'] = argmts,
    unixlikecmds = require('./unix').unix,
    bundler = require('./builder').bundler,
    { ls, cat, cd, mkdir, touch, rm } = unixlikecmds,
    files = ls(input),

    // Create a directory tree watcher.
    watcher = hound.watch('./' + input),
    build = (files, outDir) => {
        files
            .filter(file => /.js$/.test(file))
            .map(inputFile => {
                bundler(inputFile, outDir);
            });
    };

console.log(bundler);

watcher.on('create', () => build(files, outDir))
watcher.on('change', () => build(files, outDir))
watcher.on('delete', () => build(files, outDir));