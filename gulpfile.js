'use strict'

import path from 'path'
import gulp from 'gulp'
import del from 'del'
import runSequence from 'run-sequence'
import browserSync from 'browser-sync'
import swPrecache from 'sw-precache'
import gulpLoadPlugins from 'gulp-load-plugins'


const $ = gulpLoadPlugins()
const reload = browserSync.reload

// Link javascript
gulp.task('lint', () =>
  gulp.src(['src/js/**/*.js'])
    .pipe($.eslint())
    .pipe($.eslint.format())
    .pipe($.if(!browserSync.active, $.eslint.failAfterError()))
)

// compile and automatically prefix stylesheet
gulp.task('styles', () => {
  const AUTOPREFIXER_BROWSERS = [
    'ie >= 10',
    'ie_mob >= 10',
    'ff >= 30',
    'chrome >= 34',
    'safari >= 7',
    'opera >= 23',
    'ios >= 7',
    'android >= 4.4',
    'bb >= 10'
  ]

  // For best performance, don't add sass partials to gulp.src
  return gulp.src([
    'src/scss/**/*.scss'
  ])
    .pipe($.newer('.tmp/tyles'))
    .pipe($.sourcemaps.init())
    .pipe($.sass({
      precision: 10
    })).on('error', $.sass.logError)
    .pipe($.autoprefixer(AUTOPREFIXER_BROWSERS))
    .pipe(gulp.dest('.tmp/styles'))
    // concatenate and minify styles
    .pipe($.if('*.css', $.cssnano()))
    .pipe($.size({title: 'styles'}))
    .pipe($.sourcemaps.write('./'))
    .pipe(gulp.dest('dist/styles'))
    .pipe(gulp.dest('.tmp/styles'))
})


gulp.task('scripts', () =>
  gulp.src([
    'src/js/app.js'
  ])
    .pipe($newer('.tmp/scripts'))
    .pipe($.sourcemaps.init())
    .pipe($.babel())
    .pipe($.sourcemaps.write())
    .pipe(gulp.dest('.tmp/scripts'))
    .pipe($.uglify({preserveComments: 'some'}))
    // outPut files
    .pipe($.size({title: 'scripts'}))
    .pipe($.sourcemaps.write('.'))
    .pipe(gulp.dest('dist/scripts'))
    .pipe(gulp.dest('.tmp/scripts'))
)

// Scan your HTMl for assets & optimize them
gulp.task('html', () => {
  return gulp.src('src/**/*.html')
    .pipe($.useref({
      searchpath: '{.tmp, app}',
      noAssets: true
    }))

    // Minify any HTMl
    .pipe($.if('*.html', $.htmlmin({
      removeComments: true,
      collapseWhitespace: true,
      collapseBooleanAttributes: true,
      removeAttributeQuotes: true,
      removeRedundantAttributes: true,
      removeEmptyAttributes: true,
      removeScriptTypeAttributes: true,
      removeStyleLinkTypeAttributes: true,
      removeOptionalTags: true
    })))
    // Output files
    .pipe($.if('*.html', $.size({title: 'html', showFiles: true})))
    .pipe(gulp.dest('dist'))
})

// Clean output directory
gulp.task('clean', () => del(['.tmp', 'dist/*', '!dist.git'], {dot: true}))

// Wacth files for changes & reload
gulp.task('serve', ['scripts', 'styles'], () => {
  browserSync({
    notify: false,
    logPrefix: 'WSK',
    scrollElementMapping: ['main', '.mdl-layout'],
    server: ['.tmp', 'src'],
    port: 3000
  })

  gulp.watch(['src/**/*.html'], reload)
  gulp.watch(['src/scss/**/*.scss'], ['styles', reload])
  gulp.watch(['src/scripts/**/*.js'], ['lint', 'scripts', reload])
})

gulp.task('serve:dist', ['default'], () =>
  browserSync({
    notify: false,
    logPrefix: 'WSK',
    server: 'dist',
    port: 3001
  })
)

gulp.task('default', ['clean'], cb =>
  runSequence(
    'styles',
    ['lint', 'html', 'scripts', 'images', 'copy'],
    'generate-service-worker',
    cb
  )
)
