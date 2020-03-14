
const //
    process = require('process'),
    fs = require('fs'),
    argmts = process.argv.slice(2),
    [input = 'src', out = 'dist'] = argmts,
    outputDir = (out + '/' + input.replace(new RegExp(input), '').replace(/^.*\//, '')).replace(/\/$/, ''),
    unixlikecmds = require('./unix').unix,
    { ls, cat, cd, mkdir, touch, rm } = unixlikecmds,

    data = {
        styles: [],
        stylesImports: []
    },
    files = ls(input),
    main = (inputFile) => {
        try {
            const // 
                outputFile = inputFile.replace(new RegExp(input), outputDir),
                js = cat(inputFile),
                lines = js.split(/\n/m),
                patternImport = /import(?:["'\s]*([\w*{}\n, ]+)from\s*)?["'\s]*([@\w/_-]+)["'\s].*/,
                styles = [];
            lines.map(line => {
                const found = patternImport.exec(line);
                if (!found)
                    return false;
                const // 
                    [match] = found,
                    simplified = match.replace(/[,'";]/g, ''),
                    splits = simplified.split(/(?<!\{)\s|\s(?!\})/).filter(Boolean),
                    moduleName = splits.pop();
                if (/\.(s?c|sa|le)ss$/.test(moduleName)) {
                    data.stylesImports.push(match);
                    styles.push({
                        importName: splits[1],
                        moduleName
                    })
                }
            });

            let // 
                cpntId = -1,
                beg = '',
                end = '',
                tmp = [],
                final = [];
            const //
                paths = inputFile.split(/\//).slice(0, -1).join('/'),
                path = paths + '/',
                out = {},
                ids = {},
                stops = [' ', '\t', '\n', ',', '[', '>', '~', ':', '+', '{', ';'],
                isCpnt = str => /^[A-Z]\w?/.test(str);
            styles.map(({ importName, moduleName }, sheetId) => {
                out[importName] = {};
                const style = cat(path + moduleName.replace(/^.{1}\//, '')).replace(/[\n]/, '');
                [...style].map(char => {

                    if (stops.indexOf(char) != -1) {
                        let content = tmp.join('');
                        if (isCpnt(content)) {
                            content = content.replace(/[\.#].*/, m => {
                                end = '' + m;
                                return '';
                            });
                            if (!ids.hasOwnProperty(content)) {
                                cpntId = cpntId + 1;
                                ids[content] = 'S' + sheetId + 'C' + cpntId;
                            }
                            content = beg + '.' + ids[content] + end;
                            end = '';
                        }
                        content += char

                        final.push(content);
                        tmp = [];
                        mem = '';
                    } else {
                        tmp.push(char)
                    }

                });
                data.styles.push({ id: importName, path: moduleName, content: final.join(''), associations: ids });


            })
            //console.log(data);

            // cd('../');
            mkdir(outputDir);
            // cd('dist');
            data.styles.map(style => {
                const outfile = outputDir + '/' + (style.path.replace(/\.{1}\//, ''));
                console.log(outputDir, style.path, outfile);
                rm(outfile);
                //touch(outfile);
                fs.appendFileSync(outfile, style.content);
            });
            rm(outputFile);
            //touch(outputFile);
            lines.map(line => {
                if (data.stylesImports.indexOf(line) == -1) {
                    fs.appendFileSync(outputFile, line + '\n');
                } else {
                    let after = '';
                    fs.appendFileSync(outputFile, line.replace(/\s.*\sfrom/, m => {
                        let // 
                            file = m.replace(/from/, '').trim(),
                            assoc = data.styles.find(({ id }) => id == file);
                        rm(outputDir + '/' + file + '.def.js')
                        //touch(outputDir + '/' + file + '.def.js');
                        fs.appendFileSync(outputDir + '/' + file + '.def.js', 'export default ' + JSON.stringify(assoc.associations, null, '\t'));
                        after = 'import ' + file + ' from \'./' + file + '.def.js\''
                        return '';
                    }) + '\n');
                    fs.appendFileSync(outputFile, after);
                }

            })

            //console.log(lines);




            // touch ${built}

            // usage




        } catch (err) {
            console.error(err)
        }
    };

//origin = 'test.js';

files
    .filter(file => /.js$/.test(file))
    .map(inputFile => {
        main(inputFile);
    });

exports.bundler = main;

//cd('src');


