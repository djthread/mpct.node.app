// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
angular.module('mpct', ['ionic'])

.constant('apiHost', 'localhost')
// .constant('apiHost', 'mobius')
.constant('apiPort', 6601)

.config(function($stateProvider, $urlRouterProvider, $httpProvider) {

  $stateProvider
    .state('panel', {
      url: '/panel',
      templateUrl: 'panel.html',
      controller: 'PanelController'
    });

  $urlRouterProvider.otherwise('/panel');
})

.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if(window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if(window.StatusBar) {
      StatusBar.styleDefault();
    }
  });
})

.factory('api', function($http, apiHost, apiPort) {
  return {
    call: function(command, cb) {
      console.log('fou');
      console.log(command); 
      $http.post('http://' + apiHost + ':' + apiPort, command)
      .success(function(response) {
        console.log(response);
        if (cb) cb();
      }).error(function(error) {
        alert(error);
      });
    },
    button: function(text, cb) {
      console.log('thre');
      this.call('-rt db', cb);
    }
  };
})

.directive('butt', function(api) {
  return {
    restrict: 'A',
    link: function(scope, element, attributes) {
      console.log('one');
      element.on('click', function() {
        console.log('two');
        api.button(element.text());
      });
    }
  };
})

.controller('PanelController', function() {
});
