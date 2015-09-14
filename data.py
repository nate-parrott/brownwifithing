#!/usr/bin/env python

import webapp2
import urllib, urllib2, json, calendar
from google.appengine.ext import ndb
from datetime import timedelta
from random import randint

class WifiMeasurement(ndb.Model):
	timestamp = ndb.DateTimeProperty(auto_now_add=True)
	count = ndb.IntegerProperty()
	location = ndb.StringProperty()
	
	def to_json(self):
		return {
			"timestamp": calendar.timegm(self.timestamp.timetuple()),
			"location": self.location,
			"count": self.count
		}

CLIENT_ID = "66438301-1039-4178-ae2d-dd1675d771aa"
LOCATIONS = ["jos", "andrews", "ratty", "vdub", "blueroom"]

def get_data(location):
	url = "https://api.students.brown.edu/wifi/count?" + urllib.urlencode({'location': location, 'client_id': CLIENT_ID})
	return json.loads(urllib.urlopen(url).read())

def get_wifi_measurement(location):
	data = get_data(location)
	# print data
	return WifiMeasurement(count=int(data['count']), location=location)

class PullHandler(webapp2.RequestHandler):
    def get(self):
			ndb.put_multi(map(get_wifi_measurement, LOCATIONS))
			self.response.write("Okay")

class FakeDataHandler(webapp2.RequestHandler):
    def get(self):
        top_n = WifiMeasurement.query().order(-WifiMeasurement.timestamp).fetch(limit=len(LOCATIONS))
        past = 0
        new_measurements = []
        while past < 24 * 60 * 60:
            for measure in top_n:
                t = measure.timestamp - timedelta(seconds=past)
                new_measure = WifiMeasurement(timestamp=t, location=measure.location, count=randint(0, 60))
                new_measurements.append(new_measure)
            past += 5 * 60
        ndb.put_multi(new_measurements)

app = webapp2.WSGIApplication([
    ('/pull_data', PullHandler),
    ('/generate_fake_data', FakeDataHandler)
], debug=True)
