'use strict';

// Include dependencies
var gulp = require('gulp'),
    $ = require('gulp-load-plugins')({
        pattern : [
            'gulp-*',
            'lazypipe',
            'rimraf'
        ]
    });

// Helpers
var debug = function (glob) {
    return $.lazypipe()
        .pipe(function() {
            return $.debug({ title : '' });
        })
        .pipe(function() {
            return $.ignore.exclude(!!glob ? glob : '*.*');
        })
        .pipe(function() {
            return gulp.dest('./temp');
        })();
}

var tslint = function () {
    return $.lazypipe()
        .pipe(function() {
            return $.tslint({ formatter : 'verbose' });
        })
        .pipe(function() {
            return $.tslint.report({ emitError : false });
        })();
}

// Clean file(s)
var clean = {
    'temp' : function(done) {
        $.rimraf('./temp', done);
    },
    //'build' : function(done) {
    //    $.rimraf('./build', done);
    //},
    //'dist' : function(done) {
    //    $.rimraf('./dist', done);
    //},
    'bundles' : function(done) {
        $.rimraf('./bundles', done);
    },
    'index.js': function (done) {
        $.rimraf('./index.js', done);
    },
    'index.d.ts': function (done) {
        $.rimraf('./index.d.ts', done);
    },
    'index.metadata.json': function (done) {
        $.rimraf('./index.metadata.json', done);
    },
    'ng2-metadata.js': function (done) {
        $.rimraf('./ng2-metadata.js', done);
    },
    'ng2-metadata.d.ts' : function(done) {
        $.rimraf('./ng2-metadata.d.ts', done);
    },
    'ng2-metadata.metadata.json' : function(done) {
        $.rimraf('./ng2-metadata.metadata.json', done);
    },
    'src/*.js': function (done) {
        $.rimraf('./src/**/*.js', done);
    },
    'src/*.d.ts': function (done) {
        $.rimraf('./src/**/*.d.ts', done);
    },
    'src/*.metadata.json': function (done) {
        $.rimraf('./src/**/*.metadata.json', done);
    }
};

clean['temp'].displayName = 'clean:./temp/**';
//clean['build'].displayName = 'clean:./build/**';
//clean['dist'].displayName = 'clean:./dist/**';
clean['bundles'].displayName = 'clean:./bundles/**';
clean['index.js'].displayName = 'clean:./index.js';
clean['index.d.ts'].displayName = 'clean:./index.d.ts';
clean['index.metadata.json'].displayName = 'clean:./index.metadata.json';
clean['ng2-metadata.js'].displayName = 'clean:./ng2-metadata.js';
clean['ng2-metadata.d.ts'].displayName = 'clean:./ng2-metadata.d.ts';
clean['ng2-metadata.metadata.json'].displayName = 'clean:./ng2-metadata.metadata.json';
clean['src/*.js'].displayName = 'clean:./src/*.js';
clean['src/*.d.ts'].displayName = 'clean:./src/*.js';
clean['src/*.metadata.json'].displayName = 'clean:./src/*.js';

// TypeScript
var ts = {
    'ng2-metadata' : {
        compile_src : function(done) {
            var tsProject = $.typescript.createProject('./tsconfig.json'),
                tsResult = gulp.src('./src/**/*.ts')
                    .pipe($.changed('./build', { extension : '.js' }))
                    .pipe(tsProject());

            var merge2 = require('merge2');

            return merge2([tsResult.js
                .pipe(gulp.dest('./build/dist'))
                .pipe(debug('**/*.*')),
                tsResult.dts
                .pipe(gulp.dest('./build/dist'))
                .pipe(debug('**/*.*'))
            ]).on('end', done);
        },
        copy_src_dist: function (done) {
            return gulp.src('./src/**/*.ts')
                .pipe(gulp.dest('./dist'))
                .pipe(debug('**/*.*'))
                .on('end', done);
        },
        compile_main: function (done) {
            var tsProject = $.typescript.createProject('./tsconfig.json'),
                tsResult = gulp.src('./ng2-metadata.ts')
                    .pipe($.changed('./build', { extension : '.js' }))
                    .pipe(tsProject());

            var merge2 = require('merge2');

            return merge2([tsResult.js
                .pipe(gulp.dest('./build'))
                .pipe(debug('**/*.*')),
                tsResult.dts
                .pipe(gulp.dest('./build'))
                .pipe(debug('**/*.*'))
            ]).on('end', done);
        },
        bundle_defs: function (done) {
            var dts = require('dts-bundle');

            dts.bundle({
                name: 'ng2-metadata',
                main: './build/ng2-metadata.d.ts',
                out: '../ng2-metadata.d.ts'
            });

            done();
        },
        bundle_umd: function (done) {
            var ignoreDeps = {};
            ignoreDeps['./node_modules/@angular/*'] = { build: false };
            ignoreDeps['./node_modules/rxjs/*'] = { build: false };

            var builder = $.systemjsBuilder();

            builder.config({
                paths: { '*': '*.js' },
                map: {
                    '@angular/common': './node_modules/@angular/common/bundles/common.umd.min.js',
                    '@angular/core': './node_modules/@angular/core/bundles/core.umd.min.js',
                    '@angular/platform-browser': './node_modules/@angular/platform-browser/bundles/platform-browser.umd.min.js',
                    '@angular/router': './node_modules/@angular/router/bundles/router.umd.min.js',
                    'rxjs': './node_modules/rxjs'
                },
                meta: ignoreDeps
            });

            return builder.buildStatic('./build/ng2-metadata.js',
                    'ng2-metadata.umd.min.js',
                    {
                        minify: true,
                        format: 'umd'
                    })
                .pipe(gulp.dest('./dist/bundles'))
                .pipe(debug())
                .on('end', done);
        },
        copy_main_build: function (done) {
            return gulp.src('./ng2-metadata.ts')
                .pipe(gulp.dest('./build'))
                .pipe(debug())
                .on('end', done);
        },
        copy_src_build: function (done) {
            return gulp.src('./src/**/*.ts')
                .pipe(gulp.dest('./build/dist'))
                .pipe(debug('**/*.*'))
                .on('end', done);
        },
        compile_aot: function(done) {
            var options = {
                continueOnError: false,
                pipeStdout: false,
                customTemplatingThing: 'test'
            };
            var reportOptions = {
                err: true,
                stderr: true,
                stdout: true
            }

            return gulp.src('./tsconfig-aot.json')
              .pipe($.exec('ngc -p "./tsconfig-aot.json"', options))
              .pipe($.exec.reporter(reportOptions))
              .on('end', done);
        },
        copy_main_dist: function (done) {
            return gulp.src([
                    './build/ngfactory/ng2-metadata.js'
            ])
                .pipe(gulp.dest('./'))
                .pipe(debug())
                .on('end', done);
        },
        copy_build_dist: function (done) {
            return gulp.src([
                    './build/ngfactory/dist/**/*.js',
                    './build/dist/**/*.d.ts'
                ])
                .pipe(gulp.dest('./dist'))
                .pipe(debug('**/*.*'))
                .on('end', done);
        },
        copy_metadata_dist: function (done) {
            return gulp.src('./build/ngfactory/**/*.metadata.json')
                .pipe(gulp.dest('./'))
                .pipe(debug('**/*.*'))
                .on('end', done);
        },
        lint : function(done) {
            return gulp.src('./src/**/*.ts')
                .pipe(tslint())
                .on('end', done);
        }
    }
};

