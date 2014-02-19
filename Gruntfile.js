module.exports = function(grunt) {
  grunt.loadNpmTasks('grunt-contrib-uglify');
  
  // Project configuration.
  grunt.initConfig({
    uglify: {
      all: {
        files: {
          'story-machine-min.js': ['story-machine.js']
        }
      }
    }
  });
};