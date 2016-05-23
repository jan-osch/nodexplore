function test() {
    for (var i = 0; i < 1000000000; ++i) {
        if (i % 2) {
            ;
        }
    }
}

try {
    test();
} catch (e) {
}