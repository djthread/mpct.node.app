// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
angular.module('mpct', ['ionic'])

// .constant('apiHost', 'localhost')
.constant('apiHost', 'mobius')
.constant('apiPort', 6601)
.constant('genres', {
  am: 'Ambient',
  ab: 'Ambient Beats',
  bb: 'Breakbeat',
  bc: 'Breakcore, Gabber, and Noise',
  ch: 'Chill Out and Dub',
  cl: 'Classical',
  co: 'Compilations',
  dj: 'DJ Beats',
  db: 'Drum \'n Bass',
  dt: 'Dub Techno',
  du: 'Dubstep',
  el: 'Electronic and Electro',
  fo: 'Folk',
  go: 'Goa',
  ho: 'House',
  id: 'IDM',
  ja: 'Jazz',
  me: 'Metal',
  mi: 'Minimalistic',
  po: 'Pop',
  pr: 'Post-rock',
  ra: 'Rap and Hip Hop',
  re: 'Reggae and Dub',
  ro: 'Rock',
  sl: 'Soul',
  so: 'Soundtracks',
  te: 'Techno',
  tr: 'Trance',
  th: 'Trip-Hop',
  we: 'Weird',
  wo: 'World and New Age'
})

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
    var fn = function(){};
    cordova.exec(fn, fn, 'OrientationLock', 'lock', ['portrait']);
  });
})

.factory('api', function($http, apiHost, apiPort) {
  return {
    call: function(command, cb) {
      $http.post('http://' + apiHost + ':' + apiPort, command)
      .success(function(response) {
        // console.log('response', response);
        if (cb) cb(response);
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
          case 'play':     cmd = '-x play';     break;
          case 'pause':    cmd = '-x pause';    break;
          case 'next':     cmd = '-x next';     break;
          case 'jump':     cmd = '-x seek +20%'; break;
          case 'this':     cmd = '-b' + a;      break;

          case 'dnbr':
            cmd = '-x add http://ildnb1.dnbradio.com:8000/';
            break;

          case 'db': cmd = '-rt db' + a; wake = true; break;
          case 'ch': cmd = '-rt ch' + a; wake = true; break;
          case 'ab': cmd = '-rt ab' + a; wake = true; break;
          case 'id': cmd = '-rt id' + a; wake = true; break;
          case 'ja': cmd = '-rt ja' + a; wake = true; break;
          case 'te': cmd = '-rt te' + a; wake = true; break;
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

        api.call(cmd, function() {
          $rootScope.$broadcast('shouldRefresh');
        });
      });
    }
  };
})

.directive('peeyLevelIonSlides', function() {
  return {
    restrict: 'A',
    link: function(scope, element, attrs) {
      scope.$watch(
        function () {
          var activeSlideElement = angular.element(
            element[0].getElementsByClassName(attrs.slideChildClass + '-active'));

          // constantly remove max height from current element to allow it to expand if required
          activeSlideElement.css('max-height', 'none');
          // if activeSlideElement[0] is undefined, it means that it probably hasn't loaded yet
          return angular.isDefined(activeSlideElement[0]) ? activeSlideElement[0].offsetHeight : 20;
        },
        function(newHeight, oldHeight) {
          var sildeElements = angular.element(
            element[0].getElementsByClassName(attrs.slideChildClass));
          sildeElements.css('max-height', newHeight + 'px');
        }
      );
    }
  }
})

// .directive('latestItem', function($rootScope, api) {
//   return {
//     restrict: 'A',
//     link: function(scope, element, attributes) {
//       element.on('click', function(
//     }
//   };
// })

.controller('PanelController', function($rootScope, $scope, $ionicScrollDelegate, $interval, api, genres) {

  $scope.activeIndex = 1;
  $scope.latest = [];
  $scope.playlist = [];
  $scope.status = 'idle';
  $scope.playing = false;
  $scope.percent = 0;

  $scope.appendToggle = function(ap) {
    $rootScope.append = ap;
  };

  $scope.slide = function(index) {
    $ionicScrollDelegate.scrollTop();
  };

  $scope.addLatest = function(dir) {
    var cmd = '-x add "' + dir + '"';

    if ($rootScope.append) {
      api.call(cmd);
    } else {
      api.call('-x clear', function() {
        api.call(cmd, function() {
          api.call('-x play');
        });
      });
    }
  };

  $scope.genres = [];
  angular.forEach(genres, function(val, key) {
    $scope.genres.push({
      short:   key,
      display: val
    });
  });

  $scope.addRandomByGenre = function(short) {
    api.call('-z mobius');
    a = $rootScope.append ? ' -a' : '';
    api.call('-rt ' + short + a, refresh);
  };

  $scope.play = function(pos) {
    api.call('-z mobius');
    api.call('-x play ' + pos, refresh);
  };

  // STATUS & PLAYLIST THINGS
  var refresh = function() {
    api.call('-x status', function(out) {
      out = out.trim().split("\n");
      $scope.status = out[0];
      $scope.playing = out[1].match(/\[playing\]/);
      var matches = out[1].match(/\((\d+)%\)/);
      $scope.percent = matches[1];
    });
    api.call('-x playlist', function(out) {
      $scope.playlist = [];
      angular.forEach(out.trim().split("\n"), function(val, key) {
        $scope.playlist.push({
          pos:     key + 1,
          display: val
        });
      });
    });
  };
  $interval(refresh, 5000);
  $rootScope.$on('shouldRefresh', refresh);
  refresh();

  api.call('-l', function(response) {
    $scope.latest = response.map(function(la) {
      var d = new Date(la.lm);
      la.formatted = d.getMonth() + '-' + d.getDate();
      la.display = la.dir.replace(/^tmp\/stage5\//, '')
        .replace(/^Chill Out and Dub\//, 'Chill/')
        .replace(/^Drum 'n Bass\//, 'DnB/');
      return la;
    });
  });
});
