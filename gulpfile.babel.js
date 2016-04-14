import gulp from "gulp";
import shell from "gulp-shell";
import rimraf from "rimraf";
import run from "run-sequence";
import watch from "gulp-watch";
import server from "gulp-live-server";

const paths = {
    js: ['./src/**/*.js'],
    tests: ['./src/spec/**/*.js'],
    destination: './app'
};

gulp.task('default', callback => {
    run('build', 'server', 'watch', callback);
});

gulp.task('build', callback => {
    run('clean', 'flow', 'babel', callback);
});

gulp.task('clean', callback => {
    rimraf(paths.destination, callback);
});

gulp.task('flow',
    shell.task([
        'flow'
    ], {
        ignoreErrors: true
    }));

gulp.task('babel', shell.task([
    'babel src --out-dir app'
]));


let express;

gulp.task('server', () => {
    express = server.new(paths.destination);
});

gulp.task('restart', () => {
    if (!express) {
        run('server', ()=> {
            express.scanDirectory.bind(express)();
        });
    } else {
        express.scanDirectory.bind(express)();
    }
});

gulp.task('watch', () => {
    return watch(paths.js, () => {
        run('build', 'restart');
    });
});

gulp.task('watch-test', () => {
    return watch(paths.js, () => {
        run('build', 'run-test');
    });
});

gulp.task('run-test', shell.task([
    'jasmine-node app/spec'
]));