let tspect = require('../tspect');

main();

async function main() {
    console.log('Starting session 1');
    ptyProcess = tspect.spawn('/usr/bin/ssh', ['mtwomey@core.beakstar.com']);
    ptyProcess.expect('The authenticity of host',
        () => {
            ptyProcess.write('yes\n');
        }, () => {}).then(result => {
        console.log(`XXXXX ${result} XXXXX`);
    });
    ptyProcess.expect('assword',
        () => {
            ptyProcess.write('***REMOVED***\n');
        }).then(result => {
        console.log(`XXXXX ${result} XXXXX`);
    })
    await ptyProcess.interact(ptyProcess);
}
