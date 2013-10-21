'use strict';

var api_base = '/wgtg-api';
var wg2g = angular.module('wg2g', []);
var ws = new WebSocket('ws://' + window.location.host + api_base + '/pushes');
var MAX_LEN = 20;
var TZ_OFFSET = 0; //5 * 60 * 60 * 1000;

wg2g.controller('WG2GCtrl', function WG2GCtrl($scope, $http) {

    
    $scope.events = [];

    $scope.timeSince = '';
    
    ws.onmessage = function(ev) {
        console.log(ev.data);
        add_event(new Date(Date.parse(ev.data) - TZ_OFFSET));
    }

    $http({method: 'GET', url: api_base + '/recentEvents'}).
        success(function(data, status, headers, config) {
            var evStrings = data.trim().split('\n');
            var evs = [];
            for(var i in evStrings) {
                evs.push(new Date(Date.parse(evStrings[i])- TZ_OFFSET));
            }
            $scope.events = evs;

            init_chart();
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

    function init_chart() {
        var chart = d3.select("#chart-container").append("svg")
            .attr("class", "chart")
            .attr("width", 420).attr("height", 200);

        var deltas = [];
        for(var i in $scope.events) {
            if(i > 0) {
                deltas.push($scope.events[i-1] - $scope.events[i]);
            }
        }

        var x = d3.scale.log()
            .domain([1, d3.max(deltas)])
            .range([0, 420]);

        chart.selectAll("rect")
             .data(deltas)
           .enter().append("rect")
             .attr("y", function(d, i) { return i * 20; })
             .attr("width", x)
             .attr("height", 20);

    }
    
    window.setInterval(set_time_since, 1000);

})