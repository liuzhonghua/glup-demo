'use strict'

var gulp = require("gulp"),
    less = require("gulp-less"),
    browserSync = require("browser-sync")
var path = require('path');
var notify = require("gulp-notify");
var cache = require('gulp-cache');
var del = require('del');
var sourcemaps = require('gulp-sourcemaps');
var cssnano = require('gulp-cssnano');
var uglify = require('gulp-uglify');
var htmlmin = require('gulp-htmlmin');
var imagemin = require('gulp-imagemin');
var rename = require('gulp-rename');

// 目录定义
var baseDir = './';
var distDir = path.join(baseDir, 'dist');
var srcDir = path.join(baseDir, 'src');

// 文件目录
var filepath = {
    'libs': ['bower_components/*/dist/**/*', 'bower_components/*/build/**/*'],
    'css': path.join(srcDir, 'css/**/*.css'),
    'js': path.join(srcDir, 'js/**/*.js'),
    'less': path.join(srcDir, 'less/**/*.less'),
    'sass': path.join(srcDir, 'sass/**/*.scss'),
    'image': path.join(srcDir, 'image/**/*'),
    'view': path.join(srcDir, '**/*.html'),
};

// 错误处理
var handlerError = function () {
    var args = Array.prototype.slice.call(arguments);
    notify.onError({
        title: 'compile error',
        message: '<%=error.message %>'
    }).apply(this, args);//替换为当前对象
    this.emit(); //提交
};

gulp.task("less", function() {
    gulp.src(filepath.less)
        .pipe(less())
        .on('error', handlerError)
        .pipe(gulp.dest(path.join(srcDir, 'css')))
        .pipe(browserSync.stream());
})


gulp.task("js-watch", function() {
    gulp.src(filepath.js)
    .pipe(browserSync.stream());
})

gulp.task("html", function() {
    gulp.src(filepath.view)
    .pipe(browserSync.stream());
})

gulp.task("serve", ["less", "js-watch", "html"], function() {
    browserSync.init({
        server : "./dist",
        port: 8081,
    });
    gulp.watch('./src/**/*.+(less||js||html)',['build']).on("change", function() {
        browserSync.reload();
    });
});


//清除缓存
gulp.task('cleanCache', function (cb) {
    return cache.clearAll(cb);
});

// 清空发布目录
gulp.task('clean', ['cleanCache'], function (cb) {
    return del([path.join(distDir, '**/*')], cb);
});


// 打包第三方包
gulp.task('libs', function () {
    return gulp.src(filepath.libs)
        .pipe(gulp.dest(path.join(srcDir, 'libs')));
});


// 发布流程:html
gulp.task('release:html', function () {
    var options = {
        //清除HTML注释
        removeComments: true,

        //压缩HTML
        collapseWhitespace: true,

        //删除所有空格作属性值 <input id="" /> ==> <input />
        removeEmptyAttributes: true,

        //压缩页面JS
        minifyJS: true,

        //压缩页面CSS
        minifyCSS: true
    };
    return gulp.src(filepath.view)
        .pipe(cache(htmlmin(options)))
        .pipe(gulp.dest(distDir));
});

// 发布流程:style
gulp.task('release:style', ['build'], function () {
    return gulp.src(filepath.css)
        .pipe(sourcemaps.init())
        .pipe(cache(cssnano()))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest(path.join(distDir, 'css')));
});

// 发布流程:js
gulp.task('release:javascript', function () {
    return gulp.src(filepath.js)
        .pipe(sourcemaps.init())
        .pipe(uglify())
        .pipe(sourcemaps.write())
        .pipe(gulp.dest(path.join(distDir, 'js')));
});

gulp.task('release:libs', ['libs'], function () {
    return gulp.src(path.join(srcDir, 'libs/**/*'))
        .pipe(gulp.dest(path.join(distDir, 'libs')));
});


gulp.task('release:images', function () {
    return gulp.src(path.join(srcDir, 'images/**/*'))
        .pipe(cache(imagemin({

            //类型：Number  默认：3  取值范围：0-7（优化等级）
            optimizationLevel: 5,

            //类型：Boolean 默认：false 无损压缩jpg图片 
            progressive: true,

            //类型：Boolean 默认：false 隔行扫描gif进行渲染 
            interlaced: true,

            //类型：Boolean 默认：false 多次优化svg直到完全优化 
            multipass: true,

            svgoPlugins: [{ removeViewBox: false }]
            
        })))
        .pipe(gulp.dest(path.join(distDir, 'images')));
});

// 发布任务list
var releaseTasks = [
    'release:html',
    'release:style',
    'release:javascript',
    'release:libs',
    'release:images',
    'build'
];

// 发布
gulp.task('release', releaseTasks);

gulp.task('build',['less','js-watch','html']);

gulp.task("default", ["serve"])

gulp.task('release', releaseTasks);