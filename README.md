# tspect - remember expect?

## Installation
`npm i mtwomey/tspect#v2.0.4 --save`

This will install v2.0.0 direct from github. See Releases for the latest release #s.

## Simple example
```javascript
let tspect = require('tspect');

let pty = tspect.spawn('/bin/sh');
pty.expect('$', () => {
    pty.write('echo "Hello World"\n');
    setTimeout(() => { // Timeout just to see the output before exit
        pty.done();
    }, 2000);
})
```

## Simple example with promises
```javascript
let tspect = require('tspect');

main();

async function main() {
    let pty = tspect.spawn('/bin/sh');
    await pty.expect('$');
    pty.write('echo "Hello World"\n');
    setTimeout(() => { // Timeout just to see the output before exit
        pty.done();
    }, 2000);
}
```

## SSH Login Example
```javascript
let tspect = require('../tspect');

main()

async function main() {
    console.log('Starting session 1');
    let pty = tspect.spawn('/usr/bin/ssh user@target.host');
    pty.expect('The authenticity of host', // Answer yes in case you've never connected to this host before
        () => {
            pty.write('yes\n');
        });
    pty.expect('assword',
        () => {
            pty.removeAllClauses(); // Prevent the above clause from firing or timing out
            pty.write('mypassword\n');
        });
    await pty.interact(pty); // Turn over control to the user
}
```
## tspect.spawn(program)

* **program** Program to execute
* Return the virtual pty

## pty.expect(strings[,matchFn][,timeout][,timeoutFn])

* **strings** A single string or an array of strings to be matched from the pty input / output
* **matchFn** Function executed upon a match
* **timeout** Timeout in ms to wait
* **timeoutFn** Function executed upon timeout
* Returns a promise

## pty.expect({strings: strings [,matchFn: matchFn][,timeout: timeout][,timeoutFn: timeoutFn}])

* **strings** A single string or an array of strings to be matched from the pty output
* **matchFn** Function executed upon a match
* **timeout** Timeout in ms to wait
* **timeoutFn** Function executed upon timeout
* Returns a promise

## pty.interact()

Connects your pty to the spawned virtual pty, allows for interactions.

Example:

```javascript
let tspect = require('tspect');

main();

async function main() {
    let pty = tspect.spawn('/bin/sh');
    await pty.expect('$');
    pty.write('echo "Hello World"\n');
    await pty.interact(); // Program terminates when you exit the shell
}
```

## pty.removeAllClauses()

Removes all unresolved clauses from the session
(clauses that have already resolved are automatically removed).

