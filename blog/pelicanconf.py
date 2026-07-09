#!/usr/bin/env python
# -*- coding: utf-8 -*- #
from __future__ import unicode_literals

AUTHOR = u'Jesse Lumarie'
SITENAME = u'Writing | Jesse Lumarie'
SITEURL = 'https://jesselumarie.com/blog'

# dev site URL
# SITEURL = ''

PATH = 'content'

TIMEZONE = 'America/Chicago'

DEFAULT_LANG = u'en'

# Feed generation is usually not desired when developing
FEED_ALL_ATOM = None
CATEGORY_FEED_ATOM = None
TRANSLATION_FEED_ATOM = None
AUTHOR_FEED_ATOM = None
AUTHOR_FEED_RSS = None

# Blogroll
LINKS = (('Pelican', 'https://getpelican.com/'),
         ('Python.org', 'https://python.org/'),
         ('Jinja2', 'http://jinja.pocoo.org/'),
         ('You can modify those links in your config file', '#'),)

# Social widget
SOCIAL = (('You can add links in your config file', '#'),
          ('Another social link', '#'),)

DEFAULT_PAGINATION = 5

# Machine-readable article index for the FF7-mode Writing screen.
# 'blogindex' renders pelican_theme/templates/blogindex.html (template
# lookup only tries TEMPLATE_EXTENSIONS, i.e. .html) but saves as JSON.
DIRECT_TEMPLATES = ['index', 'tags', 'categories', 'authors', 'archives', 'blogindex']
BLOGINDEX_SAVE_AS = 'blogindex.json'

THEME = "../pelican_theme"
# Uncomment following line if you want document-relative URLs when developing
#RELATIVE_URLS = True
