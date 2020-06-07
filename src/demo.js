let tspect = require('./tspect');

main();

async function main() {
    let ptyProcess;

    console.log('Starting session 1');
    ptyProcess = tspect.spawn('/bin/sh');
    await ptyProcess.interact(ptyProcess);

    console.log('Starting session 2');
    ptyProcess = tspect.spawn('/bin/sh');
    await ptyProcess.interact(ptyProcess);
}
