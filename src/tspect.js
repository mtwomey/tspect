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
                    resolve(true);
                }

                // Wrap timeout function with resolve for promises
                let timeoutFn = expectClause.timeoutFn;
                expectClause.timeoutFn = () => {
                    timeoutFn();
                    resolve(false);
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

function clearExpectClauseTimeouts(expectClauseHolder) {
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
    }
    if (typeof args[1] === 'number') {
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

    console.log(`
    Adding clause:
    strings: ${strings.toString()}
    matchFn: ${matchFn}
    timeout: ${timeout}
    timeoutFn: ${timeoutFn}
    `)

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
        done: () => {
            clearExpectClauseTimeouts(expectClauseHolder);
            ptyProcess.kill();
        },
        interact: () => {
            return interact(ptyProcess, ptyConfig, expectClauseHolder);
        }
    });

    let dataHolder = new DataHolder();

    ptyProcess.addListener('data', (data) => {
        processIncomingData(data, dataHolder, expectClauseHolder, ptyConfig);
    })
    ptyProcess.addListener('err', (data) => {
        processIncomingData(data, dataHolder, expectClauseHolder, ptyConfig);
    })
    return ptyProcess;
}

function interact(ptyProcess, ptyConfig, expectClauseHolder) { // Allow user interaction from here on out
    return new Promise((resolve, reject) => {
        ptyConfig.echo = false;

        process.stdin.setRawMode(true);

        function stdoutResizeHandler() {
            ptyProcess.resize(process.stdout.columns, process.stdout.rows);
        }
        process.stdout.addListener('resize', stdoutResizeHandler);

        function stdinDataHandler(data) {
            ptyProcess.write(data);
        }
        process.stdin.addListener('data', stdinDataHandler);

        function stdoutDataHandler(data) {
            process.stdout.write(data);
        }
        ptyProcess.addListener('data', stdoutDataHandler);

        ptyProcess.addListener('close', function () {
            ptyProcess.removeListener('data', stdoutDataHandler);
            process.stdin.removeListener('data', stdinDataHandler);
            process.stdout.removeListener('resize', stdoutResizeHandler);
            process.stdin.setRawMode(false);
            ptyConfig.echo = true;
            process.stdin.unref(); // This is the key to getting node to exit
            // see here: https://stackoverflow.com/questions/26004519/why-doesnt-my-node-js-process-terminate-once-all-listeners-have-been-removed
            // and here: https://stackoverflow.com/questions/59220095/node-doesnt-exit-automatically-once-a-listener-is-set-on-stdin
            clearExpectClauseTimeouts(expectClauseHolder);
            resolve();
        });
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
