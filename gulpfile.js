'use strict';

var HTML_SRC = './**/*.html';
var CSS_SRC  = './css/**/*.css';

var gulp = require('gulp');
var bs = require('browser-sync').create();

// browser-sync
gulp.task('bs', function(){
  var bsOptions = {};
  bsOptions.files = [HTML_SRC, CSS_SRC];
  bsOptions.server = './';
  // bsOptions.https = true;
  bs.init(bsOptions);
});

gulp.task('default', ['bs']);
