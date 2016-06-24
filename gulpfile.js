'use strict';

var HAML_SRC  = './assets/views/**/*.haml';
var HTML_SRC  = './**/*.html';
var HTML_DEST = './';
var SCSS_SRC  = './assets/stylesheets/**/*.scss';
var CSS_SRC   = './css/**/*.css';
var CSS_DEST  = './css/';

var gulp = require('gulp');
var haml = require('gulp-ruby-haml');
var sass = require('gulp-sass');
var scsslint = require('gulp-scss-lint');
var bs = require('browser-sync').create();

// browser-sync
gulp.task('bs', function(){
  var bsOptions = {};
  bsOptions.files = [HTML_SRC, CSS_SRC];
  bsOptions.server = './';
  bsOptions.port  = 3001;
  bs.init(bsOptions);
});

// haml
gulp.task('haml', function(){
  return gulp.src(HAML_SRC)
    .pipe(haml().on('error', function(e) { console.log(e.message); }))
    .pipe(gulp.dest(HTML_DEST));
});

// haml-watch
gulp.task('haml:watch', function(){
  var watcher = gulp.watch(HAML_SRC, ['haml']);
  watcher.on('change', function(event) {
    console.log('File ' + event.path + ' was ' + event.type + ', running tasks...');
  });
});

// SCSS
gulp.task('sass', function(){
  return gulp.src(SCSS_SRC)
    .pipe(sass.sync().on('error', sass.logError))
    .pipe(gulp.dest(CSS_DEST));
});


// scss-lint
gulp.task('scss-lint', function(){
  return gulp.src(SCSS_SRC)
    .pipe(scsslint());
});


// scss-watch
gulp.task('scss:watch', function(){
  var watcher = gulp.watch(SCSS_SRC, ['scss-lint', 'sass']);
  watcher.on('change', function(event) {
    console.log('File ' + event.path + ' was ' + event.type + ', running tasks...');
  });
});

gulp.task('default', ['bs', 'haml:watch', 'scss:watch']);