ts['ng2-metadata'].compile_src.displayName = 'compile:ts-src';
ts['ng2-metadata'].copy_src_dist.displayName = 'copy:src->dist';
ts['ng2-metadata'].compile_main.displayName = 'compile:ts-main';
ts['ng2-metadata'].bundle_defs.displayName = 'bundle:def\'s';
ts['ng2-metadata'].bundle_umd.displayName = 'bundle:umd';
ts['ng2-metadata'].copy_src_build.displayName = 'copy:src->build';
ts['ng2-metadata'].copy_main_build.displayName = 'copy:main->build';
ts['ng2-metadata'].compile_aot.displayName = 'compile:ts-aot';
ts['ng2-metadata'].copy_main_dist.displayName = 'copy:main->dist';
ts['ng2-metadata'].copy_build_dist.displayName = 'copy:build->dist';
ts['ng2-metadata'].copy_metadata_dist.displayName = 'copy:metadata->dist';
ts['ng2-metadata'].lint.displayName = 'lint:ts';

//*** __CLEAN__
gulp.task('__CLEAN__',
    gulp.parallel(
        clean['temp'],
        clean['bundles'],
        //clean['dist'],
        clean['index.js'],
        clean['index.d.ts'],
        clean['index.metadata.json'],
        clean['ng2-metadata.js'],
        clean['ng2-metadata.d.ts'],
        clean['ng2-metadata.metadata.json'],
        clean['src/*.js'],
        clean['src/*.d.ts'],
        clean['src/*.metadata.json']
    ));

//*** _BUILD_
gulp.task('_BUILD_',
    gulp.series(
        ts['ng2-metadata'].compile_src,
        ts['ng2-metadata'].copy_src_dist,
        ts['ng2-metadata'].compile_main
        //clean['dist']
    ));

//*** _BUILD_UMD_
gulp.task('_BUILD_UMD_',
    gulp.parallel(
        ts['ng2-metadata'].bundle_defs,
        ts['ng2-metadata'].bundle_umd
    ));

//*** _BUILD_AoT_
gulp.task('_BUILD_AoT_',
    gulp.parallel(
        ts['ng2-metadata'].copy_src_build,
        ts['ng2-metadata'].copy_main_build,
        ts['ng2-metadata'].compile_aot
    ));

//*** __DIST__
gulp.task('__DIST__',
    gulp.series(
        '__CLEAN__',
        '_BUILD_',
        '_BUILD_UMD_',
        '_BUILD_AoT_',
        ts['ng2-metadata'].copy_main_dist,
        ts['ng2-metadata'].copy_build_dist,
        ts['ng2-metadata'].copy_metadata_dist
        //clean['build']
    ));

//*** Review
gulp.task('review:ts',
    gulp.parallel(
        ts['ng2-metadata'].lint
    ));

var bundle = function (done) {
    const webpack = require('webpack');
    const webpackStream = require('webpack-stream');

    const conf = require('./webpack.config.js');

    return gulp.src('./index.ts')
                .pipe(webpackStream(conf, webpack))
                .pipe(gulp.dest('./bundles'))
                .on('end', done);
}

//*** ____TEST_webpack____
gulp.task('____TEST_webpack____',
    gulp.series(
        bundle
    ));

var compile = function(done) {
    const options = {
        continueOnError: false,
        pipeStdout: false,
        customTemplatingThing: 'test'
    };
    const reportOptions = {
        err: true,
        stderr: true,
        stdout: true
    };

    return gulp.src('./tsconfig.json')
      .pipe($.exec('ngc -p "./tsconfig.json"', options))
      .pipe($.exec.reporter(reportOptions))
      .on('end', done);
}

var dts = function (done) {
    const dts = require('dts-bundle');

    dts.bundle({
        name: 'ng2-metadata',
        main: './index.d.ts',
        out: './index.d.ts'
    });

    done();
}

//*** ____TEST_AoT____
gulp.task('____TEST_AoT____',
    gulp.series(
        '__CLEAN__',
        compile//,
        //dts
    ));