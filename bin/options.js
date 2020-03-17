exports.getOptions = args => {
    const //
        optsFound = [],
        passedOpts = {},
        options = {
            watch: {
                inputs: ['-w', '--watch', 'watch'],
                cb: () => true
            },
            inputdir: {
                inputs: ['-i', '--input-dir'],
                cb: (argmts, i) => argmts[i + 1]
            },
            outputdir: {
                inputs: ['-o', '--output-dir'],
                cb: (argmts, i) => argmts[i + 1]
            },
            verbose:{
                inputs:['-v','--verbose'],
                cb: () => true
            }
        };
    args.map((arg, i) => {
        for (let prop in options) {
            if (options[prop].inputs.indexOf(arg) > -1) {
                optsFound.push(args[i]);
                passedOpts[prop] = options[prop].cb(args, i);
            }
        }

    });
    passedOpts.inputdir = passedOpts.inputdir || 'src';
    passedOpts.outputdir = passedOpts.outputdir || 'dist';

    return passedOpts;

};