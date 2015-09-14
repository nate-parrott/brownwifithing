import webapp2
from data import WifiMeasurement, LOCATIONS
import datetime, json, random, calendar
from google.appengine.ext import ndb

MEASUREMENT_INTERVAL_MINUTES = 5
EXPECTED_MEASUREMENT_COUNT = int(1.2 * 24.0 * 60 / MEASUREMENT_INTERVAL_MINUTES * len(LOCATIONS)) # * 1.2 for a little extra

class NowHandler(webapp2.RequestHandler):
	def get(self):
		now = datetime.datetime.now()
		since = now - datetime.timedelta(days=1)
		if self.request.get('fake'):
			measurements = []
			time = since
			while time <= now:
				for location in LOCATIONS:
					measurements.append({
						"timestamp": calendar.timegm(time.timetuple()),
						"location": location,
						"count": random.randint(0, 70)
					})
				time += datetime.timedelta(minutes=5)
		else:
			measurement_models = WifiMeasurement.query(WifiMeasurement.timestamp >= since, WifiMeasurement.timestamp <= now).order(WifiMeasurement.timestamp).fetch(limit=EXPECTED_MEASUREMENT_COUNT)
			measurements = [measurement.to_json() for measurement in measurement_models]
		self.response.headers['Content-Type'] = 'text/json'
		self.response.write(json.dumps({
			"measurements": measurements
		}))
