
const // 
    fs = require('fs'),
    hound = require('hound'),
    exit = msg => !console.log(msg) && process.exit(),
    unixlikecmds = require('./unix').unix,
    { ls, cat, touch, mkdir } = unixlikecmds,
    importRE = /import(?:["'\s]*([\w*{}\n, ]+)from\s*)?["'\s]*([@\w/_-]+)["'\s].*/,
    //
    getArgs = () => process.argv.slice(2),
    setArgs = args => [args.length >= 1 ? args[0] : 'src', args.length >= 2 ? args[1] : 'dist'],
    cleanPath = path => path.replace(/\.{1}\//, '').replace(/\/$/, ''),
    setScope = path => cleanPath(__dirname + '/' + path),
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
    args = getArgs(),
    [_src, _dest] = setArgs(args),
    src = setScope(_src),
    dest = setScope(_dest),
    watcher = isDir(src) && hound.watch(src)||exit(),
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

        jsFiles
            .map((jsFile, index, pathToThisFile) => ({ content: cat(jsFile), path: pathToThisFile[index] }))
            .filter(({ content, path: pathToThisFile }) => {
                let // 
                    sheetId = 0,
                    usesAssocFunction = false;
                const //,
                    lines = content.split(/\n/m);

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

                        if (isStyleFile(moduleName)) {
                            if (usesAssocFunction)
                                associations[pathToThisFile] = { importName, moduleName, importStmt };
                            const //
                                pathToTheStyleFile = getPath(pathToThisFile, moduleName),
                                style = cat(pathToTheStyleFile);
                            console.log({ path: pathToTheStyleFile });
                            //
                            let // 
                                cpntId = 0,
                                end = '',
                                tmp = final = [];
                            [...style].map(char => {

                                if (stylesheetRulesStops.indexOf(char) != -1) {
                                    let content = tmp.join('');
                                    if (isCpnt(content)) {
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

                            touch(replaceByDist(pathToTheStyleFile), final.join(''))
                            sheetId++;
                        }
                    });

                console.log({ usesAssocFunction });

                if (!usesAssocFunction)
                    touch(replaceByDist(pathToThisFile), content);

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
                    } else {
                        after.push(line);
                    }

                });
                touch(outputFile, after.join('\n'));

            })

        otherFiles.map(f => touch(replaceByDist(f), cat(f)));

    };

console.log({ src, dest });

if (!isDir(src))
    exit(`file '${src}' does'nt exist or is not a directory`);





watcher.on('create', run)
watcher.on('change', run)
watcher.on('delete', run);