module.exports = function(grunt) {
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  
  // Project configuration.
  grunt.initConfig({
    uglify: {
      all: {
        files: {
          'story-machine-min.js': ['story-machine.js']
        }
      }
    },
    jshint: {
      all: ["story-machine.js"]
    }
  });
};