'use strict';
let pty = require('node-pty');
let crypto = require('crypto');

function PtyConfig() {
    this.echo = true;
}

function DataHolder() {
    this.data = '';
    this.append = newData => {
        this.data += newData;
    }
    return this;
}

function ExpectClauseHolder() {
    this.expectClauses = {};

    this.add = (...args) => {

        // Figure out if it was passed in an array, or array or arrays, ...etc and handle / normalize it

        if (args.length === 1)
            args = args[0];
        if (isObject(args)) {
            args = Object.values(args);
        }
        if (!Array.isArray(args[args.length - 1]))
            args = [args];

        let promises = [];
        args.forEach(argumentList => {
            promises.push(new Promise((resolve, reject) => {

                let expectClause = new ExpectClause(...argumentList);

                // Wrap match function with resolve for promises
                let matchFn = expectClause.matchFn;
                expectClause.matchFn = () => {
                    clearTimeout(expectClause.timeoutFnRef);
                    matchFn();
                    resolve();
                }

                // Wrap timeout function with resolve for promises
                let timeoutFn = expectClause.timeoutFn;
                expectClause.timeoutFn = () => {
                    timeoutFn();
                    resolve();
                }

                expectClause.timeoutFnRef = setTimeout(() => {
                    expectClause.timeoutFn();
                    delete this.expectClauses[this.expectClauses.id];
                }, expectClause.timeout);
                let id = crypto.randomBytes(20).toString('hex');
                expectClause.id = id;
                this.expectClauses[id] = expectClause;
            }));
        });
        if (promises.length === 1)
            promises = promises[0];
        return promises;
    }

    return this;
}

function die(expectClauseHolder, ptyProcess) {
    Object.values(expectClauseHolder.expectClauses).forEach(expectClause => {
        clearTimeout(expectClause.timeoutFnRef);
    })
}

function isObject(o) {
    return !Array.isArray(o) && typeof o !== 'number' && typeof o !== 'string' && typeof o !== 'boolean' && typeof o !== 'undefined';
}

function ExpectClause(...args) {
    let strings
    let timeout = 4000 // Default timeout
    let matchFn = () => {
    };
    let timeoutFn = () => { // Default timeoutFn
        console.log('timed out...');
    }

    if (args.length === 1) // If they passed the whole thing as an array, unwrap it
        args = args[0];

    if (isObject(args)) {
        args = Object.values(args);
    }

    if (typeof args === 'string')
        args = [args];
    if (!Array.isArray(args[0]))
        args[0] = [args[0]];

    strings = args[0];

    if (typeof args[1] === 'function') {
        matchFn = args[1];
    } else {
        timeout = args[1];
    }

    if (typeof args[2] === 'number')
        timeout = args[2];

    if (typeof args[2] === 'function')
        timeoutFn = args[2];

    if (typeof args[3] === 'function')
        timeoutFn = args[3];

    this.strings = strings;
    this.matchFn = matchFn;
    this.timeout = timeout;
    this.timeoutFn = timeoutFn;

    return this;
}

function spawn(program, params) {
    process.stdout.columns = 80;
    process.stdout.rows = 20;
    let commandLine = program;
    if (params)
        commandLine += params.join('');
    process.stdout.write(commandLine + '\n');

    let ptyProcess = pty.spawn(program, params, {
        name: 'xterm-color',
        cols: process.stdout.columns,
        rows: process.stdout.rows,
        cwd: process.env.HOME,
        env: process.env
    });
    ptyProcess.resize(process.stdout.columns, process.stdout.rows);

    let expectClauseHolder = new ExpectClauseHolder();
    let ptyConfig = new PtyConfig();
    Object.assign(ptyProcess, {
        expect: expectClauseHolder.add,
        die: () => {
            die(expectClauseHolder, ptyProcess)
        },
        interact: () => {
            return interact(ptyProcess, ptyConfig)
        },
        getExpectClauses: () => {return expectClauseHolder.expectClauses;}
    });

    let dataHolder = new DataHolder();

    ptyProcess.on('data', (data) => {
        processIncomingData(data, dataHolder, expectClauseHolder, ptyConfig);
    })
    ptyProcess.on('err', (data) => {
        processIncomingData(data, dataHolder, expectClauseHolder, ptyConfig);
    })
    return ptyProcess;
}

function interact(ptyProcess, ptyConfig) { // Allow user interaction from here on out
    return new Promise((resolve, reject) => {
        ptyConfig.echo = false;

        process.stdin.setRawMode(true);

        let stdoutResizeHandler = () => {
            ptyProcess.resize(process.stdout.columns, process.stdout.rows);
        };
        process.stdout.on('resize', stdoutResizeHandler);

        let stdinDataHandler = data => {
            ptyProcess.write(data);
        };
        process.stdin.on('data', stdinDataHandler);

        let ptyProcessDataHandler = data => {
            process.stdout.write(data);
        };
        ptyProcess.on('data', ptyProcessDataHandler);

        ptyProcess.on('close', function () {
            process.stdin.setRawMode(false);
            ptyProcess.removeAllListeners();
            process.stdin.removeAllListeners();
            process.stdout.removeAllListeners();

            ptyConfig.echo = true;
            resolve();
        });
        ptyProcess.write('\n');
    });

}

function processIncomingData(data, dataHold, expectClauseHolder, ptyConfig) {
    if (ptyConfig.echo)
        process.stdout.write(data);
    dataHold.append(data);
    if (expectClauseHolder) {
        Object.values(expectClauseHolder.expectClauses).forEach(expectClause => {
            expectClause.strings.forEach(string => {
                if (dataHold.data.indexOf(string) !== -1) {
                    clearTimeout(expectClause.timeoutFnRef);
                    expectClause.matchFn();
                    delete expectClauseHolder.expectClauses[expectClause.id];
                }
            })
        })
    }
}

module.exports = {
    spawn: spawn
};
