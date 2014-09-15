// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
angular.module('mpct', ['ionic'])

// .constant('apiHost', 'localhost')
.constant('apiHost', 'mobius')
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
    // Lock orientation
    // https://github.com/cogitor/PhoneGap-OrientationLock/blob/master/www/orientationLock.js
    // return cordova.exec(success, fail, "OrientationLock", "lock", [orientation])
    cordova.exec(null, null, 'OrientationLock', 'lock', ['portrait']);
  });
})

.factory('api', function($http, apiHost, apiPort) {
  return {
    call: function(command, cb) {
      $http.post('http://' + apiHost + ':' + apiPort, command)
      .success(function(response) {
        // console.log(response);
        if (cb) cb();
      }).error(function(error) {
        // alert(error);
      });
    }
  };
})

.directive('butt', function($rootScope, api) {
  return {
    restrict: 'A',
    link: function(scope, element, attributes) {
      element.on('click', function() {
        var cmd,
          wake   = false,
          pause  = false,
          key    = attributes.butt || element.text(),
          a      = $rootScope.append ? ' -a' : '';

        switch (key) {
          case 'Mobius':   cmd = '-z mobius';   break;
          case 'CCast':    cmd = '-z ccast';    break;
          case 'Mini':     cmd = '-z mini';     break;
          case 'Off':      cmd = '-z pwoff'; pause = true; break;
          case '0':        cmd = '-z v00';      break;
          case '1':        cmd = '-z v30';      break;
          case '2':        cmd = '-z v35';      break;
          case '3':        cmd = '-z v40';      break;
          case '4':        cmd = '-z v45';      break;
          case '5':        cmd = '-z v50';      break;
          case '+':        cmd = '-z vup';      break;
          case '-':        cmd = '-z vdn';      break;
          case 'prev':     cmd = '-x prev';     break;
          case 'toggle':   cmd = '-x toggle';   break;
          case 'next':     cmd = '-x next';     break;
          case 'jump':     cmd = '-x seek +20%'; break;

          case 'dnbr':
            cmd = '-x add http://ildnb1.dnbradio.com:8000/';
            break;

          case 'db': cmd = '-rt db' + a; wake = true; break;
          case 'ch': cmd = '-rt ch' + a; wake = true; break;
          case 'mi': cmd = '-rt mi' + a; wake = true; break;
          case 'fo': cmd = '-rt fo' + a; wake = true; break;
          case 'du': cmd = '-rt du' + a; wake = true; break;

          case 'am': cmd = '-rt am' + a; wake = true; break;
          case 'ab': cmd = '-rt ab' + a; wake = true; break;
          case 'bb': cmd = '-rt bb' + a; wake = true; break;
          case 'dt': cmd = '-rt dt' + a; wake = true; break;
          case 'ho': cmd = '-rt ho' + a; wake = true; break;

          case 'te': cmd = '-rt te' + a; wake = true; break;
          case 'id': cmd = '-rt id' + a; wake = true; break;
          case 'cl': cmd = '-rt cl' + a; wake = true; break;
          case 'so': cmd = '-rt so' + a; wake = true; break;
          case 'el': cmd = '-rt el' + a; wake = true; break;
        }

        if (key === 'dnbr' && !a) {
          api.call('-x clear', function() {
            api.call(cmd, function() {
              api.call('-x play');
            });
          });
          return;
        }

        if (wake) api.call('-z mobius');

        if (pause) api.call('-x pause');

        api.call(cmd);
      });
    }
  };
})

.controller('PanelController', function($rootScope, $scope) {
  $scope.appendToggle = function(ap) {
    $rootScope.append = ap;
  };
});
