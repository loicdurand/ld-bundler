const // 
    fs = require('fs'),
    path = require("path"),
    { closeSync, openSync, utimesSync, unlinkSync } = fs,
    unix = {

        ls: (dirPath, arrayOfFiles = []) => {
            files = fs.readdirSync(dirPath)

            files.forEach(function (file) {
                if (fs.statSync(dirPath + "/" + file).isDirectory()) {
                    arrayOfFiles = unix.ls(dirPath + "/" + file, arrayOfFiles)
                } else {
                    arrayOfFiles.push(path.join(dirPath, "/", file))
                }
            })

            return arrayOfFiles
        },

        mkdir: targetDir => {
            console.log({ targetDir });
            try {
                fs.mkdirSync(targetDir, { recursive: true });
            } catch (error) {
                console.log(error);
            }
        },

        touch: (targetFile, content = '') => {
            console.log({ targetFile });
            const //
                targetDir = targetFile.split(/\//),
                createdFile = targetDir.join('/');
            targetDir.pop();
            unix.mkdir(targetDir.join('/'));
            try {
                fs.writeFileSync(createdFile, content);
            } catch (err) {
                console.log(err);
            }
        },

        cat: path => {
            const content = [];
            try {
                content.push(fs.readFileSync(path, 'utf8'));
            } catch (err) {
                console.log(err);
            }
            return [content].join('');
        }
    };

exports.unix = unix;