'use strict';
let pty = require('node-pty');
let tspect = require('./tspect');

// Works
// let ptyProcess = pty.spawn('/bin/sh', null, {});
// ptyProcess.write('echo test');
// ptyProcess.kill();

// works1();
// works2();
// works3();
// noWorky1();
test();

function works1() {
    let program = '/bin/sh';
    let params = null;
    process.stdout.columns = 80;
    process.stdout.rows = 20;
    let ptyProcess = pty.spawn(program, params, {
        name: 'xterm-color',
        cols: process.stdout.columns,
        rows: process.stdout.rows,
        cwd: process.env.HOME,
        env: process.env
    });
    ptyProcess.write('echo test\n');
    ptyProcess.kill();
}

function works2() {
    let ptyProcess = tspect.spawn('/bin/sh');
    ptyProcess.expect('$', 1000);

    setTimeout(() => {
        let x = ptyProcess.getExpectClauses();
        ptyProcess.kill();
    }, 10);
}

function works3() { // Works because I cleared the expect clause timeout
    let ptyProcess = tspect.spawn('/bin/sh');
    ptyProcess.expect('$', 1000);
    ptyProcess.write('echo test\n');

    let expectClauses = ptyProcess.getExpectClauses();
    console.log(`Num expectClauses: ${Object.keys(expectClauses).length}`)
    Object.values(expectClauses).forEach(expectClause => {
        clearTimeout(expectClause.timeoutFnRef);
    })
    ptyProcess.kill();
}

function noWorky1() {
    let ptyProcess = tspect.spawn('/bin/sh');

    ptyProcess.interact();

    ptyProcess.addListener('close', () => {
        console.log('Closing...');
        process.stdin.emit('end');
        ptyProcess.kill();
    })
}

function works4() {
    let ptyProcess = pty.spawn('/bin/sh');

    // Setup
    process.stdin.on('data', data => {
        ptyProcess.write(data);
    })

    ptyProcess.addListener('data', data => {
        process.stdout.write(data);
    });

    ptyProcess.addListener('close', () => {
        console.log('Closing...');
        // Teardown
        // process.stdin.removeAllListeners('data');
        // ptyProcess.removeAllListeners('data');
        // process.stdout.destroy();
        process.stdin.emit('end');
        // process.stdin.end();
        // process.stdin.destroy();
        // ptyProcess.kill();
    })
}

function it(ptyProcess) {
    // Setup
    process.stdin.setRawMode(true);

    process.stdout.addListener('resize', () => {
        ptyProcess.resize(process.stdout.columns, process.stdout.rows);
    });

    process.stdin.addListener('data', data => {
        ptyProcess.write(data);
    })

    ptyProcess.addListener('data', data => {
        process.stdout.write(data);
    });



    ptyProcess.addListener('close', () => {
        console.log('Closing...');
        // Teardown
        process.stdin.setRawMode(false);
        process.stdin.emit('end');
    })
}

function test() {
    let ptyProcess = tspect.spawn('/bin/sh');

    // ptyProcess.interact();
    it(ptyProcess);

}
