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
      var currentQuarterRef = new Firebase(FIREBASE_URL + "newsFlashes/currentQuarter");
      $scope.currentQuarter = $firebaseObject(currentQuarterRef);

      $scope.login = function () {
        Auth.login($scope.login.user, $scope.login.pass);
      };
      $scope.logout = function () {
        //console.log($scope.dataObj);
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
    .controller('homeCtrl', function ($scope, $state, Auth, $firebaseObject) {
      //Put controller logic here
    })
    // Controller for the website landing page
    .controller('companyAndServiceInfoCtrl', function ($scope, $state, Auth, $firebaseObject, FIREBASE_URL) {
      $scope.companyInfo = $firebaseObject(new Firebase(FIREBASE_URL + "simInfo/companyBios"));
      $scope.serviceInfo = $firebaseObject(new Firebase(FIREBASE_URL + "simInfo/serviceInfo"));

      $scope.showCompanies = {
        accounting: false,
        consulting: true,
        finance: true,
        marketing: true
      };
      $scope.radioVal = "accounting";
      $scope.toggleCards = function (industry) {
        var visibility = {
          accounting: true,
          consulting: true,
          finance: true,
          marketing: true
        };
        visibility[industry] = false;
        $scope.showCompanies = visibility;
      };
    })
    .controller('adminCtrl', function ($scope, $firebaseObject, $firebaseArray, FIREBASE_URL) {

      //Need to load the firebase arrays before using any functions on them, so define as global to controller
      var teamsNewsFeedRef = new Firebase(FIREBASE_URL + "newsFlashes/teams");
      $scope.teamNewsFeed = $firebaseArray(teamsNewsFeedRef);

      var adminNewsFeedRef = new Firebase(FIREBASE_URL + "newsFlashes/admin");
      $scope.adminNewsFeed = $firebaseArray(adminNewsFeedRef);

      var currentQuarterRef = new Firebase(FIREBASE_URL + "newsFlashes/currentQuarter");
      $scope.currentQuarter = $firebaseObject(currentQuarterRef);

      var setCurrentQuarter = function () {
        var quarterValue = 0;

        $scope.teamNewsFeed.forEach(function (arrayObject) {
          if (arrayObject.quarter && (arrayObject.quarter > quarterValue)) {
            quarterValue = arrayObject.quarter;
          }
        });
        $scope.currentQuarter.$value = quarterValue;
        $scope.currentQuarter.$save();
      };

      //admin function to toggle news events to teams news feeds
      $scope.toggleNewsItem = function (newsObject) {
        if (newsObject.sentToTeams) {
          var indexToRemove = $scope.teamNewsFeed.$indexFor(newsObject.teamsNewsFeedId);
          $scope.teamNewsFeed.$remove(indexToRemove).then(function (ref) {
            newsObject.teamsNewsFeedId = "";
            newsObject.sentToTeams = false;
            $scope.adminNewsFeed.$save($scope.adminNewsFeed.$indexFor(newsObject.$id));
            setCurrentQuarter();
          });
        }
        else {
          $scope.teamNewsFeed.$add(newsObject).then(function (ref) {
            newsObject.teamsNewsFeedId = ref.key();
            newsObject.sentToTeams = true;
            $scope.adminNewsFeed.$save($scope.adminNewsFeed.$indexFor(newsObject.$id));
            setCurrentQuarter();
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

      $scope.newsNest = $scope.newsfeed.news;

      console.log($scope.newsfeed);

      var tradesRef = new Firebase(FIREBASE_URL).child("teams").child(Auth.getAuth().uid).child("trades");
      $scope.trades = $firebaseObject(tradesRef);

      var teamRef = new Firebase(FIREBASE_URL).child("teams").child(Auth.getAuth().uid);
      $scope.teamInfo = $firebaseObject(teamRef);
      console.log($scope.teamInfo);

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

    .controller('highchartsCtrl', function ($scope, $timeout, $firebaseArray, $FirebaseObject, FIREBASE_URL, Auth) {
      $scope.chartConfig = {
        options: {
          chart: {
            zoomType: 'x'
          },
          rangeSelector: {
            enabled: false
          },
          navigator: {
            enabled: false
          }
        },
        xAxis: {
          title: {text: 'Quarter'}
        },
        yAxis: {
          title: {text: 'Dollars ($)'}
        },
        series: [],
        title: {
          text: 'Quarterly Revenue and Cost Data'
        },
        useHighStocks: false
      };
    //  $scope.chartConfig.series.push({
    //    name:"test",
    //    data: [0, '0']
    //});

      var chartRef =  new Firebase(FIREBASE_URL).child("teams").child(Auth.getAuth().uid).child("charting");
      $scope.chartConfig.series = $firebaseArray(chartRef);

      //chartObject.$watch(function () {
      //  console.log("called watch");
      //  $scope.chartConfig.series[0].data = chartObject[0].data;
      //
      //});

      console.log($scope.chartConfig.series);
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

      var currentQuarterRef = new Firebase(FIREBASE_URL + "newsFlashes/currentQuarter");
      var currentQuarter = $firebaseObject(currentQuarterRef);

      // Buying team is also the team that is accepting the trade
      var buyingTeamFinancialRef = new Firebase(FIREBASE_URL).child("teams").child(currentUserId).child("financials");
      var buyingTeamFinancials = $firebaseArray(buyingTeamFinancialRef);

      // Load the buying team (current user) charting data
      var buyingTeamChartingRef = new Firebase(FIREBASE_URL).child("teams").child(currentUserId).child("charting");
      var buyingTeamCharting = $firebaseArray(buyingTeamChartingRef);

      // Load the service details for calculation purposes
      var serviceDetailsRef = new Firebase(FIREBASE_URL).child("serviceDetails");
      var serviceDetails= $firebaseObject(serviceDetailsRef);

      // Load the quarterly details for the calculation process
      var quarterlyDetailsRef = new Firebase(FIREBASE_URL).child("quarterlyDetails");
      var quarterlyDetails= $firebaseArray(quarterlyDetailsRef);

      // Load the location details for all the firms
      var locationDetailsRef = new Firebase(FIREBASE_URL).child("locationDetails");
      var locationDetails= $firebaseObject(locationDetailsRef);

      var makeTrade = function (price, receivingTeam, providingTeam, serviceOffered) {

        var receivingTeamRef = new Firebase(FIREBASE_URL).child("teams").child(receivingTeam.id).child("trades").child("pending");
        var receivingTeamPending = $firebaseArray(receivingTeamRef); // trade pending array specific to receiving team

        console.log(providingTeam.name + " with Id of " + currentUserId + " is selling " + serviceOffered + " for $" + price + " to " + receivingTeam.name + " with Id of " + receivingTeam.id)
        console.log(providingTeam);
        var tradeObject = {
          companyProvidingId: currentUserId, // Defined above
          companyProvidingName: providingTeam.name, // Get the currently logged in team's name
          companyReceivingId: receivingTeam.id,
          companyReceivingName: receivingTeam.name,
          industry: providingTeam.industry,
          service: serviceOffered,
          priceSoldFor: Number(price),
          quarter: Number(currentQuarter.$value)
        };
        console.log(tradeObject);

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

      var updateFinancials = function (tradeObject) {
        // Add the financial info for the buying team
        buyingTeamFinancials[tradeObject.quarter - 1].operatingExpenses = Number(tradeObject.priceSoldFor);

        // Determine the operational savings for the buying team
        var serviceMultiplier = Number(quarterlyDetails[tradeObject.quarter - 1].serviceMultiplier[tradeObject.industry].serviceChosen[tradeObject.service]);
        buyingTeamFinancials[tradeObject.quarter - 1].operationalSavings = Number(2000000 * serviceMultiplier);

        // If the buying team purchases the service from a company that is domestic to them they receive a lower tax rate
        var buyingTeamLocation = locationDetails[tradeObject.companyReceivingName];
        var sellingTeamLocation = locationDetails[tradeObject.companyProvidingName];
        if ( buyingTeamLocation === sellingTeamLocation ) {
          buyingTeamFinancials[tradeObject.quarter - 1].taxRate = 0.3;
        }
        else {
          buyingTeamFinancials[tradeObject.quarter - 1].taxRate = 0.45;
        }
        buyingTeamFinancials.$save(tradeObject.quarter - 1);

        // Update the charting information for the buying team
        // 0 index = Operating Expenses, 1 = Operational Savings, 2 = Revenue, 3 = Net Income
        var operatingExpensesData = [tradeObject.quarter, tradeObject.priceSoldFor];
        buyingTeamCharting[0].data.push(operatingExpensesData);
        buyingTeamCharting.$save(0);

        var operationalSavingsData = [tradeObject.quarter, 2000000 * serviceMultiplier];
        buyingTeamCharting[1].data.push(operationalSavingsData);
        buyingTeamCharting.$save(1);


        var buyTeamRev = buyingTeamFinancials[tradeObject.quarter - 1].revenues;
        var buyTeamOpSav = buyingTeamFinancials[tradeObject.quarter - 1].operationalSavings;
        var buyTeamOpExp = buyingTeamFinancials[tradeObject.quarter - 1].operatingExpenses;
        var buyTeamCogs = buyingTeamFinancials[tradeObject.quarter - 1].cogs;
        var buyTeamTaxRate = buyingTeamFinancials[tradeObject.quarter - 1].taxRate;

        // Check to see if the two trades have been completed to ensure all fields are filled for BUYING TEAM
        if (!isNaN(buyTeamRev+buyTeamOpSav+buyTeamOpExp+buyTeamCogs+buyTeamTaxRate)) {
          buyingTeamFinancials[tradeObject.quarter - 1].netIncome = (buyTeamRev+buyTeamOpSav-buyTeamOpExp-buyTeamCogs)*(1-buyTeamTaxRate);
          buyingTeamFinancials.$save(tradeObject.quarter - 1);

          var buyTeamNetIncomeData = [tradeObject.quarter, (buyTeamRev + buyTeamOpSav - buyTeamOpExp - buyTeamCogs) * (1 - buyTeamTaxRate)];
          buyingTeamCharting[3].data.push(buyTeamNetIncomeData);
        }

        // Add the financial info for the selling team
        var sellingTeamFinancialRef = new Firebase(FIREBASE_URL).child("teams").child(tradeObject.companyProvidingId).child("financials");
        var sellingTeamFinancials = $firebaseArray(sellingTeamFinancialRef);

        // Get the charting object for the selling team
        var sellingTeamChartingRef = new Firebase(FIREBASE_URL).child("teams").child(tradeObject.companyProvidingId).child("charting");
        var sellingTeamCharting = $firebaseArray(sellingTeamChartingRef);

        // When the array has loaded, perform the following operations for the selling team
        sellingTeamFinancials.$loaded(function () {
          // Revenues for the selling team
          sellingTeamFinancials[tradeObject.quarter - 1].revenues = Number(tradeObject.priceSoldFor);
          var serviceCogs = serviceDetails[tradeObject.service][sellingTeamLocation];
          sellingTeamFinancials[tradeObject.quarter - 1].cogs = Number(serviceCogs);

          // Add the revenue information for the selling team
          sellingTeamCharting.$loaded(function () {
            var revenueData = [tradeObject.quarter, tradeObject.priceSoldFor];
            sellingTeamCharting[2].data.push(revenueData);
            sellingTeamCharting.$save(2);
          });

          var sellTeamRev = sellingTeamFinancials[tradeObject.quarter - 1].revenues;
          var sellTeamOpSav = sellingTeamFinancials[tradeObject.quarter - 1].operationalSavings;
          var sellTeamOpExp = sellingTeamFinancials[tradeObject.quarter - 1].operatingExpenses;
          var sellTeamCogs = sellingTeamFinancials[tradeObject.quarter - 1].cogs;
          var sellTeamTaxRate = sellingTeamFinancials[tradeObject.quarter - 1].taxRate;

          // Check to see if the fields are all filled to calculate net income for SELLING TEAM
          if (!isNaN(sellTeamRev+sellTeamOpSav+sellTeamOpExp+sellTeamCogs+sellTeamTaxRate)) {
            sellingTeamFinancials[tradeObject.quarter - 1].netIncome = (sellTeamRev + sellTeamOpSav - sellTeamOpExp - sellTeamCogs) * (1 - sellTeamTaxRate);
            sellingTeamFinancials.$save(tradeObject.quarter - 1);

            sellingTeamCharting.$loaded(function () {
              var netIncomeData = [tradeObject.quarter, (sellTeamRev + sellTeamOpSav - sellTeamOpExp - sellTeamCogs) * (1 - sellTeamTaxRate)];
              sellingTeamCharting[3].data.push(netIncomeData);
              sellingTeamCharting.$save(3);
            });
          }

        });
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
        updateFinancials(tradeObjectPending);

      };

      var declineTrade = function (id) {

        // Define the providing team's sent array to remove trade object
        console.log(id);
        console.log(tradesPending);
        var providingTeamId = tradesPending.$getRecord(id).companyProvidingId;

        var providingTeamSentRef = new Firebase(FIREBASE_URL).child("teams").child(providingTeamId).child("trades").child("sent");
        var providingTeamTradesSent = $firebaseArray(providingTeamSentRef);
        var providingTeamDeclinedRef = new Firebase(FIREBASE_URL).child("teams").child(providingTeamId).child("trades").child("declined");
        var providingTeamTradesDeclined = $firebaseArray(providingTeamDeclinedRef);

        // Define the trade object and the id for the same object in the sending teams array
        var tradeObjectPending = tradesPending.$getRecord(id);
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
      .state('CompanyAndServiceInfo', {
        url: '/CompanyAndServiceInfo',
        templateUrl: 'templates/CompanyAndServiceInfo.html',
        controller: 'companyAndServiceInfoCtrl'
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
