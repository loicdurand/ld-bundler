const // 
    fs = require('fs'),
    path = require("path"),
    { closeSync, openSync, utimesSync, unlinkSync } = fs;

exports.unix = {

    ls: (dirPath, arrayOfFiles = []) => {
        files = fs.readdirSync(dirPath)

        files.forEach(function (file) {
            if (fs.statSync(dirPath + "/" + file).isDirectory()) {
                arrayOfFiles = fs.readdirSync(dirPath + "/" + file, arrayOfFiles)
            } else {
                arrayOfFiles.push(path.join(dirPath, "/", file))
            }
        })

        return arrayOfFiles
    },

    mkdir: path => {
        const mem = [];
        path.split(/\//).map(dir => {
            try {
                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(mem.join('') + dir);
                    mem.push(dir + '/');
                }
            } catch (err) {
                closeSync(openSync(dir, 'w'));
            }
        });
    },

    touch: path => {
        const // 
            time = new Date();
        path.split(/\//).map((dir, i, splits) => {
            try {
                utimesSync(dir, time, time);
            } catch (err) {
                closeSync(openSync(dir, 'w'));
            }
        });
    },
    rm: path => {
        try {
            fs.existsSync(path) && unlinkSync(path);
        } catch (err) {
            console.log('error while deleting ' + path, err);
        }
    },
    cd: path => {
        try {
            process.chdir(path);
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