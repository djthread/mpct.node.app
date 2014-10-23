// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
angular.module('mpct', ['ionic'])

// .constant('apiHost', 'localhost')
.constant('defaultApiHost', 'mobius')
.constant('hosts', {
  mobius: {
    hostname:   'mobius',
    port:       6601,
    useMarantz: true
  },
  pi: {
    hostname:   'mobius',
    port:       6602,
    useMarantz: false
  }
})

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

.config(function($stateProvider, $urlRouterProvider) {

  $stateProvider
    .state('tabs', {
      url:         '/tab',
      abstract:    true,
      templateUrl: 'tabs.html'
    })
    .state('tabs.main', {
      url: '/main',
      views: {
        'main-tab': {
          templateUrl: 'main.html',
          controller:  'MainController'
        }
      }
    })
    .state('tabs.genres', {
      url: '/genres',
      views: {
        'genres-tab': {
          templateUrl: 'genres.html',
          controller:  'GenresController'
        }
      }
    })
    .state('tabs.latest', {
      url: '/latest',
      views: {
        'latest-tab': {
          templateUrl: 'latest.html',
          controller:  'LatestController'
        }
      }
    })
    .state('tabs.settings', {
      url: '/settings',
      views: {
        'settings-tab': {
          templateUrl: 'settings.html',
          controller:  'SettingsController'
        }
      }
    });
/*
    .state('panel', {
      url: '/panel',
      templateUrl: 'panel.html',
      controller: 'PanelController'
    });
    */

  $urlRouterProvider.otherwise('/tab/main');
})

.run(function($ionicPlatform, api) {

  api.connect();

  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    // if(window.cordova && window.cordova.plugins.Keyboard) {
    //   alert('1');
    //   cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    // }
    //   alert('2');
    // if(window.StatusBar) {
    //   alert('3');
    //   StatusBar.styleDefault();
    // }

    // Lock orientation
    // https://github.com/cogitor/PhoneGap-OrientationLock/blob/master/www/orientationLock.js
    // return cordova.exec(success, fail, "OrientationLock", "lock", [orientation])
    // var fn = function(o){alert('OL: '+o);};
    // cordova.exec(fn, fn, 'OrientationLock', 'lock', ['portrait']);

  });
})

.factory('persister', function($interval) {
  var reconnectInterval;

  // Manage my own auto-reconnect since I want to have multiple sockets,
  // potentially, and thus I can't use the stock reconnection feature.
  var persist = function(socket) {
    endPersist();
    reconnectInterval = $interval(function() {
      if (socket.connected) return;
      socket.connect({reconnection: false});
    }, 2000);
  };

  var endPersist = function() {
    $interval.cancel(reconnectInterval);
  };

  return {
    persist:    persist,
    endPersist: endPersist
  };
})

