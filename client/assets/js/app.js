(function () {
  'use strict';

  angular.module('application', [
    'ui.router',
    'ngAnimate',
    'firebase',
    'highcharts-ng',

    //foundation
    'foundation',
    'foundation.dynamicRouting',
    'foundation.dynamicRouting.animations'
  ])
    .constant('FIREBASE_URL', 'https://blazing-heat-1366.firebaseIO.com/')

    .run(["$rootScope", "$state", function ($rootScope, $state) {
      $rootScope.$on("$stateChangeError", function (event, toState, toParams, fromState, fromParams, error) {
        // We can catch the error thrown when the $requireAuth promise is rejected
        // and redirect the user back to the home page
        if (error === "AUTH_REQUIRED") {
          console.log("You must login");
          $state.go("home");
        }
      });
    }])

    .controller('topBarCtrl', function ($scope, $state, FIREBASE_URL, $firebaseObject, Auth) {

      $scope.login = function () {
        Auth.login($scope.login.user, $scope.login.pass);
      };
      $scope.logout = function () {
        Auth.logout();
      };
      $scope.getAuth = function () {
        var authData = Auth.getAuth();
        if (authData) {
          console.log("Logged in as: ", authData);
        } else {
          console.error("Authentication failed, authData: ", authData);
        }
      };
      $scope.getTeam = function () {
        Auth.getTeam().then(function (data) {
          console.log(data);
        })
      };
    })

    // Controller for the website landing page
    .controller('homeCtrl', function ($scope, $state, Auth) {
      //Put controller logic here
    })

    .controller('adminCtrl', function ($scope, $firebaseObject, $firebaseArray, FIREBASE_URL) {

      //Need to load the firebase arrays before using any functions on them, so define as global to controller
      var teamsNewsFeedRef = new Firebase(FIREBASE_URL + "newsFlashes/teams");
      $scope.teamNewsFeed = $firebaseArray(teamsNewsFeedRef);

      var adminNewsFeedRef = new Firebase(FIREBASE_URL + "newsFlashes/admin");
      $scope.adminNewsFeed = $firebaseArray(adminNewsFeedRef);

      var testName = new Firebase(FIREBASE_URL + "teams/simplelogin:2");
      $scope.testName1 = $firebaseObject(testName);

      //admin function to toggle news events to teams news feeds
      $scope.toggleNewsItem = function (newsObject) {
        if (newsObject.sentToTeams) {
          var indexToRemove = $scope.teamNewsFeed.$indexFor(newsObject.teamsNewsFeedId);
          $scope.teamNewsFeed.$remove(indexToRemove).then(function (ref) {
            newsObject.teamsNewsFeedId = "";
            newsObject.sentToTeams = false;
            $scope.adminNewsFeed.$save($scope.adminNewsFeed.$indexFor(newsObject.$id));
          });
        }
        else {
          $scope.teamNewsFeed.$add(newsObject).then(function (ref) {
            newsObject.teamsNewsFeedId = ref.key();
            newsObject.sentToTeams = true;
            $scope.adminNewsFeed.$save($scope.adminNewsFeed.$indexFor(newsObject.$id));
          });
        }
      };

      //remove the top item from the team news feed
      $scope.removeNewsItem = function () {
        $scope.teamNewsFeed.$remove(1);
      }

    })

    .controller('teamCtrl', function ($scope, $firebaseObject, $firebaseArray, FIREBASE_URL) {

      //Need to load the firebase arrays before using any functions on them, so define as global to controller
      var newsFeedRef = new Firebase(FIREBASE_URL).child("newsFlashes").child("teams");
      var query = newsFeedRef.orderByChild("quarter");
      $scope.newsfeed = $firebaseArray(query);


    })

    .controller('highchartsCtrl', function ($scope, $timeout) {
      $scope.chartConfig = {
        options: {
          chart: {
            zoomType: 'x'
          },
          rangeSelector: {
            enabled: true
          },
          navigator: {
            enabled: true
          }
        },
        series: [],
        title: {
          text: 'Hello'
        },
        useHighStocks: true
      }
      $scope.chartConfig.series.push({
        id: 1,
        data: [
          [1147651200000, 23.15],
          [1147737600000, 23.01],
          [1147824000000, 22.73],
          [1147910400000, 22.83],
          [1147996800000, 22.56],
          [1148256000000, 22.88],
          [1148342400000, 22.79],
          [1148428800000, 23.50],
          [1148515200000, 23.74],
          [1148601600000, 23.72],
          [1148947200000, 23.15],
          [1149033600000, 22.65]
        ]
      }, {
        id: 2,
        data: [
          [1147651200000, 25.15],
          [1147737600000, 25.01],
          [1147824000000, 25.73],
          [1147910400000, 25.83],
          [1147996800000, 25.56],
          [1148256000000, 25.88],
          [1148342400000, 25.79],
          [1148428800000, 25.50],
          [1148515200000, 26.74],
          [1148601600000, 26.72],
          [1148947200000, 26.15],
          [1149033600000, 26.65]
        ]

      });
    })

    .controller('tradeCtrl', function ($scope, tradeManager) {
      $scope.makeTrade = function () {
        tradeManager.makeTrade("something", "simplelogin:2");
      }
    })

    .factory("Auth", function ($firebaseAuth, $firebaseObject, $state, $rootScope, FIREBASE_URL) {
      var ref = new Firebase(FIREBASE_URL);
      var authObj = $firebaseAuth(ref);

      authObj.$onAuth(function (authUser) {
        if (authUser) {
          var ref = new Firebase(FIREBASE_URL + "teams/" + authUser.uid);
          var team = $firebaseObject(ref);
          if (authUser.uid === "simplelogin:3") { //check for admin user
            console.log(authUser);
            $rootScope.currentTeam = team;
            $state.go('admin');
          }
          else {
            console.log(authUser);
            $rootScope.currentTeam = team;
            $state.go('teams');
          }
        }
        else {
          $rootScope.currentTeam = "";
          $state.go('home');
        }
      });

      var getAuth = function () {
        var authData = authObj.$getAuth();
        return authData;
      };
      var requireAuth = function () {
        return authObj.$requireAuth();
      }
      // Returns a promise of the userData once the database has finished loading
      // Only query userData when authenticated
      var getTeam = function () {
        var teamRef = new Firebase(FIREBASE_URL + "teams/" + authObj.$getAuth().uid);
        var teamData = $firebaseObject(teamRef);
        return teamData.$loaded();
      };
      // Returns true if logged in
      var isLoggedIn = function () {
        return authObj.$getAuth() !== null;
      };
      // Login function, returns a promise
      var login = function (userName, password) {
        return authObj.$authWithPassword({
          email: userName + "@team.com",
          password: password
        });
      };
      // Logout function, calls $onAuth() after completing
      var logout = function () {
        return authObj.$unauth()
      };

      return {
        getAuth: getAuth,
        requireAuth: requireAuth,
        getTeam: getTeam,
        isLoggedIn: isLoggedIn,
        login: login,
        logout: logout
      };
    })

    .factory("tradeManager", function (Auth, $firebaseArray, $firebaseObject, FIREBASE_URL) {
      var availableTeams;
      var userId = Auth.getAuth().uid;

      var tradesSentRef = new Firebase(FIREBASE_URL).child("teams").child(userId).child("trades").child("sent");
      var tradesSent = $firebaseArray(tradesSentRef); // trade sent array specific to each user

      var makeTrade = function (price, receivingTeam) {
        var tradesRef = new Firebase(FIREBASE_URL).child("trades");
        var trades = $firebaseArray(tradesRef); // Trade status object containing accept, pend arrays
        var receivingTeamRef = new Firebase(FIREBASE_URL).child("teams").child(receivingTeam).child("trades").child("pending");
        var receivingTeamPending = $firebaseArray(receivingTeamRef); // trade pending array specific to receiving team
        var tradeObject = {
          companyProviding: "Providing Team",
          companyReceiving: "Receiving Team",
          industry: "Accounting",
          service: "Audit",
          interalCostOfService: "1 MIL",
          priceSoldFor: "2 MIL",
          quarter: "1"
        };
        return trades.$add(tradeObject).then(function (ref) {
          var id = ref.key();
          console.log(tradesSent, id);
          tradesSent.$add(id); // add trade ID to sent trades array
          tradesSent.$save(id); // save the id to the array
          receivingTeamPending.$add(id); // add trade ID to sent trades array
          receivingTeamPending.$save(id); // save the id to the array
        });
      };

      var acceptTrade = function (id) {
        var tradesAcceptRef = new Firebase(FIREBASE_URL).child("teams").child(userId).child("trades").child("sent");
        var tradesAccept = $firebaseArray(tradesAcceptRef); // trade sent array specific to each user

        tradesSent.$remove(id)
          .then(function () {
            tradesAccept.$add(id)
              .then(function (ref) {
                console.log("trade successfully accepted.");
              });
          });
        tradesAccept.$save(id);
      };

      var declineTrade = function () {
        var tradesDeclinedRef = new Firebase(FIREBASE_URL).child("teams").child(userId).child("trades").child("declined");
        var tradesDeclined = $firebaseArray(tradesDeclinedRef); // trade sent array specific to each user

        tradesSent.$remove(id)
          .then(function () {
            tradesDeclined.$add(id)
              .then(function () {
                console.log("trade successfully declined.");
              });
          });
        tradesDeclined.$save(id);
      };

      var getTrades = function () {

      };

      return {
        makeTrade: makeTrade,
        acceptTrade: acceptTrade,
        declineTrade: declineTrade,
        getTrades: getTrades
      }
    })

    .config(config)
    .run(run);

  config.$inject = ['$stateProvider', '$locationProvider', '$urlRouterProvider'];

  function config($stateProvider, $locationProvider, $urlProvider) {
    $stateProvider
      .state('home', {
        url: '/',
        templateUrl: 'templates/home.html',
        controller: 'homeCtrl'
      })
      .state('teams', {
        url: '/teams',
        templateUrl: 'templates/teams.html',
        controller: 'teamCtrl',
        resolve: {
          // controller will not be loaded until $waitForAuth resolves
          // Auth refers to our $firebaseAuth wrapper in the example above
          "currentAuth": ["Auth", function (Auth) {
            // requireAuth returns a promise if authenticated, rejects if not
            return Auth.requireAuth();
          }]
        }
      })
      .state('admin', {
        url: '/admin',
        templateUrl: 'templates/admin.html',
        controller: 'adminCtrl',
        resolve: {
          // controller will not be loaded until $waitForAuth resolves
          // Auth refers to our $firebaseAuth wrapper in the example above
          "currentAuth": ["Auth", function (Auth) {
            // requireAuth returns a promise if authenticated, rejects if not
            return Auth.requireAuth();
          }]
        }
      });
    // Default to the index view if the URL loaded is not found
    $urlProvider.otherwise('/');

    // Use this to enable HTML5 mode
    $locationProvider.html5Mode({
      enabled: false,
      requireBase: false
    });

    // Use this to set the prefix for hash-bangs
    // Example: example.com/#!/page
    $locationProvider.hashPrefix('!');
  }

  function run() {
    FastClick.attach(document.body);
  }

})
();
