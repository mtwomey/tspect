let rewire = require('rewire');
let tspect = rewire('../src/tspect.js');

tspect.ExpectClause = tspect.__get__('ExpectClause');

test('creating the pty process successfully', () => {
    let ptyProcess = tspect.spawn('/bin/echo', ['Hello World!']);
    expect(ptyProcess.constructor.name).toBe('UnixTerminal');
    ptyProcess.die();
})

test('creating a pty process and reading data from it', () => {
    let ptyProcess = tspect.spawn('/bin/echo', ['Hello World!']);
    ptyProcess.on('data', data => {
        expect(data).toBe('Hello World!\r\n')
        ptyProcess.die();
    });
})

test('adding an expect clause with multiple matches to a pty process', (done) => {
    let ptyProcess = tspect.spawn('/bin/sh');
    ptyProcess.expect(
        [
            [
                'noMatchAAA',
                () => {},
            ]
        ]);
    ptyProcess.expect(
        [
            [
                'noMatch',
                () => {
                },
            ],
            [
                {
                    strings: 'matchMe',
                    matchFn: () => {}
                }

            ],
            [
                {
                    strings: ['matchMe', 'orMe'],
                    matchFn: () => {}
                }

            ],
            [
                '$',
                () => {
                    ptyProcess.die();
                    done();
                },
                () => {

                }
            ]
        ]);
    ptyProcess.expect(
        [
            [
                'noMatchBBB',
                () => {},
            ]
        ]);
});

test('adding multiple expect clauses at once', (done) => {
    let ptyProcess = tspect.spawn('/bin/sh');
    let clause1 = ['$', () => {}];
    let clause2 = ['$', () => {ptyProcess.die(); done();}];
    ptyProcess.expect(clause1, clause2, clause1);
    ptyProcess.end();
})

test('adding multiple expect clauses at once - array form', (done) => {
    let ptyProcess = tspect.spawn('/bin/sh');
    let clause1 = ['$', () => {}];
    let clause2 = ['$', () => {ptyProcess.die(); done();}];
    ptyProcess.expect([clause1, clause2, clause1]);
})

test('adding an expect clause with a single match to a pty process - array form', (done) => {
    let ptyProcess = tspect.spawn('/bin/sh');
    ptyProcess.expect(['$', () => {
        ptyProcess.die();
        done()
    }]);
});

test('adding an expect clause with a single match to a pty process - object form', (done) => {
    let ptyProcess = tspect.spawn('/bin/sh');
    ptyProcess.expect({
        strings: '$',
        matchFn: () => {
            ptyProcess.die();
            done();
        }
    });
});

test('adding an expect clause with a single match to a pty process - object form 2', (done) => {
    let ptyProcess = tspect.spawn('/bin/sh');
    ptyProcess.expect({
        strings: ['matchThis', 'or', '$'],
        matchFn: () => {
            ptyProcess.die();
            done();
        }
    });
});

test('creating an expect clause with just a string and nothing else (for await use)', async (done) => {
    let ptyProcess = tspect.spawn('/bin/sh');
    await ptyProcess.expect('$');
    ptyProcess.die();
    done();
});

test('creating an expect clause with just a string and timeout (for await use)', async (done) => {
    let ptyProcess = tspect.spawn('/bin/sh');
    await ptyProcess.expect('$', 3000);
    ptyProcess.die();
    done();
});

test('adding an expect clause with a single match to a pty process', (done) => {
    let ptyProcess = tspect.spawn('/bin/sh');
    ptyProcess.expect('$', () => {
        ptyProcess.die();
        done()
    });
});

test('adding an expect clause that\'s not found and times out', (done) => {
    let ptyProcess = tspect.spawn('/bin/sh');
    ptyProcess.expect('noMatch', () => {

    }, 2000, () => {
        ptyProcess.die();
        done();
    });
});

test('sending output to the spawned process 1', (done) => {
    let ptyProcess = tspect.spawn('/bin/sh');
    ptyProcess.expect('hello', () => {
        ptyProcess.die();
        done();
    }, 1000);
    ptyProcess.expect('$', () => {
        ptyProcess.write('echo hello\n');
    }, 3000);
});

