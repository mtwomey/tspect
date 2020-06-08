module.exports = function (wallaby) {
    return {
        files: [
            'src/**/*.js'
        ],

        tests: [
            'test/**/*test.js'
        ],

        env: {
            type: 'node'
        },

        testFramework: 'jest',

        // workers: {
        //     initial: 6,
        //     regular: 2
        // }
    };
};
