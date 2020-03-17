
exports.ldbundler = options => {

    const // 
        fs = require('fs'),
        process = require('process'),
        hound = require('hound'),
        { unix } = require('./unix'),
        { ls, cat, touch } = unix,
        importRE = /import(?:["'\s]*([\w*{}\n, ]+)from\s*)?["'\s]*([@\w/_-]+)["'\s].*/,
        //
        cleanPath = path => path.replace(/\.{1}\//, '').replace(/\/$/, ''),
        setScope = path => cleanPath(process.cwd() + '/' + path),
        isFile = file => fs.existsSync(file) && fs.statSync(file).isFile(),
        isDir = dir => fs.existsSync(dir) && fs.statSync(dir).isDirectory(),
        isStyleFile = file => /\.(s?c|sa|le)ss$/.test(file),
        ids = {},
        stylesheetRulesStops = [' ', '\t', '\n', ',', '[', '>', '~', ':', '+', '{', ';'],
        isCpnt = str => /^[A-Z]\w?/.test(str),
        getPath = (pathToAFile, relativePathToAnother) => {
            const directories = pathToAFile.split('/');
            directories.pop();
            const filename = relativePathToAnother
                .split('/')
                .filter(split => {
                    if (split == '..') {
                        directories.pop();
                        return false;
                    } else if (split == '.')
                        return false;
                    return true;
                }).join('/');
            return [...directories, filename].join('/');
        },
        replaceByDist = path => path.replace(new RegExp('^' + src), dest),
        //
        logs = [],
        pushLogs = msg => {
            msg && options.verbose && logs.push(msg);
            return msg || true;
        },
        exit = msg => !console.log(msg) && process.exit(),
        alreadyCreateds = [],
        [_src, _dest] = [options.inputdir, options.outputdir],
        src = setScope(_src),
        dest = setScope(_dest),
        watcher = isDir(src) || isFile(src) ? hound.watch(src) : exit(`file '${src}' does'nt exist or is not a directory`),
        run = () => {
            const //
                filesInScope = ls(src),
                otherFiles = [],
                jsFiles = filesInScope.filter(f => {
                    if (/\.js[x]?$/.test(f))
                        return true;
                    else {
                        otherFiles.push(f);
                        return false;
                    }
                }),
                associations = {};

            pushLogs(`
starting with options:

-v, --verbose:          true
-i, --input-dir:        ${_src} ==> ${src} [type="${isDir(src) ? 'directory' : 'file'}"]
-o, --output-dir:       ${_dest} ==> ${dest} [type="${isDir(dest) ? 'directory' : 'file'}"]
-w, --watch:            ${options.watch || false}

${isDir(src) ? `${filesInScope.length} file(s) found in ${_src}/` : ''}

${jsFiles.length ? jsFiles.length + ' javascript file(s) found\n==========================' : ''}
`);

            jsFiles
                .map((jsFile, index, pathToThisFile) => ({ content: cat(jsFile), path: pathToThisFile[index] }))
                .filter(({ content, path: pathToThisFile }) => {

                    let // 
                        sheetId = 0,
                        usesAssocFunction = false;
                    const //
                        lines = content.split(/\n/m);

                    pushLogs(pathToThisFile);

                    lines
                        .filter(line => importRE.test(line))
                        .map(importStmt => {
                            const // 
                                simplified = importStmt.replace(/[,'";]/g, ''),
                                splits = simplified.split(/(?<!\{)\s|\s(?!\})/).filter(Boolean),
                                moduleName = splits.pop(),
                                importName = splits[1],
                                checkUsesAssoc = () => (
                                    (moduleName == 'ld-components') &&
                                    ('{assoc}' == splits
                                        .filter(split => ['{', 'assoc', '}'].indexOf(split) != -1)
                                        .join('')
                                    )
                                );
                            usesAssocFunction = checkUsesAssoc() ? true : usesAssocFunction;

                            pushLogs(checkUsesAssoc() ? '\t==> import statement found for "ld-components"' : '');

                            if (isStyleFile(moduleName)) {
                                pushLogs('\t==> import statement found for "' + moduleName + '"');

                                if (usesAssocFunction) {
                                    associations[pathToThisFile] = { importName, moduleName, importStmt };
                                    pushLogs('\t==> start analysing "' + moduleName + '"')
                                }
                                const //
                                    pathToTheStyleFile = getPath(pathToThisFile, moduleName),
                                    style = cat(pathToTheStyleFile);

                                //
                                let //
                                    countCpnts = 0,
                                    cpntId = 0,
                                    end = '',
                                    tmp = final = [];
                                [...style].map(char => {

                                    if (stylesheetRulesStops.indexOf(char) != -1) {
                                        let content = tmp.join('');
                                        if (isCpnt(content)) {
                                            countCpnts++;
                                            content = content.replace(/[\.#].*/, m => {
                                                end = '' + m;
                                                return '';
                                            });
                                            if (!ids.hasOwnProperty(content))
                                                ids[content] = 'S' + sheetId + 'C' + cpntId++;
                                            content = '.' + ids[content] + end;
                                            end = '';
                                        }
                                        content += char

                                        final.push(content);
                                        tmp = [];
                                    } else {
                                        tmp.push(char)
                                    }

                                });

                                pushLogs('\t==> ' + countCpnts + ' rule(s) regarding components found');
                                pushLogs('\t==> creating ' + replaceByDist(pathToTheStyleFile));
                                alreadyCreateds.push(replaceByDist(pathToTheStyleFile));

                                touch(replaceByDist(pathToTheStyleFile), final.join(''));
                                sheetId++;
                            }
                        });

                    if (!usesAssocFunction) {
                        touch(replaceByDist(pathToThisFile), content);
                        pushLogs('\t==> copying into ' + replaceByDist(pathToThisFile) + '\n');
                    } else {
                        pushLogs('\t==> creating ' + replaceByDist(pathToThisFile));
                    }



                    return usesAssocFunction;

                }).map(({ content, path: pathToThisFile }) => {

                    if (!associations.hasOwnProperty(pathToThisFile)) {
                        touch(replaceByDist(pathToThisFile), content);
                        return false;
                    }

                    const //
                        { importStmt, moduleName, importName } = associations[pathToThisFile],
                        outputFile = replaceByDist(pathToThisFile, content),
                        lines = content.split(/\n/m),
                        after = [];
                    lines.map(line => {

                        if (line == importStmt) {
                            after.push(`import '${moduleName}';`);
                            after.push(`import ${importName} from './${importName}.def.js';`);
                            touch(getPath(outputFile, `${importName}.def.js`), `export default ${JSON.stringify(ids, null, '\t')};`);
                            pushLogs('\t==> creating ' + getPath(outputFile, `${importName}.def.js`) + '\n');
                        } else {
                            after.push(line);
                        }

                    });
                    touch(outputFile, after.join('\n'));
                })

            pushLogs(otherFiles.length ? otherFiles.length + ' other file(s) found\n=====================\n' : '');

            otherFiles.map(f => {
                const // 
                    newlyCreated = replaceByDist(f),
                    haveBeenCreated = alreadyCreateds.indexOf(newlyCreated) > -1;
                !haveBeenCreated && touch(newlyCreated, cat(f));
                pushLogs(f + '\n\t==> ' + (haveBeenCreated ? newlyCreated + ' ( already created )' : 'creating ' + newlyCreated) + '\n');
            });

        };

    run();

    logs.map(log => console.log(log));

    if (options.watch) {
        watcher
            .on('create', file => {
                console.log('new file created: ' + file);
                run();
            })
            .on('change', file => {
                console.log('file changed: ' + file);
                run();
            })
            .on('delete', file => {
                console.log('file deleted: ' + file);
                run();
            });
        console.log('start watching...');
    } else
        exit('done');

}