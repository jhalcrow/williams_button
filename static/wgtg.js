'use strict';

var wg2g = angular.module('wg2g', []);
var ws = new WebSocket('ws://' + window.location.host + '/pushes');
var MAX_LEN = 20;
var TZ_OFFSET = 5 * 60 * 60 * 1000;

wg2g.controller('WG2GCtrl', function WG2GCtrl($scope, $http) {

    
    $scope.events = [];

    $scope.timeSince = '';
    
    ws.onmessage = function(ev) {
        console.log(ev.data);
        add_event(new Date(Date.parse(ev.data) - TZ_OFFSET));
    }

    $http({method: 'GET', url: '/recentEvents'}).
        success(function(data, status, headers, config) {
            var evStrings = data.trim().split('\n');
            var evs = [];
            for(var i in evStrings) {
                evs.push(new Date(Date.parse(evStrings[i])- TZ_OFFSET));
            }
            $scope.events = evs;
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
    
    function set_time_since() {
        if ($scope.events.length == 0) {
            $scope.timeSince = 'Never';
        } else {
            var last = $scope.events[0];
            var millisec_delta = new Date().getTime() - last.getTime() - TZ_OFFSET;
            var delta = new Date(millisec_delta);
            var days = Math.floor(millisec_delta / (1000 * 60 * 60 * 24));
            
            $scope.timeSince = days + ' Days, ' + delta.getHours() + ' Hours, ' + delta.getMinutes() + ' Minutes, ' + delta.getSeconds() + ' Seconds.';
            $scope.$apply();
        }
        
    }
    
    window.setInterval(set_time_since, 1000);

})