(function () {
    'use strict';
    'asfsadfsadf';

    var x = 42;
    console.log(x);

    function func() {
        var x = 43;
        var y = 5;
        var z = 10;
        console.log('hello world');
        console.log(z);
    };

    func();

    var a = 'hi';

    function func2(a) {
        console.log(a);
    }

    func2(10);

    function ususedFunction() {
        console.log('hi');
        unusedFunction();
    }

})();