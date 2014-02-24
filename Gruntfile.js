module.exports = function(grunt) {
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-docco');
  
  // Project configuration.
  grunt.initConfig({
    uglify: {
      all: {
        files: {
          'story-machine-min.js': ['story-machine.js']
        }
      }
    },
    docco: {
      main: {
        src: ['story-machine.js'],
        options: {
          output: 'docs/'
        }
      }
    },
    jshint: {
      all: ["story-machine.js"]
    }
  });
  
  grunt.registerTask('default', ['jshint','uglify','docco']);
};