test('sending output to the spawned process 2', async (done) => {
    let ptyProcess = tspect.spawn('/bin/sh');

    // This should fail due to await
    await ptyProcess.expect('hello', () => {

    }, 50, () => {
        ptyProcess.die();
        ptyProcess = undefined;
        done();
    });
    if (ptyProcess)
        ptyProcess.expect('$', () => {
            ptyProcess.write('echo hello\n');
        }, 3000);

});

test('expectClause creation 1', () => {
    let expectClause = new tspect.ExpectClause('matchMe', ()=>{return});
    expect(Array.isArray(expectClause.strings)).toBe(true);
    expect(typeof expectClause.matchFn).toBe('function');
    expect(expectClause.timeout).toBe(4000);
    expect(typeof expectClause.timeoutFn).toBe('function');
})

test('expectClause creation 2', () => {
    let expectClause = new tspect.ExpectClause(['matchMe', 'or me'], ()=>{return});
    expect(Array.isArray(expectClause.strings)).toBe(true);
    expect(typeof expectClause.matchFn).toBe('function');
    expect(expectClause.timeout).toBe(4000);
    expect(typeof expectClause.timeoutFn).toBe('function');
})

test('expectClause creation 3', () => {
    let expectClause = new tspect.ExpectClause('matchMe', ()=>{return}, 3000);
    expect(Array.isArray(expectClause.strings)).toBe(true);
    expect(typeof expectClause.matchFn).toBe('function');
    expect(expectClause.timeout).toBe(3000);
    expect(typeof expectClause.timeoutFn).toBe('function');
})

test('expectClause creation 4', () => {
    let expectClause = new tspect.ExpectClause('matchMe', ()=>{return}, () => {return -1});
    expect(Array.isArray(expectClause.strings)).toBe(true);
    expect(typeof expectClause.matchFn).toBe('function');
    expect(expectClause.timeout).toBe(4000);
    expect(typeof expectClause.timeoutFn).toBe('function');
})

test('expectClause creation 5', () => {
    let expectClause = new tspect.ExpectClause('matchMe', ()=>{return}, 3000, () => {return -1});
    expect(Array.isArray(expectClause.strings)).toBe(true);
    expect(typeof expectClause.matchFn).toBe('function');
    expect(expectClause.timeout).toBe(3000);
    expect(typeof expectClause.timeoutFn).toBe('function');
})

test('expectClause creation 6', () => {
    let expectClause = new tspect.ExpectClause(['matchMe', ()=>{return}, 3000, () => {return -1}]);
    expect(Array.isArray(expectClause.strings)).toBe(true);
    expect(typeof expectClause.matchFn).toBe('function');
    expect(expectClause.timeout).toBe(3000);
    expect(typeof expectClause.timeoutFn).toBe('function');
})

test('expectClause creation 7', () => {
    let expectClause = new tspect.ExpectClause({strings: 'matchMe', matchfn: () => {}, timeout: 3000});
    expect(Array.isArray(expectClause.strings)).toBe(true);
    expect(typeof expectClause.matchFn).toBe('function');
    expect(expectClause.timeout).toBe(3000);
    expect(typeof expectClause.timeoutFn).toBe('function');
})

test('expectClause creation 8', () => {
    let expectClause = new tspect.ExpectClause({strings: ['matchMe', 'orMe'], matchfn: () => {}, timeout: 3000});
    expect(Array.isArray(expectClause.strings)).toBe(true);
    expect(typeof expectClause.matchFn).toBe('function');
    expect(expectClause.timeout).toBe(3000);
    expect(typeof expectClause.timeoutFn).toBe('function');
})

test('expectClause creation 9', () => {
    let expectClause = new tspect.ExpectClause('matchMe', 3000);
    expect(Array.isArray(expectClause.strings)).toBe(true);
    expect(typeof expectClause.matchFn).toBe('function');
    expect(expectClause.timeout).toBe(3000);
    expect(typeof expectClause.timeoutFn).toBe('function');
})
