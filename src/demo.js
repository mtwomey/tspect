// const log = require('why-is-node-running');
let tspect = require('./tspect');

main();

process.on('unhandledRejection', (reason, p) => {
    console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
    // application specific logging, throwing an error, or other logic here
});

async function main() {
    let pty = tspect.spawn('/bin/sh');
    pty.expect('$', 5000);

    // pty.write('ls -als|head -5\n');

    ////

    // ptyConfig.echo = false;

    // process.stdin.setRawMode(true);

    // let stdoutResizeHandler = () => {
    //     pty.resize(process.stdout.columns, process.stdout.rows);
    // };
    // process.stdout.on('resize', stdoutResizeHandler);

    // let stdinDataHandler = data => {
    //     pty.write(data);
    // };
    // process.stdin.on('data', stdinDataHandler);
    // console.log(`listeners: ${process.stdin.listenerCount()}`);
    // process.stdin.removeListener('data', stdinDataHandler);
    // console.log(process.stdin.listenerCount());
    // process.stdin.removeAllListeners();




    ////

    // await pty.interact();
    // console.log('here');
    // // pty.kill('SIGHUP');
    // pty.die();
    // // pty.kill();
    // // await pty.interact();
    // //
    // // process.stdout.write('Cleaning up...', () => {
    // //     pty.die();
    // // });
    // //
    // console.log('123');
    // console.log('starting a second one...');

    // pty = tspect.spawn('/bin/sh');
    // // await pty.interact();
    // pty.die();
    // pty.streams
    // console.log(process._getActiveRequests())
    // console.log(process._getActiveHandles());
}
