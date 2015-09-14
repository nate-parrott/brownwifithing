#!/usr/bin/env python

import webapp2
import json
import now

class MainHandler(webapp2.RequestHandler):
    def get(self):
        self.response.write('Hello world!')

app = webapp2.WSGIApplication([
    ('/', MainHandler),
		('/now', now.NowHandler)
], debug=True)
