const gulp = require('gulp');

const sass = require('gulp-sass');

const del = require('del');

const uglify = require('gulp-uglify');

const cleanCSS = require('gulp-clean-css');

const rename = require('gulp-rename');

const merge = require('merge-stream');

const htmlreplace = require('gulp-html-replace');

const autoprefixer = require('gulp-autoprefixer');

const browserSync = require('browser-sync').create();

// Clean task
gulp.task('clean', () => del(['dist', 'src/css/app.css']));

// Copy third party libraries from node_modules into /vendor
gulp.task('vendor:js', () =>
  gulp
    .src([
      './node_modules/bootstrap/dist/js/*',
      './node_modules/jquery/dist/*',
      '!./node_modules/jquery/dist/core.js',
      './node_modules/popper.js/dist/umd/popper.*',
    ])
    .pipe(gulp.dest('./src/js/vendor')),
);

// Copy font-awesome from node_modules into /fonts
gulp.task('vendor:fonts', () =>
  gulp
    .src([
      './node_modules/font-awesome/**/*',
      '!./node_modules/font-awesome/{less,less/*}',
      '!./node_modules/font-awesome/{scss,scss/*}',
      '!./node_modules/font-awesome/.*',
      '!./node_modules/font-awesome/*.{txt,json,md}',
    ])
    .pipe(gulp.dest('./src/fonts/font-awesome')),
);

// vendor task
gulp.task('vendor', gulp.parallel('vendor:fonts', 'vendor:js'));

// Copy vendor's js to /dist
gulp.task('vendor:build', () => {
  const jsStream = gulp
    .src([
      './src/js/vendor/bootstrap.min.js',
      './src/js/vendor/jquery.slim.min.js',
      './src/js/vendor/popper.min.js',
    ])
    .pipe(gulp.dest('./dist/src/js/vendor'));
  const fontStream = gulp
    .src(['./src/fonts/font-awesome/**/*.*'])
    .pipe(gulp.dest('./dist/src/fonts/font-awesome'));
  return merge(jsStream, fontStream);
});

// Copy Bootstrap SCSS(SASS) from node_modules to /src/scss/bootstrap
gulp.task('bootstrap:scss', () =>
  gulp
    .src(['./node_modules/bootstrap/scss/**/*'])
    .pipe(gulp.dest('./src/scss/bootstrap')),
);

// Compile SCSS(SASS) files
gulp.task(
  'scss',
  gulp.series('bootstrap:scss', () =>
    gulp
      .src(['./src/scss/*.scss'])
      .pipe(
        sass
          .sync({
            outputStyle: 'expanded',
          })
          .on('error', sass.logError),
      )
      .pipe(autoprefixer())
      .pipe(gulp.dest('./src/css')),
  ),
);

// Minify CSS
gulp.task(
  'css:minify',
  gulp.series('scss', () =>
    gulp
      .src('./src/css/app.css')
      .pipe(cleanCSS())
      .pipe(
        rename({
          suffix: '.min',
        }),
      )
      .pipe(gulp.dest('./dist/src/css'))
      .pipe(browserSync.stream()),
  ),
);

// Minify Js
gulp.task('js:minify', () =>
  gulp
    .src(['./src/js/app.js'])
    .pipe(uglify())
    .pipe(
      rename({
        suffix: '.min',
      }),
    )
    .pipe(gulp.dest('./dist/src/js'))
    .pipe(browserSync.stream()),
);

// Replace HTML block for Js and Css file upon build and copy to /dist
gulp.task('replaceHtmlBlock', () =>
  gulp
    .src(['*.html'])
    .pipe(
      htmlreplace({
        js: 'src/js/app.min.js',
        css: 'src/css/app.min.css',
      }),
    )
    .pipe(gulp.dest('dist/')),
);

// Configure the browserSync task and watch file path for change
gulp.task('dev', done => {
  browserSync.init({
    server: {
      baseDir: './',
    },
  });
  gulp.watch(
    ['src/scss/*.scss', 'src/scss/**/*.scss', '!src/scss/bootstrap/**'],
    gulp.series('css:minify', donecb => {
      browserSync.reload();
      donecb(); // Async callback for completion.
    }),
  );
  gulp.watch(
    'src/js/app.js',
    gulp.series('js:minify', donecb => {
      browserSync.reload();
      donecb();
    }),
  );
  gulp.watch(['*.html']).on('change', browserSync.reload);
  done();
});

// Build task
gulp.task(
  'build',
  gulp.series(
    gulp.parallel('css:minify', 'js:minify', 'vendor'),
    'vendor:build',
    () =>
      gulp
        .src(['favicon.ico', 'src/img/**'], { base: './' })
        .pipe(gulp.dest('dist')),
    'replaceHtmlBlock',
  ),
);

// Default task
gulp.task('default', gulp.series('clean', 'build', 'replaceHtmlBlock'));
