let pty = require('node-pty');

function spawn(program, params) {
    process.stdout.write(program + ' ' + params.join(' ') + '\n');
    let maxSearch = 200;
    let defaultTimeout = 6000;

    let expectClauses = [];
    let ptyProcess = pty.spawn(program, params, {
        name: 'xterm-color',
        cols: process.stdout.columns,
        rows: process.stdout.rows,
        cwd: process.env.HOME,
        env: process.env
    });
    ptyProcess.resize(process.stdout.columns, process.stdout.rows);

    let searchStrings = () => {
        if (expectClauses.length > 0) {
            let length = searchString.length;
            let pointer = 0;
            for (let i = 1; i < length; i++) {
                let targetString = searchString.substr(pointer, i);

                let results = [];

                expectClauses[0].searchStrings.forEach((s) => {
                    if (targetString.indexOf(s) !== -1) {
                        expectClauses[0].matchedString = s;
                        results.push(expectClauses[0]);
                    }
                    if (s === '')
                        results.push(expectClauses[0]);
                });

                if (results.length > 0) {
                    results.forEach(result => {
                        clearTimeout(result.timeout);
                        if (result.f)
                            result.f(result.matchedString);
                        result.resolve(result.matchedString);
                        expectClauses.splice(expectClauses.indexOf(result), 1);
                    });
                    pointer = i; // Pretty sure this is right, checked it with logging...
                }
                if (expectClauses.length === 0)
                    break;
            }
        }
    };

    let searchString = '';
    function processIncomingData(data){
        searchString += data;
        searchStrings();
        if (searchString.length > maxSearch) {
            searchString = searchString.substr(searchString.length - maxSearch);
        }
    }
    ptyProcess.on('data', processIncomingData);
    ptyProcess.on('err', processIncomingData);



    Object.assign(ptyProcess, {
        expect: (searchStrings, f, timeout) => {
            return new Promise((resolve, reject) => {
                searchStrings = Array.isArray(searchStrings) ? searchStrings : [searchStrings];
                let newClause = {
                    searchStrings: searchStrings,
                    f: f,
                    timeout: setTimeout(() => {
                        console.log(`\n*** Timed out waiting ***\n${newClause.searchStrings.toString()}\n`);
                        reject();
                    }, timeout || defaultTimeout),
                    resolve: resolve
                };
                expectClauses.push(newClause);
            });
        },
        interact: () => { // Allow user interaction from here on out
            process.stdin.setRawMode(true);
            process.stdout.on('resize', () => {
                ptyProcess.resize(process.stdout.columns, process.stdout.rows);
            });
            process.stdin.on('data', data => {
                ptyProcess.write(data);
            });
            ptyProcess.on('close', function () {
                process.exit();
            });
            ptyProcess.on('data', data => {
                process.stdout.write(data);
            });
            ptyProcess.write('\n');
        },
        searchString() {
            return searchString;
        }
    });

    return ptyProcess;
}

module.exports = {
    spawn: spawn
};


