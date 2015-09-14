
document.addEventListener("DOMContentLoaded", function() {
	var url = location.search.indexOf('fake') == -1 ? '/now' : '/now?fake=1'
	d3.json(url, function(err, data) {
		
		var eateryNames = {
			jos: "Jo's",
			ratty: "Ratty",
			vdub: "V-Dub",
			blueroom: "Blue Room",
			andrews: "Andrews"
		}
		
		var secondsInDay = 24 * 60 * 60;
		var timeOfDay = function(timestamp) {
			var startOfToday = new Date();
			startOfToday.setHours(0,0,0,0);
			var startOfTodayTimestamp = startOfToday.getTime() / 1000;
			var t = (timestamp - startOfTodayTimestamp) % secondsInDay;
			// t += 1;
			return (t > 0) ? t : t + secondsInDay;
		}
		
		var createPin = function(left, count, title) {
			var textRightOfCount = left < 0.5;
			var classes = 'pin ' + (textRightOfCount ? 'textRightOfCount' : 'textLeftOfCount');
			var div = d3.select(document.createElement('div')).attr({'class': classes}).node();
			var text = d3.select(document.createElement('h1')).text(title).node();
			
			if (!textRightOfCount) div.appendChild(text);
			
			var countContainer = d3.select(document.createElement('div')).attr({'class': 'count-container'}).node();
			countContainer.appendChild(d3.select(document.createElement('div')).text(count).node());
			div.appendChild(countContainer);
			
			if (textRightOfCount) div.appendChild(text);
			
			if (textRightOfCount) {
				div.style.left = left * 100 + '%';
			} else {
				div.style.right = (1 - left) * 100 + '%';
			}
			
			return div;
		}
		
		var createGraph = function(node, eatery, drawGlobalLine) {
			node = d3.select(node);
			
			var measurements = data.measurements.filter(function(m) {return m.location == eatery});
			var mostRecentMeasurement = measurements[measurements.length - 1];
			measurements = measurements.sort(function(a,b) {
				return timeOfDay(a.timestamp) - timeOfDay(b.timestamp);
			})
			
			var graphWidth = 700, graphHeight = 100;
			
			var xScale = d3.scale.linear().domain([0, secondsInDay]).range([0, graphWidth]);
			var yScale = d3.scale.linear().domain([0, d3.max(measurements.map(function(m) {return m.count}))]).range([0, graphHeight]);
						
			var svg = node.selectAll('svg').data([1]).enter().append('svg');
			svg.attr('viewBox', '0 0 ' + graphWidth + ' ' + graphHeight).attr('preserveAspectRatio', 'none');
			
			var line = d3.svg.area()
				.x(function(m){
					return xScale(timeOfDay(m.timestamp))
				}).y1(function(m){
					return graphHeight - yScale(m.count)
				}).y0(function(m) {
					return graphHeight - 1;
				}).interpolate('basis');
			
			var path = svg.selectAll('path').data([measurements]).enter().append('path').attr("d", line);
			
			var pinLeft = (timeOfDay(mostRecentMeasurement.timestamp) / secondsInDay);
			
			// create gradient:
			var gradient = svg.append("svg:defs")
			    .append("svg:linearGradient")
			    .attr("id", "gradient")
			    .attr("x1", "0%")
			    .attr("y1", "0%")
			    .attr("x2", "100%")
			    .attr("y2", "0%")
			    .attr("spreadMethod", "pad");			
			gradient.append("svg:stop")
			    .attr("offset", "0%")
			    .attr("stop-color", "#036564")
			    .attr("stop-opacity", 0.3);
			gradient.append("svg:stop")
			    .attr("offset", (pinLeft - 0.1) * 100 + '%')
			    .attr("stop-color", "#036564")
			    .attr("stop-opacity", 0.3);
			gradient.append("svg:stop")
			    .attr("offset", (pinLeft) * 100 + '%')
			    .attr("stop-color", "#63bfbc")
			    .attr("stop-opacity", 1);
			gradient.append("svg:stop")
			    .attr("offset", (pinLeft) * 100 + '%')
			    .attr("stop-color", "#036564")
			    .attr("stop-opacity", 0.3);
					path.attr('fill', 'url(#gradient)');
			
			var path = svg.selectAll('path').data([measurements]).enter().append('path').attr("d", line);
			
			node.selectAll('.pin-container').remove();
			node.node().appendChild(createPin(pinLeft, mostRecentMeasurement.count, eateryNames[eatery]));
			
			if (drawGlobalLine) {
				var line = document.createElement('div');
				line.className = 'global-line';
				line.style.left = pinLeft * 100 + '%';
				document.body.appendChild(line);
			}
		}
		
		var getAllEateries = function(measurements) {
			var eateries = [];
			var seen = {};
			measurements.forEach(function(m) {
				if (seen[m.location] === undefined) {
					eateries.push(m.location);
					seen[m.location] = true;
				}
			});
			return eateries;
		}
		
		var allEateries = getAllEateries(data.measurements);
		d3.select("#eateries").selectAll('.eatery').data(allEateries).enter().append('div').attr('class', 'eatery').each(function(eatery, i) {
			createGraph(this, eatery, i==0);
		})
	})
});