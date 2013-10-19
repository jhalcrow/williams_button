'use strict';

var wg2g = angular.module('wg2g', []);
var ws = new WebSocket('ws://' + window.location.host + '/pushes');
var MAX_LEN = 20;

wg2g.controller('WG2GCtrl', function WG2GCtrl($scope, $http) {

    $scope.events = [];

    ws.onmessage = function(ev) {
        console.log(ev.data);
        add_event(ev.data);
    }

    $http({method: 'GET', url: '/recentEvents'}).
        success(function(data, status, headers, config) {
            $scope.events = data.trim().split('\n');
        }).
        error(function(data, status, headers, config) {
            console.log("Error getting recent events.\n" + data);
        });

    function add_event(ev_time) {
        console.log("Adding " + ev_time);
        $scope.events = [ev_time].concat($scope.events);
        $scope.events = $scope.events.slice(0, MAX_LEN);
        $scope.$apply();

    }

})