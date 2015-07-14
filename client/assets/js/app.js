(function () {
  'use strict';

  angular.module('application', [
    'ui.router',
    'ngAnimate',
    'firebase',

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

    .controller('menuCtrl', function ($scope, $state, FIREBASE_URL, $firebaseObject, Auth) {

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

    .controller('homeCtrl', function ($scope, $state, Auth) {
      $scope.login = function () {
        Auth.login($scope.login.user, $scope.login.pass);
      };
    })

    .controller('AppCtrl', function ($scope, $firebaseObject, $firebaseArray, FIREBASE_URL) {

      //Need to load the firebase arrays before using any functions on them, so define as global to controller
      var newsfeedRef = new Firebase(FIREBASE_URL + "newsFlashes/teams");
      $scope.newsfeed = $firebaseArray(newsfeedRef);

      var adminNewsfeedRef = new Firebase(FIREBASE_URL + "newsFlashes/admin");
      var adminNews = $firebaseArray(adminNewsfeedRef);
      var counter = 0;

      var testName = new Firebase(FIREBASE_URL + "teams/simplelogin:2");
      $scope.testName1 = $firebaseObject(testName);

      //admin function to add events to teams news feeds
      $scope.addNewsItem = function () {
        console.log("testing name access:" + $scope.testName1.name);
        $scope.newsfeed.$add(adminNews[counter]).then(function (ref) {
          var id = ref.key();
          console.log("Added record with id: " + id);
          console.log("Location in array: " + counter + " Item: " + adminNews[counter]);
          counter++;
        });
      };

      $scope.removeNewsItem = function () {
        $scope.newsfeed.$remove(1);
      }
    })

    .factory("Auth", function ($firebaseAuth, $firebaseObject, $state, $rootScope, FIREBASE_URL) {
      var ref = new Firebase(FIREBASE_URL);
      var authObj = $firebaseAuth(ref);

      authObj.$onAuth(function (authUser) {
        if (authUser) {
          var ref = new Firebase(FIREBASE_URL + "teams/" + authUser.uid);
          var team = $firebaseObject(ref);
          $rootScope.currentTeam = team;
          $state.go('teams');
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
        controller: 'AppCtrl',
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

})();
