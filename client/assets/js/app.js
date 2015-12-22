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

    .controller('teamCtrl', function ($scope, $firebaseObject, $firebaseArray, FIREBASE_URL, Auth) {

      //Need to load the firebase arrays before using any functions on them, so define as global to controller
      var newsFeedRef = new Firebase(FIREBASE_URL).child("newsFlashes").child("teams");
      var query = newsFeedRef.orderByChild("quarter");
      $scope.newsfeed = $firebaseArray(query);

      var tradesRef = new Firebase(FIREBASE_URL).child("teams").child(Auth.getAuth().uid).child("trades");
      $scope.trades = $firebaseObject(tradesRef);
      $scope.seeTrades = function () {
        console.log($scope.trades.pending);
      }

      var competitorsRef = new Firebase(FIREBASE_URL).child("teams").child(Auth.getAuth().uid).child("competitors");
      $scope.competitors = $firebaseObject(competitorsRef);

      var servicesRef = new Firebase(FIREBASE_URL).child("teams").child(Auth.getAuth().uid).child("services");
      $scope.servicesOffered = $firebaseObject(servicesRef);

      // Define ng model variables EMPTY for when page loads - see teams.html trade section
      $scope.buyingTeam = '';
      $scope.serviceToSell = '';

      $scope.testClick = function() {
        console.log($scope.buyingTeam);
        console.log($scope.serviceToSell);
        console.log(Auth.getAuth().uid);
      }

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
          text: 'Quarterly Revenue and Cost Data'
        },
        useHighStocks: false
      };

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

    .controller('tradeCtrl', function ($scope, tradeManager, Auth) {
      $scope.makeTrade = function (price, receivingTeam, serviceOffered) {
        tradeManager.makeTrade(price, receivingTeam, $scope.currentTeam, serviceOffered);
      };

      $scope.acceptTrade = function (id) {
        tradeManager.acceptTrade(id);
      };

      $scope.declineTrade = function (id) {
        tradeManager.declineTrade(id);
      };

      $scope.testTrade = function (price, receivingTeam, serviceOffered) {
        console.log($scope.currentTeam.name + " with Id of " + Auth.getAuth().uid + " is selling " + serviceOffered + " for $" + price + " to " + receivingTeam.name + " with Id of " + receivingTeam.id);
        console.log($scope.currentTeam);
        console.log(receivingTeam);
      }
    })

    .factory("Auth", function ($firebaseAuth, $firebaseObject, $state, $rootScope, FIREBASE_URL) {
      var ref = new Firebase(FIREBASE_URL);
      var authObj = $firebaseAuth(ref);

      // Set the state of the app and the rootscope object currentTeam to the object containing the currentTeam data
      authObj.$onAuth(function (authUser) {
        if (authUser) {
          var ref = new Firebase(FIREBASE_URL + "teams/" + authUser.uid);
          var team = $firebaseObject(ref);
          if (authUser.uid === "ca97176c-ad12-457a-954e-580ba61574d6") { //check for admin user
            //console.log(authUser);
            $rootScope.currentTeam = team;
            $state.go('admin');
          }
          else {
            //console.log(authUser);
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
      var currentUserId = Auth.getAuth().uid; // Get the currentUserId of the currently logged in team for the trade

      // Define all the firebase arrays needed for the below functions
      var tradesSentRef = new Firebase(FIREBASE_URL).child("teams").child(currentUserId).child("trades").child("sent");
      var tradesSent = $firebaseArray(tradesSentRef);

      var tradesPendingRef = new Firebase(FIREBASE_URL).child("teams").child(currentUserId).child("trades").child("pending");
      var tradesPending = $firebaseArray(tradesPendingRef);

      var tradesAcceptRef = new Firebase(FIREBASE_URL).child("teams").child(currentUserId).child("trades").child("accepted");
      var tradesAccept = $firebaseArray(tradesAcceptRef); // trade sent array specific to each user

      var tradesDeclinedRef = new Firebase(FIREBASE_URL).child("teams").child(currentUserId).child("trades").child("declined");
      var tradesDeclined = $firebaseArray(tradesDeclinedRef);

      var makeTrade = function (price, receivingTeam, providingTeam, serviceOffered) {

        var receivingTeamRef = new Firebase(FIREBASE_URL).child("teams").child(receivingTeam.id).child("trades").child("pending");
        var receivingTeamPending = $firebaseArray(receivingTeamRef); // trade pending array specific to receiving team

        console.log(providingTeam.name + " with Id of " + currentUserId + " is selling " + serviceOffered + " for $" + price + " to " + receivingTeam.name + " with Id of " + receivingTeam.id)

        var tradeObject = {
          companyProvidingId: currentUserId, // Defined above
          companyProvidingName: providingTeam.name, // Get the currently logged in team's name
          companyReceivingId: receivingTeam.id,
          companyReceivingName: receivingTeam.name,
          industry: "Accounting",
          service: serviceOffered,
          interalCostOfService: "1 MIL",
          priceSoldFor: price,
          quarter: "1"
        };

        var tradeSentId = '';
        var tradePendingId = '';

        tradesSent.$add(tradeObject)
          .then(function (ref) {
            tradeSentId = ref.key(); // Save the id that firebase stores for the sent array
            receivingTeamPending.$add(tradeObject)
              .then(function (ref) {
                tradePendingId = ref.key(); // Save the id that firebase stores for the pending array

                // Get the indexes for the current trade objects
                var tradeSentIndex = tradesSent.$indexFor(tradeSentId);
                var tradePendingIndex = receivingTeamPending.$indexFor(tradePendingId);

                tradesSent[tradeSentIndex].tradeSentId = tradeSentId;
                tradesSent[tradeSentIndex].tradePendingId = tradePendingId;
                receivingTeamPending[tradePendingIndex].tradeSentId = tradeSentId;
                receivingTeamPending[tradePendingIndex].tradePendingId = tradePendingId;
                tradesSent.$save(tradeSentIndex);
                receivingTeamPending.$save(tradePendingIndex);

              }); // add trade ID to the receiving team's trades pending array
          }); // add trade ID to sent trades array

      };

      var acceptTrade = function (id) {

        var tradeObjectPending = tradesPending.$getRecord(id);

        // Define the providing team's sent array to remove trade object
        var providingTeamId = tradesPending.$getRecord(id).companyProvidingId;

        var providingTeamSentRef = new Firebase(FIREBASE_URL).child("teams").child(providingTeamId).child("trades").child("sent");
        var providingTeamTradesSent = $firebaseArray(providingTeamSentRef);
        var providingTeamAcceptedRef = new Firebase(FIREBASE_URL).child("teams").child(providingTeamId).child("trades").child("accepted");
        var providingTeamTradesAccepted = $firebaseArray(providingTeamAcceptedRef);

        // Remove and add to the accepted array for the offering team
        var sentTradeId = tradeObjectPending.tradeSentId;
        providingTeamTradesSent.$loaded(function () { // Always remember to make sure the data is loaded before executing
          var recordToRemove = providingTeamTradesSent.$getRecord(sentTradeId);
          providingTeamTradesSent.$remove(recordToRemove);
        });

        // Add the trade object to the accepted array for the other team
        providingTeamTradesAccepted.$add(tradeObjectPending);
        providingTeamTradesAccepted.$save(tradeObjectPending);

        // Add the trade object to the currently using team
        tradesPending.$remove(tradeObjectPending);
        tradesAccept.$add(tradeObjectPending);
        tradesAccept.$save(tradeObjectPending);

      };

      var declineTrade = function (id) {

        // Define the providing team's sent array to remove trade object
        var providingTeamId = tradesPending[id].companyProvidingId;

        var providingTeamSentRef = new Firebase(FIREBASE_URL).child("teams").child(providingTeamId).child("trades").child("sent");
        var providingTeamTradesSent = $firebaseArray(providingTeamSentRef);
        var providingTeamDeclinedRef = new Firebase(FIREBASE_URL).child("teams").child(providingTeamId).child("trades").child("declined");
        var providingTeamTradesDeclined = $firebaseArray(providingTeamDeclinedRef);

        // Define the trade object and the id for the same object in the sending teams array
        var tradeObjectPending = tradesPending[id];
        var sentTradeId = tradeObjectPending.tradeSentId;

        providingTeamTradesSent.$loaded(function () { // Always remember to make sure the data is loaded before executing
          var recordToRemove = providingTeamTradesSent.$getRecord(sentTradeId);
          providingTeamTradesSent.$remove(recordToRemove);
        });

        // Add the trade object to the accepted array for the other team
        providingTeamTradesDeclined.$add(tradeObjectPending);
        providingTeamTradesDeclined.$save(tradeObjectPending);

        // Add the trade object to the currently using team
        tradesPending.$remove(tradeObjectPending);
        tradesDeclined.$add(tradeObjectPending);
        tradesDeclined.$save(tradeObjectPending);
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