.factory('api', function($rootScope, $interval, hosts, defaultApiHost, persister) {
  var heartbeat, sockets = [];

  if (heartbeat) {
    $interval.cancel(heartbeat);
  }

  console.log('api init');
  $rootScope.host       = defaultApiHost;
  $rootScope.connected  = false;
  $rootScope.useMarantz = null;

  var connect = function(hostName) {
    hostName = hostName || $rootScope.host;

    var host = hosts[hostName].hostname,
        port = hosts[hostName].port,
        s;

    // turn them all off
    angular.forEach(Object.keys(sockets), function(sn) {
      if (sockets[sn].connected) {
        console.log('disconnecting..');
        sockets[sn].io.disconnect();
      }
    });

    $rootScope.connected  = false;
    $rootScope.host       = null;
    $rootScope.status     = null;

    (function() {
      var hn = hostName;

      if (sockets[hn]) {
        console.log('reconnecting', hn, sockets[hn]);
        sockets[hn].connect({ reconnection: false });
        return;
      }

      console.log('connecting...', host, port);
      sockets[hn] = io.connect(
        'http://' + host + ':' + port,
        { reconnection: false }
      );

      sockets[hn].on('reconnection', function(attemptNum) {
        console.log('reconnect!');
      });

      sockets[hn].on('connect_error', function(err) {
        persister.persist(sockets[hn]);
      });

      sockets[hn].on('disconnect', function() {
        persister.persist(sockets[hn]);
        console.log('disconnected', hn);
        $rootScope.connected = false;
        $rootScope.host      = null;
      });

      sockets[hn].on('connect', function() {
        console.log('connected', sockets[hn]);
        persister.endPersist();
        $rootScope.connected  = true;
        $rootScope.host       = hn;
        $rootScope.useMarantz = hosts[hn].useMarantz;
        $rootScope.latest     = [];
        sockets[hn].emit('status');

        call('-l -c 50', function(response) {
          $rootScope.latest = response.map(function(la) {
            var d = new Date(la.lm);
            la.formatted = d.getMonth() + '-' + d.getDate();
            la.display = la.dir.replace(/^tmp\/stage5\//, '')
              .replace(/^Chill Out and Dub\//, 'Chill/')
              .replace(/^Drum 'n Bass\//, 'DnB/');
            return la;
          });
          $rootScope.$apply();
        });

        // Don't double-hook event handlers
        if (sockets[hn].hooked) return;

        sockets[hn].hooked = true;

        sockets[hn].on('status', function(status) {
          console.log('got status', status);
          $rootScope.status = status;

          var elapsed = $rootScope.status.status.elapsed;

          $rootScope.playing = status.status.state === 'play';

          var heartbeatFn = function() {
            if ($rootScope.status && $rootScope.status.currentSong) {
              elapsed++;
              $rootScope.percent = parseInt(elapsed
                / $rootScope.status.currentSong.Time * 100);
            } else {
              $rootScope.percent = 0;
            }
          };

          if (heartbeat) {
            $interval.cancel(heartbeat);
          }

          if ($rootScope.playing) {
            heartbeat = $interval(heartbeatFn, 1000);
            heartbeatFn();
          }

          $rootScope.$apply();
        });
      });
    })();
  };

  var call = function(command, cb) {

    if (!sockets[$rootScope.host].connected) {
      console.log('not connected. skipping', command);
      return;
    }

    // Ignore on marantz command when marantz mode is disabled
    if (command.match(/^-z /) && !$rootScope.useMarantz) {
      if (cb) cb();
      return;
    }

    console.log('emitting command to ' + $rootScope.host + ':', command, sockets[$rootScope.host].io.uri);
    sockets[$rootScope.host].emit('command', command, function(data) {
      console.log('data', data);
      if (cb) cb(data);
    });

  };

  return {
    connect: connect,
    call:    call
  };
})

.directive('butt', function($rootScope, api) {
  return {
    restrict: 'A',
    link: function(scope, element, attributes) {
      element.on('click', function() {
        if (!$rootScope.connected) return;

        var cmd,
          wake   = false,
          pause  = false,
          key    = attributes.butt || element.text(),
          a      = $rootScope.append ? ' -a' : '';

        switch (key) {
          case 'Mobius':   cmd = '-z mobius';   break;
          case 'CCast':    cmd = '-z ccast';    break;
          case 'Mini':     cmd = '-z mini';     break;
          case 'Off':      cmd = '-z pwoff';    pause = true; break;
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
          api.call('-z mobius');
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
          // $rootScope.$broadcast('shouldRefresh');
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

.controller('MainController', function($rootScope, $scope, $ionicScrollDelegate, api) {

  $scope.appendToggle = function(ap) {
    $rootScope.append = ap;
  };

  $scope.slide = function(index) {
    $ionicScrollDelegate.scrollTop();
  };

  $scope.play = function(pos) {
    pos = parseInt(pos);
    api.call('-z mobius');
    api.call('-x play ' + (pos + 1));
  };

})

.controller('GenresController', function($rootScope, $scope, api, genres) {

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
    api.call('-rt ' + short + a);
  };
})

.controller('LatestController', function($rootScope, $scope, api) {

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
})

.controller('SettingsController', function($rootScope, $scope, api) {
  $scope.connect = function(host) {
    api.connect(host);
  };
  $scope.wipeCache = function() {
    api.call('-w');
  };
});

  // $rootScope.launchClient = function() {
  //   // var fn = function(o){alert(o);};
  //   // cordova.exec(fn, fn, 'startApp', 'start', ['org.musicpd.android']);
  //   alert('wat');
  //   alert(navigator);
  //   navigator.startApp.check('org.musicpd.android', function(msg) {
  //     alert('ay. '+msg);
  //     navigator.startApp.start('org.musicpd.android', function(msg) {
  //       alert('by. '+msg);
  //       console.log(msg);
  //     }, function(er) {
  //       alert('bn. '+er);
  //     });
  //   }, function(er) {
  //     alert('an. '+er);
  //   });
  // };
