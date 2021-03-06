const // 
    fs = require('fs'),
    path = require("path"),
    unix = {

        ls: (dirPath, arrayOfFiles = []) => {
            if (fs.existsSync(dirPath) && fs.statSync(dirPath).isFile())
                return [dirPath];
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
            try {
                fs.mkdirSync(targetDir, { recursive: true });
            } catch (error) {
                console.log(error);
            }
        },

        touch: (targetFile, content = '') => {
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
                content.push(fs.readFileSync(path, { encoding: "UTF-8" }));
            } catch (err) {
                console.log(err);
            }
            return [content].join('');
        }
    };

exports.unix = unix;