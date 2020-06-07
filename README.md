# tspect - remember expect?

## Installation
`npm i mtwomey/tspect#v2.0.0 --save`

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
## tspect.spawn(program)

* **program** Program to execute
* Return the virtual pty

## tspect.pty.expect(strings[,matchFn][,timeout][,timeoutFn])

* **strings** A single string or an array of strings to be matched from the pty output
* **matchFn** Function executed upon a match
* **timeout** Timeout in ms to wait
* **timeoutFn** Function executed upon timeout
* Returns a promise

## tspect.pty.expect({strings: strings [,matchFn: matchFn][,timeout: timeout][,timeoutFn: timeoutFn}])

* **strings** A single string or an array of strings to be matched from the pty output
* **matchFn** Function executed upon a match
* **timeout** Timeout in ms to wait
* **timeoutFn** Function executed upon timeout
* Returns a promise

## tspect.pty.interact()

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
