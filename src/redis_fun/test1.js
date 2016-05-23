function test() {
    try {
        for (var i = 0; i < 1000000000; ++i) {
            if (i % 2) {
                ;
            }
        }
    } catch (e) {
    }
}

test();